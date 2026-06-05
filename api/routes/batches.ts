import express, { type Request, type Response } from 'express';
import batchService from '../services/batchService.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const batches = batchService.listBatches();
    res.json({ success: true, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const batch = batchService.getBatchById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, error: '批次不存在' });
    }
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const batch = batchService.createBatch({
      ...req.body,
      created_by: userId,
    });
    res.status(201).json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/:id/immune', (req: Request, res: Response) => {
  try {
    const records = batchService.getImmuneRecordsByBatch(req.params.id);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/:id/immune', (req: Request, res: Response) => {
  try {
    const record = batchService.addImmuneRecord({
      batch_id: req.params.id,
      ...req.body
    });
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/:id/immune-check', (req: Request, res: Response) => {
  try {
    const result = batchService.checkImmuneInterval(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
