# Laboratorio 5 · API REST de Notas con Express, MySQL y DeepSeek

Backend desarrollado con **Node.js 20+**, **Express 5** y **CommonJS** para la gestión de notas en base de datos **MySQL** (con fallback en memoria) e integración con el modelo **DeepSeek Flash** mediante `@anthropic-ai/sdk`. Incluye validación estricta con **Zod**, documentación interactiva **OpenAPI 3 / Swagger UI**, soporte **CORS**, endpoint de salud y contenedorización con **Docker Compose**.

---

## 📋 Tabla de Contenidos

1. [Características](#-características)
2. [Estructura del Proyecto](#-estructura-del-proyecto)
3. [Requisitos Previos](#-requisitos-previos)
4. [Instalación y Configuración](#-instalación-y-configuración)
5. [Ejecución](#-ejecución)
6. [Despliegue con Docker y Docker Compose](#-despliegue-con-docker-y-docker-compose)
7. [Pruebas Automatizadas](#-pruebas-automatizadas)
8. [Contrato de la API y Ejemplos](#-contrato-de-la-api-y-ejemplos)
9. [Documentación Interactiva (Swagger UI)](#-documentación-interactiva-swagger-ui)
10. [Casos de Prueba para Entrega (Swagger)](#-casos-de-prueba-para-entrega-swagger)

---

## 🚀 Características

- **Persistencia en MySQL:** CRUD completo (Crear, Leer, Actualizar y Eliminar) con `mysql2/promise` y creación automática de base de datos (`notas_db`) y tabla (`notas`). Si MySQL no está configurado, cuenta con fallback automático en memoria.
- **Búsqueda y Filtros:** Endpoint `GET /api/notas?q=termino` para buscar notas por palabra clave en título o contenido.
- **Endpoint de Salud (`GET /api/health`):** Verificación en tiempo real del estado de la aplicación, tiempo de actividad (`uptime`) y estado de la conexión a la base de datos.
- **Soporte CORS:** Habilitado para permitir peticiones desde clientes web y frontends en otros orígenes (React, Vue, Vite, etc.).
- **Integración con DeepSeek Flash:**
  - Preguntas libres con reporte de consumo de tokens (`input_tokens` y `output_tokens`).
  - Resumen de notas en exactamente tres viñetas breves en español.
  - Inicialización perezosa: el CRUD y Swagger funcionan sin necesidad de configurar una API key.
  - Control de timeout (25s) para evitar peticiones congeladas.
- **Validación con Zod:** Sanitización de espacios y límites de caracteres en `titulo`, `contenido` y `pregunta`.
- **Manejo Centralizado de Errores:** Conversión uniforme de fallos HTTP y del SDK sin exponer claves ni detalles sensibles.
- **Swagger UI Dinámico:** Configurado con OpenAPI 3 y rutas relativas para admitir cualquier puerto sin desconfigurar la opción *Try it out*.

---

## 📂 Estructura del Proyecto

```text
Laboratorio 5/
├── src/
│   ├── index.js                  # Punto de entrada: inicializa Express y la BD
│   ├── app.js                    # Configura Express, CORS, Swagger, middlewares y routers
│   ├── config/
│   │   ├── database.js           # Conexión, pool y migraciones automáticas en MySQL
│   │   └── swagger.js            # Configuración OpenAPI 3 con rutas relativas
│   ├── routes/
│   │   ├── notas.routes.js       # Endpoints CRUD de notas, búsqueda y resumen
│   │   ├── ia.routes.js          # Endpoint de consulta a DeepSeek Flash
│   │   └── health.routes.js      # Endpoint de verificación de salud
│   ├── services/
│   │   ├── notas.service.js      # Capa de datos (MySQL / memoria) y lógica de notas
│   │   └── deepseek.service.js   # Cliente de DeepSeek con @anthropic-ai/sdk
│   ├── middlewares/
│   │   ├── validar.js            # Validación de esquemas con Zod
│   │   └── errorHandler.js       # Middleware centralizado de gestión de errores
│   └── utils/
│       └── errors.js             # Clase personalizada AppError
├── test/
│   └── api.test.js               # Suite de 9 pruebas de integración con node:test
├── Dockerfile                    # Imagen Docker optimizada (Node 20 Alpine)
├── docker-compose.yml            # Orquestación de contenedores (API + MySQL)
├── .dockerignore                 # Exclusiones para el build de Docker
├── .env.example                  # Plantilla de variables de entorno
├── .gitignore                    # Exclusión de node_modules y .env
├── package.json                  # Dependencias y scripts
└── README.md                     # Documentación general
```

---

## ⚙️ Requisitos Previos

- **Node.js:** Versión 20.x o superior.
- **MySQL Server:** (Opcional si usas Docker o fallback en memoria).
- **Clave de DeepSeek:** Opcional para el CRUD, requerida para consultar las rutas de IA.

---

## 🛠️ Instalación y Configuración

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Copia el archivo de plantilla `.env.example` a un archivo local `.env`:
   ```bash
   cp .env.example .env
   # En Windows PowerShell:
   Copy-Item .env.example .env
   ```

   Edita `.env` con tus credenciales:
   ```dotenv
   DEEPSEEK_API_KEY=tu_clave_de_deepseek_aqui
   DEEPSEEK_MODEL=deepseek-flash
   PORT=3000

   # Configuración MySQL
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=tu_contraseña_mysql
   DB_NAME=notas_db
   ```

---

## 💻 Ejecución

- **Modo Producción:**
  ```bash
  npm start
  ```

- **Modo Desarrollo (con recarga automática mediante Nodemon):**
  ```bash
  npm run dev
  ```

---

## 🐳 Despliegue con Docker y Docker Compose

Para levantar todo el entorno (API Node.js + Base de datos MySQL 8.0) sin necesidad de instalar nada en tu máquina local:

```bash
docker compose up -d --build
```

- La API estará disponible en `http://localhost:3000`.
- Swagger UI en `http://localhost:3000/api-docs/`.
- MySQL expuesto en el puerto `3307`.
- Para detener los contenedores:
  ```bash
  docker compose down
  ```

---

## 🧪 Pruebas Automatizadas

El proyecto incluye 9 pruebas de integración construidas con el módulo nativo `node:test` y `node:assert/strict` de Node.js:

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
7. Verificación del endpoint de salud `GET /api/health` con estado de base de datos.
8. Actualización de notas `PUT /api/notas/:id` (éxito `200`, validación `400` y no encontrado `404`).
9. Búsqueda y filtrado de notas por término `GET /api/notas?q=termino`.

---

## 📖 Contrato de la API y Ejemplos

### Resumen de Endpoints

| Método | Ruta | Descripción | Estado Éxito | Errores Posibles |
|---|---|---|:---:|:---:|
| `GET` | `/api/health` | Estado del servicio y base de datos | `200 OK` | — |
| `POST` | `/api/notas` | Crea una nueva nota | `201 Created` | `400` |
| `GET` | `/api/notas` | Lista todas las notas (admite `?q=termino`) | `200 OK` | — |
| `GET` | `/api/notas/:id` | Obtiene una nota por su ID | `200 OK` | `404` |
| `PUT` | `/api/notas/:id` | Actualiza título y contenido de una nota | `200 OK` | `400`, `404` |
| `DELETE` | `/api/notas/:id` | Elimina una nota por su ID | `204 No Content` | `404` |
| `POST` | `/api/notas/:id/resumen` | Genera un resumen en 3 viñetas con DeepSeek | `200 OK` | `404`, `429`, `502`, `503` |
| `POST` | `/api/ia/preguntar` | Envía una consulta a DeepSeek Flash | `200 OK` | `400`, `429`, `502`, `503` |
| `GET` | `/api-docs/` | Documentación interactiva Swagger UI | `200 OK` | — |

---

### Detalle de Endpoints y Ejemplos JSON

#### 1. Verificación de Salud
- **Ruta:** `GET /api/health`
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "status": "ok",
    "uptime": 142,
    "database": "connected",
    "timestamp": "2026-11-11T13:00:00.000Z"
  }
  ```

#### 2. Crear Nota
- **Ruta:** `POST /api/notas`
- **Reglas Zod:** `titulo` (1 a 100 caracteres, no solo espacios), `contenido` (1 a 5000 caracteres, no solo espacios).
- **Cuerpo de petición:**
  ```json
  {
    "titulo": "Arquitectura de Software",
    "contenido": "Se evaluó el diseño de microservicios usando Express 5 y MySQL."
  }
  ```
- **Respuesta exitosa (`201 Created`):**
  ```json
  {
    "id": 1,
    "titulo": "Arquitectura de Software",
    "contenido": "Se evaluó el diseño de microservicios usando Express 5 y MySQL."
  }
  ```

#### 3. Listar y Buscar Notas
- **Ruta:** `GET /api/notas` o `GET /api/notas?q=Software`
- **Respuesta exitosa (`200 OK`):**
  ```json
  [
    {
      "id": 1,
      "titulo": "Arquitectura de Software",
      "contenido": "Se evaluó el diseño de microservicios usando Express 5 y MySQL."
    }
  ]
  ```

#### 4. Actualizar Nota
- **Ruta:** `PUT /api/notas/1`
- **Cuerpo de petición:**
  ```json
  {
    "titulo": "Arquitectura Modificada",
    "contenido": "Contenido actualizado y persistido en MySQL."
  }
  ```
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "id": 1,
    "titulo": "Arquitectura Modificada",
    "contenido": "Contenido actualizado y persistido en MySQL."
  }
  ```

#### 5. Resumen de Nota con DeepSeek Flash
- **Ruta:** `POST /api/notas/1/resumen`
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "notaId": 1,
    "resumen": "• Se evaluó el diseño de microservicios.\n• Se implementó Express 5 con MySQL.\n• Se aseguró la validación estricta de contratos."
  }
  ```

#### 6. Preguntar a DeepSeek Flash
- **Ruta:** `POST /api/ia/preguntar`
- **Cuerpo de petición:**
  ```json
  {
    "pregunta": "¿Cuáles son las ventajas de Express 5 frente a versiones anteriores?"
  }
  ```
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "respuesta": "Express 5 simplifica el desarrollo al soportar de forma nativa promesas y propagación automática de errores asíncronos.",
    "uso": {
      "input_tokens": 26,
      "output_tokens": 656
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

Accede desde tu navegador en:
```text
http://localhost:3000/api-docs/
```

- **Compatibilidad con puertos dinámicos:** Configurado con `servers: [{ url: '/' }]` para que el botón **Try it out** ejecute las llamadas contra el mismo puerto en el que esté corriendo la API.
- **Modelos y Endpoints:** Documenta todos los endpoints CRUD, búsqueda, salud e inteligencia artificial con esquemas de entrada y salida completos.

---

## 📸 Casos de Prueba para Entrega (Swagger)

1. **Pregunta exitosa a la IA (`POST /api/ia/preguntar`):**
   - Ejecuta una pregunta válida con tu clave activa en `.env`.
   - Verifica la respuesta `200 OK` con `respuesta` y `uso` (`input_tokens` y `output_tokens`).

2. **Resumen en tres viñetas (`POST /api/notas/:id/resumen`):**
   - Crea previamente una nota descriptiva en MySQL.
   - Ejecuta el endpoint de resumen para esa nota.
   - Verifica la respuesta `200 OK` con `notaId` y el texto formateado en 3 viñetas.

3. **Respuesta 502 ante clave falsa:**
   - Modifica temporalmente en `.env` la variable `DEEPSEEK_API_KEY=sk-clave-invalida` y reinicia el servidor.
   - Ejecuta `POST /api/ia/preguntar`.
   - Verifica la respuesta `502 Bad Gateway` con el cuerpo `{ "error": "IA_NO_DISPONIBLE" }`.
