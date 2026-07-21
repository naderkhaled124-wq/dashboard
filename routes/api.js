const express = require('express');
const multer = require('multer');
const { handleUpload } = require('../controllers/upload');
const { getData, getKPIs, getDatasets, deleteDataset } = require('../controllers/data');
const { validateUpload } = require('../middleware/validate');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.post('/upload', upload.single('file'), validateUpload, handleUpload);
router.get('/data', getData);
router.get('/kpis', getKPIs);
router.get('/datasets', getDatasets);
router.delete('/datasets/:id', deleteDataset);

module.exports = router;
