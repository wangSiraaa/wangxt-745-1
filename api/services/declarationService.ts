import { getDb, generateId } from '../db/index.js';
import type { Database } from 'better-sqlite3';
import batchService from './batchService.js';
import vehicleService from './vehicleService.js';

export interface QuarantineDeclaration {
  id: string;
  declaration_no: string;
  batch_id: string;
  vehicle_id?: string;
  declarant_id: string;
  destination: string;
  receiver?: string;
  receiver_phone?: string;
  declaration_date: string;
  immune_check_status: string;
  vehicle_check_status: string;
  certificate_status: string;
  transport_status: string;
  receipt_status: string;
  review_status: string;
  certificate_no?: string;
  certificate_issue_date?: string;
  exception_reason?: string;
  review_comment?: string;
  current_status: string;
  withdraw_reason?: string;
  withdraw_time?: string;
  withdraw_by?: string;
  rewrite_count: number;
  original_declaration_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ArrivalReceipt {
  id: string;
  declaration_id: string;
  arrival_time: string;
  receiver_name: string;
  pig_count: number;
  abnormal_count: number;
  abnormal_description?: string;
  receipt_status: string;
  signature?: string;
  created_at: string;
}

export interface ExceptionReview {
  id: string;
  declaration_id: string;
  exception_type: string;
  exception_description: string;
  reporter_id: string;
  report_time: string;
  reviewer_id?: string;
  review_comment?: string;
  review_time?: string;
  review_result?: string;
  handling_measures?: string;
  created_at: string;
}

export class DeclarationService {
  private db: Database;

  constructor() {
    this.db = getDb();
  }

  private generateDeclarationNo(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const seq = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `JY${dateStr}${seq}`;
  }

  createDeclaration(data: {
    batch_id: string;
    declarant_id: string;
    destination: string;
    receiver?: string;
    receiver_phone?: string;
  }): QuarantineDeclaration {
    const id = generateId('decl');
    const declarationNo = this.generateDeclarationNo();
    
    const stmt = this.db.prepare(`
      INSERT INTO quarantine_declarations 
      (id, declaration_no, batch_id, declarant_id, destination, receiver, receiver_phone, current_status)
      VALUES (@id, @declaration_no, @batch_id, @declarant_id, @destination, @receiver, @receiver_phone, 'declared')
    `);
    
    stmt.run({ id, declaration_no: declarationNo, ...data });
    return this.getDeclarationById(id)!;
  }

  getDeclarationById(id: string): QuarantineDeclaration | undefined {
    return this.db.prepare('SELECT * FROM quarantine_declarations WHERE id = ?').get(id) as QuarantineDeclaration | undefined;
  }

  getDeclarationByNo(declarationNo: string): QuarantineDeclaration | undefined {
    return this.db.prepare('SELECT * FROM quarantine_declarations WHERE declaration_no = ?').get(declarationNo) as QuarantineDeclaration | undefined;
  }

  listDeclarations(filters?: { status?: string; declarant_id?: string }): QuarantineDeclaration[] {
    let sql = 'SELECT * FROM quarantine_declarations WHERE 1=1';
    const params: any[] = [];
    
    if (filters?.status) {
      sql += ' AND current_status = ?';
      params.push(filters.status);
    }
    if (filters?.declarant_id) {
      sql += ' AND declarant_id = ?';
      params.push(filters.declarant_id);
    }
    
    sql += ' ORDER BY created_at DESC';
    return this.db.prepare(sql).all(...params) as QuarantineDeclaration[];
  }

  checkImmune(declarationId: string): QuarantineDeclaration {
    const decl = this.getDeclarationById(declarationId);
    if (!decl) {
      throw new Error('申报单不存在');
    }
    if (decl.current_status !== 'declared') {
      throw new Error('当前状态不允许进行免疫校验');
    }

    const immuneCheck = batchService.checkImmuneInterval(decl.batch_id);
    
    const status = immuneCheck.valid ? 'passed' : 'failed';
    const newStatus = immuneCheck.valid ? 'immune_checked' : decl.current_status;
    
    const stmt = this.db.prepare(`
      UPDATE quarantine_declarations 
      SET immune_check_status = ?, current_status = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(status, newStatus, declarationId);
    
    if (!immuneCheck.valid) {
      throw new Error(immuneCheck.message);
    }
    
    return this.getDeclarationById(declarationId)!;
  }

  bindVehicle(declarationId: string, vehicleId: string): QuarantineDeclaration {
    const decl = this.getDeclarationById(declarationId);
    if (!decl) {
      throw new Error('申报单不存在');
    }
    if (!['declared', 'immune_checked'].includes(decl.current_status)) {
      throw new Error('当前状态不允许绑定车辆');
    }

    const vehicleCheck = vehicleService.checkVehicleValidity(vehicleId);
    
    if (!vehicleCheck.valid) {
      const stmt = this.db.prepare(`
        UPDATE quarantine_declarations 
        SET vehicle_check_status = 'failed', vehicle_id = ?, updated_at = datetime('now')
        WHERE id = ?
      `);
      stmt.run(vehicleId, declarationId);
      throw new Error(vehicleCheck.message);
    }

    const stmt = this.db.prepare(`
      UPDATE quarantine_declarations 
      SET vehicle_id = ?, vehicle_check_status = 'passed', current_status = 'vehicle_bound', updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(vehicleId, declarationId);
    
    return this.getDeclarationById(declarationId)!;
  }

  issueCertificate(declarationId: string, inspectorId: string): QuarantineDeclaration {
    const decl = this.getDeclarationById(declarationId);
    if (!decl) {
      throw new Error('申报单不存在');
    }
    if (decl.current_status !== 'vehicle_bound') {
      throw new Error('请先完成免疫校验和车辆绑定');
    }

    if (decl.immune_check_status !== 'passed') {
      throw new Error('免疫校验未通过，不能出证');
    }
    if (decl.vehicle_check_status !== 'passed') {
      throw new Error('车辆校验未通过，不能出证');
    }

    const immuneCheck = batchService.checkImmuneInterval(decl.batch_id);
    if (!immuneCheck.valid) {
      throw new Error(immuneCheck.message);
    }

    const vehicleCheck = vehicleService.checkVehicleValidity(decl.vehicle_id!);
    if (!vehicleCheck.valid) {
      throw new Error(vehicleCheck.message);
    }

    const certificateNo = `ZJ${Date.now()}`;
    const stmt = this.db.prepare(`
      UPDATE quarantine_declarations 
      SET certificate_status = 'issued', certificate_no = ?, certificate_issue_date = datetime('now'), 
          current_status = 'certificate_issued', updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(certificateNo, declarationId);
    
    return this.getDeclarationById(declarationId)!;
  }

  startTransport(declarationId: string): QuarantineDeclaration {
    const decl = this.getDeclarationById(declarationId);
    if (!decl) {
      throw new Error('申报单不存在');
    }
    if (decl.current_status !== 'certificate_issued') {
      throw new Error('请先完成检疫出证');
    }

    const stmt = this.db.prepare(`
      UPDATE quarantine_declarations 
      SET transport_status = 'in_transit', current_status = 'in_transit', updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(declarationId);
    
    return this.getDeclarationById(declarationId)!;
  }

  receiveGoods(data: {
    declaration_id: string;
    receiver_name: string;
    pig_count: number;
    abnormal_count?: number;
    abnormal_description?: string;
    receipt_status: string;
    signature?: string;
  }): ArrivalReceipt {
    const decl = this.getDeclarationById(data.declaration_id);
    if (!decl) {
      throw new Error('申报单不存在');
    }
    if (decl.current_status !== 'in_transit') {
      throw new Error('当前状态不允许签收');
    }

    const id = generateId('receipt');
    const arrivalTime = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO arrival_receipts 
      (id, declaration_id, arrival_time, receiver_name, pig_count, abnormal_count, abnormal_description, receipt_status, signature)
      VALUES (@id, @declaration_id, @arrival_time, @receiver_name, @pig_count, @abnormal_count, @abnormal_description, @receipt_status, @signature)
    `);
    
    const abnormalCount = data.abnormal_count || 0;
    stmt.run({ id, arrival_time: arrivalTime, abnormal_count: abnormalCount, ...data });

    let newStatus: string;
    let receiptStatus: string;
    
    if (data.receipt_status === 'rejected') {
      newStatus = 'exception';
      receiptStatus = 'rejected';
    } else if (abnormalCount > 0) {
      newStatus = 'exception';
      receiptStatus = data.receipt_status;
    } else {
      newStatus = 'received';
      receiptStatus = 'received';
    }

    const updateStmt = this.db.prepare(`
      UPDATE quarantine_declarations 
      SET receipt_status = ?, current_status = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    updateStmt.run(receiptStatus, newStatus, data.declaration_id);
    
    return this.getReceiptById(id)!;
  }

  getReceiptById(id: string): ArrivalReceipt | undefined {
    return this.db.prepare('SELECT * FROM arrival_receipts WHERE id = ?').get(id) as ArrivalReceipt | undefined;
  }

  getReceiptsByDeclaration(declarationId: string): ArrivalReceipt[] {
    return this.db.prepare('SELECT * FROM arrival_receipts WHERE declaration_id = ? ORDER BY created_at DESC').all(declarationId) as ArrivalReceipt[];
  }

  reportException(data: {
    declaration_id: string;
    exception_type: string;
    exception_description: string;
    reporter_id: string;
  }): ExceptionReview {
    const decl = this.getDeclarationById(data.declaration_id);
    if (!decl) {
      throw new Error('申报单不存在');
    }

    const id = generateId('review');
    
    const stmt = this.db.prepare(`
      INSERT INTO exception_reviews 
      (id, declaration_id, exception_type, exception_description, reporter_id, review_result)
      VALUES (@id, @declaration_id, @exception_type, @exception_description, @reporter_id, 'pending')
    `);
    stmt.run({ id, ...data });

    const updateStmt = this.db.prepare(`
      UPDATE quarantine_declarations 
      SET transport_status = 'exception', current_status = 'exception', exception_reason = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    updateStmt.run(data.exception_description, data.declaration_id);
    
    return this.getReviewById(id)!;
  }

  getReviewById(id: string): ExceptionReview | undefined {
    return this.db.prepare('SELECT * FROM exception_reviews WHERE id = ?').get(id) as ExceptionReview | undefined;
  }

  getReviewsByDeclaration(declarationId: string): ExceptionReview[] {
    return this.db.prepare('SELECT * FROM exception_reviews WHERE declaration_id = ? ORDER BY created_at DESC').all(declarationId) as ExceptionReview[];
  }

  reviewException(data: {
    review_id: string;
    reviewer_id: string;
    review_comment: string;
    review_result: string;
    handling_measures?: string;
  }): ExceptionReview {
    const review = this.getReviewById(data.review_id);
    if (!review) {
      throw new Error('复核记录不存在');
    }

    const stmt = this.db.prepare(`
      UPDATE exception_reviews 
      SET reviewer_id = ?, review_comment = ?, review_result = ?, handling_measures = ?, review_time = datetime('now')
      WHERE id = ?
    `);
    stmt.run(data.reviewer_id, data.review_comment, data.review_result, data.handling_measures || null, data.review_id);

    const updateDeclStmt = this.db.prepare(`
      UPDATE quarantine_declarations 
      SET review_status = ?, review_comment = ?, current_status = 'reviewed', updated_at = datetime('now')
      WHERE id = ?
    `);
    updateDeclStmt.run(data.review_result === 'resolved' ? 'resolved' : 'reviewing', data.review_comment, review.declaration_id);
    
    return this.getReviewById(data.review_id)!;
  }

  listReviews(filters?: { review_result?: string }): ExceptionReview[] {
    let sql = 'SELECT * FROM exception_reviews WHERE 1=1';
    const params: any[] = [];
    
    if (filters?.review_result) {
      sql += ' AND review_result = ?';
      params.push(filters.review_result);
    }
    
    sql += ' ORDER BY created_at DESC';
    return this.db.prepare(sql).all(...params) as ExceptionReview[];
  }

  withdrawDeclaration(declarationId: string, userId: string, reason: string): QuarantineDeclaration {
    const decl = this.getDeclarationById(declarationId);
    if (!decl) {
      throw new Error('申报单不存在');
    }
    
    const allowedStatuses = ['declared', 'immune_checked', 'vehicle_bound', 'rewrite_pending'];
    if (!allowedStatuses.includes(decl.current_status)) {
      throw new Error('当前状态不允许撤回');
    }

    const stmt = this.db.prepare(`
      UPDATE quarantine_declarations 
      SET current_status = 'withdrawn', 
          withdraw_reason = ?, 
          withdraw_time = datetime('now'), 
          withdraw_by = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(reason, userId, declarationId);
    
    return this.getDeclarationById(declarationId)!;
  }

  rewriteDeclaration(declarationId: string, userId: string, data?: {
    destination?: string;
    receiver?: string;
    receiver_phone?: string;
  }): QuarantineDeclaration {
    const originalDecl = this.getDeclarationById(declarationId);
    if (!originalDecl) {
      throw new Error('原申报单不存在');
    }
    
    if (originalDecl.current_status !== 'withdrawn') {
      throw new Error('只有已撤回的申报单才能重办');
    }

    const id = generateId('decl');
    const declarationNo = this.generateDeclarationNo();
    
    const newDeclData = {
      id,
      declaration_no: declarationNo,
      batch_id: originalDecl.batch_id,
      declarant_id: userId,
      destination: data?.destination || originalDecl.destination,
      receiver: data?.receiver || originalDecl.receiver,
      receiver_phone: data?.receiver_phone || originalDecl.receiver_phone,
      original_declaration_id: declarationId,
      rewrite_count: (originalDecl.rewrite_count || 0) + 1,
      current_status: 'rewrite_pending' as const,
    };

    const insertStmt = this.db.prepare(`
      INSERT INTO quarantine_declarations 
      (id, declaration_no, batch_id, declarant_id, destination, receiver, receiver_phone, 
       original_declaration_id, rewrite_count, current_status)
      VALUES (@id, @declaration_no, @batch_id, @declarant_id, @destination, @receiver, @receiver_phone,
              @original_declaration_id, @rewrite_count, @current_status)
    `);
    insertStmt.run(newDeclData);

    const updateStmt = this.db.prepare(`
      UPDATE quarantine_declarations 
      SET rewrite_count = rewrite_count + 1,
          updated_at = datetime('now')
      WHERE id = ?
    `);
    updateStmt.run(declarationId);
    
    return this.getDeclarationById(id)!;
  }

  submitRewrite(declarationId: string): QuarantineDeclaration {
    const decl = this.getDeclarationById(declarationId);
    if (!decl) {
      throw new Error('申报单不存在');
    }
    
    if (decl.current_status !== 'rewrite_pending') {
      throw new Error('只有待提交的重办申报单才能提交');
    }

    const stmt = this.db.prepare(`
      UPDATE quarantine_declarations 
      SET current_status = 'declared',
          updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(declarationId);
    
    return this.getDeclarationById(declarationId)!;
  }

  getRewriteHistory(originalDeclarationId: string): QuarantineDeclaration[] {
    return this.db.prepare(`
      SELECT * FROM quarantine_declarations 
      WHERE original_declaration_id = ? 
      ORDER BY created_at DESC
    `).all(originalDeclarationId) as QuarantineDeclaration[];
  }
}

export default new DeclarationService();
