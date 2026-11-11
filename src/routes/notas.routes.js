const express = require('express');
const notasService = require('../services/notas.service');
const deepseekService = require('../services/deepseek.service');
const { validar, crearNotaSchema } = require('../middlewares/validar');

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Nota:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         titulo:
 *           type: string
 *           example: Plan de desarrollo
 *         contenido:
 *           type: string
 *           example: Revisar microservicios y migrar endpoints a Express 5.
 *     CrearNotaInput:
 *       type: object
 *       required:
 *         - titulo
 *         - contenido
 *       properties:
 *         titulo:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           example: Plan de desarrollo
 *         contenido:
 *           type: string
 *           minLength: 1
 *           maxLength: 5000
 *           example: Revisar microservicios y migrar endpoints a Express 5.
 *     ErrorRespuesta:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: Nota no encontrada
 *     ValidacionErrorRespuesta:
 *       type: object
 *       properties:
 *         errores:
 *           type: array
 *           items:
 *             type: object
 *     ResumenRespuesta:
 *       type: object
 *       properties:
 *         notaId:
 *           type: integer
 *           example: 1
 *         resumen:
 *           type: string
 *           example: "• Se analizó la arquitectura.\n• Se definieron tecnologías.\n• Se planificó entrega."
 */

/**
 * @openapi
 * /api/notas:
 *   post:
 *     summary: Crear una nueva nota
 *     tags:
 *       - Notas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CrearNotaInput'
 *     responses:
 *       201:
 *         description: Nota creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Nota'
 *       400:
 *         description: Error de validación o cuerpo inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidacionErrorRespuesta'
 */
router.post('/', validar(crearNotaSchema), async (req, res) => {
  const nota = await notasService.crear(req.body);
  res.status(201).json(nota);
});

/**
 * @openapi
 * /api/notas:
 *   get:
 *     summary: Listar todas las notas
 *     tags:
 *       - Notas
 *     responses:
 *       200:
 *         description: Lista de notas registradas en memoria
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Nota'
 */
router.get('/', async (req, res) => {
  const notas = await notasService.listar();
  res.status(200).json(notas);
});

/**
 * @openapi
 * /api/notas/{id}:
 *   get:
 *     summary: Obtener una nota por su identificador
 *     tags:
 *       - Notas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID decimal positivo de la nota
 *     responses:
 *       200:
 *         description: Nota encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Nota'
 *       404:
 *         description: Nota no encontrada o ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorRespuesta'
 */
router.get('/:id', async (req, res) => {
  const nota = await notasService.buscar(req.params.id);
  res.status(200).json(nota);
});

/**
 * @openapi
 * /api/notas/{id}:
 *   delete:
 *     summary: Eliminar una nota por su identificador
 *     tags:
 *       - Notas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID decimal positivo de la nota
 *     responses:
 *       204:
 *         description: Nota eliminada exitosamente (sin contenido)
 *       404:
 *         description: Nota no encontrada o ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorRespuesta'
 */
router.delete('/:id', async (req, res) => {
  await notasService.eliminar(req.params.id);
  res.status(204).send();
});

/**
 * @openapi
 * /api/notas/{id}/resumen:
 *   post:
 *     summary: Generar un resumen de la nota en tres viñetas breves con DeepSeek
 *     tags:
 *       - Notas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la nota a resumir
 *     responses:
 *       200:
 *         description: Resumen generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResumenRespuesta'
 *       404:
 *         description: Nota no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorRespuesta'
 *       429:
 *         description: Límite de peticiones de DeepSeek alcanzado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorRespuesta'
 *       502:
 *         description: Proveedor de IA no disponible o clave inválida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorRespuesta'
 *       503:
 *         description: Servicio de DeepSeek temporalmente sobrecargado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorRespuesta'
 */
router.post('/:id/resumen', async (req, res) => {
  const nota = await notasService.buscar(req.params.id);
  const systemPrompt = 'Resume el texto en exactamente tres viñetas breves en español.';
  const { respuesta } = await deepseekService.preguntar(nota.contenido, systemPrompt);
  res.status(200).json({
    notaId: nota.id,
    resumen: respuesta
  });
});

module.exports = router;
