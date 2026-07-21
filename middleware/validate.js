const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.xlsm', '.xlsb', '.json'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function validateUpload(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ error: 'لم يتم رفع أي ملف' });
  }

  const ext = '.' + req.file.originalname.split('.').pop().toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return res.status(400).json({
      error: `صيغة الملف غير مدعومة (${ext}). المدعومة: ${ALLOWED_EXTENSIONS.join(', ')}`,
    });
  }

  if (req.file.size > MAX_FILE_SIZE) {
    return res.status(400).json({
      error: `حجم الملف يتجاوز الحد الأقصى (${MAX_FILE_SIZE / 1024 / 1024}MB)`,
    });
  }

  if (req.file.size === 0) {
    return res.status(400).json({ error: 'الملف فارغ' });
  }

  next();
}

module.exports = { validateUpload };
