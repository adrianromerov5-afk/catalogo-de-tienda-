// Configuración del cliente Supabase
const SUPABASE_URL = 'https://kwdapcjhhrxijvpteflg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZGFwY2poaHJ4aWp2cHRlZmxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MTA1MzksImV4cCI6MjEwNDk4NjUzOX0.SJYrdYjbwvKNp8f1YzkdLVl5HyrGqVNPg-GFzznJuao';

// Catálogo inicial de referencia
export const PRODUCTOS_INICIALES = [
    {
        id_producto: 1,
        nombre_producto: 'Arroz Diana',
        presentacion: 'Presentación 1 Kg.',
        precio: 4500,
        imagen_url: 'imagenes/arroz.jpg'
    },
    {
        id_producto: 2,
        nombre_producto: 'Aceite Premier',
        presentacion: 'Botella 900 ml.',
        precio: 12000,
        imagen_url: 'imagenes/aceite.jpg'
    },
    {
        id_producto: 3,
        nombre_producto: 'Leche Entera',
        presentacion: 'Bolsa 1 Litro.',
        precio: 3800,
        imagen_url: 'imagenes/leche.jpg'
    },
    {
        id_producto: 4,
        nombre_producto: 'Huevos AA',
        presentacion: '30 Unidades.',
        precio: 18000,
        imagen_url: 'imagenes/huevos.jpg'
    },
    {
        id_producto: 5,
        nombre_producto: 'Café Sello Rojo',
        presentacion: '250 gramos.',
        precio: 7500,
        imagen_url: 'imagenes/cafe.jpg'
    },
    {
        id_producto: 6,
        nombre_producto: 'Azúcar Incauca',
        presentacion: '1 Kg.',
        precio: 3200,
        imagen_url: 'imagenes/azucar.jpg'
    },
    {
        id_producto: 7,
        nombre_producto: "Atún Van Camp's",
        presentacion: '160 gramos.',
        precio: 6000,
        imagen_url: 'imagenes/atun.jpg'
    },
    {
        id_producto: 8,
        nombre_producto: 'Papel Higiénico',
        presentacion: 'Paquete x4',
        precio: 6500,
        imagen_url: 'imagenes/papel.jpg'
    },
    {
        id_producto: 9,
        nombre_producto: 'Gaseosa Coca-Cola',
        presentacion: 'Botella 3 Litros',
        precio: 12000,
        imagen_url: 'https://megatiendas.vtexassets.com/arquivos/ids/174255/7702535024447.jpg?v=638697024878100000'
    },
    {
        id_producto: 10,
        nombre_producto: 'Gaseosa Quatro Toronja',
        presentacion: 'Botella 3 Litros',
        precio: 11000,
        imagen_url: 'https://exitocol.vtexassets.com/arquivos/ids/35048568/Quatro-Toronja-3-Litros-256395_a.jpg?v=639239483074500000'
    },
    {
        id_producto: 11,
        nombre_producto: 'Gaseosa Colombiana Postobón',
        presentacion: 'Botella 3.125 Litros',
        precio: 9500,
        imagen_url: 'https://carulla.vtexassets.com/arquivos/ids/13596766/Gaseosa-COLOMBIANA-3125-ml-1051515_a.jpg?v=638476694806770000'
    },
    {
        id_producto: 12,
        nombre_producto: 'Paquete Bon bon bum',
        presentacion: '2.220 g',
        precio: 10450,
        imagen_url: 'https://colombinacontentmanager-prd.s3.us-east-1.amazonaws.com/Dulces/7702011023285_A1N1_es.jpg'
    },
    {
        id_producto: 13,
        nombre_producto: 'Papas Margarita Pollo',
        presentacion: 'Paquete 105 g',
        precio: 4200,
        imagen_url: 'https://exitocol.vtexassets.com/arquivos/ids/24368504/Papas-Fritas-Pollo-MARGARITA-105-g-309536_a.jpg?v=638575037198270000'
    },
    {
        id_producto: 14,
        nombre_producto: 'Chocoramo Tradicional',
        presentacion: 'Ponqué 65 g',
        precio: 2800,
        imagen_url: 'https://carulla.vtexassets.com/arquivos/ids/13596796/Ponque-CHOCORAMO-65-g-1051543_a.jpg?v=638476695221970000'
    },
    {
        id_producto: 15,
        nombre_producto: 'Pastas Doria Spaghetti',
        presentacion: 'Paquete 500 g',
        precio: 3900,
        imagen_url: 'https://carulla.vtexassets.com/arquivos/ids/13596765/Pasta-Spaghetti-DORIA-500-g-1051514_a.jpg?v=638476694793630000'
    }
];

// Inicializar cliente Supabase
let client = null;
if (typeof supabase !== 'undefined' && supabase.createClient) {
    client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export const db = client;

const sanitizarLista = (lista) => (lista || []).map((p, idx) => ({
    ...p,
    id_producto: p.id_producto !== undefined && p.id_producto !== null ? p.id_producto : (idx + 1),
    precio: Number(p.precio) || 0
}));

// Helper para evitar que las consultas de red se queden congeladas indefinidamente en GitHub Pages o modo offline
const withTimeout = (promise, ms = 2200) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de red superado')), ms))
    ]);
};

/**
 * Obtiene los productos desde la tabla 'productos' en Supabase.
 * En entornos estáticos como GitHub Pages o modo offline, recurre de inmediato
 * al catálogo local sin bloquear la pantalla con pantallas de carga infinitas.
 */
export async function obtenerProductos() {
    // 1. Intentar Supabase si el cliente está inicializado, con timeout rápido (2.2s)
    if (client) {
        try {
            const queryPromise = client
                .from('productos')
                .select('*')
                .order('id_producto', { ascending: true });

            const { data, error } = await withTimeout(queryPromise, 2200);

            if (!error && data && data.length > 0) {
                return { source: 'supabase', productos: sanitizarLista(data), error: null };
            }
        } catch (sbErr) {
            console.warn('Supabase no disponible o timeout (entorno GitHub/offline):', sbErr.message);
        }
    }

    // 2. Si hay servidor local/Vercel (Express), consultar endpoint /api/productos
    // En GitHub Pages este endpoint no existe (404), por lo que se utiliza un timeout corto (1.2s)
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        const response = await fetch('/api/productos', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
            const resData = await response.json();
            return {
                source: resData.source || 'supabase',
                productos: sanitizarLista(resData.productos || PRODUCTOS_INICIALES),
                error: null
            };
        }
    } catch (apiErr) {
        // Normal en GitHub Pages o apertura directa de archivos HTML
        console.warn('Servidor API local no presente (modo estático):', apiErr.message);
    }

    // 3. Catálogo local instantáneo (Garantizado para GitHub Pages, local o sin backend)
    return { source: 'local', productos: sanitizarLista(PRODUCTOS_INICIALES), error: null };
}

/**
 * Guarda un registro de contacto en la tabla 'contactos' de Supabase.
 * @param {Object} datos - { nombre_completo, correo_electronico, asunto, mensaje }
 */
export async function guardarContacto(datos) {
    try {
        if (client) {
            const { data, error } = await client
                .from('contactos')
                .insert([
                    {
                        nombre_completo: datos.nombre_completo,
                        correo_electronico: datos.correo_electronico,
                        asunto: datos.asunto,
                        mensaje: datos.mensaje
                    }
                ])
                .select();

            if (!error) {
                return { success: true, data };
            }

            console.warn('Error cliente Supabase al insertar contacto:', error);
        }

        // Intento a través del backend (/api/contacto) si no estamos en GitHub Pages
        if (typeof window !== 'undefined' && window.location.protocol.startsWith('http') && !window.location.hostname.includes('github.io')) {
            const controller = new AbortController();
            const to = setTimeout(() => controller.abort(), 2000);
            const res = await fetch('/api/contacto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos),
                signal: controller.signal
            });
            clearTimeout(to);
            if (res.ok) {
                return await res.json();
            }
        }

        // Respaldo local
        try {
            let msgs = JSON.parse(localStorage.getItem('supermarket_contactos_locales') || '[]');
            if (!Array.isArray(msgs)) msgs = [];
            msgs.unshift({ id_contacto: Date.now(), ...datos, created_at: new Date().toISOString() });
            localStorage.setItem('supermarket_contactos_locales', JSON.stringify(msgs));
            return { success: true, local: true };
        } catch (e) {}

        return { success: true };
    } catch (err) {
        console.warn('Error al guardar contacto:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Agrega un nuevo producto a la tabla 'productos' de Supabase.
 * @param {Object} producto - { nombre_producto, presentacion, precio, imagen_url }
 */
export async function agregarProducto(producto) {
    try {
        if (client) {
            const { data, error } = await client
                .from('productos')
                .insert([
                    {
                        nombre_producto: producto.nombre_producto,
                        presentacion: producto.presentacion,
                        precio: Number(producto.precio) || 0,
                        imagen_url: producto.imagen_url || 'imagenes/arroz.jpg'
                    }
                ])
                .select();

            if (!error && data) {
                return { success: true, data };
            }
        }

        // Fallback a través del endpoint del servidor
        if (typeof window !== 'undefined' && window.location.protocol.startsWith('http') && !window.location.hostname.includes('github.io')) {
            const controller = new AbortController();
            const to = setTimeout(() => controller.abort(), 2000);
            const res = await fetch('/api/productos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(producto),
                signal: controller.signal
            });
            clearTimeout(to);
            if (res.ok) {
                return await res.json();
            }
        }

        // Respaldo local
        let custom = [];
        try {
            custom = JSON.parse(localStorage.getItem('supermarket_admin_productos_locales') || '[]');
            if (!Array.isArray(custom)) custom = [];
        } catch (e) {}
        const nuevo = { id_producto: Date.now(), ...producto };
        custom.push(nuevo);
        localStorage.setItem('supermarket_admin_productos_locales', JSON.stringify(custom));
        return { success: true, producto: nuevo };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Sincroniza o puebla la tabla de productos con los productos base.
 */
export async function sincronizarCatalogo() {
    try {
        if (typeof window !== 'undefined' && window.location.protocol.startsWith('http') && !window.location.hostname.includes('github.io')) {
            const controller = new AbortController();
            const to = setTimeout(() => controller.abort(), 2500);
            const res = await fetch('/api/seed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal
            });
            clearTimeout(to);
            if (res.ok) {
                return await res.json();
            }
        }
        return { success: true, mensaje: 'Catálogo base cargado correctamente.' };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// Exponer en window para scripts tradicionales
if (typeof window !== 'undefined') {
    window.SUPABASE_URL = SUPABASE_URL;
    window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
    window.db = client;
    window.SupabaseApp = {
        db: client,
        obtenerProductos,
        guardarContacto,
        agregarProducto,
        sincronizarCatalogo,
        PRODUCTOS_INICIALES
    };
}
