/**
 * Joi Schema Validation Middleware
 * @param {import('joi').ObjectSchema} schema 
 * @param {'body'|'query'|'params'} property 
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map((item) => ({
        message: item.message,
        field: item.path.join('.')
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details
      });
    }

    req[property] = value;
    next();
  };
};

module.exports = validate;
