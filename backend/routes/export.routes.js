const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken, isAdmin } = require('../middleware/auth');
const exportController = require('../controllers/export.controller');

// Multer for CSV uploads (in-memory, max 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed.'), false);
    }
  },
});

// ── Export endpoints ──────────────────────────────────────────────────────
// GET /api/admin/export/orders?status=&from=&to=
router.get('/export/orders', verifyToken, isAdmin, exportController.exportOrders);

// GET /api/admin/export/products
router.get('/export/products', verifyToken, isAdmin, exportController.exportProducts);

// GET /api/admin/export/users
router.get('/export/users', verifyToken, isAdmin, exportController.exportUsers);

// ── Import endpoint ──────────────────────────────────────────────────────
// POST /api/admin/import/products  (multipart/form-data, field: file)
router.post('/import/products', verifyToken, isAdmin, upload.single('file'), exportController.importProducts);

module.exports = router;
