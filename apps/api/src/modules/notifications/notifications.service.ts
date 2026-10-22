import mongoose from 'mongoose';
import {
  Notification,
  type INotification,
  type NotificationType,
} from '../../models/notification.model.js';
import { User, type Campus } from '../../models/user.model.js';
import { AppError } from '../../errors/app-error.js';

export interface NotificationFeed {
  items: INotification[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

export class NotificationsService {
  static async getUserNotifications(
    userId: string,
    limit = 10,
    offset = 0
  ): Promise<NotificationFeed> {
    const userObjId = new mongoose.Types.ObjectId(userId);

    const [items, total, unreadCount] = await Promise.all([
      Notification.find({ user: userObjId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit),
      Notification.countDocuments({ user: userObjId }),
      Notification.countDocuments({ user: userObjId, isRead: false }),
    ]);

    return {
      items,
      total,
      unreadCount,
      hasMore: offset + items.length < total,
    };
  }

  static async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({
      user: new mongoose.Types.ObjectId(userId),
      isRead: false,
    });
  }

  static async markAsRead(id: string, userId: string): Promise<INotification> {
    const notification = await Notification.findOne({
      _id: new mongoose.Types.ObjectId(id),
      user: new mongoose.Types.ObjectId(userId),
    });

    if (!notification) {
      throw AppError.notFound('Notification non trouvée');
    }

    notification.isRead = true;
    await notification.save();
    return notification;
  }

  static async markAllAsRead(userId: string): Promise<boolean> {
    await Notification.updateMany(
      { user: new mongoose.Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true } }
    );
    return true;
  }

  static async createNotification(
    userId: string,
    data: {
      title: string;
      message: string;
      type: NotificationType;
      link?: string;
    }
  ): Promise<INotification> {
    return Notification.create({
      user: new mongoose.Types.ObjectId(userId),
      title: data.title,
      message: data.message,
      type: data.type,
      link: data.link,
    });
  }

  static async notifyCampusUsers(
    campus: Campus,
    data: {
      title: string;
      message: string;
      type: NotificationType;
      link?: string;
      excludeUserId?: string;
    }
  ): Promise<void> {
    const query: Record<string, unknown> = { campus };
    if (data.excludeUserId) {
      query._id = { $ne: new mongoose.Types.ObjectId(data.excludeUserId) };
    }

    const users = await User.find(query).select('_id');
    if (users.length === 0) return;

    const docs = users.map((u) => ({
      user: u._id,
      title: data.title,
      message: data.message,
      type: data.type,
      link: data.link,
      isRead: false,
    }));

    await Notification.insertMany(docs);
  }
}
