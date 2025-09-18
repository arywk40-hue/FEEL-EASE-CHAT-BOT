const { validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// Validation rules for user registration
const validateRegistration = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  
  handleValidationErrors
];

// Validation rules for user login
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Validation rules for journey creation
const validateJourney = [
  body('origin')
    .notEmpty()
    .withMessage('Origin is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Origin must be between 2 and 100 characters'),
  
  body('destination')
    .notEmpty()
    .withMessage('Destination is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Destination must be between 2 and 100 characters'),
  
  body('travelDate')
    .isISO8601()
    .withMessage('Please provide a valid date')
    .custom((value) => {
      const travelDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (travelDate < today) {
        throw new Error('Travel date cannot be in the past');
      }
      
      // Limit to 1 year in advance
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      
      if (travelDate > oneYearFromNow) {
        throw new Error('Travel date cannot be more than 1 year in advance');
      }
      
      return true;
    }),
  
  body('passengers')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Number of passengers must be between 1 and 10'),
  
  handleValidationErrors
];

// Validation rules for booking creation
const validateBooking = [
  body('journeyId')
    .notEmpty()
    .withMessage('Journey ID is required')
    .isMongoId()
    .withMessage('Invalid Journey ID format'),
  
  body('passengers')
    .isArray({ min: 1 })
    .withMessage('At least one passenger is required'),
  
  body('passengers.*.name')
    .notEmpty()
    .withMessage('Passenger name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Passenger name must be between 2 and 50 characters'),
  
  body('passengers.*.age')
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage('Age must be between 1 and 120'),
  
  body('passengers.*.baggage')
    .optional()
    .isInt({ min: 0, max: 5 })
    .withMessage('Baggage count must be between 0 and 5'),
  
  handleValidationErrors
];

// Validation rules for user profile update
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  
  body('preferences.preferredTransport')
    .optional()
    .isArray()
    .withMessage('Preferred transport must be an array'),
  
  body('preferences.budget')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Budget must be a positive number'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validateJourney,
  validateBooking,
  validateProfileUpdate
};