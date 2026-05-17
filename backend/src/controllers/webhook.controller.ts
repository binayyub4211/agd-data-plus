import { Request, Response } from 'express';
import crypto from 'crypto';
import { config } from '../config/config';
import { prisma } from '../utils/prisma';
import { TransactionStatus, ServiceType, Provider } from '../types/prisma';

export const paystackWebhook = async (req: Request, res: Response) => {
  console.log('--- WEBHOOK RECEIVED ---');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  const paystackSignature = req.headers['x-paystack-signature'];
  const ppSignature = req.headers['paymentpoint-signature'] || req.headers['http_paymentpoint_signature'];

  // 1. Handle PaymentPoint Webhook
  if (ppSignature) {
    const ppSecret = config.PAYMENTPOINT_SECRET_KEY;
    // @ts-ignore
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const ppHash = crypto
      .createHmac('sha256', ppSecret)
      .update(rawBody)
      .digest('hex');

    if (ppHash === ppSignature) {
      return handlePaymentPointEvent(req.body, res);
    }
  }

  // 2. Handle Paystack Webhook
  if (paystackSignature) {
    const paystackSecret = config.PAYSTACK_SECRET_KEY;
    // @ts-ignore
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const paystackHash = crypto
      .createHmac('sha512', paystackSecret)
      .update(rawBody)
      .digest('hex');

    if (paystackHash === paystackSignature) {
      return handlePaystackEvent(req.body, res);
    }
  }

  // 3. Fallback for testing (if needed, only in development)
  if (process.env.NODE_ENV === 'development' && req.body && req.body.notification_status === 'payment_successful') {
    return handlePaymentPointEvent(req.body, res);
  }

  console.error('Webhook failed: Invalid signature or unknown source');
  return res.status(401).send('Invalid signature or unknown source');
};

async function handlePaystackEvent(event: any, res: Response) {
  console.log('Processing Paystack Event:', event.event);
  try {
    if (event.event === 'charge.success') {
      const { reference, amount, customer } = event.data;
      await processSuccessfulFunding(customer.email, amount / 100, reference, Provider.PAYSTACK);
    }
    res.status(200).send('Processed');
  } catch (err) {
    res.status(500).send('Error');
  }
}

async function handlePaymentPointEvent(event: any, res: Response) {
  try {
    if (event.transaction_status === 'success' || event.notification_status === 'payment_successful') {
      const { transaction_id, amount_paid, customer } = event;
      await processSuccessfulFunding(customer.email, amount_paid, transaction_id, Provider.PAYMENTPOINT);
    }
    res.status(200).send('Processed');
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).send('Error');
  }
}

import { EmailService } from '../services/email.service';

async function processSuccessfulFunding(email: string, amount: number, reference: string, provider: Provider) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { wallet: true },
  });

  if (!user || !user.wallet) {
    console.warn(`User not found for webhook email: ${email}`);
    return;
  }

  const existingTx = await prisma.transaction.findUnique({ where: { reference } });
  if (existingTx && existingTx.status === TransactionStatus.SUCCESS) {
    console.log(`Transaction ${reference} already processed.`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    // 1. Handle User Wallet Top-up
    if (!existingTx) {
      await tx.transaction.create({
        data: {
          userId: user.id,
          walletId: user.wallet!.id,
          amount,
          status: TransactionStatus.SUCCESS,
          serviceType: ServiceType.WALLET_TOPUP,
          provider,
          reference,
          description: `Wallet funding via ${provider} (Automated Transfer)`,
        },
      });
    } else {
      await tx.transaction.update({
        where: { id: existingTx.id },
        data: { status: TransactionStatus.SUCCESS },
      });
    }

    const updatedWallet = await tx.wallet.update({
      where: { id: user.wallet!.id },
      data: { balance: { increment: amount } },
    });

    // Notify user via Email (Non-blocking)
    EmailService.sendFundingNotification(user.email, amount, updatedWallet.balance).catch(console.error);

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREDIT',
        amount,
        previousBalance: user.wallet!.balance,
        newBalance: updatedWallet.balance,
        description: `Auto-funded via ${provider} Webhook. Ref: ${reference}`,
      },
    });

    // Notify user
    // @ts-ignore
    await (tx as any).notification.create({
      data: {
        userId: user.id,
        title: 'Wallet Funded Successfully',
        message: `Your wallet has been credited with ₦${amount.toLocaleString()} via ${provider}.`,
        type: 'SUCCESS',
      },
    });

    // 2. Handle Referral Bonus (Check if this is a first-time funding for a referred user)
    const referral = await (tx as any).referral.findFirst({
      where: { 
        referredId: user.id,
        status: 'PENDING'
      }
    });

    if (referral) {
      const referrer = await tx.user.findUnique({
        where: { id: referral.referrerId },
        include: { wallet: true }
      });

      if (referrer && referrer.wallet) {
        // Pay bonus to Referrer
        const updatedReferrerWallet = await tx.wallet.update({
          where: { id: referrer.wallet.id },
          data: { balance: { increment: referral.bonusAmount } }
        });

        // Log Referrer Audit
        await tx.auditLog.create({
          data: {
            userId: referrer.id,
            action: 'REFERRAL_BONUS',
            amount: referral.bonusAmount,
            previousBalance: referrer.wallet.balance,
            newBalance: updatedReferrerWallet.balance,
            description: `Referral bonus for inviting ${user.name}.`
          }
        });

        // Notify Referrer
        // @ts-ignore
        await (tx as any).notification.create({
          data: {
            userId: referrer.id,
            title: 'Referral Bonus Earned! 🎁',
            message: `You earned ₦${referral.bonusAmount} because ${user.name} just funded their wallet!`,
            type: 'SUCCESS',
          }
        });

        // Update Referral status to PAID
        await (tx as any).referral.update({
          where: { id: referral.id },
          data: { status: 'PAID' }
        });

        console.log(`Referral Bonus paid to ${referrer.email} for user ${user.email}`);
      }
    }
    
    console.log(`Successfully credited ${amount} to ${email} via ${provider}`);
  });
}
