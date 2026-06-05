import { getDb, initDb } from '../api/db/index.js';

initDb();
const db = getDb();

console.log('表列表：');
console.log(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all());

console.log('\n用户表数据：');
console.log(db.prepare('SELECT * FROM users').all());
