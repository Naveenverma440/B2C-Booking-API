const Joi = require('joi');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {String} property - Request property to validate (body, params, query)
 * @returns {Function} Express middleware function
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], {
      abortEarly: false, // Return all validation errors
      allowUnknown: false, // Don't allow unknown fields
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');

      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errorMessage
      });
    }

    next();
  };
};

// User validation schemas
const signupSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'First name is required',
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters'
    }),
  
  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Last name is required',
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters'
    }),
  
  email: Joi.string()
    .email()
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required'
    }),
  
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.empty': 'Password is required'
    }),
  
  phone: Joi.string()
    .pattern(/^\+?[\d\s-()]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
      'string.empty': 'Phone number is required'
    }),
  
  dateOfBirth: Joi.date()
    .max('now')
    .required()
    .messages({
      'date.max': 'Date of birth cannot be in the future',
      'any.required': 'Date of birth is required'
    }),
  
  gender: Joi.string()
    .valid('male', 'female', 'other')
    .required()
    .messages({
      'any.only': 'Gender must be male, female, or other',
      'any.required': 'Gender is required'
    }),
  
  address: Joi.object({
    street: Joi.string().trim().required().messages({
      'string.empty': 'Street address is required'
    }),
    city: Joi.string().trim().required().messages({
      'string.empty': 'City is required'
    }),
    state: Joi.string().trim().required().messages({
      'string.empty': 'State is required'
    }),
    country: Joi.string().trim().required().messages({
      'string.empty': 'Country is required'
    }),
    zipCode: Joi.string().trim().required().messages({
      'string.empty': 'Zip code is required'
    })
  }).required()
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required'
    })
});

const updateProfileSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters'
    }),
  
  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters'
    }),
  
  phone: Joi.string()
    .pattern(/^\+?[\d\s-()]+$/)
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  
  dateOfBirth: Joi.date()
    .max('now')
    .messages({
      'date.max': 'Date of birth cannot be in the future'
    }),
  
  gender: Joi.string()
    .valid('male', 'female', 'other')
    .messages({
      'any.only': 'Gender must be male, female, or other'
    }),
  
  address: Joi.object({
    street: Joi.string().trim(),
    city: Joi.string().trim(),
    state: Joi.string().trim(),
    country: Joi.string().trim(),
    zipCode: Joi.string().trim()
  })
});

// Traveller validation schemas
const travellerSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Traveller first name is required',
      'string.min': 'First name must be at least 2 characters long'
    }),
  
  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Traveller last name is required',
      'string.min': 'Last name must be at least 2 characters long'
    }),
  
  dateOfBirth: Joi.date()
    .max('now')
    .required()
    .messages({
      'date.max': 'Date of birth cannot be in the future',
      'any.required': 'Date of birth is required'
    }),
  
  gender: Joi.string()
    .valid('male', 'female', 'other')
    .required()
    .messages({
      'any.only': 'Gender must be male, female, or other',
      'any.required': 'Gender is required'
    }),
  
  passportNumber: Joi.string()
    .trim()
    .allow('')
    .messages({
      'string.base': 'Passport number must be a string'
    }),
  
  nationality: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Nationality is required'
    })
});

// Query validation schemas
const bookingQuerySchema = Joi.object({
  status: Joi.string()
    .valid('upcoming', 'completed')
    .messages({
      'any.only': 'Status must be either upcoming or completed'
    }),
  
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'Page must be at least 1'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    })
});

// Parameter validation schemas
const mongoIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid ID format',
      'any.required': 'ID is required'
    })
});

const travellerIdSchema = Joi.object({
  traveller_id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid traveller ID format',
      'any.required': 'Traveller ID is required'
    })
});

module.exports = {
  validate,
  signupSchema,
  loginSchema,
  updateProfileSchema,
  travellerSchema,
  bookingQuerySchema,
  mongoIdSchema,
  travellerIdSchema
};