import { Request, Response } from 'express';
import { VtuEngine } from '../services/VtuEngine';
import { prisma } from '../utils/prisma';
import { ServiceType, TransactionStatus, Provider } from '../types/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '../services/email.service';

const vtuEngine = new VtuEngine();

const purchaseSchema = z.object({
  serviceType: z.nativeEnum(ServiceType),
  phone: z.string().min(11),
  planCode: z.string(),
  amount: z.number().positive(),
  pin: z.string().length(4),
});

export const purchaseService = async (req: Request, res: Response) => {
  try {
    const validated = purchaseSchema.parse(req.body);
    // @ts-ignore
    const userId = req.user.id;

    // Atomic Balance Check and Debit
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
      });

      if (!user || !user.wallet) throw new Error('User or Wallet not found');
      
      if (!user.transactionPin) {
        throw new Error('PIN_NOT_SET');
      }

      const isPinMatch = await bcrypt.compare(validated.pin, user.transactionPin);
      if (!isPinMatch) {
        throw new Error('INCORRECT_PIN');
      }

      if (user.wallet.balance < validated.amount) {
        throw new Error('Insufficient wallet balance');
      }

      // Create PENDING transaction
      const reference = `AGD-${uuidv4().slice(0, 8).toUpperCase()}`;
      const transaction = await tx.transaction.create({
        data: {
          userId,
          walletId: user.wallet.id,
          amount: validated.amount,
          serviceType: validated.serviceType,
          status: TransactionStatus.PENDING,
          provider: Provider.CHEAP_DATA_HUB, // Initial provider
          reference,
          description: `${validated.serviceType} purchase for ${validated.phone}`,
        },
      });

      // Debit Wallet
      const updatedWallet = await tx.wallet.update({
        where: { id: user.wallet.id },
        data: { balance: { decrement: validated.amount } },
      });

      // Log Audit
      await tx.auditLog.create({
        data: {
          userId,
          action: 'DEBIT',
          amount: validated.amount,
          previousBalance: user.wallet.balance,
          newBalance: updatedWallet.balance,
          description: `Debit for ${validated.serviceType} purchase. Ref: ${reference}`,
        },
      });

      return { transaction, user };
    });

    // Outside transaction, trigger the VTU Engine (external API calls)
    try {
      const engineResponse = await vtuEngine.processTransaction({
        ...validated,
        reference: result.transaction.reference,
      });

      // Update transaction status to SUCCESS and log profits
      const costPrice = (engineResponse as any).costPrice;
      const profit = costPrice ? (validated.amount - costPrice) : null;

      await prisma.transaction.update({
        where: { id: result.transaction.id },
        data: { 
          status: TransactionStatus.SUCCESS,
          provider: engineResponse.providerUsed as Provider,
          costPrice,
          profit
        },
      });

      // Check and execute Referral bonus if applicable
      if (result.user.referredBy) {
        try {
          const referral = await prisma.referral.findFirst({
            where: {
              referredId: userId,
              status: 'PENDING'
            }
          });

          if (referral) {
            // Reward the referrer
            await prisma.$transaction(async (tx) => {
              const referrerWallet = await tx.wallet.findUnique({
                where: { userId: referral.referrerId }
              });

              if (referrerWallet) {
                const updatedReferrerWallet = await tx.wallet.update({
                  where: { id: referrerWallet.id },
                  data: { balance: { increment: referral.bonusAmount } }
                });

                // Update Referral status to PAID
                await tx.referral.update({
                  where: { id: referral.id },
                  data: { status: 'PAID' }
                });

                // Audit Log for Referrer
                await tx.auditLog.create({
                  data: {
                    userId: referral.referrerId,
                    action: 'CREDIT',
                    amount: referral.bonusAmount,
                    previousBalance: referrerWallet.balance,
                    newBalance: updatedReferrerWallet.balance,
                    description: `Referral bonus reward for inviting ${result.user.name}`
                  }
                });

                // Notification for Referrer
                await tx.notification.create({
                  data: {
                    userId: referral.referrerId,
                    title: 'Referral Reward Credited! 🎁',
                    message: `You earned ₦${referral.bonusAmount} because ${result.user.name} made their first purchase!`,
                    type: 'SUCCESS'
                  }
                });
              }
            });
          }
        } catch (referralError) {
          console.error('[Referral System] Failed to process referral payout:', referralError);
        }
      }

      const finalTransaction = await prisma.transaction.findUnique({
        where: { id: result.transaction.id }
      });

      // Create Notification
      await prisma.notification.create({
        data: {
          userId,
          title: 'Transaction Successful',
          message: `Your ${validated.serviceType} purchase for ${validated.phone} (₦${validated.amount}) was successful.`,
          type: 'SUCCESS'
        }
      });

      // Send Email Receipt Asynchronously
      EmailService.sendPurchaseReceipt(
        result.user.email,
        result.user.name,
        validated.serviceType,
        validated.amount,
        result.transaction.reference
      ).catch(e => console.error('Failed to send purchase receipt', e));

      res.json({
        success: true,
        message: 'Transaction successful',
        transaction: finalTransaction,
        provider: engineResponse.providerUsed,
      });

    } catch (engineError: any) {
      // If Engine fails, we should REFUND the user
      console.error('VTU Engine Error, initiating refund:', engineError.message);
      
      await prisma.$transaction(async (tx) => {
        await tx.transaction.update({
          where: { id: result.transaction.id },
          data: { status: TransactionStatus.FAILED },
        });

        const currentWallet = await tx.wallet.findUnique({ where: { userId } });
        if (!currentWallet) return;

        const refundedWallet = await tx.wallet.update({
          where: { id: currentWallet.id },
          data: { balance: { increment: validated.amount } },
        });

        await tx.auditLog.create({
          data: {
            userId,
            action: 'CREDIT',
            amount: validated.amount,
            previousBalance: currentWallet.balance,
            newBalance: refundedWallet.balance,
            description: `Refund for failed ${validated.serviceType} purchase. Ref: ${result.transaction.reference}`,
          },
        });
      });

      res.status(500).json({ 
        error: 'Service provider error. Your wallet has been refunded.',
        reference: result.transaction.reference 
      });
    }

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
};

export const getUserTransactions = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Last 50 transactions
    });

    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};
