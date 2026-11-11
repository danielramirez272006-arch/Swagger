const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API REST de notas con DeepSeek',
      version: '1.0.0',
      description: 'API REST para administrar notas en memoria y utilizar DeepSeek Flash para responder preguntas y resumir notas.'
    },
    servers: [
      {
        url: '/',
        description: 'Servidor actual'
      }
    ]
  },
  apis: [
    path.join(__dirname, '../routes/*.js').replace(/\\/g, '/')
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec
};

