import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { Provider } from '../types/prisma';
import { seedDefaultServicePrices } from '../utils/pricing';
import { PaymentPointService } from '../services/PaymentPointService';
import { EmailService } from '../services/email.service';
import { PaymentService } from '../services/payment.service';

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

    // 5. Sales Summary (Last 24h & Total Profit)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dailySales = await prisma.transaction.aggregate({
      where: {
        status: 'SUCCESS',
        createdAt: { gte: oneDayAgo }
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    const totalProfits = await prisma.transaction.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { profit: true }
    });

    res.json({
      totalUsers,
      totalUserBalance,
      providerBalances,
      recentTransactions,
      totalSystemProfit: totalProfits._sum.profit || 0,
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
    const { provider } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (provider === 'PAYSTACK') {
      if (user.psAccountNumber) {
        return res.status(400).json({ error: 'User already has a Paystack virtual account' });
      }

      try {
        let customerId = user.paystackCustomerId;
        if (!customerId) {
          const nameParts = user.name.split(' ');
          const firstName = nameParts[0];
          const lastName = nameParts.length > 1 ? nameParts[1] : 'User';
          const customer = await PaymentService.createCustomer(
            user.email,
            firstName,
            lastName,
            user.phone
          );
          customerId = customer.customer_code;
        }

        if (!customerId) {
          return res.status(400).json({ error: 'Failed to create or retrieve Paystack customer profile' });
        }

        const psAccount = await PaymentService.createVirtualAccount(customerId);
        if (psAccount) {
          const accountNumber = psAccount.account_number;
          const bankName = psAccount.bank?.name || 'Wema Bank';
          const accountName = psAccount.account_name;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              paystackCustomerId: customerId,
              psAccountNumber: accountNumber,
              psBankName: bankName,
              psAccountName: accountName,
            }
          });
          return res.json({ message: 'Paystack Account generated successfully', bank: bankName, account: accountNumber });
        } else {
          return res.status(400).json({ error: 'Paystack returned empty dedicated account data. Make sure dedicated accounts are active on your dashboard.' });
        }
      } catch (apiError: any) {
        return res.status(400).json({ error: apiError.message || 'Failed to generate Paystack account' });
      }
    } else {
      // Default to PAYMENTPOINT
      if (user.ppAccountNumber) {
        return res.status(400).json({ error: 'User already has a PaymentPoint virtual account' });
      }

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
          return res.json({ message: 'PaymentPoint Account generated successfully', bank: bankName, account: accountNumber });
        } else {
          return res.status(400).json({ error: 'PaymentPoint returned empty account data.' });
        }
      } catch (apiError: any) {
        return res.status(400).json({ error: apiError.message || 'Failed to generate PaymentPoint account from provider' });
      }
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

export const createSystemAlert = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    // Deactivate all existing alerts
    await prisma.systemAlert.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    const alert = await prisma.systemAlert.create({
      data: { message, isActive: true }
    });

    res.json({ success: true, alert });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create alert' });
  }
};

export const deleteSystemAlert = async (req: Request, res: Response) => {
  try {
    await prisma.systemAlert.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete alert' });
  }
};

export const adjustUserWallet = async (req: Request, res: Response) => {
  const { userId, amount, action, description } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error('Wallet not found');

      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new Error('Invalid amount');
      }

      let newBalance = wallet.balance;
      if (action === 'CREDIT') {
        newBalance += numericAmount;
      } else if (action === 'DEBIT') {
        if (wallet.balance < numericAmount) {
          throw new Error('Insufficient wallet balance to complete manual debit.');
        }
        newBalance -= numericAmount;
      } else {
        throw new Error('Invalid adjustment action (must be CREDIT or DEBIT).');
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance }
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: action === 'CREDIT' ? 'MANUAL_CREDIT' : 'MANUAL_DEBIT',
          amount: numericAmount,
          previousBalance: wallet.balance,
          newBalance: updatedWallet.balance,
          description: description || `Manual admin wallet adjustment: ${action}`
        }
      });

      return updatedWallet;
    });

    res.json({ success: true, message: 'Wallet adjusted successfully', newBalance: result.balance });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllTransactionsAdmin = async (req: Request, res: Response) => {
  try {
    const { search, page = '1', limit = '10' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};
    if (search) {
      where.OR = [
        { id: { contains: search as string, mode: 'insensitive' } },
        { reference: { contains: search as string, mode: 'insensitive' } },
        { user: { email: { contains: search as string, mode: 'insensitive' } } },
        { user: { phone: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { user: { select: { name: true, email: true, phone: true } } }
      }),
      prisma.transaction.count({ where })
    ]);

    res.json({
      transactions,
      meta: {
        total,
        page: parseInt(page as string),
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve transactions.' });
  }
};

export const getMarketAnalysis = async (req: Request, res: Response) => {
  try {
    // 1. Top Users by purchase volume
    const users = await prisma.user.findMany({
      include: {
        transactions: {
          where: { status: 'SUCCESS' },
          select: { amount: true }
        }
      }
    });

    const analyzedUsers = users.map(user => {
      const totalVolume = user.transactions.reduce((sum, tx) => sum + tx.amount, 0);
      let tier = 'Silver';
      if (totalVolume >= 50000) tier = 'Platinum';
      else if (totalVolume >= 10000) tier = 'Gold';

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        totalSpent: totalVolume,
        tier
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);

    // 2. Referrals leaderboard (top referrers)
    const referrals = await prisma.referral.findMany({
      where: { status: 'PAID' }
    });

    const referralCounts: Record<string, number> = {};
    referrals.forEach(ref => {
      referralCounts[ref.referrerId] = (referralCounts[ref.referrerId] || 0) + 1;
    });

    const topReferrers = await Promise.all(
      Object.keys(referralCounts).map(async referrerId => {
        const user = await prisma.user.findUnique({
          where: { id: referrerId },
          select: { name: true, email: true }
        });
        return {
          name: user ? user.name : 'Unknown User',
          email: user ? user.email : '',
          count: referralCounts[referrerId]
        };
      })
    );
    topReferrers.sort((a, b) => b.count - a.count);

    // 3. Pricing Plan Rules
    await seedDefaultServicePrices();
    const planPrices = await prisma.servicePrice.findMany();

    res.json({
      topUsers: analyzedUsers.slice(0, 10),
      topReferrers: topReferrers.slice(0, 10),
      planPrices
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch market analysis.' });
  }
};

export const updatePlanPriceSetting = async (req: Request, res: Response) => {
  const { provider, planCode, providerPrice, sellingPrice, resellerPrice, serviceType = 'DATA' } = req.body;

  try {
    const updated = await prisma.servicePrice.upsert({
      where: { provider_planCode: { provider, planCode } },
      update: {
        providerPrice: parseFloat(providerPrice),
        sellingPrice: parseFloat(sellingPrice),
        resellerPrice: parseFloat(resellerPrice),
        serviceType
      },
      create: {
        provider,
        planCode,
        serviceType,
        providerPrice: parseFloat(providerPrice),
        sellingPrice: parseFloat(sellingPrice),
        resellerPrice: parseFloat(resellerPrice)
      }
    });

    res.json({ success: true, priceRule: updated });
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to update plan pricing rules.' });
  }
};

export const getReferralsAdmin = async (req: Request, res: Response) => {
  try {
    const referrals = await prisma.referral.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const referralData = await Promise.all(referrals.map(async (ref) => {
      const [referrer, referred] = await Promise.all([
        prisma.user.findUnique({
          where: { id: ref.referrerId },
          select: { name: true, email: true, phone: true }
        }),
        prisma.user.findUnique({
          where: { id: ref.referredId },
          select: { name: true, email: true, phone: true }
        })
      ]);

      return {
        id: ref.id,
        referrerName: referrer?.name || 'Unknown Referrer',
        referrerEmail: referrer?.email || '',
        referredName: referred?.name || 'Unknown User',
        referredEmail: referred?.email || '',
        bonusAmount: ref.bonusAmount,
        status: ref.status,
        createdAt: ref.createdAt
      };
    }));

    res.json(referralData);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve referrals.' });
  }
};

export const rewardReferralAdmin = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const referral = await prisma.referral.findUnique({ where: { id } });
    if (!referral) return res.status(404).json({ error: 'Referral not found.' });

    if (referral.status !== 'SUCCESS') {
      return res.status(400).json({ error: 'Referral must have a SUCCESS status to be rewarded.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const referrerWallet = await tx.wallet.findUnique({
        where: { userId: referral.referrerId }
      });

      if (!referrerWallet) throw new Error('Referrer wallet not found');

      const updatedWallet = await tx.wallet.update({
        where: { id: referrerWallet.id },
        data: { balance: { increment: referral.bonusAmount } }
      });

      const updatedReferral = await tx.referral.update({
        where: { id: referral.id },
        data: { status: 'PAID' }
      });

      const referredUser = await tx.user.findUnique({
        where: { id: referral.referredId },
        select: { name: true }
      });

      await tx.auditLog.create({
        data: {
          userId: referral.referrerId,
          action: 'CREDIT',
          amount: referral.bonusAmount,
          previousBalance: referrerWallet.balance,
          newBalance: updatedWallet.balance,
          description: `Manual admin referral reward for inviting ${referredUser?.name || 'User'}`
        }
      });

      await tx.notification.create({
        data: {
          userId: referral.referrerId,
          title: 'Referral Reward Credited! 🎁',
          message: `Admin has approved and credited your ₦${referral.bonusAmount} referral bonus for inviting ${referredUser?.name || 'User'}!`,
          type: 'SUCCESS'
        }
      });

      return updatedReferral;
    });

    res.json({ success: true, message: 'Referrer rewarded successfully!', referral: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to reward referrer.' });
  }
};
