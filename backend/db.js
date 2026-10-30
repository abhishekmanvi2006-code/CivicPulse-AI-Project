const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'civicpulse.db');

let dbInstance = null;

async function getDb() {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();
  let db;

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
    } catch (e) {
      console.warn('Failed to load existing db, initializing fresh:', e.message);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  dbInstance = {
    _db: db,
    save() {
      try {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_FILE, buffer);
      } catch (err) {
        console.error('Error saving SQLite DB to disk:', err);
      }
    },
    exec(sql) {
      db.exec(sql);
      this.save();
    },
    query(sql, params = []) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    },
    get(sql, params = []) {
      const rows = this.query(sql, params);
      return rows.length > 0 ? rows[0] : null;
    },
    run(sql, params = []) {
      const stmt = db.prepare(sql);
      stmt.run(params);
      stmt.free();
      const lastIdRow = db.exec("SELECT last_insert_rowid() AS id");
      const lastInsertRowid = (lastIdRow && lastIdRow[0] && lastIdRow[0].values && lastIdRow[0].values[0])
        ? lastIdRow[0].values[0][0]
        : null;
      this.save();
      return { lastInsertRowid };
    }
  };

  initSchema(dbInstance);
  return dbInstance;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tracking_id TEXT UNIQUE NOT NULL,
      citizen_name TEXT,
      citizen_phone TEXT,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      category_confidence REAL DEFAULT 0.9,
      summary TEXT,
      image_url TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      address TEXT,
      priority TEXT NOT NULL,
      priority_score INTEGER NOT NULL,
      priority_factors TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'SUBMITTED',
      department TEXT DEFAULT 'Unassigned',
      assigned_to TEXT,
      parent_id INTEGER,
      duplicate_count INTEGER DEFAULT 1,
      similarity_score REAL DEFAULT 0,
      ai_source TEXT DEFAULT 'rule_based',
      resolution_notes TEXT,
      resolution_photo TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS timeline_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      action TEXT NOT NULL,
      note TEXT,
      actor TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sensitive_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      radius_meters REAL NOT NULL
    );
  `);
}

module.exports = {
  getDb,
  DB_FILE
};
