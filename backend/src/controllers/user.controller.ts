import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import bcrypt from 'bcryptjs';

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { profilePicture, theme } = req.body;
    // @ts-ignore
    const userId = req.user.id;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(profilePicture !== undefined && { profilePicture }),
        ...(theme !== undefined && { theme }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        profilePicture: true,
        theme: true,
      }
    });

    res.json({ message: 'Settings updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    // @ts-ignore
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password' });
  }
};

export const updateEmail = async (req: Request, res: Response) => {
  try {
    const { newEmail, password } = req.body;
    // @ts-ignore
    const userId = req.user.id;

    if (!newEmail || !password) {
      return res.status(400).json({ error: 'New email and current password are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Check if email is already in use by someone else
    const existingEmail = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email is already in use' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { email: newEmail },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        profilePicture: true,
        theme: true,
      }
    });

    res.json({ message: 'Email updated successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update email' });
  }
};

import { PaymentPointService } from '../services/paymentpoint.service';
import { PaymentService } from '../services/payment.service';

export const generateAccounts = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const currentUserId = req.user.id;
    // @ts-ignore
    const userRole = req.user.role;
    
    // If admin is providing targetId, use that, otherwise use current user id
    const { targetId, provider } = req.body;
    const userId = (userRole === 'ADMIN' && targetId) ? targetId : currentUserId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    console.log(`Manually generating ${provider || 'ALL'} accounts for ${user.email}...`);

    let ppAccount = null;
    let psAccount = null;

    // 1. PaymentPoint
    if (!provider || provider === 'PAYMENTPOINT') {
      try {
        ppAccount = await PaymentPointService.createDedicatedAccount(user.email, user.name, user.phone);
      } catch (e) { 
        console.error('PP Gen Error:', e); 
        if (provider === 'PAYMENTPOINT') throw new Error('PaymentPoint is currently unavailable');
      }
    }

    // 2. Paystack
    if (!provider || provider === 'PAYSTACK') {
      try {
        const nameParts = user.name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts[1] : 'User';
        const customer = await PaymentService.createCustomer(user.email, firstName, lastName, user.phone);
        psAccount = await PaymentService.createVirtualAccount(customer.customer_code);
        if (provider === 'PAYSTACK' && !psAccount) throw new Error('Paystack could not generate account at this time');
      } catch (e: any) { 
        console.error('PS Gen Error:', e); 
        if (provider === 'PAYSTACK') throw new Error(e.message || 'Paystack is currently unavailable');
      }
    }

    // Update User
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        // @ts-ignore
        ...(ppAccount && {
          ppAccountNumber: ppAccount.accountNumber,
          ppBankName: ppAccount.bankName,
          ppAccountName: ppAccount.accountName,
        }),
        // @ts-ignore
        ...(psAccount && {
          psAccountNumber: psAccount.account_number,
          psBankName: psAccount.bank?.name,
          psAccountName: psAccount.account_name,
          paystackCustomerId: psAccount.customer?.customer_code
        })
      }
    });

    res.json({ message: `${provider || 'Accounts'} generated successfully`, user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate accounts' });
  }
};
