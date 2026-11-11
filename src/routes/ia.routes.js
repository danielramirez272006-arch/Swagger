const express = require('express');
const deepseekService = require('../services/deepseek.service');
const { validar, preguntaSchema } = require('../middlewares/validar');

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     PreguntaInput:
 *       type: object
 *       required:
 *         - pregunta
 *       properties:
 *         pregunta:
 *           type: string
 *           minLength: 3
 *           maxLength: 2000
 *           example: ¿Qué es Express 5 y cuáles son sus mejoras?
 *     UsoTokens:
 *       type: object
 *       properties:
 *         input_tokens:
 *           type: integer
 *           example: 18
 *         output_tokens:
 *           type: integer
 *           example: 45
 *     PreguntaRespuesta:
 *       type: object
 *       properties:
 *         respuesta:
 *           type: string
 *           example: Express 5 introduce soporte nativo para promesas en rutas y middlewares.
 *         uso:
 *           $ref: '#/components/schemas/UsoTokens'
 */

/**
 * @openapi
 * /api/ia/preguntar:
 *   post:
 *     summary: Realizar una pregunta a DeepSeek Flash
 *     tags:
 *       - Inteligencia Artificial
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PreguntaInput'
 *     responses:
 *       200:
 *         description: Respuesta generada por DeepSeek Flash
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PreguntaRespuesta'
 *       400:
 *         description: Pregunta inválida o fuera de los límites permitidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidacionErrorRespuesta'
 *       429:
 *         description: Límite de peticiones de DeepSeek alcanzado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorRespuesta'
 *       502:
 *         description: Proveedor de IA no disponible o clave ausente/inválida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorRespuesta'
 *       503:
 *         description: Servicio de DeepSeek sobrecargado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorRespuesta'
 */
router.post('/preguntar', validar(preguntaSchema), async (req, res) => {
  const { respuesta, uso } = await deepseekService.preguntar(req.body.pregunta);
  res.status(200).json({ respuesta, uso });
});

module.exports = router;
