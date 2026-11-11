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
 *     TagsRespuesta:
 *       type: object
 *       properties:
 *         notaId:
 *           type: integer
 *           example: 1
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["javascript", "express", "backend"]
 *     NotasEstadisticas:
 *       type: object
 *       properties:
 *         totalNotas:
 *           type: integer
 *           example: 5
 *         totalPalabras:
 *           type: integer
 *           example: 120
 *         totalCaracteres:
 *           type: integer
 *           example: 850
 *         promedioCaracteres:
 *           type: integer
 *           example: 170
 *         notaMasLarga:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: integer
 *               example: 2
 *             titulo:
 *               type: string
 *               example: Arquitectura
 *             longitud:
 *               type: integer
 *               example: 350
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
 *     summary: Listar todas las notas con soporte de búsqueda y paginación
 *     tags:
 *       - Notas
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Término de búsqueda para filtrar por título o contenido
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Número de página para paginación
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Cantidad máxima de notas por página
 *     responses:
 *       200:
 *         description: Lista de notas obtenidas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Nota'
 */
router.get('/', async (req, res) => {
  const notas = await notasService.listar({
    q: req.query.q,
    page: req.query.page,
    limit: req.query.limit
  });
  res.status(200).json(notas);
});

/**
 * @openapi
 * /api/notas/stats:
 *   get:
 *     summary: Obtener estadísticas globales de las notas (conteo, palabras, caracteres)
 *     tags:
 *       - Notas
 *     responses:
 *       200:
 *         description: Métricas y estadísticas calculadas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotasEstadisticas'
 */
router.get('/stats', async (req, res) => {
  const stats = await notasService.obtenerEstadisticas();
  res.status(200).json(stats);
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
 *   put:
 *     summary: Actualizar una nota existente
 *     tags:
 *       - Notas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID decimal positivo de la nota a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CrearNotaInput'
 *     responses:
 *       200:
 *         description: Nota actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Nota'
 *       400:
 *         description: Error de validación en los datos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidacionErrorRespuesta'
 *       404:
 *         description: Nota no encontrada o ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorRespuesta'
 */
router.put('/:id', validar(crearNotaSchema), async (req, res) => {
  const notaActualizada = await notasService.actualizar(req.params.id, req.body);
  res.status(200).json(notaActualizada);
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

/**
 * @openapi
 * /api/notas/{id}/tags:
 *   post:
 *     summary: Generar etiquetas sugeridas automáticamente para la nota mediante IA
 *     tags:
 *       - Notas
 *       - Inteligencia Artificial
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la nota para la cual generar etiquetas
 *     responses:
 *       200:
 *         description: Etiquetas generadas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TagsRespuesta'
 *       404:
 *         description: Nota no encontrada o ID inválido
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
router.post('/:id/tags', async (req, res) => {
  const nota = await notasService.buscar(req.params.id);
  const systemPrompt = 'Genera entre 3 y 5 etiquetas cortas para este texto. Responde únicamente con un array JSON de strings, por ejemplo ["backend", "express", "api"].';
  const { respuesta } = await deepseekService.preguntar(nota.contenido, systemPrompt);

  let tags = [];
  try {
    const jsonMatch = respuesta.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        tags = parsed.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
      }
    }
  } catch (_) {}

  if (tags.length === 0) {
    tags = respuesta
      .split(/[\n,]+/)
      .map((t) => t.replace(/^[-*•\d.]+\s*/, '').trim().toLowerCase())
      .filter((t) => t.length > 0 && t.length <= 50)
      .slice(0, 5);
  }

  res.status(200).json({
    notaId: nota.id,
    tags
  });
});

/**
 * @openapi
 * /api/notas/{id}/duplicar:
 *   post:
 *     summary: Duplicar una nota existente
 *     tags:
 *       - Notas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la nota a clonar
 *     responses:
 *       201:
 *         description: Nota clonada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Nota'
 *       404:
 *         description: Nota original no encontrada o ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorRespuesta'
 */
router.post('/:id/duplicar', async (req, res) => {
  const duplicada = await notasService.duplicar(req.params.id);
  res.status(201).json(duplicada);
});

module.exports = router;
