import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import bcrypt from 'bcryptjs';

export const setTransactionPin = async (req: Request, res: Response) => {
  try {
    const { password, pin } = req.body;
    // @ts-ignore
    const userId = req.user.id;

    if (!password || !pin) {
      return res.status(400).json({ error: 'Password and 4-digit PIN are required.' });
    }

    if (pin.length !== 4 || isNaN(Number(pin))) {
      return res.status(400).json({ error: 'PIN must be exactly 4 digits.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Verify password first
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect account password.' });
    }

    // Hash the PIN
    const hashedPin = await bcrypt.hash(pin, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { transactionPin: hashedPin }
    });

    res.json({ success: true, message: 'Transaction PIN set successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to set transaction PIN.' });
  }
};

export const verifyTransactionPin = async (req: Request, res: Response) => {
  try {
    const { pin } = req.body;
    // @ts-ignore
    const userId = req.user.id;

    if (!pin) {
      return res.status(400).json({ error: 'PIN is required.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.transactionPin) {
      return res.status(404).json({ error: 'Transaction PIN not configured.' });
    }

    const isMatch = await bcrypt.compare(pin, user.transactionPin);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid transaction PIN.' });
    }

    res.json({ success: true, message: 'PIN verified successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to verify transaction PIN.' });
  }
};

export const checkPinConfigured = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    res.json({ configured: !!(user && user.transactionPin) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check PIN configuration.' });
  }
};
