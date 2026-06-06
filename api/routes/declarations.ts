import express, { type Request, type Response } from 'express';
import declarationService from '../services/declarationService.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string | undefined,
      declarant_id: req.query.declarant_id as string | undefined,
    };
    const declarations = declarationService.listDeclarations(filters);
    res.json({ success: true, data: declarations });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const declaration = declarationService.getDeclarationById(req.params.id);
    if (!declaration) {
      return res.status(404).json({ success: false, error: '申报单不存在' });
    }
    res.json({ success: true, data: declaration });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const declaration = declarationService.createDeclaration({
      ...req.body,
      declarant_id: userId,
    });
    res.status(201).json({ success: true, data: declaration });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/:id/immune-check', (req: Request, res: Response) => {
  try {
    const declaration = declarationService.checkImmune(req.params.id);
    res.json({ success: true, data: declaration });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.post('/:id/bind-vehicle', (req: Request, res: Response) => {
  try {
    const declaration = declarationService.bindVehicle(req.params.id, req.body.vehicle_id);
    res.json({ success: true, data: declaration });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.post('/:id/issue-certificate', (req: Request, res: Response) => {
  try {
    const declaration = declarationService.issueCertificate(req.params.id, req.body.inspector_id);
    res.json({ success: true, data: declaration });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.post('/:id/start-transport', (req: Request, res: Response) => {
  try {
    const declaration = declarationService.startTransport(req.params.id);
    res.json({ success: true, data: declaration });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.get('/:id/receipts', (req: Request, res: Response) => {
  try {
    const receipts = declarationService.getReceiptsByDeclaration(req.params.id);
    res.json({ success: true, data: receipts });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/:id/receive', (req: Request, res: Response) => {
  try {
    const receipt = declarationService.receiveGoods({
      declaration_id: req.params.id,
      ...req.body
    });
    res.status(201).json({ success: true, data: receipt });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.get('/:id/reviews', (req: Request, res: Response) => {
  try {
    const reviews = declarationService.getReviewsByDeclaration(req.params.id);
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/:id/report-exception', (req: Request, res: Response) => {
  try {
    const review = declarationService.reportException({
      declaration_id: req.params.id,
      ...req.body
    });
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.post('/:id/withdraw', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const declaration = declarationService.withdrawDeclaration(
      req.params.id,
      userId,
      req.body.reason || ''
    );
    res.json({ success: true, data: declaration });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.post('/:id/rewrite', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const declaration = declarationService.rewriteDeclaration(
      req.params.id,
      userId,
      req.body
    );
    res.status(201).json({ success: true, data: declaration });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.post('/:id/submit-rewrite', (req: Request, res: Response) => {
  try {
    const declaration = declarationService.submitRewrite(req.params.id);
    res.json({ success: true, data: declaration });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.get('/:id/rewrite-history', (req: Request, res: Response) => {
  try {
    const history = declarationService.getRewriteHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
