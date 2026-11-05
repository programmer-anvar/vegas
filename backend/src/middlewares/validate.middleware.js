import ApiError from '#utils/ApiError.js';

export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body ?? {}, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((d) => d.message);
    return next(ApiError.badRequest("Kiritilgan ma'lumotlar noto'g'ri", errors));
  }

  req.body = value;
  next();
};

export const parseJsonFields = (fields) => (req, res, next) => {
  for (const field of fields) {
    const raw = req.body?.[field];
    if (typeof raw === 'string') {
      try {
        req.body[field] = JSON.parse(raw);
      } catch {
        return next(ApiError.badRequest(`"${field}" maydoni to'g'ri JSON formatda emas`));
      }
    }
  }
  next();
};
