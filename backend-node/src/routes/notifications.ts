import { Router, Request, Response } from 'express';
import { NotificationService } from '../services/notifications';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const business_profile_id = req.query.business_profile_id as string;
    const limit = parseInt(req.query.limit as string) || 20;
    const unread_only = req.query.unread_only === 'true';

    if (!business_profile_id) {
      res.status(400).json({ error: 'business_profile_id query parameter is required' });
      return;
    }

    const result = await NotificationService.getUnread(business_profile_id, limit, unread_only);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await NotificationService.markAsRead(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { business_profile_id, type, title, message } = req.body;
    if (!business_profile_id || !type || !title || !message) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const notification = await NotificationService.create({
      business_profile_id, type, title, message
    });

    res.status(201).json({ notification });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
