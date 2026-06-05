import { getDb, generateId } from '../db/index.js';
import type { Database } from 'better-sqlite3';

export interface TransportVehicle {
  id: string;
  plate_no: string;
  vehicle_type: string;
  driver_name?: string;
  driver_phone?: string;
  registration_date: string;
  expiry_date: string;
  capacity?: number;
  disinfection_date?: string;
  status: string;
  created_at: string;
}

export class VehicleService {
  private db: Database;

  constructor() {
    this.db = getDb();
  }

  createVehicle(data: Omit<TransportVehicle, 'id' | 'created_at' | 'status'>): TransportVehicle {
    const id = generateId('vehicle');
    const stmt = this.db.prepare(`
      INSERT INTO transport_vehicles (id, plate_no, vehicle_type, driver_name, driver_phone, registration_date, expiry_date, capacity, disinfection_date, status)
      VALUES (@id, @plate_no, @vehicle_type, @driver_name, @driver_phone, @registration_date, @expiry_date, @capacity, @disinfection_date, 'active')
    `);
    stmt.run({ id, ...data });
    return this.getVehicleById(id)!;
  }

  getVehicleById(id: string): TransportVehicle | undefined {
    return this.db.prepare('SELECT * FROM transport_vehicles WHERE id = ?').get(id) as TransportVehicle | undefined;
  }

  getVehicleByPlate(plateNo: string): TransportVehicle | undefined {
    return this.db.prepare('SELECT * FROM transport_vehicles WHERE plate_no = ?').get(plateNo) as TransportVehicle | undefined;
  }

  listVehicles(): TransportVehicle[] {
    return this.db.prepare('SELECT * FROM transport_vehicles ORDER BY created_at DESC').all() as TransportVehicle[];
  }

  updateVehicleStatus(id: string, status: string): TransportVehicle | undefined {
    this.db.prepare('UPDATE transport_vehicles SET status = ? WHERE id = ?').run(status, id);
    return this.getVehicleById(id);
  }

  checkVehicleValidity(vehicleId: string): { valid: boolean; message: string; expiryDate?: string; daysUntilExpiry?: number } {
    const vehicle = this.getVehicleById(vehicleId);
    
    if (!vehicle) {
      return { valid: false, message: '车辆不存在' };
    }

    if (vehicle.status === 'expired') {
      return { valid: false, message: '车辆备案已过期，不能运输', expiryDate: vehicle.expiry_date };
    }

    if (vehicle.status === 'maintenance') {
      return { valid: false, message: '车辆正在维护中，不能运输', expiryDate: vehicle.expiry_date };
    }

    const expiryDate = new Date(vehicle.expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      this.db.prepare('UPDATE transport_vehicles SET status = ? WHERE id = ?').run('expired', vehicleId);
      return { valid: false, message: '车辆备案已过期，不能运输', expiryDate: vehicle.expiry_date, daysUntilExpiry };
    }

    return {
      valid: true,
      message: '车辆备案有效',
      expiryDate: vehicle.expiry_date,
      daysUntilExpiry
    };
  }
}

export default new VehicleService();
