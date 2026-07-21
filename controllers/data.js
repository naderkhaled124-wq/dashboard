const db = require('../database/db');
const logger = require('../utils/logger');

function getData(req, res) {
  try {
    const datasetId = req.query.datasetId
      ? parseInt(req.query.datasetId, 10)
      : null;

    let dataset;
    if (datasetId) {
      dataset = db.getAllDatasets().find((d) => d.id === datasetId);
    } else {
      dataset = db.getLatestDataset();
    }

    if (!dataset) {
      return res.json({ dataset: null, records: [], total: 0 });
    }

    const limit = parseInt(req.query.limit, 10) || 5000;
    const records = db.getRecordsByDataset(dataset.id, limit);
    const total = db.getRecordCount(dataset.id);

    res.json({
      dataset: {
        id: dataset.id,
        originalName: dataset.original_name,
        fileType: dataset.file_type,
        rowCount: dataset.row_count,
        columnNames: JSON.parse(dataset.column_names),
        uploadedAt: dataset.uploaded_at,
      },
      records: records.map((r) => r.data),
      total,
    });
  } catch (err) {
    logger.error('Failed to fetch data', { error: err.message });
    res.status(500).json({ error: 'فشل في استرجاع البيانات' });
  }
}

function getKPIs(req, res) {
  try {
    const dataset = db.getLatestDataset();
    if (!dataset) {
      return res.json({ kpis: [], columns: [] });
    }

    const records = db.getRecordsByDataset(dataset.id, 10000);
    const data = records.map((r) => r.data);
    const columns = JSON.parse(dataset.column_names);

    const numericCols = columns.filter((col) => {
      const values = data.map((row) => row[col]).filter((v) => v !== null && v !== undefined && v !== '');
      if (values.length === 0) return false;

      const numericCount = values.filter((v) => {
        if (typeof v === 'number') return true;
        const n = parseFloat(v);
        return !isNaN(n) && String(v).trim() !== '';
      }).length;

      const ratio = numericCount / values.length;
      if (ratio < 0.8) return false;

      const firstNumeric = values.find((v) => !isNaN(parseFloat(v)));
      if (typeof firstNumeric === 'string' && /^\d{4}[-/]\d{1,2}/.test(firstNumeric)) return false;

      return true;
    });

    const kpis = numericCols.map((col) => {
      const values = data
        .map((row) => parseFloat(row[col]))
        .filter((v) => !isNaN(v));

      if (values.length === 0) return null;

      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      return {
        label: col,
        sum: Math.round(sum * 100) / 100,
        avg: Math.round(avg * 100) / 100,
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        count: values.length,
      };
    }).filter(Boolean);

    res.json({ kpis, columns });
  } catch (err) {
    logger.error('Failed to compute KPIs', { error: err.message });
    res.status(500).json({ error: 'فشل في حساب المؤشرات' });
  }
}

function getDatasets(req, res) {
  try {
    const datasets = db.getAllDatasets();
    res.json({ datasets });
  } catch (err) {
    logger.error('Failed to list datasets', { error: err.message });
    res.status(500).json({ error: 'فشل في استرجاع قائمة الملفات' });
  }
}

function deleteDataset(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) {
      return res.status(400).json({ error: 'معرف غير صالح' });
    }
    db.deleteDataset(id);
    logger.info('Dataset deleted', { id });
    res.json({ success: true });
  } catch (err) {
    logger.error('Failed to delete dataset', { error: err.message });
    res.status(500).json({ error: 'فشل في حذف الملف' });
  }
}

module.exports = { getData, getKPIs, getDatasets, deleteDataset };
