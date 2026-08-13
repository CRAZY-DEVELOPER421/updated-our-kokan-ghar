const { body, param, query, validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));
    return ApiResponse.error(res, 'Validation failed', 400, errorMessages);
  }
  next();
};

// NOTE: We deliberately use .toLowerCase() instead of .normalizeEmail() here.
// normalizeEmail() strips dots from Gmail addresses (gmail_remove_dots) and
// drops +subaddresses by default — which corrupts the email the user typed
// (e.g. sawant.sakshi016@gmail.com became sawantsakshi016@gmail.com). Emails
// must be stored exactly as entered (dots, +, %, #, etc. all preserved); only
// case is normalized so login matching stays predictable.
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format').toLowerCase(),
  body('password').notEmpty().withMessage('Password is required').isLength({ min: 6, max: 128 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  handleValidationErrors
];

const loginValidation = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format').toLowerCase(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

const addressValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
  body('phone').notEmpty().withMessage('Phone is required').matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  body('house_no').trim().notEmpty().withMessage('House/Flat number is required'),
  body('street').trim().notEmpty().withMessage('Street is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('pincode').notEmpty().withMessage('Pincode is required').matches(/^[0-9]{6}$/).withMessage('Pincode must be 6 digits'),
  body('address_type').optional().isIn(['home', 'work', 'other']).withMessage('Invalid address type'),
  handleValidationErrors
];

const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('mrp').isFloat({ min: 0 }).withMessage('MRP must be a positive number'),
  body('stock_quantity').isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
  body('category_id').isInt({ min: 1 }).withMessage('Valid category is required'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  handleValidationErrors
];

const reviewValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').optional().trim().isLength({ max: 255 }),
  body('body').optional().trim().isLength({ max: 5000 }),
  handleValidationErrors
];

const orderValidation = [
  body('address_id').isInt({ min: 1 }).withMessage('Valid address is required'),
  body('payment_method').isIn(['online', 'cod']).withMessage('Invalid payment method'),
  body('notes').optional().trim().isLength({ max: 500 }),
  handleValidationErrors
];

const couponValidation = [
  body('code').trim().notEmpty().withMessage('Coupon code is required').toUpperCase(),
  handleValidationErrors
];

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

const categoryValidation = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('slug').optional().trim(),
  handleValidationErrors
];

const changePasswordValidation = [
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password').notEmpty().withMessage('New password is required').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  handleValidationErrors
];

// Used by the "Set your password" popup that appears right after a NEW
// Google/Facebook signup — those accounts have password_hash = NULL until the
// user sets one here.
const setPasswordValidation = [
  body('password').notEmpty().withMessage('Password is required').isLength({ min: 6, max: 128 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

const forgotPasswordValidation = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format').toLowerCase(),
  handleValidationErrors
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Token is required'),
  body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

module.exports = {
  registerValidation,
  loginValidation,
  addressValidation,
  productValidation,
  reviewValidation,
  orderValidation,
  couponValidation,
  paginationValidation,
  categoryValidation,
  changePasswordValidation,
  setPasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation
};
