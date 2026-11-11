const express = require('express');
const { swaggerUi, swaggerSpec } = require('./config/swagger');
const notasRouter = require('./routes/notas.routes');
const iaRouter = require('./routes/ia.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(express.json());

// Registro de peticiones entrantes
app.use((req, res, next) => {
  if (!req.url.startsWith('/api-docs')) {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Documentación interactiva Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas de la API
app.use('/api/notas', notasRouter);
app.use('/api/ia', iaRouter);

// Middleware centralizado de manejo de errores
app.use(errorHandler);

module.exports = app;

