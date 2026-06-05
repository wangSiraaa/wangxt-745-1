import { getDb, generateId } from '../db/index.js';
import type { Database } from 'better-sqlite3';

export interface PigBatch {
  id: string;
  batch_no: string;
  farm_name: string;
  pig_count: number;
  breed?: string;
  birth_date?: string;
  source?: string;
  created_by: string;
  created_at: string;
  status: string;
}

export interface ImmuneRecord {
  id: string;
  batch_id: string;
  vaccine_type: string;
  vaccine_date: string;
  vaccine_batch?: string;
  manufacturer?: string;
  vaccinated_by?: string;
  created_at: string;
}

const IMMUNE_INTERVAL_DAYS = 21;

export class BatchService {
  private db: Database;

  constructor() {
    this.db = getDb();
  }

  createBatch(data: Omit<PigBatch, 'id' | 'created_at' | 'status'>): PigBatch {
    const id = generateId('batch');
    const stmt = this.db.prepare(`
      INSERT INTO pig_batches (id, batch_no, farm_name, pig_count, breed, birth_date, source, created_by, status)
      VALUES (@id, @batch_no, @farm_name, @pig_count, @breed, @birth_date, @source, @created_by, 'active')
    `);
    stmt.run({ id, ...data });
    return this.getBatchById(id)!;
  }

  getBatchById(id: string): PigBatch | undefined {
    return this.db.prepare('SELECT * FROM pig_batches WHERE id = ?').get(id) as PigBatch | undefined;
  }

  getBatchByNo(batchNo: string): PigBatch | undefined {
    return this.db.prepare('SELECT * FROM pig_batches WHERE batch_no = ?').get(batchNo) as PigBatch | undefined;
  }

  listBatches(): PigBatch[] {
    return this.db.prepare('SELECT * FROM pig_batches ORDER BY created_at DESC').all() as PigBatch[];
  }

  addImmuneRecord(data: Omit<ImmuneRecord, 'id' | 'created_at'>): ImmuneRecord {
    const id = generateId('imm');
    const stmt = this.db.prepare(`
      INSERT INTO immune_records (id, batch_id, vaccine_type, vaccine_date, vaccine_batch, manufacturer, vaccinated_by)
      VALUES (@id, @batch_id, @vaccine_type, @vaccine_date, @vaccine_batch, @manufacturer, @vaccinated_by)
    `);
    stmt.run({ id, ...data });
    return this.getImmuneRecordById(id)!;
  }

  getImmuneRecordById(id: string): ImmuneRecord | undefined {
    return this.db.prepare('SELECT * FROM immune_records WHERE id = ?').get(id) as ImmuneRecord | undefined;
  }

  getImmuneRecordsByBatch(batchId: string): ImmuneRecord[] {
    return this.db.prepare('SELECT * FROM immune_records WHERE batch_id = ? ORDER BY vaccine_date DESC').all(batchId) as ImmuneRecord[];
  }

  checkImmuneInterval(batchId: string): { valid: boolean; message: string; latestImmuneDate?: string; daysSinceImmune?: number } {
    const records = this.getImmuneRecordsByBatch(batchId);
    
    if (records.length === 0) {
      return { valid: false, message: '该批次无免疫记录，无法出证' };
    }

    const latestRecord = records[0];
    const immuneDate = new Date(latestRecord.vaccine_date);
    const today = new Date();
    const daysSinceImmune = Math.floor((today.getTime() - immuneDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceImmune < IMMUNE_INTERVAL_DAYS) {
      return {
        valid: false,
        message: `免疫未达间隔要求（需${IMMUNE_INTERVAL_DAYS}天，当前仅${daysSinceImmune}天），不能出证`,
        latestImmuneDate: latestRecord.vaccine_date,
        daysSinceImmune
      };
    }

    return {
      valid: true,
      message: '免疫间隔校验通过',
      latestImmuneDate: latestRecord.vaccine_date,
      daysSinceImmune
    };
  }
}

export default new BatchService();
