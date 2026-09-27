# Guía de Despliegue en Vercel - Catálogo Digital

Este proyecto ya está 100% preparado y optimizado para ser desplegado en **Vercel**, combinando la velocidad de entrega estática (CDN) para las páginas web con funciones **Serverless (Node.js/Express)** para toda la API de Supabase y el panel de administración.

---

## 📂 Archivos generados para Vercel

1. **`vercel.json`**:
   - Enruta todas las peticiones `/api/*` hacia la función serverless de Express (`api/index.js`).
   - Configura URLs amigables limpias (`cleanUrls: true`) para `/inicio`, `/productos`, `/nosotros`, `/contacto` y `/admin`.
   - Aplica cabeceras de caché óptimas para imágenes y desactiva caché en endpoints dinámicos de la API.

2. **`api/index.js`**:
   - Punto de entrada serverless para Vercel que importa y ejecuta la aplicación Express de `server.js`.

3. **`server.js`**:
   - Soporte automático para entorno serverless (`process.env.VERCEL`) y para ejecución local/desarrollo (`node server.js` en el puerto 3000).
   - Middleware de cabeceras CORS activado.
   - Enrutamiento directo a todas las vistas y APIs.

4. **`.vercelignore`**:
   - Excluye archivos locales, `node_modules` y scripts internos para asegurar que el despliegue sea rápido y liviano.

---

## 🚀 Opciones de Despliegue

### Opción 1: Despliegue mediante GitHub (Recomendado)

1. **Sube tu código a un repositorio de GitHub**:
   ```bash
   git add .
   git commit -m "Preparado para despliegue en Vercel"
   git push origin main
   ```
2. **Inicia sesión en Vercel**:
   - Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
3. **Importar el proyecto**:
   - Haz clic en **"Add New..."** > **"Project"**.
   - Selecciona el repositorio de GitHub de este proyecto.
4. **Configuración del proyecto**:
   - **Framework Preset**: `Other` (se detectará automáticamente por `vercel.json`).
   - **Root Directory**: `./` (raíz).
   - **Build Command**: `npm run build` (por defecto).
   - **Output Directory**: Déjalo vacío o por defecto.
5. **Configurar Variables de Entorno (Environment Variables)**:
   - En la sección **Environment Variables**, añade las siguientes claves (ver sección abajo).
6. **Desplegar**:
   - Haz clic en **Deploy**. ¡En pocos segundos tu tienda estará en línea con HTTPS gratuito!

---

### Opción 2: Despliegue mediante Vercel CLI (Línea de comandos)

Si tienes Node.js en tu equipo, puedes desplegar directamente ejecutando:

```bash
# 1. Instalar o ejecutar Vercel CLI
npx vercel

# 2. Sigue las instrucciones interactivas en pantalla
# - Set up and deploy? [Y/n] -> Y
# - Which scope? -> Tu cuenta
# - Link to existing project? [y/N] -> N
# - Project name? -> catalogo-digital (o el que desees)
# - In which directory is your code located? -> ./

# 3. Para desplegar directamente a Producción:
npx vercel --prod
```

---

## 🔑 Variables de Entorno en Vercel

Configura estas variables en **Vercel Dashboard** > **Tu Proyecto** > **Settings** > **Environment Variables**:

| Variable | Valor requerido | Descripción |
| :--- | :--- | :--- |
| `SUPABASE_URL` | `https://kwdapcjhhrxijvpteflg.supabase.co` | URL de tu instancia Supabase |
| `SUPABASE_ANON_KEY` | *(Tu Anon Key de Supabase)* | Llave pública de acceso a Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | *(Opcional)* | Llave administrativa de Supabase (sin restricciones RLS) |
| `ADMIN_USER` | `admin` | Usuario para ingresar al panel `/admin` |
| `ADMIN_PASS` | `admin123` | Contraseña para el panel `/admin` (puedes cambiarla) |

*(Nota: Si no agregas las variables de Supabase, el servidor utilizará las credenciales base que ya vienen preconfiguradas en el código como valor por defecto).*

---

## 🔍 Verificación del Despliegue

Una vez desplegado en `https://tu-proyecto.vercel.app`:

1. **Página Principal**: `https://tu-proyecto.vercel.app/` o `/inicio`
2. **Catálogo de Productos**: `https://tu-proyecto.vercel.app/productos`
3. **Panel de Administración**: `https://tu-proyecto.vercel.app/admin` (Ingresa con `admin` / `admin123`)
4. **Prueba de API de Estado**: `https://tu-proyecto.vercel.app/api/status`
5. **Prueba de API de Productos**: `https://tu-proyecto.vercel.app/api/productos`
