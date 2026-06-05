import express, { type Request, type Response } from 'express';
import declarationService from '../services/declarationService.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const filters = {
      review_result: req.query.review_result as string | undefined,
    };
    const reviews = declarationService.listReviews(filters);
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const review = declarationService.getReviewById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, error: '复核记录不存在' });
    }
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/:id/review', (req: Request, res: Response) => {
  try {
    const review = declarationService.reviewException({
      review_id: req.params.id,
      ...req.body
    });
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

export default router;
