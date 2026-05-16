import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import { z } from 'zod';
import { config } from '../config/config';
import { prisma } from '../utils/prisma';
import { PaymentPointService } from '../services/PaymentPointService';
import { EmailService } from '../services/EmailService';

// Validation Schemas
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(11),
  password: z.string().min(8),
  referralCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Helper: Generate Tokens
const generateTokens = (userId: string) => {
  const token = jwt.sign({ userId }, config.JWT_SECRET as jwt.Secret, {
    expiresIn: config.JWT_EXPIRES_IN as any,
  });

  const refreshToken = jwt.sign({ userId }, config.JWT_REFRESH_SECRET as jwt.Secret, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN as any,
  });

  return { token, refreshToken };
};

export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: validatedData.email }, { phone: validatedData.phone }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or phone already exists' });
    }

    // Check for Referrer
    let referrerId = null;
    if (validatedData.referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: validatedData.referralCode }
      });
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    // 1. Create PaymentPoint Dedicated Account
    const virtualAccount = await PaymentPointService.createDedicatedAccount(
      validatedData.email,
      validatedData.name,
      validatedData.phone
    );

    // 2. Create user and wallet in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          passwordHash,
          virtualAccountNumber: virtualAccount?.accountNumber,
          virtualAccountBank: virtualAccount?.bankName,
          virtualAccountName: virtualAccount?.accountName,
          referredBy: referrerId,
        },
      });

      await tx.wallet.create({
        data: { userId: user.id },
      });

      if (referrerId) {
        await (tx as any).referral.create({
          data: {
            referrerId,
            referredId: user.id,
            bonusAmount: 100,
            status: 'PENDING'
          }
        });
      }

      return { user };
    });

    const { token, refreshToken } = generateTokens(result.user.id);

    res.status(201).json({
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        referralCode: result.user.referralCode
      },
      token,
      refreshToken,
    });

    // Send Welcome Email asynchronously
    EmailService.sendWelcomeEmail(result.user.email, result.user.name).catch(e => console.error('Failed to send welcome email', e));

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Safety: Ensure user has a wallet
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet) {
      await prisma.wallet.create({ data: { userId: user.id } });
      console.log(`Self-healed: Created missing wallet for user ${user.email}`);
    }

    const { token, refreshToken } = generateTokens(user.id);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        referralCode: user.referralCode
      },
      token,
      refreshToken,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const payload = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET as jwt.Secret) as { userId: string };
    const { token, refreshToken: newRefreshToken } = generateTokens(payload.userId);

    res.json({ token, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        twoFactorEnabled: true,
        virtualAccountNumber: true,
        virtualAccountBank: true,
        virtualAccountName: true,
        referralCode: true,
        wallet: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const setup2FA = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(
      // @ts-ignore
      req.user.email,
      'AGD Data Plus',
      secret
    );

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    res.json({ secret, otpauthUrl });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verify2FA = async (req: Request, res: Response) => {
  const { token } = req.body;

  try {
    // @ts-ignore
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA not setup' });
    }

    const isValid = authenticator.verify({
      token,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid 2FA token' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getNotifications = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const notifications = await (prisma as any).notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markNotificationAsRead = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await (prisma as any).notification.update({
      where: { id },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

export const getReferrals = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const referrals = await (prisma as any).referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        // Find the name of the person referred
        // This requires a relation in prisma which I'll check
      }
    });

    // Manually fetch names if relation not set up yet
    const referralData = await Promise.all(referrals.map(async (ref: any) => {
      const referredUser = await prisma.user.findUnique({
        where: { id: ref.referredId },
        select: { name: true, createdAt: true }
      });
      return {
        ...ref,
        referredName: referredUser?.name || 'Unknown User',
        referredAt: referredUser?.createdAt
      };
    }));

    res.json(referralData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
};
