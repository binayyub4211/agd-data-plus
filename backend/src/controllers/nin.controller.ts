import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../utils/prisma';
import { ServiceType, TransactionStatus, Provider } from '../types/prisma';
import { NinService } from '../services/nin.service';

const ninService = new NinService();

const ninVerifySchema = z.object({
  nin: z.string().length(11, 'NIN must be exactly 11 digits'),
  slipType: z.enum(['NIN_BASIC', 'NIN_STANDARD', 'NIN_PREMIUM']),
  pin: z.string().length(4, 'Transaction PIN must be 4 digits'),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'You must check the consent box to proceed' }),
  }),
});

export const verifyNinSlip = async (req: Request, res: Response) => {
  try {
    const validated = ninVerifySchema.parse(req.body);
    // @ts-ignore
    const userId = req.user.id;

    // 1. Process Database Transaction (Balance Check, PIN Verification, Debit)
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

      // Fetch pricing margin for selected slip type
      let finalAmountToDebit = 150; // default for STANDARD
      if (validated.slipType === 'NIN_BASIC') finalAmountToDebit = 100;
      else if (validated.slipType === 'NIN_PREMIUM') finalAmountToDebit = 250;

      let costPrice = 80; // default provider cost
      if (validated.slipType === 'NIN_BASIC') costPrice = 50;
      else if (validated.slipType === 'NIN_PREMIUM') costPrice = 120;

      const priceRule = await tx.servicePrice.findFirst({
        where: { planCode: validated.slipType, serviceType: 'NIN' }
      });

      if (priceRule) {
        finalAmountToDebit = user.role === 'RESELLER' || user.role === 'ADMIN' 
          ? priceRule.resellerPrice 
          : priceRule.sellingPrice;
        costPrice = priceRule.providerPrice;
      }

      if (user.wallet.balance < finalAmountToDebit) {
        throw new Error('Insufficient wallet balance');
      }

      // Create PENDING transaction
      const reference = `AGD-NIN-${uuidv4().slice(0, 8).toUpperCase()}`;
      const transaction = await tx.transaction.create({
        data: {
          userId,
          walletId: user.wallet.id,
          amount: finalAmountToDebit,
          serviceType: ServiceType.NIN,
          status: TransactionStatus.PENDING,
          provider: Provider.NIMC,
          reference,
          description: `NIN Slip print (${validated.slipType}) for ID: ${validated.nin}`,
        },
      });

      // Debit Wallet
      const updatedWallet = await tx.wallet.update({
        where: { id: user.wallet.id },
        data: { balance: { decrement: finalAmountToDebit } },
      });

      // Log Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'DEBIT',
          amount: finalAmountToDebit,
          previousBalance: user.wallet.balance,
          newBalance: updatedWallet.balance,
          description: `Debit for NIN Verification. Ref: ${reference}`,
        },
      });

      return { transaction, user, finalAmountToDebit, costPrice };
    });

    // 2. Call external identity provider API outside DB lock
    try {
      const ninResult = await ninService.verifyNin(validated.nin, result.user.name);

      // Log success, calculate profit
      const profit = result.finalAmountToDebit - result.costPrice;

      await prisma.transaction.update({
        where: { id: result.transaction.id },
        data: {
          status: TransactionStatus.SUCCESS,
          costPrice: result.costPrice,
          profit: profit,
        },
      });

      // Create Success Notification
      await prisma.notification.create({
        data: {
          userId,
          title: 'NIN Verification Successful 🪪',
          message: `Your NIN verification for ID ${validated.nin} was successful. Download your slip now!`,
          type: 'SUCCESS',
        },
      });

      res.json({
        success: true,
        message: 'NIN verified successfully',
        transaction: {
          ...result.transaction,
          status: TransactionStatus.SUCCESS
        },
        data: ninResult
      });

    } catch (apiError: any) {
      // 3. If API fails, initiate REFUND to user wallet
      console.error('[NIN Controller] Verification failed, initiating refund:', apiError.message);
      
      await prisma.$transaction(async (tx) => {
        await tx.transaction.update({
          where: { id: result.transaction.id },
          data: { status: TransactionStatus.FAILED },
        });

        const currentWallet = await tx.wallet.findUnique({ where: { userId } });
        if (!currentWallet) return;

        const refundedWallet = await tx.wallet.update({
          where: { id: currentWallet.id },
          data: { balance: { increment: result.finalAmountToDebit } },
        });

        await tx.auditLog.create({
          data: {
            userId,
            action: 'CREDIT',
            amount: result.finalAmountToDebit,
            previousBalance: currentWallet.balance,
            newBalance: refundedWallet.balance,
            description: `Refund for failed NIN Verification. Ref: ${result.transaction.reference}`,
          },
        });
      });

      res.status(500).json({
        error: apiError.message || 'Identity verification service error. Your wallet has been fully refunded.',
        reference: result.transaction.reference
      });
    }

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0]?.message || 'Invalid request body' });
    }
    
    const message = error.message || 'NIN Verification transaction failed';
    if (message === 'PIN_NOT_SET') {
      return res.status(400).json({ error: 'Please set up a transaction PIN in Settings before verification.' });
    }
    if (message === 'INCORRECT_PIN') {
      return res.status(400).json({ error: 'INCORRECT_PIN' });
    }
    if (message === 'Insufficient wallet balance') {
      return res.status(400).json({ error: 'Insufficient wallet balance to perform this operation.' });
    }

    res.status(500).json({ error: message });
  }
};
