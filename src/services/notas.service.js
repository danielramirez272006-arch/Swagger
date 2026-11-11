const { AppError } = require('../utils/errors');

let notas = [];
let nextId = 1;

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

function listar() {
  return notas;
}

function crear({ titulo, contenido }) {
  const nuevaNota = {
    id: nextId++,
    titulo,
    contenido
  };
  notas.push(nuevaNota);
  return nuevaNota;
}

function buscar(id) {
  const parsedId = parseAndValidateId(id);
  if (parsedId === null) {
    throw new AppError('Nota no encontrada', 404);
  }
  const nota = notas.find((n) => n.id === parsedId);
  if (!nota) {
    throw new AppError('Nota no encontrada', 404);
  }
  return nota;
}

function eliminar(id) {
  const nota = buscar(id);
  const index = notas.findIndex((n) => n.id === nota.id);
  if (index !== -1) {
    notas.splice(index, 1);
  }
  return true;
}

function _reset() {
  notas = [];
  nextId = 1;
}

module.exports = {
  listar,
  crear,
  buscar,
  eliminar,
  _reset
};

