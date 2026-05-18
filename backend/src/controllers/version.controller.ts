import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getSystemVersion = async (req: Request, res: Response) => {
  try {
    const versionSetting = await prisma.systemSetting.findUnique({
      where: { key: 'latest_version' }
    });

    res.json({ version: versionSetting ? versionSetting.value : '1.0.0' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve system version.' });
  }
};

export const updateSystemVersion = async (req: Request, res: Response) => {
  try {
    const { version } = req.body;

    if (!version) {
      return res.status(400).json({ error: 'Version is required.' });
    }

    const versionSetting = await prisma.systemSetting.upsert({
      where: { key: 'latest_version' },
      update: { value: version },
      create: { key: 'latest_version', value: version }
    });

    res.json({ success: true, message: 'System version updated successfully.', version: versionSetting.value });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update system version.' });
  }
};
