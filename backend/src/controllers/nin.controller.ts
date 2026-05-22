import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
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

// Helper to map frontend slip type to ArewaWise slip type
const mapFrontendToApiSlipType = (frontendType: 'NIN_BASIC' | 'NIN_STANDARD' | 'NIN_PREMIUM'): 'information' | 'standard' | 'premium' => {
  if (frontendType === 'NIN_BASIC') return 'information';
  if (frontendType === 'NIN_STANDARD') return 'standard';
  return 'premium';
};

// Helper to generate a highly realistic demographic mock response for frontend visual preview
const generateDemographicMock = (nin: string, defaultName: string) => {
  const nameParts = defaultName.split(' ');
  const lastName = nameParts[0] || 'Dangote';
  const firstName = nameParts[1] || 'Aliko';
  const middleName = nameParts.slice(2).join(' ') || 'GCON';
  const randomTrackingId = `FT-${Math.floor(10000000 + Math.random() * 90000000)}`;

  return {
    nin: nin,
    firstName: firstName,
    middleName: middleName,
    lastName: lastName,
    fullName: `${firstName} ${middleName} ${lastName}`.trim().toUpperCase(),
    gender: Math.random() > 0.5 ? 'MALE' : 'FEMALE',
    dateOfBirth: '1987-04-10',
    phone: '08012345678',
    trackingId: randomTrackingId,
    address: '15, Alfred Rewane Road, Ikoyi, Lagos, Nigeria',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=300&h=300',
    stateOfOrigin: 'Kano State',
    lga: 'Kano Municipal',
    issueDate: new Date().toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })
  };
};

export const verifyNinSlip = async (req: Request, res: Response) => {
  try {
    const validated = ninVerifySchema.parse(req.body);
    // @ts-ignore
    const userId = req.user.id;
    const apiSlipType = mapFrontendToApiSlipType(validated.slipType);

    // 1. Check if cache exists
    const cachedVerification = await prisma.ninVerification.findUnique({
      where: {
        userId_nin_slipType: {
          userId,
          nin: validated.nin,
          slipType: apiSlipType,
        },
      },
    });

    if (cachedVerification) {
      // Verify the cached PDF file actually exists on disk
      if (fs.existsSync(cachedVerification.pdfPath)) {
        console.log(`[NIN Controller] Cache hit for user \${userId}, NIN \${validated.nin}, type \${apiSlipType}. Bypassing payment.`);
        
        // Fetch user to personalize the mock card
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const name = user ? user.name : 'Aliko Dangote';
        const data = generateDemographicMock(validated.nin, name);

        return res.json({
          success: true,
          message: 'NIN verified successfully (Loaded from Cache)',
          downloadUrl: `/api/vtu/nin/download/\${cachedVerification.id}`,
          data: {
            ...data,
            downloadUrl: `/api/vtu/nin/download/\${cachedVerification.id}`
          }
        });
      } else {
        console.warn(`[NIN Controller] Cache record found but PDF file was missing on disk: \${cachedVerification.pdfPath}. Re-fetching.`);
      }
    }

    // 2. Process Database Transaction (Balance Check, PIN Verification, Debit) for first-time request
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

      // Default profitable pricing:
      // - Cost price = 200 Naira for all slip types.
      // - NIN_BASIC sellingPrice = 250, resellerPrice = 220
      // - NIN_STANDARD sellingPrice = 300, resellerPrice = 250
      // - NIN_PREMIUM sellingPrice = 450, resellerPrice = 350
      let costPrice = 200;
      let sellingPrice = 300; // default for STANDARD
      let resellerPrice = 250; // default for STANDARD
      
      if (validated.slipType === 'NIN_BASIC') {
        sellingPrice = 250;
        resellerPrice = 220;
      } else if (validated.slipType === 'NIN_PREMIUM') {
        sellingPrice = 450;
        resellerPrice = 350;
      }

      // Check for ServicePrice database override
      const priceRule = await tx.servicePrice.findFirst({
        where: { planCode: validated.slipType, serviceType: 'NIN' }
      });

      if (priceRule) {
        sellingPrice = priceRule.sellingPrice;
        resellerPrice = priceRule.resellerPrice;
        costPrice = priceRule.providerPrice;
      }

      const finalAmountToDebit = user.role === 'RESELLER' || user.role === 'ADMIN' 
        ? resellerPrice 
        : sellingPrice;

      if (user.wallet.balance < finalAmountToDebit) {
        throw new Error('Insufficient wallet balance');
      }

      // Create PENDING transaction
      const reference = `AGD-NIN-\${uuidv4().slice(0, 8).toUpperCase()}`;
      const transaction = await tx.transaction.create({
        data: {
          userId,
          walletId: user.wallet.id,
          amount: finalAmountToDebit,
          serviceType: ServiceType.NIN,
          status: TransactionStatus.PENDING,
          provider: Provider.NIMC, // NIMC/ArewaWise
          reference,
          description: `NIN Slip print (\${validated.slipType}) for ID: \${validated.nin}`,
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
          description: `Debit for NIN Verification. Ref: \${reference}`,
        },
      });

      return { transaction, user, finalAmountToDebit, costPrice };
    });

    // 3. Call external identity provider API outside DB lock
    try {
      console.log(`[NIN Controller] Cache miss. Fetching ArewaWise slip for NIN: \${validated.nin}, slipType: \${apiSlipType}...`);
      const slipResponse = await ninService.fetchArewaWiseSlip(validated.nin, 'nin', apiSlipType);

      if (!slipResponse.success || !slipResponse.pdf) {
        throw new Error(slipResponse.message || 'Failed to fetch slip PDF from ArewaWise');
      }

      // 4. Save PDF to local server filesystem (uploads/nins/)
      const uploadsDir = path.join(process.cwd(), 'uploads', 'nins');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `\${userId}_\${validated.nin}_\${apiSlipType}.pdf`;
      const pdfPath = path.join(uploadsDir, filename);
      const pdfBuffer = Buffer.from(slipResponse.pdf, 'base64');
      fs.writeFileSync(pdfPath, pdfBuffer);

      console.log(`[NIN Controller] Saved NIN PDF slip to server disk: \${pdfPath}`);

      // 5. Store record in database
      const newVerification = await prisma.ninVerification.upsert({
        where: {
          userId_nin_slipType: {
            userId,
            nin: validated.nin,
            slipType: apiSlipType,
          },
        },
        update: {
          pdfPath,
        },
        create: {
          userId,
          nin: validated.nin,
          searchType: 'nin',
          slipType: apiSlipType,
          pdfPath,
        },
      });

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
          message: `Your NIN verification for ID \${validated.nin} was successful. Download your slip now!`,
          type: 'SUCCESS',
        },
      });

      const demographicData = generateDemographicMock(validated.nin, result.user.name);

      res.json({
        success: true,
        message: 'NIN verified successfully',
        transaction: {
          ...result.transaction,
          status: TransactionStatus.SUCCESS
        },
        downloadUrl: `/api/vtu/nin/download/\${newVerification.id}`,
        data: {
          ...demographicData,
          downloadUrl: `/api/vtu/nin/download/\${newVerification.id}`
        }
      });

    } catch (apiError: any) {
      // 6. If API fails, initiate REFUND to user wallet
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
            description: `Refund for failed NIN Verification. Ref: \${result.transaction.reference}`,
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

export const getNinHistory = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;

    const history = await prisma.ninVerification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const formattedHistory = history.map(item => ({
      id: item.id,
      nin: item.nin,
      searchType: item.searchType,
      slipType: item.slipType,
      createdAt: item.createdAt,
      downloadUrl: `/api/vtu/nin/download/\${item.id}`,
    }));

    res.json({
      success: true,
      history: formattedHistory,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve NIN history' });
  }
};

export const downloadNinSlip = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { id } = req.params;

    const verification = await prisma.ninVerification.findUnique({
      where: { id },
    });

    if (!verification) {
      return res.status(404).json({ error: 'NIN verification record not found' });
    }

    // Secure ownership validation
    if (verification.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized download request' });
    }

    if (!fs.existsSync(verification.pdfPath)) {
      return res.status(404).json({ error: 'NIN slip PDF file not found on disk' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="NIN_Slip_\${verification.slipType}_\${verification.nin}.pdf"`);

    const fileStream = fs.createReadStream(verification.pdfPath);
    fileStream.pipe(res);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to download NIN slip' });
  }
};
