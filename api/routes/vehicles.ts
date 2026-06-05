import express, { type Request, type Response } from 'express';
import vehicleService from '../services/vehicleService.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const vehicles = vehicleService.listVehicles();
    res.json({ success: true, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const vehicle = vehicleService.getVehicleById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, error: '车辆不存在' });
    }
    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const vehicle = vehicleService.createVehicle(req.body);
    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/:id/validity', (req: Request, res: Response) => {
  try {
    const result = vehicleService.checkVehicleValidity(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.patch('/:id/status', (req: Request, res: Response) => {
  try {
    const vehicle = vehicleService.updateVehicleStatus(req.params.id, req.body.status);
    if (!vehicle) {
      return res.status(404).json({ success: false, error: '车辆不存在' });
    }
    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
