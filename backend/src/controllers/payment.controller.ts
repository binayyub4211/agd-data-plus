import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { prisma } from '../utils/prisma';
import { ServiceType, Provider, TransactionStatus } from '../types/prisma';

export const initializeFunding = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const user = req.user;
    const { amount } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'Minimum funding amount is ₦100' });
    }

    const paystackData = await PaymentService.initializePayment(user.email, amount);

    // Create a PENDING transaction in our DB
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });

    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        walletId: wallet.id,
        amount,
        status: TransactionStatus.PENDING,
        serviceType: ServiceType.WALLET_TOPUP,
        provider: Provider.PAYSTACK,
        reference: paystackData.data.reference,
        description: 'Wallet funding via Paystack',
      },
    });

    res.json(paystackData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyFunding = async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { reference },
      include: { user: true, wallet: true },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.status === TransactionStatus.SUCCESS) {
      return res.json({ message: 'Transaction already processed', status: 'SUCCESS' });
    }

    const verificationData = await PaymentService.verifyPayment(reference);

    if (verificationData.data.status === 'success') {
      const amountPaid = verificationData.data.amount / 100;

      // Atomic update: Transaction status + Wallet balance + Audit Log
      await prisma.$transaction(async (tx) => {
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: TransactionStatus.SUCCESS },
        });

        const updatedWallet = await tx.wallet.update({
          where: { id: transaction.walletId },
          data: { balance: { increment: amountPaid } },
        });

        await tx.auditLog.create({
          data: {
            userId: transaction.userId,
            action: 'CREDIT',
            amount: amountPaid,
            previousBalance: transaction.wallet.balance,
            newBalance: updatedWallet.balance,
            description: `Successfully funded wallet via Paystack. Ref: ${reference}`,
          },
        });
      });

      return res.json({ message: 'Wallet funded successfully', status: 'SUCCESS' });
    }

    res.json({ message: 'Payment not successful', status: verificationData.data.status });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
