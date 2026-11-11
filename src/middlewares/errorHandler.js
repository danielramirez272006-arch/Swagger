const { AppError } = require('../utils/errors');

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  // JSON mal formado
  if ((err instanceof SyntaxError || err.name === 'SyntaxError') && (err.status === 400 || err.statusCode === 400)) {
    return res.status(400).json({ error: 'JSON inválido' });
  }

  // AppError u errores con código de estado HTTP
  if (err instanceof AppError || (err.statusCode && typeof err.statusCode === 'number')) {
    const status = err.statusCode;
    if (status === 404) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }
    if (status === 429) {
      return res.status(429).json({ error: 'IA_NO_DISPONIBLE' });
    }
    if (status === 503) {
      return res.status(503).json({ error: 'IA_NO_DISPONIBLE' });
    }
    if (status === 502) {
      return res.status(502).json({ error: 'IA_NO_DISPONIBLE' });
    }
    return res.status(status).json({ error: err.message || 'Error en la solicitud' });
  }

  // Errores directos del proveedor de IA o SDK
  if (err.status === 429) {
    return res.status(429).json({ error: 'IA_NO_DISPONIBLE' });
  }
  if (err.status === 529) {
    return res.status(503).json({ error: 'IA_NO_DISPONIBLE' });
  }
  if (err.status === 401 || err.name === 'APIError' || (typeof err.name === 'string' && err.name.includes('Anthropic'))) {
    return res.status(502).json({ error: 'IA_NO_DISPONIBLE' });
  }

  // Fallo inesperado de la aplicación
  return res.status(500).json({ error: 'Error interno' });
}

module.exports = errorHandler;

