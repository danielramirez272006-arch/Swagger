const { AppError } = require('../utils/errors');
const { getPool } = require('../config/database');

let notasMemoria = [];
let nextIdMemoria = 1;

function parseAndValidateId(rawId) {
  if (typeof rawId !== 'string' && typeof rawId !== 'number') {
    return null;
  }
  const str = String(rawId).trim();
  if (!/^[1-9]\d*$/.test(str)) {
    return null;
  }
  const num = Number(str);
  if (!Number.isSafeInteger(num) || num <= 0) {
    return null;
  }
  return num;
}

async function listar() {
  const pool = getPool();
  if (pool) {
    const [rows] = await pool.query('SELECT id, titulo, contenido FROM notas ORDER BY id ASC');
    return rows;
  }
  return notasMemoria;
}

async function crear({ titulo, contenido }) {
  const pool = getPool();
  if (pool) {
    const [result] = await pool.query(
      'INSERT INTO notas (titulo, contenido) VALUES (?, ?)',
      [titulo, contenido]
    );
    return {
      id: result.insertId,
      titulo,
      contenido
    };
  }

  const nuevaNota = {
    id: nextIdMemoria++,
    titulo,
    contenido
  };
  notasMemoria.push(nuevaNota);
  return nuevaNota;
}

async function buscar(id) {
  const parsedId = parseAndValidateId(id);
  if (parsedId === null) {
    throw new AppError('Nota no encontrada', 404);
  }

  const pool = getPool();
  if (pool) {
    const [rows] = await pool.query(
      'SELECT id, titulo, contenido FROM notas WHERE id = ?',
      [parsedId]
    );
    if (!rows || rows.length === 0) {
      throw new AppError('Nota no encontrada', 404);
    }
    return rows[0];
  }

  const nota = notasMemoria.find((n) => n.id === parsedId);
  if (!nota) {
    throw new AppError('Nota no encontrada', 404);
  }
  return nota;
}

async function eliminar(id) {
  const nota = await buscar(id);
  const pool = getPool();
  if (pool) {
    await pool.query('DELETE FROM notas WHERE id = ?', [nota.id]);
    return true;
  }

  const index = notasMemoria.findIndex((n) => n.id === nota.id);
  if (index !== -1) {
    notasMemoria.splice(index, 1);
  }
  return true;
}

async function _reset() {
  notasMemoria = [];
  nextIdMemoria = 1;

  const pool = getPool();
  if (pool) {
    await pool.query('DELETE FROM notas');
    await pool.query('ALTER TABLE notas AUTO_INCREMENT = 1');
  }
}

module.exports = {
  listar,
  crear,
  buscar,
  eliminar,
  _reset
};
