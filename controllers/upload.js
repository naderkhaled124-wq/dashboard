const path = require('path');
const fs = require('fs');
const { parseFile } = require('../utils/parser');
const db = require('../database/db');
const logger = require('../utils/logger');

function handleUpload(req, res) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'لم يتم رفع أي ملف' });
    }

    logger.info('File received', {
      name: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });

    const result = parseFile(file.buffer, file.originalname);

    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'الملف لا يحتوي بيانات صالحة' });
    }

    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const datasetId = db.insertDataset(
      file.filename || `upload_${Date.now()}`,
      file.originalname,
      ext,
      result.rowCount,
      result.columns
    );

    db.insertRecords(datasetId, result.data);

    logger.info('Dataset saved', { datasetId, rows: result.rowCount, columns: result.columns.length });

    res.json({
      success: true,
      dataset: {
        id: datasetId,
        originalName: file.originalname,
        fileType: ext,
        rowCount: result.rowCount,
        columns: result.columns,
      },
    });
  } catch (err) {
    logger.error('Upload processing failed', { error: err.message, stack: err.stack });

    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(500).json({ error: err.message || 'حدث خطأ أثناء معالجة الملف' });
  }
}

module.exports = { handleUpload };
