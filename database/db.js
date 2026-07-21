const Database = require('better-sqlite3');
const path = require('path');
const logger = require('../utils/logger');

const DB_PATH = path.join(__dirname, '..', 'data', 'dashboard.db');

const fs = require('fs');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
    logger.info('Database initialized', { path: DB_PATH });
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS datasets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      row_count INTEGER NOT NULL DEFAULT 0,
      column_names TEXT NOT NULL DEFAULT '[]',
      uploaded_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataset_id INTEGER NOT NULL,
      row_index INTEGER NOT NULL,
      data TEXT NOT NULL,
      FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_records_dataset ON records(dataset_id);
  `);
}

function insertDataset(filename, originalName, fileType, rowCount, columnNames) {
  const stmt = getDb().prepare(
    'INSERT INTO datasets (filename, original_name, file_type, row_count, column_names) VALUES (?, ?, ?, ?, ?)'
  );
  const result = stmt.run(filename, originalName, fileType, rowCount, JSON.stringify(columnNames));
  return result.lastInsertRowid;
}

function insertRecords(datasetId, records) {
  const stmt = getDb().prepare(
    'INSERT INTO records (dataset_id, row_index, data) VALUES (?, ?, ?)'
  );
  const insertMany = getDb().transaction((rows) => {
    for (let i = 0; i < rows.length; i++) {
      stmt.run(datasetId, i, JSON.stringify(rows[i]));
    }
  });
  insertMany(records);
}

function getAllDatasets() {
  return getDb().prepare('SELECT * FROM datasets ORDER BY uploaded_at DESC').all();
}

function getLatestDataset() {
  return getDb().prepare('SELECT * FROM datasets ORDER BY uploaded_at DESC LIMIT 1').get();
}

function getRecordsByDataset(datasetId, limit = 5000) {
  const rows = getDb().prepare(
    'SELECT id, row_index, data FROM records WHERE dataset_id = ? ORDER BY row_index LIMIT ?'
  ).all(datasetId, limit);
  return rows.map(r => ({ ...r, data: JSON.parse(r.data) }));
}

function getRecordCount(datasetId) {
  return getDb().prepare('SELECT COUNT(*) as count FROM records WHERE dataset_id = ?').get(datasetId).count;
}

function deleteDataset(datasetId) {
  getDb().prepare('DELETE FROM records WHERE dataset_id = ?').run(datasetId);
  getDb().prepare('DELETE FROM datasets WHERE id = ?').run(datasetId);
}

function deleteAllDatasets() {
  getDb().exec('DELETE FROM records');
  getDb().exec('DELETE FROM datasets');
}

module.exports = {
  getDb,
  insertDataset,
  insertRecords,
  getAllDatasets,
  getLatestDataset,
  getRecordsByDataset,
  getRecordCount,
  deleteDataset,
  deleteAllDatasets,
};
