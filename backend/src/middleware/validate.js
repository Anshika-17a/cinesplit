const { ZodError } = require('zod');

const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const fields = error.issues.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Invalid input data",
        fields
      });
    }
    next(error);
  }
};

module.exports = validate;
