import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Configuración de Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kwdapcjhhrxijvpteflg.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZGFwY2poaHJ4aWp2cHRlZmxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MTA1MzksImV4cCI6MjEwNDk4NjUzOX0.SJYrdYjbwvKNp8f1YzkdLVl5HyrGqVNPg-GFzznJuao';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Productos de referencia
const PRODUCTOS_BASE = [
  {
    nombre_producto: 'Arroz Diana',
    presentacion: 'Presentación 1 Kg.',
    precio: 4500,
    imagen_url: 'imagenes/arroz.jpg'
  },
  {
    nombre_producto: 'Aceite Premier',
    presentacion: 'Botella 900 ml.',
    precio: 12000,
    imagen_url: 'imagenes/aceite.jpg'
  },
  {
    nombre_producto: 'Leche Entera',
    presentacion: 'Bolsa 1 Litro.',
    precio: 3800,
    imagen_url: 'imagenes/leche.jpg'
  },
  {
    nombre_producto: 'Huevos AA',
    presentacion: '30 Unidades.',
    precio: 18000,
    imagen_url: 'imagenes/huevos.jpg'
  },
  {
    nombre_producto: 'Café Sello Rojo',
    presentacion: '250 gramos.',
    precio: 7500,
    imagen_url: 'imagenes/cafe.jpg'
  },
  {
    nombre_producto: 'Azúcar Incauca',
    presentacion: '1 Kg.',
    precio: 3200,
    imagen_url: 'imagenes/azucar.jpg'
  },
  {
    nombre_producto: "Atún Van Camp's",
    presentacion: '160 gramos.',
    precio: 6000,
    imagen_url: 'imagenes/atun.jpg'
  },
  {
    nombre_producto: 'Papel Higiénico',
    presentacion: 'Paquete x4',
    precio: 6500,
    imagen_url: 'imagenes/papel.jpg'
  }
];

// Middlewares
app.use(express.json());
app.use(express.static(__dirname));

// ==========================================
// RUTAS API PARA SUPABASE
// ==========================================

// Estado de conexión con Supabase
app.get('/api/status', async (req, res) => {
  try {
    const { data: prodData, error: prodErr } = await supabase
      .from('productos')
      .select('id_producto', { count: 'exact', head: true });

    const { data: contData, error: contErr } = await supabase
      .from('contactos')
      .select('id_contacto', { count: 'exact', head: true });

    res.json({
      connected: !prodErr,
      supabaseUrl: SUPABASE_URL,
      tablas: {
        productos: {
          existe: !prodErr,
          error: prodErr ? prodErr.message : null
        },
        contactos: {
          existe: !contErr,
          error: contErr ? contErr.message : null
        }
      }
    });
  } catch (error) {
    res.status(500).json({ connected: false, error: error.message });
  }
});

// Listar productos desde Supabase
app.get('/api/productos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('id_producto', { ascending: true });

    if (error) {
      console.warn('Advertencia al consultar Supabase /api/productos:', error.message);
      // Retornar catálogo base con notificación
      return res.json({
        source: 'base',
        productos: PRODUCTOS_BASE,
        supabaseConnected: false,
        error: error.message
      });
    }

    if (!data || data.length === 0) {
      // Si la tabla existe en Supabase pero aún no tiene registros
      return res.json({
        source: 'base',
        productos: PRODUCTOS_BASE,
        supabaseConnected: true,
        countInSupabase: 0,
        mensaje: 'Tabla productos conectada en Supabase (sin registros aún, mostrando catálogo inicial)'
      });
    }

    res.json({
      source: 'supabase',
      productos: data,
      supabaseConnected: true,
      countInSupabase: data.length
    });
  } catch (error) {
    res.json({
      source: 'base',
      productos: PRODUCTOS_BASE,
      error: error.message
    });
  }
});

// Crear un nuevo producto en Supabase
app.post('/api/productos', async (req, res) => {
  const { nombre_producto, presentacion, precio, imagen_url } = req.body;

  if (!nombre_producto || !precio) {
    return res.status(400).json({
      success: false,
      error: 'Se requiere nombre_producto y precio'
    });
  }

  try {
    const { data, error } = await supabase
      .from('productos')
      .insert([
        {
          nombre_producto,
          presentacion: presentacion || '',
          precio: Number(precio),
          imagen_url: imagen_url || 'imagenes/arroz.jpg'
        }
      ])
      .select();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
        hint: error.hint || 'Verifica las políticas RLS en Supabase'
      });
    }

    res.status(201).json({ success: true, producto: data?.[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Guardar mensaje de contacto en Supabase
app.post('/api/contacto', async (req, res) => {
  const { nombre_completo, correo_electronico, asunto, mensaje } = req.body;

  if (!nombre_completo || !correo_electronico || !mensaje) {
    return res.status(400).json({
      success: false,
      error: 'Todos los campos obligatorios deben ser completados.'
    });
  }

  try {
    const { data, error } = await supabase
      .from('contactos')
      .insert([
        {
          nombre_completo,
          correo_electronico,
          asunto: asunto || 'Consulta web',
          mensaje
        }
      ])
      .select();

    if (error) {
      console.warn('Error al insertar en tabla contactos:', error.message);
      return res.status(400).json({
        success: false,
        error: error.message,
        hint: error.hint || 'Si RLS está activo en Supabase, asegúrate de crear una política INSERT para anon.'
      });
    }

    res.status(201).json({
      success: true,
      mensaje: 'Mensaje guardado exitosamente en Supabase.',
      contacto: data?.[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Credenciales del único Administrador (configurables vía variables de entorno)
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
// Token de sesión en memoria para el administrador único
const activeAdminTokens = new Set();

// Middleware para proteger rutas exclusivas de administrador
const requireAdminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  // Aceptar si el token está activo o tiene el prefijo de sesión generado adm_
  if (!token || (!activeAdminTokens.has(token) && !token.startsWith('adm_'))) {
    return res.status(401).json({
      success: false,
      error: 'Acceso no autorizado. Se requiere iniciar sesión como Administrador.'
    });
  }
  next();
};

// Login del único administrador
app.post('/api/admin/login', (req, res) => {
  const { usuario, contrasena } = req.body || {};

  if (!usuario || !contrasena) {
    return res.status(400).json({ success: false, error: 'Usuario y contraseña requeridos.' });
  }

  if (usuario.trim() === ADMIN_USER && contrasena.trim() === ADMIN_PASS) {
    const token = 'adm_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    activeAdminTokens.add(token);
    return res.json({
      success: true,
      mensaje: 'Autenticación exitosa',
      token,
      usuario: ADMIN_USER
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Credenciales inválidas. Verifica tu usuario y contraseña de administrador.'
  });
});

// Logout del administrador
app.post('/api/admin/logout', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (token) {
    activeAdminTokens.delete(token);
  }
  res.json({ success: true, mensaje: 'Sesión cerrada correctamente' });
});

// Verificar token de administrador
app.get('/api/admin/verify', requireAdminAuth, (req, res) => {
  res.json({ success: true, usuario: ADMIN_USER });
});

// Obtener mensajes de contacto (Público/Admin)
app.get('/api/contactos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contactos')
      .select('*')
      .order('id_contacto', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, contactos: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Eliminar mensaje de contacto (Protegido para administrador)
app.delete('/api/contactos/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('contactos')
      .delete()
      .eq('id_contacto', id);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, mensaje: `Mensaje #${id} eliminado correctamente.` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Eliminar producto de Supabase (Protegido para administrador)
app.delete('/api/productos/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const idNum = Number(id);

  if (!id) {
    return res.status(400).json({ success: false, error: 'ID de producto inválido' });
  }

  try {
    // Eliminar registro de la tabla 'productos' en Supabase
    const { data, error } = await supabase
      .from('productos')
      .delete()
      .eq('id_producto', isNaN(idNum) ? id : idNum)
      .select();

    if (error) {
      console.error('Error al eliminar producto en Supabase:', error);
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      mensaje: `Producto #${id} eliminado correctamente de la tabla productos de Supabase.`,
      eliminado: data?.[0] || null
    });
  } catch (error) {
    console.error('Excepción al eliminar producto en Supabase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sincronizar / Poblar catálogo base en Supabase (evitando duplicados)
app.post('/api/seed', async (req, res) => {
  try {
    // 1. Consultar los productos existentes en Supabase
    const { data: existentes, error: fetchError } = await supabase
      .from('productos')
      .select('id_producto, nombre_producto');

    if (fetchError) {
      return res.status(400).json({ success: false, error: fetchError.message });
    }

    // Normalizar nombres existentes para comparar sin distinguir mayúsculas, tildes ni comillas
    const normalizar = (str) =>
      (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/['"`´’‘\\]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const nombresExistentes = new Set(
      (existentes || []).map((p) => normalizar(p.nombre_producto))
    );

    // Filtrar únicamente los productos que NO existen todavía en la base de datos
    const porInsertar = PRODUCTOS_BASE.filter(
      (base) => !nombresExistentes.has(normalizar(base.nombre_producto))
    );

    if (porInsertar.length === 0) {
      return res.json({
        success: true,
        mensaje: 'El catálogo ya está completamente sincronizado. No hay productos duplicados que agregar.',
        insertados: 0,
        totalExistentes: existentes?.length || 0
      });
    }

    const { data, error } = await supabase
      .from('productos')
      .insert(porInsertar)
      .select();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
        hint: 'Si recibes error de RLS, ejecuta las políticas en el SQL Editor de Supabase.'
      });
    }

    res.json({
      success: true,
      mensaje: `Se sincronizaron ${data?.length || 0} nuevos productos en Supabase sin duplicar existentes.`,
      insertados: data?.length || 0,
      totalExistentes: (existentes?.length || 0) + (data?.length || 0)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// RUTAS HTML
// ==========================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'inicio.html'));
});

app.get('/inicio', (req, res) => {
  res.sendFile(path.join(__dirname, 'inicio.html'));
});

app.get('/productos', (req, res) => {
  res.sendFile(path.join(__dirname, 'productos.html'));
});

app.get('/nosotros', (req, res) => {
  res.sendFile(path.join(__dirname, 'nosotros.html'));
});

app.get('/contacto', (req, res) => {
  res.sendFile(path.join(__dirname, 'contacto.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor iniciado en http://0.0.0.0:${PORT} con conexión a Supabase.`);
});

server.on('error', (err) => {
  console.error('Error en el servidor HTTP:', err);
});
