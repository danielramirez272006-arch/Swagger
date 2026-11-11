const { z } = require('zod');

const validar = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      errores: result.error.issues || result.error.errors || []
    });
  }
  req.body = result.data;
  next();
};

const crearNotaSchema = z.object({
  titulo: z
    .string({ invalid_type_error: 'El título debe ser un texto' })
    .trim()
    .min(1, 'El título no puede estar vacío')
    .max(100, 'El título no puede tener más de 100 caracteres'),
  contenido: z
    .string({ invalid_type_error: 'El contenido debe ser un texto' })
    .trim()
    .min(1, 'El contenido no puede estar vacío')
    .max(5000, 'El contenido no puede tener más de 5000 caracteres')
});

const preguntaSchema = z.object({
  pregunta: z
    .string({ invalid_type_error: 'La pregunta debe ser un texto' })
    .trim()
    .min(3, 'La pregunta debe tener al menos 3 caracteres')
    .max(2000, 'La pregunta no puede tener más de 2000 caracteres')
});

module.exports = {
  validar,
  crearNotaSchema,
  preguntaSchema
};

