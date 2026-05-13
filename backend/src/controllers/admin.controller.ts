import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { Provider } from '../types/prisma';

export const getAdminStats = async (req: Request, res: Response) => {
  try {
    // 1. Total Users
    const totalUsers = await prisma.user.count();

    // 2. Total Wallet Balance (Liability)
    const walletStats = await prisma.wallet.aggregate({
      _sum: { balance: true }
    });
    const totalUserBalance = walletStats._sum.balance || 0;

    // 3. Provider Balances (Assets)
    const providerBalances = await prisma.providerBalance.findMany();
    
    // 4. Recent Transactions
    const recentTransactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { name: true, email: true } } }
    });

    // 5. Sales Summary (Last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dailySales = await prisma.transaction.aggregate({
      where: {
        status: 'SUCCESS',
        createdAt: { gte: oneDayAgo }
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    res.json({
      totalUsers,
      totalUserBalance,
      providerBalances,
      recentTransactions,
      dailySales: {
        amount: dailySales._sum.amount || 0,
        count: dailySales._count.id || 0
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        wallet: { select: { balance: true } },
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const manualCreditUser = async (req: Request, res: Response) => {
  const { userId, amount, description } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error('Wallet not found');

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: parseFloat(amount) } }
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'MANUAL_CREDIT',
          amount: parseFloat(amount),
          previousBalance: wallet.balance,
          newBalance: updatedWallet.balance,
          description: description || 'Manual admin credit'
        }
      });

      return updatedWallet;
    });

    res.json({ message: 'User credited successfully', newBalance: result.balance });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
