import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    res.json({ notifications, unreadCount });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true }
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.user.id;

    await prisma.notification.deleteMany({
      where: { id, userId }
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};
