const express = require('express');
const { estaConectado } = require('../config/database');

const router = express.Router();

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Verificar el estado del servicio y la base de datos
 *     tags:
 *       - Sistema
 *     responses:
 *       200:
 *         description: Estado del servicio en tiempo real
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 uptime:
 *                   type: integer
 *                   example: 120
 *                 database:
 *                   type: string
 *                   example: connected
 *                 timestamp:
 *                   type: string
 *                   example: 2026-11-11T13:00:00.000Z
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    database: estaConectado() ? 'connected' : 'memory_fallback',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

