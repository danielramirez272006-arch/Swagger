require('dotenv').config();

const app = require('./app');
const { inicializarBD } = require('./config/database');

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
  console.log(`Documentación Swagger UI en http://localhost:${PORT}/api-docs/`);
  await inicializarBD();
});

