const { test, describe, beforeEach, after, before } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../src/app');
const notasService = require('../src/services/notas.service');
const deepseekService = require('../src/services/deepseek.service');

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, options);
  let json = null;
  let text = '';
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    json = await response.json();
  } else {
    text = await response.text();
  }
  return { status: response.status, json, text, headers: response.headers };
}

describe('Laboratorio 5 - Pruebas de integración', () => {
  beforeEach(async () => {
    await notasService._reset();
    deepseekService._setClient(null);
  });

  test('1. Swagger UI carga y el CRUD funciona con ANTHROPIC_API_KEY ausente', async () => {
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    // Swagger UI carga
    const swaggerRes = await request('/api-docs/');
    assert.equal(swaggerRes.status, 200);
    assert.match(swaggerRes.text, /swagger/i);

    // CRUD funciona sin API key
    const res = await request('/api/notas');
    assert.equal(res.status, 200);
    assert.deepEqual(res.json, []);
  });

  test('2. La lista empieza vacía. Crear dos notas devuelve 201 con IDs diferentes. Listarlas y consultar una devuelve 200.', async () => {
    // Lista vacía
    const vaciaRes = await request('/api/notas');
    assert.equal(vaciaRes.status, 200);
    assert.deepEqual(vaciaRes.json, []);

    // Crear primera nota
    const n1Res = await request('/api/notas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'Nota Uno', contenido: 'Contenido uno' })
    });
    assert.equal(n1Res.status, 201);
    assert.equal(n1Res.json.id, 1);
    assert.equal(n1Res.json.titulo, 'Nota Uno');
    assert.equal(n1Res.json.contenido, 'Contenido uno');

    // Crear segunda nota
    const n2Res = await request('/api/notas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'Nota Dos', contenido: 'Contenido dos' })
    });
    assert.equal(n2Res.status, 201);
    assert.equal(n2Res.json.id, 2);
    assert.notEqual(n1Res.json.id, n2Res.json.id);

    // Listar notas
    const listaRes = await request('/api/notas');
    assert.equal(listaRes.status, 200);
    assert.equal(listaRes.json.length, 2);

    // Consultar nota 1
    const getRes = await request('/api/notas/1');
    assert.equal(getRes.status, 200);
    assert.equal(getRes.json.id, 1);
    assert.equal(getRes.json.titulo, 'Nota Uno');
  });

  test('3. Una nota con cuerpo vacío o campos de solo espacios devuelve 400. El JSON mal formado también devuelve 400.', async () => {
    // Cuerpo vacío
    const vacioRes = await request('/api/notas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.equal(vacioRes.status, 400);
    assert.ok(Array.isArray(vacioRes.json.errores));

    // Campos de solo espacios
    const espaciosRes = await request('/api/notas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: '    ', contenido: '    ' })
    });
    assert.equal(espaciosRes.status, 400);
    assert.ok(Array.isArray(espaciosRes.json.errores));

    // JSON mal formado
    const malformadoRes = await request('/api/notas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ "titulo": "algo", malformado'
    });
    assert.equal(malformadoRes.status, 400);
    assert.deepEqual(malformadoRes.json, { error: 'JSON inválido' });
  });

  test('4. Eliminar una nota devuelve 204 sin cuerpo. Consultarla después, pedir una nota inexistente o usar un ID inválido devuelve 404.', async () => {
    // Creamos nota
    const creacion = await request('/api/notas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'Para eliminar', contenido: 'Texto a borrar' })
    });
    const id = creacion.json.id;

    // Eliminar nota
    const delRes = await request(`/api/notas/${id}`, { method: 'DELETE' });
    assert.equal(delRes.status, 204);
    assert.equal(delRes.text, '');

    // Consultarla después
    const getDeleted = await request(`/api/notas/${id}`);
    assert.equal(getDeleted.status, 404);
    assert.deepEqual(getDeleted.json, { error: 'Nota no encontrada' });

    // Pedir nota inexistente
    const getNotFound = await request('/api/notas/99999');
    assert.equal(getNotFound.status, 404);
    assert.deepEqual(getNotFound.json, { error: 'Nota no encontrada' });

    // ID inválido (texto)
    const getIdInvalido = await request('/api/notas/invalido');
    assert.equal(getIdInvalido.status, 404);
    assert.deepEqual(getIdInvalido.json, { error: 'Nota no encontrada' });

    // ID negativo
    const getIdNegativo = await request('/api/notas/-1');
    assert.equal(getIdNegativo.status, 404);
    assert.deepEqual(getIdNegativo.json, { error: 'Nota no encontrada' });

    // ID decimal
    const getIdDecimal = await request('/api/notas/1.5');
    assert.equal(getIdDecimal.status, 404);
    assert.deepEqual(getIdDecimal.json, { error: 'Nota no encontrada' });

    // DELETE con ID inválido
    const delInvalido = await request('/api/notas/xyz', { method: 'DELETE' });
    assert.equal(delInvalido.status, 404);
    assert.deepEqual(delInvalido.json, { error: 'Nota no encontrada' });

    // Al crear una nueva nota, el ID no se reutiliza
    const nueva = await request('/api/notas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'Nota siguiente', contenido: 'No reusa ID' })
    });
    assert.equal(nueva.status, 201);
    assert.equal(nueva.json.id, id + 1);
  });

  test('5. Una pregunta de un carácter devuelve 400 y resumir una nota inexistente devuelve 404. En ambos casos comprueba que el proveedor recibió cero llamadas.', async () => {
    let llamadasProveedor = 0;
    deepseekService._setClient({
      messages: {
        create: async () => {
          llamadasProveedor++;
          return { content: [{ type: 'text', text: 'ok' }], usage: { input_tokens: 1, output_tokens: 1 } };
        }
      }
    });

    // Pregunta de 1 caracter
    const p1Res = await request('/api/ia/preguntar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pregunta: 'a' })
    });
    assert.equal(p1Res.status, 400);
    assert.ok(Array.isArray(p1Res.json.errores));
    assert.equal(llamadasProveedor, 0);

    // Pregunta de solo espacios
    const pEspacios = await request('/api/ia/preguntar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pregunta: '    ' })
    });
    assert.equal(pEspacios.status, 400);
    assert.ok(Array.isArray(pEspacios.json.errores));
    assert.equal(llamadasProveedor, 0);

    // Resumir nota inexistente
    const resResumen = await request('/api/notas/9999/resumen', { method: 'POST' });
    assert.equal(resResumen.status, 404);
    assert.deepEqual(resResumen.json, { error: 'Nota no encontrada' });
    assert.equal(llamadasProveedor, 0);

    // Resumir con ID inválido
    const resResumenInvalido = await request('/api/notas/invalido/resumen', { method: 'POST' });
    assert.equal(resResumenInvalido.status, 404);
    assert.deepEqual(resResumenInvalido.json, { error: 'Nota no encontrada' });
    assert.equal(llamadasProveedor, 0);
  });

  test('6. Con el SDK simulado, verifica los cuerpos de éxito de pregunta y resumen. Comprueba que la solicitud de resumen usa el contenido de la nota y pide tres viñetas en system. Verifica el mapeo de 401, 429 y 529, además de la respuesta cuando falta la clave.', async () => {
    let capturedParams = null;
    deepseekService._setClient({
      messages: {
        create: async (params) => {
          capturedParams = params;
          return {
            content: [{ type: 'text', text: 'Respuesta simulada exitosa' }],
            usage: { input_tokens: 15, output_tokens: 42 }
          };
        }
      }
    });

    // Éxito de pregunta
    const resPregunta = await request('/api/ia/preguntar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pregunta: '¿Qué es Node.js?' })
    });
    assert.equal(resPregunta.status, 200);
    assert.deepEqual(resPregunta.json, {
      respuesta: 'Respuesta simulada exitosa',
      uso: { input_tokens: 15, output_tokens: 42 }
    });
    assert.equal(capturedParams.model, 'deepseek-flash');
    assert.deepEqual(capturedParams.thinking, { type: 'disabled' });
    assert.equal(capturedParams.max_tokens, 1024);
    assert.deepEqual(capturedParams.messages, [{ role: 'user', content: '¿Qué es Node.js?' }]);

    // Éxito de resumen
    const notaCreada = await notasService.crear({
      titulo: 'Nota para resumen',
      contenido: 'Texto extenso para resumir en viñetas'
    });

    capturedParams = null;
    const resResumen = await request(`/api/notas/${notaCreada.id}/resumen`, {
      method: 'POST'
    });
    assert.equal(resResumen.status, 200);
    assert.deepEqual(resResumen.json, {
      notaId: notaCreada.id,
      resumen: 'Respuesta simulada exitosa'
    });
    assert.equal(capturedParams.messages[0].content, 'Texto extenso para resumir en viñetas');
    assert.match(capturedParams.system, /tres viñetas/i);
    assert.match(capturedParams.system, /español/i);

    // Mapeo 401 del proveedor -> 502 IA_NO_DISPONIBLE
    deepseekService._setClient({
      messages: {
        create: async () => {
          const err = new Error('Unauthorized');
          err.name = 'AuthenticationError';
          err.status = 401;
          throw err;
        }
      }
    });
    const res401 = await request('/api/ia/preguntar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pregunta: 'Prueba 401' })
    });
    assert.equal(res401.status, 502);
    assert.deepEqual(res401.json, { error: 'IA_NO_DISPONIBLE' });

    // Mapeo 429 del proveedor -> 429 IA_NO_DISPONIBLE
    deepseekService._setClient({
      messages: {
        create: async () => {
          const err = new Error('Rate limit');
          err.name = 'RateLimitError';
          err.status = 429;
          throw err;
        }
      }
    });
    const res429 = await request('/api/ia/preguntar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pregunta: 'Prueba 429' })
    });
    assert.equal(res429.status, 429);
    assert.deepEqual(res429.json, { error: 'IA_NO_DISPONIBLE' });

    // Mapeo 529 del proveedor -> 503 IA_NO_DISPONIBLE
    deepseekService._setClient({
      messages: {
        create: async () => {
          const err = new Error('Overloaded');
          err.name = 'APIStatusError';
          err.status = 529;
          throw err;
        }
      }
    });
    const res529 = await request('/api/ia/preguntar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pregunta: 'Prueba 529' })
    });
    assert.equal(res529.status, 503);
    assert.deepEqual(res529.json, { error: 'IA_NO_DISPONIBLE' });

    // Respuesta cuando falta la clave -> 502 IA_NO_DISPONIBLE
    deepseekService._setClient(null);
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    const resSinClave = await request('/api/ia/preguntar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pregunta: 'Prueba sin clave' })
    });
    assert.equal(resSinClave.status, 502);
    assert.deepEqual(resSinClave.json, { error: 'IA_NO_DISPONIBLE' });
  });

  test('7. GET /api/health devuelve 200 con estado de salud y base de datos', async () => {
    const res = await request('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.json.status, 'ok');
    assert.ok(typeof res.json.uptime === 'number');
    assert.ok(typeof res.json.database === 'string');
    assert.ok(typeof res.json.timestamp === 'string');
  });

  test('8. PUT /api/notas/:id actualiza una nota, devuelve 200, y 404 si no existe', async () => {
    const creacion = await request('/api/notas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'Original', contenido: 'Contenido original' })
    });
    const id = creacion.json.id;

    // Actualización exitosa
    const resPut = await request(`/api/notas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'Modificado', contenido: 'Contenido modificado' })
    });
    assert.equal(resPut.status, 200);
    assert.equal(resPut.json.id, id);
    assert.equal(resPut.json.titulo, 'Modificado');
    assert.equal(resPut.json.contenido, 'Contenido modificado');

    // Consultar para comprobar persistencia
    const getRes = await request(`/api/notas/${id}`);
    assert.equal(getRes.json.titulo, 'Modificado');

    // PUT en nota inexistente -> 404
    const put404 = await request('/api/notas/99999', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'No existe', contenido: 'Invalido' })
    });
    assert.equal(put404.status, 404);

    // PUT con datos inválidos -> 400
    const put400 = await request(`/api/notas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: '   ', contenido: 'Valido' })
    });
    assert.equal(put400.status, 400);
  });

  test('9. GET /api/notas?q=termino filtra notas correctamente', async () => {
    await request('/api/notas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'Aprender Docker', contenido: 'Contenedores y compose' })
    });
    await request('/api/notas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'Aprender Express', contenido: 'Rutas y middlewares' })
    });

    // Filtro por 'Docker'
    const resDocker = await request('/api/notas?q=Docker');
    assert.equal(resDocker.status, 200);
    assert.equal(resDocker.json.length, 1);
    assert.equal(resDocker.json[0].titulo, 'Aprender Docker');

    // Filtro por 'middlewares' (en contenido)
    const resMid = await request('/api/notas?q=middlewares');
    assert.equal(resMid.status, 200);
    assert.equal(resMid.json.length, 1);
    assert.equal(resMid.json[0].titulo, 'Aprender Express');

    // Filtro sin coincidencias
    const resVacio = await request('/api/notas?q=inexistente');
    assert.equal(resVacio.status, 200);
    assert.equal(resVacio.json.length, 0);
  });

  test('10. POST /api/notas/:id/tags genera etiquetas con IA y maneja 404', async () => {
    // 404 si la nota no existe
    const res404 = await request('/api/notas/999/tags', { method: 'POST' });
    assert.equal(res404.status, 404);

    // Crear nota para etiquetar
    const creada = await request('/api/notas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: 'Arquitectura Cloud',
        contenido: 'Diseño de microservicios en Kubernetes usando contenedores Docker y API REST.'
      })
    });
    const id = creada.json.id;

    // Simular respuesta de la IA
    let llamadaSys = '';
    deepseekService._setClient({
      messages: {
        create: async (params) => {
          llamadaSys = params.system;
          return {
            content: [{ type: 'text', text: '["kubernetes", "docker", "microservicios", "cloud"]' }],
            usage: { input_tokens: 30, output_tokens: 15 }
          };
        }
      }
    });

    const resTags = await request(`/api/notas/${id}/tags`, { method: 'POST' });
    assert.equal(resTags.status, 200);
    assert.equal(resTags.json.notaId, id);
    assert.deepEqual(resTags.json.tags, ['kubernetes', 'docker', 'microservicios', 'cloud']);
    assert.match(llamadaSys, /etiquetas/i);
  });

  test('11. Middleware responseTime agrega cabecera X-Response-Time a las respuestas', async () => {
    const res = await request('/api/health');
    assert.equal(res.status, 200);
    const header = res.headers.get('x-response-time');
    assert.ok(header, 'Debe incluir cabecera x-response-time');
    assert.match(header, /^\d+(\.\d+)?ms$/);
  });

  test('12. POST /api/notas/:id/duplicar crea una copia con sufijo (copia) y maneja 404', async () => {
    // 404 para nota inexistente
    const res404 = await request('/api/notas/999/duplicar', { method: 'POST' });
    assert.equal(res404.status, 404);

    // Crear nota original
    const orig = await request('/api/notas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'Nota Original', contenido: 'Contenido importante' })
    });
    assert.equal(orig.status, 201);

    // Duplicar nota
    const dup = await request(`/api/notas/${orig.json.id}/duplicar`, { method: 'POST' });
    assert.equal(dup.status, 201);
    assert.notEqual(dup.json.id, orig.json.id);
    assert.equal(dup.json.titulo, 'Nota Original (copia)');
    assert.equal(dup.json.contenido, 'Contenido importante');
  });

  test('13. GET /api/notas/stats calcula métricas de notas, palabras y caracteres', async () => {
    // Vacío inicialmente
    const resVacio = await request('/api/notas/stats');
    assert.equal(resVacio.status, 200);
    assert.equal(resVacio.json.totalNotas, 0);
    assert.equal(resVacio.json.notaMasLarga, null);

    // Crear dos notas
    await request('/api/notas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'Corta', contenido: 'Uno dos tres' })
    });
    await request('/api/notas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'Nota Larga', contenido: 'Este texto contiene bastantes mas palabras para la prueba' })
    });

    const resConDatos = await request('/api/notas/stats');
    assert.equal(resConDatos.status, 200);
    assert.equal(resConDatos.json.totalNotas, 2);
    assert.ok(resConDatos.json.totalPalabras > 5);
    assert.ok(resConDatos.json.totalCaracteres > 10);
    assert.equal(resConDatos.json.notaMasLarga.titulo, 'Nota Larga');
  });

  test('14. Middleware de seguridad inyecta cabeceras de protección HTTP', async () => {
    const res = await request('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.equal(res.headers.get('x-xss-protection'), '1; mode=block');
    assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  });
});
