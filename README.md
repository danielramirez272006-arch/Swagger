# Laboratorio 5 · API REST de Notas con Express y DeepSeek

Backend desarrollado con **Node.js 20+**, **Express 5** y **CommonJS** para la gestión de notas en memoria e integración con el modelo **DeepSeek Flash** mediante `@anthropic-ai/sdk`. Incluye validación estricta con **Zod**, documentación interactiva **OpenAPI 3 / Swagger UI** y manejo centralizado de errores.

---

## 📋 Tabla de Contenidos

1. [Características](#-características)
2. [Estructura del Proyecto](#-estructura-del-proyecto)
3. [Requisitos Previos](#-requisitos-previos)
4. [Instalación y Configuración](#-instalación-y-configuración)
5. [Ejecución](#-ejecución)
6. [Pruebas Automatizadas](#-pruebas-automatizadas)
7. [Contrato de la API y Ejemplos](#-contrato-de-la-api-y-ejemplos)
8. [Documentación Interactiva (Swagger UI)](#-documentación-interactiva-swagger-ui)
9. [Casos de Prueba para Entrega (Swagger)](#-casos-de-prueba-para-entrega-swagger)

---

## 🚀 Características

- **Gestión de Notas en Memoria:** Creación, listado, consulta y eliminación con IDs enteros positivos incrementales que no se reutilizan.
- **Integración con DeepSeek Flash:**
  - Preguntas libres con reporte de consumo de tokens (`input_tokens` y `output_tokens`).
  - Resumen de notas en exactamente tres viñetas breves en español.
  - Inicialización perezosa: el CRUD y Swagger funcionan sin necesidad de configurar una API key.
- **Validación con Zod:** Sanitización de espacios y límites de caracteres en `titulo`, `contenido` y `pregunta`.
- **Manejo Centralizado de Errores:** Conversión uniforme de fallos HTTP y del SDK sin exponer claves ni detalles sensibles.
- **Swagger UI Dinámico:** Configurado con OpenAPI 3 y rutas relativas para admitir cualquier puerto sin desconfigurar la opción *Try it out*.

---

## 📂 Estructura del Proyecto

```text
Laboratorio 5/
├── src/
│   ├── index.js                  # Punto de entrada: carga dotenv y escucha en el puerto
│   ├── app.js                    # Configura Express, middlewares, Swagger y rutas
│   ├── config/
│   │   └── swagger.js            # Configuración OpenAPI 3 con rutas relativas
│   ├── routes/
│   │   ├── notas.routes.js       # Endpoints CRUD de notas y generación de resumen
│   │   └── ia.routes.js          # Endpoint de consulta a DeepSeek Flash
│   ├── services/
│   │   ├── notas.service.js      # Estado de notas en memoria y lógica de negocio
│   │   └── deepseek.service.js   # Cliente de DeepSeek con @anthropic-ai/sdk
│   ├── middlewares/
│   │   ├── validar.js            # Validación de esquemas con Zod
│   │   └── errorHandler.js       # Middleware centralizado de gestión de errores
│   └── utils/
│       └── errors.js             # Clase personalizada AppError
├── test/
│   └── api.test.js               # Suite de pruebas de integración con node:test
├── .env.example                  # Plantilla de variables de entorno
├── .gitignore                    # Exclusión de node_modules y .env
├── package.json                  # Dependencias y scripts
└── README.md                     # Documentación general
```

---

## ⚙️ Requisitos Previos

- **Node.js:** Versión 20.x o superior.
- **npm:** Versión 10.x o superior.
- **Clave de DeepSeek:** Opcional para el CRUD, requerida para consultar las rutas de IA.

---

## 🛠️ Instalación y Configuración

1. **Clonar el repositorio o situarse en el directorio:**
   ```bash
   cd "Laboratorio 5"
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Copia el archivo de plantilla `.env.example` a un archivo local `.env`:
   ```bash
   cp .env.example .env
   # En Windows PowerShell:
   Copy-Item .env.example .env
   ```

   Edita `.env` con tus credenciales:
   ```dotenv
   ANTHROPIC_API_KEY=tu_clave_de_deepseek_aqui
   DEEPSEEK_MODEL=deepseek-flash
   PORT=3000
   ```

---

## 💻 Ejecución

- **Modo Producción:**
  ```bash
  npm start
  ```
  Inicia el servidor en `http://localhost:3000`.

- **Modo Desarrollo (con recarga automática mediante Nodemon):**
  ```bash
  npm run dev
  ```

---

## 🧪 Pruebas Automatizadas

El proyecto incluye pruebas de integración construidas con el módulo nativo `node:test` y `node:assert/strict` de Node.js:

```bash
npm test
```

### Escenarios verificados:
1. Carga de Swagger UI y funcionamiento del CRUD sin API Key.
2. Estado inicial vacío, creación con IDs consecutivos sin colisión y consultas.
3. Validación Zod ante cuerpos vacíos, campos de solo espacios y JSON mal formado (`400`).
4. Eliminación de notas (`204`), comprobación de que el ID eliminado no se reutiliza y respuesta `404` ante IDs inexistentes o inválidos.
5. Verificación de cero llamadas al proveedor cuando la pregunta es inválida o la nota a resumir no existe.
6. Simulación del SDK: captura de parámetros (`system` con tres viñetas, contenido del usuario), retorno de `uso` de tokens y mapeo de errores (`401` $\rightarrow$ `502`, `429` $\rightarrow$ `429`, `529` $\rightarrow$ `503`, red $\rightarrow$ `502`).

---

## 📖 Contrato de la API y Ejemplos

### Resumen de Endpoints

| Método | Ruta | Descripción | Estado Éxito | Errores Posibles |
|---|---|---|:---:|:---:|
| `POST` | `/api/notas` | Crea una nueva nota | `201 Created` | `400` |
| `GET` | `/api/notas` | Lista todas las notas | `200 OK` | — |
| `GET` | `/api/notas/:id` | Obtiene una nota por su ID | `200 OK` | `404` |
| `DELETE` | `/api/notas/:id` | Elimina una nota por su ID | `204 No Content` | `404` |
| `POST` | `/api/notas/:id/resumen` | Genera un resumen en 3 viñetas con DeepSeek | `200 OK` | `404`, `429`, `502`, `503` |
| `POST` | `/api/ia/preguntar` | Envía una consulta a DeepSeek Flash | `200 OK` | `400`, `429`, `502`, `503` |
| `GET` | `/api-docs/` | Documentación interactiva Swagger UI | `200 OK` | — |

---

### Detalle de Endpoints y Ejemplos JSON

#### 1. Crear Nota
- **Ruta:** `POST /api/notas`
- **Reglas Zod:** `titulo` (1 a 100 caracteres, no solo espacios), `contenido` (1 a 5000 caracteres, no solo espacios).
- **Cuerpo de petición:**
  ```json
  {
    "titulo": "Arquitectura de Software",
    "contenido": "Se evaluó el diseño de microservicios usando Express 5 y Zod para garantizar la validación de contratos."
  }
  ```
- **Respuesta exitosa (`201 Created`):**
  ```json
  {
    "id": 1,
    "titulo": "Arquitectura de Software",
    "contenido": "Se evaluó el diseño de microservicios usando Express 5 y Zod para garantizar la validación de contratos."
  }
  ```

#### 2. Listar Notas
- **Ruta:** `GET /api/notas`
- **Respuesta exitosa (`200 OK`):**
  ```json
  [
    {
      "id": 1,
      "titulo": "Arquitectura de Software",
      "contenido": "Se evaluó el diseño de microservicios usando Express 5 y Zod para garantizar la validación de contratos."
    }
  ]
  ```

#### 3. Consultar Nota por ID
- **Ruta:** `GET /api/notas/1`
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "id": 1,
    "titulo": "Arquitectura de Software",
    "contenido": "Se evaluó el diseño de microservicios usando Express 5 y Zod para garantizar la validación de contratos."
  }
  ```
- **Error si no existe o ID inválido (`404 Not Found`):**
  ```json
  {
    "error": "Nota no encontrada"
  }
  ```

#### 4. Eliminar Nota
- **Ruta:** `DELETE /api/notas/1`
- **Respuesta exitosa (`204 No Content`):** Sin cuerpo.
- **Error si ya fue eliminada o no existe (`404 Not Found`):**
  ```json
  {
    "error": "Nota no encontrada"
  }
  ```

#### 5. Resumen de Nota con DeepSeek Flash
- **Ruta:** `POST /api/notas/1/resumen`
- **Descripción:** Busca la nota especificada y envía su contenido al proveedor pidiendo exactamente tres viñetas breves en español.
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "notaId": 1,
    "resumen": "• Se evaluó el diseño de microservicios.\n• Se implementó Express 5 con Zod.\n• Se aseguró la validación estricta de contratos."
  }
  ```

#### 6. Preguntar a DeepSeek Flash
- **Ruta:** `POST /api/ia/preguntar`
- **Reglas Zod:** `pregunta` (3 a 2000 caracteres, no solo espacios).
- **Cuerpo de petición:**
  ```json
  {
    "pregunta": "¿Cuáles son las ventajas de Express 5 frente a versiones anteriores?"
  }
  ```
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "respuesta": "Express 5 simplifica el desarrollo al soportar de forma nativa promesas y propagación automática de errores asíncronos hacia los middlewares de manejo de errores.",
    "uso": {
      "input_tokens": 28,
      "output_tokens": 36
    }
  }
  ```

---

### Códigos y Formatos de Error

| Caso | Código HTTP | Formato del Cuerpo |
|---|:---:|---|
| Error de validación Zod | `400 Bad Request` | `{ "errores": [ { "code": "...", "message": "..." } ] }` |
| JSON mal formado | `400 Bad Request` | `{ "error": "JSON inválido" }` |
| Nota no encontrada o ID inválido | `404 Not Found` | `{ "error": "Nota no encontrada" }` |
| Límite de tasa excedido del proveedor | `429 Too Many Requests` | `{ "error": "IA_NO_DISPONIBLE" }` |
| Clave ausente, error 401 o fallo de red | `502 Bad Gateway` | `{ "error": "IA_NO_DISPONIBLE" }` |
| Sobrecarga del proveedor (error 529) | `503 Service Unavailable` | `{ "error": "IA_NO_DISPONIBLE" }` |
| Error inesperado del servidor | `500 Internal Server Error` | `{ "error": "Error interno" }` |

---

## 📑 Documentación Interactiva (Swagger UI)

La documentación OpenAPI 3 se genera de manera dinámica escaneando las anotaciones JSDoc `@openapi` en los archivos de rutas.

Accede desde tu navegador en:
```text
http://localhost:3000/api-docs/
```

- **Compatibilidad con puertos dinámicos:** Configurado con `servers: [{ url: '/' }]` para que el botón **Try it out** ejecute las llamadas contra el mismo puerto en el que esté corriendo la API.
- **Visualización completa:** Incluye esquemas de modelos (`Nota`, `CrearNotaInput`, `PreguntaInput`, etc.) y códigos de respuesta documentados.

---

## 📸 Casos de Prueba para Entrega (Swagger)

Para la sustentación o entrega del laboratorio, captura las siguientes 3 evidencias desde Swagger UI:

1. **Pregunta exitosa a la IA (`POST /api/ia/preguntar`):**
   - Ejecuta una pregunta válida con una API Key activa en `.env`.
   - Verifica la respuesta `200 OK` con `respuesta` y el bloque `uso` (`input_tokens` y `output_tokens`).

2. **Resumen en tres viñetas (`POST /api/notas/:id/resumen`):**
   - Crea previamente una nota con contenido descriptivo.
   - Ejecuta el endpoint de resumen para esa nota.
   - Verifica la respuesta `200 OK` con `notaId` y el texto formateado en 3 viñetas.

3. **Respuesta 502 ante clave falsa:**
   - Modifica temporalmente en `.env` la variable `ANTHROPIC_API_KEY=sk-clave-invalida` y reinicia el servidor.
   - Ejecuta `POST /api/ia/preguntar`.
   - Verifica la respuesta `502 Bad Gateway` con el cuerpo `{ "error": "IA_NO_DISPONIBLE" }`.
