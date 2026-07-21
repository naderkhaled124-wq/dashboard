const Papa = require('papaparse');
const XLSX = require('xlsx');
const logger = require('./logger');

function parseFile(buffer, originalName) {
  const ext = getExtension(originalName).toLowerCase();

  if (ext === 'csv') {
    return parseCSV(buffer, originalName);
  }
  if (['xlsx', 'xls', 'xlsm', 'xlsb'].includes(ext)) {
    return parseExcel(buffer, originalName);
  }
  if (ext === 'json') {
    return parseJSON(buffer, originalName);
  }

  throw new Error(`صيغة الملف غير مدعومة: ${ext}. المدعومة: CSV, XLSX, XLS, JSON`);
}

function stripBOM(text) {
  return text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
}

function parseCSV(buffer, originalName) {
  const text = stripBOM(buffer.toString('utf-8'));
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    transformHeader: (h) => h.trim(),
  });

  if (result.errors.length > 0) {
    logger.warn('CSV parse warnings', { file: originalName, errors: result.errors.slice(0, 5) });
  }

  if (result.data.length === 0) {
    throw new Error('الملف فارغ أو لا يحتوي بيانات صالحة');
  }

  const columns = result.meta.fields || Object.keys(result.data[0]);
  return { data: result.data, columns, rowCount: result.data.length };
}

function parseExcel(buffer, originalName) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error('الملف لا يحتوي أوراق عمل');
  }

  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

  if (data.length === 0) {
    throw new Error('الورشة فارغة أو لا تحتوي بيانات');
  }

  const columns = Object.keys(data[0]);
  return { data, columns, rowCount: data.length };
}

function parseJSON(buffer, originalName) {
  const text = stripBOM(buffer.toString('utf-8'));
  let parsed;

  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error('نص JSON غير صالح: ' + e.message);
  }

  let data;
  if (Array.isArray(parsed)) {
    data = parsed;
  } else if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.data)) {
      data = parsed.data;
    } else {
      data = [parsed];
    }
  } else {
    throw new Error('JSON يجب أن يكون مصفوفة أو كائن يحتوي مصفوفة');
  }

  if (data.length === 0) {
    throw new Error('JSON لا يحتوي بيانات');
  }

  data = data.map((item) => {
    const flat = {};
    for (const [key, value] of Object.entries(item)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        for (const [k, v] of Object.entries(value)) {
          flat[k] = v;
        }
      } else {
        flat[key] = value;
      }
    }
    return flat;
  });

  const columns = Object.keys(data[0]);
  return { data, columns, rowCount: data.length };
}

function getExtension(filename) {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop() : '';
}

module.exports = { parseFile };
