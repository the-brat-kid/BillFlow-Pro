import { Notification } from '../models/notification';
import { redisClient } from './redis';

export class NotificationService {
  static async create(data: { business_profile_id: string; type: string; title: string; message: string; data?: any }) {
    const notification = new Notification(data);
    await notification.save();

    redisClient.publish('notifications', JSON.stringify({
      business_profile_id: data.business_profile_id,
      notification: {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        created_at: notification.created_at
      }
    }));

    return notification;
  }

  static async getUnread(businessId: string, limit: number = 20, unreadOnly: boolean = false) {
    const query: any = { business_profile_id: businessId };
    if (unreadOnly) {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();

    const unread_count = await Notification.countDocuments({ business_profile_id: businessId, read: false });

    return {
      notifications: notifications.map(n => ({
        id: n._id,
        business_profile_id: n.business_profile_id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        created_at: n.created_at
      })),
      unread_count
    };
  }

  static async markAsRead(notificationId: string) {
    await Notification.findByIdAndUpdate(notificationId, { read: true });
  }
}
