export const schema = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('declarant', 'inspector', 'driver', 'reviewer')),
  name TEXT NOT NULL,
  phone TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pig_batches (
  id TEXT PRIMARY KEY,
  batch_no TEXT UNIQUE NOT NULL,
  farm_name TEXT NOT NULL,
  pig_count INTEGER NOT NULL,
  breed TEXT,
  birth_date TEXT,
  source TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'quarantined', 'shipped', 'completed'))
);

CREATE TABLE IF NOT EXISTS immune_records (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  vaccine_type TEXT NOT NULL,
  vaccine_date TEXT NOT NULL,
  vaccine_batch TEXT,
  manufacturer TEXT,
  vaccinated_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (batch_id) REFERENCES pig_batches(id)
);

CREATE TABLE IF NOT EXISTS transport_vehicles (
  id TEXT PRIMARY KEY,
  plate_no TEXT UNIQUE NOT NULL,
  vehicle_type TEXT NOT NULL,
  driver_name TEXT,
  driver_phone TEXT,
  registration_date TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  capacity INTEGER,
  disinfection_date TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'maintenance')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS quarantine_declarations (
  id TEXT PRIMARY KEY,
  declaration_no TEXT UNIQUE NOT NULL,
  batch_id TEXT NOT NULL,
  vehicle_id TEXT,
  declarant_id TEXT NOT NULL,
  destination TEXT NOT NULL,
  receiver TEXT,
  receiver_phone TEXT,
  declaration_date TEXT DEFAULT (datetime('now')),
  immune_check_status TEXT DEFAULT 'pending' CHECK (immune_check_status IN ('pending', 'passed', 'failed')),
  vehicle_check_status TEXT DEFAULT 'pending' CHECK (vehicle_check_status IN ('pending', 'passed', 'failed')),
  certificate_status TEXT DEFAULT 'pending' CHECK (certificate_status IN ('pending', 'issued', 'rejected')),
  transport_status TEXT DEFAULT 'pending' CHECK (transport_status IN ('pending', 'in_transit', 'arrived', 'exception')),
  receipt_status TEXT DEFAULT 'pending' CHECK (receipt_status IN ('pending', 'received', 'rejected')),
  review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'reviewing', 'resolved', 'closed')),
  certificate_no TEXT,
  certificate_issue_date TEXT,
  exception_reason TEXT,
  review_comment TEXT,
  current_status TEXT DEFAULT 'declared' CHECK (current_status IN (
    'declared', 'immune_checked', 'vehicle_bound', 'certificate_issued',
    'in_transit', 'received', 'exception', 'reviewed', 'completed',
    'withdrawn', 'rewrite_pending'
  )),
  withdraw_reason TEXT,
  withdraw_time TEXT,
  withdraw_by TEXT,
  rewrite_count INTEGER DEFAULT 0,
  original_declaration_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (batch_id) REFERENCES pig_batches(id),
  FOREIGN KEY (vehicle_id) REFERENCES transport_vehicles(id),
  FOREIGN KEY (declarant_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS arrival_receipts (
  id TEXT PRIMARY KEY,
  declaration_id TEXT NOT NULL,
  arrival_time TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  pig_count INTEGER NOT NULL,
  abnormal_count INTEGER DEFAULT 0,
  abnormal_description TEXT,
  receipt_status TEXT NOT NULL CHECK (receipt_status IN ('received', 'rejected', 'partial')),
  signature TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (declaration_id) REFERENCES quarantine_declarations(id)
);

CREATE TABLE IF NOT EXISTS exception_reviews (
  id TEXT PRIMARY KEY,
  declaration_id TEXT NOT NULL,
  exception_type TEXT NOT NULL,
  exception_description TEXT NOT NULL,
  reporter_id TEXT NOT NULL,
  report_time TEXT DEFAULT (datetime('now')),
  reviewer_id TEXT,
  review_comment TEXT,
  review_time TEXT,
  review_result TEXT CHECK (review_result IN ('pending', 'approved', 'rejected', 'resolved')),
  handling_measures TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (declaration_id) REFERENCES quarantine_declarations(id),
  FOREIGN KEY (reporter_id) REFERENCES users(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_declarations_batch ON quarantine_declarations(batch_id);
CREATE INDEX IF NOT EXISTS idx_declarations_vehicle ON quarantine_declarations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_immune_batch ON immune_records(batch_id);
CREATE INDEX IF NOT EXISTS idx_receipts_declaration ON arrival_receipts(declaration_id);
CREATE INDEX IF NOT EXISTS idx_reviews_declaration ON exception_reviews(declaration_id);
`;

export const initialData = `
INSERT OR IGNORE INTO users (id, username, password, role, name, phone) VALUES
  ('u1', 'declarant', '123456', 'declarant', '张三', '13800138001'),
  ('u2', 'inspector', '123456', 'inspector', '李四', '13800138002'),
  ('u3', 'driver', '123456', 'driver', '王五', '13800138003'),
  ('u4', 'reviewer', '123456', 'reviewer', '赵六', '13800138004');

INSERT OR IGNORE INTO pig_batches (id, batch_no, farm_name, pig_count, breed, birth_date, source, created_by, status) VALUES
  ('b1', 'BATCH202401001', '阳光养猪场', 100, '长白猪', '2024-01-15', '自繁自养', 'u1', 'active'),
  ('b2', 'BATCH202401002', '希望牧场', 80, '大白猪', '2024-01-20', '自繁自养', 'u1', 'active');

INSERT OR IGNORE INTO immune_records (id, batch_id, vaccine_type, vaccine_date, vaccine_batch, manufacturer, vaccinated_by) VALUES
  ('imm1', 'b1', '猪瘟疫苗', '2024-03-01', 'YM202402001', '某生物制药有限公司', '李兽医'),
  ('imm2', 'b1', '口蹄疫疫苗', '2024-03-05', 'YM202402002', '某生物制药有限公司', '李兽医'),
  ('imm3', 'b2', '猪瘟疫苗', '2024-06-01', 'YM202405001', '某生物制药有限公司', '王兽医');

INSERT OR IGNORE INTO transport_vehicles (id, plate_no, vehicle_type, driver_name, driver_phone, registration_date, expiry_date, capacity, disinfection_date, status) VALUES
  ('v1', '京A12345', '冷藏运输车', '王五', '13800138003', '2023-01-15', '2025-01-14', 500, '2024-06-01', 'active'),
  ('v2', '京B67890', '普通货车', '赵七', '13800138005', '2022-06-20', '2024-06-19', 300, '2024-05-15', 'expired');
`;
