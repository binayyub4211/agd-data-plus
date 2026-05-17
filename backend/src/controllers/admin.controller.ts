import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { Provider } from '../types/prisma';
import { PaymentPointService } from '../services/PaymentPointService';

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
        ppAccountNumber: true,
        ppBankName: true,
        psAccountNumber: true,
        psBankName: true,
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

export const generateMissingAccounts = async (req: Request, res: Response) => {
  try {
    // 1. Find users with no virtual account number
    const usersWithoutAccount = await prisma.user.findMany({
      where: {
        ppAccountNumber: null,
        role: 'USER' // Only for regular users
      }
    });

    if (usersWithoutAccount.length === 0) {
      return res.json({ message: 'All users already have virtual accounts.' });
    }

    let successCount = 0;
    let failCount = 0;

    // 2. Loop through and create accounts
    for (const user of usersWithoutAccount) {
      try {
        const virtualAccount = await PaymentPointService.createDedicatedAccount(
          user.email,
          user.name,
          user.phone
        );

        if (virtualAccount) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              ppAccountNumber: virtualAccount.accountNumber,
              ppBankName: virtualAccount.bankName,
              ppAccountName: virtualAccount.accountName,
            }
          });
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        failCount++;
      }
    }

    res.json({
      message: 'Account generation process completed',
      details: {
        totalFound: usersWithoutAccount.length,
        successfullyCreated: successCount,
        failed: failCount
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to initiate account generation' });
  }
};

export const generateSingleAccount = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.ppAccountNumber) return res.status(400).json({ error: 'User already has a virtual account' });

    try {
      const virtualAccount = await PaymentPointService.createDedicatedAccount(
        user.email,
        user.name,
        user.phone
      );

      if (virtualAccount) {
        const accountNumber = virtualAccount.accountNumber || virtualAccount.account_number;
        const bankName = virtualAccount.bankName || virtualAccount.bank_name;
        const accountName = virtualAccount.accountName || virtualAccount.account_name;

        await prisma.user.update({
          where: { id: user.id },
          data: {
            ppAccountNumber: accountNumber,
            ppBankName: bankName,
            ppAccountName: accountName,
          }
        });
        return res.json({ message: 'Account generated successfully', bank: bankName, account: accountNumber });
      } else {
        return res.status(400).json({ error: 'Provider returned empty account data' });
      }
    } catch (apiError: any) {
      // Return the exact provider error to the admin
      return res.status(400).json({ error: apiError.message || 'Failed to generate account from provider' });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const broadcastNotification = async (req: Request, res: Response) => {
  try {
    const { title, message, type, sendEmail, targetUserId } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    let users = [];

    // 1. Get users based on target
    if (targetUserId) {
      const user = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, email: true } });
      if (!user) return res.status(404).json({ error: 'Target user not found' });
      users.push(user);
    } else {
      users = await prisma.user.findMany({ select: { id: true, email: true } });
    }

    // 2. Create in-app notifications
    const notifications = users.map(user => ({
      userId: user.id,
      title,
      message,
      type: type || 'INFO',
    }));

    await prisma.notification.createMany({
      data: notifications
    });

    // 3. Optionally blast emails
    if (sendEmail) {
      const { EmailService } = require('../services/email.service');
      const emailPromises = users.map(user => 
        EmailService.sendAdminBroadcastEmail(user.email, title, message).catch((e: any) => console.error(e))
      );
      
      Promise.allSettled(emailPromises);
    }

    res.json({ 
      success: true, 
      message: targetUserId ? 'Message sent successfully.' : `Broadcast sent to ${users.length} users successfully.` 
    });
  } catch (error: any) {
    console.error('Broadcast Error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Admins shouldn't easily delete other admins here, but for now we just delete
    if (user.role === 'ADMIN') {
      return res.status(403).json({ error: 'Cannot delete an ADMIN user.' });
    }

    // Prisma Cascade delete will handle Wallets, Transactions, AuditLogs, Notifications
    await prisma.user.delete({
      where: { id }
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Delete User Error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
