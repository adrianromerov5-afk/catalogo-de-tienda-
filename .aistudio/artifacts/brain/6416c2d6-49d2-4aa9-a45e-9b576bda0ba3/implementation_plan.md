# Creación de Carpeta Public y Reestructuración para Despliegue en Vercel

Reorganización de los archivos estáticos del frontend dentro del directorio estándar `public/`, adaptando el servidor Express y la configuración de Vercel para garantizar una integración óptima sin errores de compilación ni enlaces rotos.

### Decisiones de la Revisión

> [!IMPORTANT]
> Confirmado por el usuario: El despliegue en Vercel requería la carpeta `public` (patrón estándar de Vercel para servir contenido estático en aplicaciones Node/Express).

- **Estructura Seleccionada**: Mover todas las vistas HTML (`index.html`, `inicio.html`, `productos.html`, `nosotros.html`, `contacto.html`, `admin.html`), hojas de estilo CSS, scripts del cliente (`admin.js`, `supabase.js`) y la carpeta `imagenes/` dentro de `public/`.
- **Compatibilidad Dual**: El servidor local Express (`server.js`) y el entorno Serverless de Vercel (`api/index.js` + CDN) seguirán respondiendo exactamente en las mismas URLs sin cambios en los enlaces de la tienda.

---

### 1. Resumen y Propósito

- **Objetivo**: Proveer la estructura estándar que Vercel espera (`public/` para el frontend y `api/` para las funciones backend), eliminando las advertencias o fallos de compilación durante el despliegue de GitHub a Vercel.
- **Beneficio Principal**: Vercel despacha automáticamente todo el contenido de `public/` a través de su CDN global de ultra-alta velocidad (Edge Network) sin costo de invocación Serverless, reservando el procesamiento backend exclusivamente para las rutas `/api/*` y la conexión con Supabase.

---

### 2. Arquitectura del Proyecto

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ESTRUCTURA DEL PROYECTO                         │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ├── public/                    ◄── Carpeta de activos estáticos      │
│   │   ├── imagenes/              ◄── Fotos de productos e iconos       │
│   │   ├── index.html             ◄── Redirección / Entrada principal   │
│   │   ├── inicio.html            ◄── Página de inicio                  │
│   │   ├── productos.html         ◄── Catálogo con categorías y carrito │
│   │   ├── nosotros.html          ◄── Quiénes somos y ubicación         │
│   │   ├── contacto.html          ◄── Formulario de contacto            │
│   │   ├── admin.html             ◄── Panel de administración           │
│   │   ├── *.css                  ◄── Hojas de estilo de cada vista     │
│   │   └── *.js (cliente)         ◄── Scripts del frontend              │
│   │                                                                    │
│   ├── api/                       ◄── Serverless functions (Vercel)     │
│   │   └── index.js               ◄── Handler que exporta Express       │
│   │                                                                    │
│   ├── server.js                  ◄── Servidor Express & APIs Supabase  │
│   ├── vercel.json                ◄── Reglas de rutas y cleanUrls       │
│   └── package.json               ◄── Configuración y dependencias      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 3. Plan de Cambios Paso a Paso

#### Fase 1: Creación del Directorio `public/` y Organización de Archivos
- Crear la carpeta `public/` en la raíz del proyecto.
- Trasladar a `public/`:
  - Archivos HTML: `index.html`, `inicio.html`, `productos.html`, `nosotros.html`, `contacto.html`, `admin.html`.
  - Archivos CSS: `inicio.css`, `productos.css`, `nosotros.css`, `contacto.css`, `admin.css`.
  - Archivos JS del navegador: `admin.js`, `supabase.js`.
  - Carpeta de imágenes: `imagenes/` (quedando como `public/imagenes/`).

#### Fase 2: Actualización de `server.js` para Compatibilidad Local
- Configurar `express.static(path.join(__dirname, 'public'))` como fuente primaria de archivos estáticos.
- Actualizar las rutas `app.get('/', ...)` y demás endpoints HTML para resolver los archivos desde `path.join(__dirname, 'public', '...')`.
- Mantener compatibilidad residual para garantizar que los scripts y assets continúen cargando tanto en el entorno de desarrollo como en producción.

#### Fase 3: Ajuste de `vercel.json`
- Optimizar las reglas de `rewrites` en `vercel.json` para que coincidan con la estructura de `public/` y las URLs limpias (`/productos`, `/contacto`, `/admin`).

#### Fase 4: Verificación y Pruebas
- Verificar la compilación con `compile_applet`.
- Probar el servidor HTTP en el puerto 3000 con `curl` verificando que `/`, `/productos`, `/api/status` y las imágenes en `/imagenes/arroz.jpg` respondan con código HTTP 200 OK.
