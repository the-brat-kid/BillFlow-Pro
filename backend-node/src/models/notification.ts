import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  business_profile_id: string;
  type: 'payment' | 'overdue' | 'low_stock' | 'system';
  title: string;
  message: string;
  read: boolean;
  data?: any;
  created_at: Date;
}

const NotificationSchema: Schema = new Schema({
  business_profile_id: { type: String, required: true, index: true },
  type: { type: String, enum: ['payment', 'overdue', 'low_stock', 'system'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  data: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now }
});

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
