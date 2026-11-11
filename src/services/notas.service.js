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

async function listar(filtros = {}) {
  const { q, page, limit } = filtros;
  const pool = getPool();

  const numPage = page && Number(page) > 0 ? Number(page) : null;
  const numLimit = limit && Number(limit) > 0 ? Math.min(Number(limit), 100) : null;

  if (pool) {
    let query = 'SELECT id, titulo, contenido FROM notas';
    const params = [];

    if (q && typeof q === 'string' && q.trim()) {
      query += ' WHERE titulo LIKE ? OR contenido LIKE ?';
      const termino = `%${q.trim()}%`;
      params.push(termino, termino);
    }

    query += ' ORDER BY id ASC';

    if (numPage && numLimit) {
      const offset = (numPage - 1) * numLimit;
      query += ' LIMIT ? OFFSET ?';
      params.push(numLimit, offset);
    } else if (numLimit) {
      query += ' LIMIT ?';
      params.push(numLimit);
    }

    const [rows] = await pool.query(query, params);
    return rows;
  }

  let resultado = notasMemoria;
  if (q && typeof q === 'string' && q.trim()) {
    const termino = q.trim().toLowerCase();
    resultado = resultado.filter(
      (n) => n.titulo.toLowerCase().includes(termino) || n.contenido.toLowerCase().includes(termino)
    );
  }

  if (numPage && numLimit) {
    const offset = (numPage - 1) * numLimit;
    return resultado.slice(offset, offset + numLimit);
  } else if (numLimit) {
    return resultado.slice(0, numLimit);
  }

  return resultado;
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

async function actualizar(id, { titulo, contenido }) {
  const notaExistente = await buscar(id);
  const pool = getPool();

  if (pool) {
    await pool.query(
      'UPDATE notas SET titulo = ?, contenido = ? WHERE id = ?',
      [titulo, contenido, notaExistente.id]
    );
    return {
      id: notaExistente.id,
      titulo,
      contenido
    };
  }

  notaExistente.titulo = titulo;
  notaExistente.contenido = contenido;
  return { ...notaExistente };
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

async function duplicar(id) {
  const original = await buscar(id);
  const nuevoTitulo = `${original.titulo} (copia)`.slice(0, 100);
  return crear({
    titulo: nuevoTitulo,
    contenido: original.contenido
  });
}

async function obtenerEstadisticas() {
  const notas = await listar();
  const totalNotas = notas.length;

  if (totalNotas === 0) {
    return {
      totalNotas: 0,
      totalPalabras: 0,
      totalCaracteres: 0,
      promedioCaracteres: 0,
      notaMasLarga: null
    };
  }

  let totalPalabras = 0;
  let totalCaracteres = 0;
  let notaMasLarga = null;
  let maxLongitud = -1;

  for (const n of notas) {
    const texto = `${n.titulo} ${n.contenido}`.trim();
    const chars = texto.length;
    const words = texto.split(/\s+/).filter(Boolean).length;

    totalPalabras += words;
    totalCaracteres += chars;

    if (chars > maxLongitud) {
      maxLongitud = chars;
      notaMasLarga = { id: n.id, titulo: n.titulo, longitud: chars };
    }
  }

  return {
    totalNotas,
    totalPalabras,
    totalCaracteres,
    promedioCaracteres: Math.round(totalCaracteres / totalNotas),
    notaMasLarga
  };
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
  actualizar,
  duplicar,
  obtenerEstadisticas,
  eliminar,
  _reset
};
