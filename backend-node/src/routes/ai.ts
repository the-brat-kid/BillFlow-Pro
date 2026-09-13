import { Router, Request, Response } from 'express';
import { AIService } from '../services/ai';

const router = Router();

router.post('/insights', async (req: Request, res: Response) => {
  try {
    const { business_profile_id, period } = req.body;
    if (!business_profile_id) {
      res.status(400).json({ error: 'business_profile_id is required' });
      return;
    }
    const result = await AIService.getInsights(business_profile_id, period);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/predictions', async (req: Request, res: Response) => {
  try {
    const { business_profile_id, products } = req.body;
    if (!business_profile_id || !Array.isArray(products)) {
      res.status(400).json({ error: 'business_profile_id and products array are required' });
      return;
    }
    const result = await AIService.getPredictions(business_profile_id, products);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/invoice-assist', async (req: Request, res: Response) => {
  try {
    const { business_profile_id, customer_name, items, context } = req.body;
    if (!business_profile_id) {
      res.status(400).json({ error: 'business_profile_id is required' });
      return;
    }
    const result = await AIService.getInvoiceAssist(business_profile_id, customer_name, items, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
