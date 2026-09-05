const multer = require("multer"); const path = require("path"); const { v4: uuidv4 } = require("uuid"); const pool = require("../config/db"); const ApiResponse = require("../utils/apiResponse"); const asyncHandler = require("../utils/asyncHandler");

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, path.join(__dirname, "../uploads")); },
  filename: (req, file, cb) => { const ext = path.extname(file.originalname); cb(null, `${uuidv4()}${ext}`); }
});

const uploadImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(ext && mime ? null : new Error("Only image files allowed."), ext && mime);
  }
});

const uploadVideo = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /mp4|webm|mov/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(ext && mime ? null : new Error("Only video files (mp4, webm, mov) allowed."), ext && mime);
  }
});

const router = require("express").Router();
const { verifyToken, isAdmin } = require("../middleware/auth");

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload a single image file (legacy endpoint)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload success with file URL.
 *       400:
 *         description: No file uploaded or invalid file type.
 *       401:
 *         description: Unauthorized.
 */
router.post("/", verifyToken, isAdmin, uploadImage.single("image"), asyncHandler(async (req, res) => {
  if (!req.file) return ApiResponse.error(res, "No file uploaded.", 400);
  return ApiResponse.success(res, { url: `/uploads/${req.file.filename}` });
}));

/**
 * @swagger
 * /upload/image:
 *   post:
 *     summary: Upload a single image file
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload success with file URL.
 *       400:
 *         description: No file uploaded or invalid file type.
 */
router.post("/image", verifyToken, isAdmin, (req, res, next) => {
  uploadImage.single("image")(req, res, (err) => {
    if (err) {
      console.error('[Upload] multer error:', err.message, '| code:', err.code);
      if (err.code === 'LIMIT_FILE_SIZE') return ApiResponse.error(res, 'File too large. Max 10MB.', 400);
      return ApiResponse.error(res, err.message || 'Upload failed.', 400);
    }
    next();
  });
}, asyncHandler(async (req, res) => {
  if (!req.file) {
    console.error('[Upload] No file in request. Content-Type:', req.headers['content-type']);
    return ApiResponse.error(res, "No file uploaded. Make sure the request is multipart/form-data.", 400);
  }
  console.log('[Upload] Image saved:', req.file.filename, '(' + req.file.size + ' bytes)');
  return ApiResponse.success(res, { url: `/uploads/${req.file.filename}` });
}));

/**
 * @swagger
 * /upload/video:
 *   post:
 *     summary: Upload a video file (mp4, webm, mov, up to 200MB)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload success with file URL.
 *       400:
 *         description: No file uploaded or invalid file type.
 */
router.post("/video", verifyToken, isAdmin, uploadVideo.single("video"), asyncHandler(async (req, res) => {
  if (!req.file) return ApiResponse.error(res, "No file uploaded.", 400);
  return ApiResponse.success(res, { url: `/uploads/${req.file.filename}` });
}));

/**
 * @swagger
 * /upload/review-image:
 *   post:
 *     summary: Upload an image for a product review (any logged-in customer)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload success with file URL.
 *       400:
 *         description: No file uploaded or invalid file type.
 */
router.post("/review-image", verifyToken, uploadImage.single("image"), asyncHandler(async (req, res) => {
  if (!req.file) return ApiResponse.error(res, "No file uploaded.", 400);
  return ApiResponse.success(res, { url: `/uploads/${req.file.filename}` });
}));

/**
 * @swagger
 * /upload/review-video:
 *   post:
 *     summary: Upload a video for a product review (any logged-in customer, up to 200MB)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload success with file URL.
 *       400:
 *         description: No file uploaded or invalid file type.
 */
router.post("/review-video", verifyToken, uploadVideo.single("video"), asyncHandler(async (req, res) => {
  if (!req.file) return ApiResponse.error(res, "No file uploaded.", 400);
  return ApiResponse.success(res, { url: `/uploads/${req.file.filename}` });
}));

module.exports = router;
