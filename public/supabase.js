// Configuración del cliente Supabase
const SUPABASE_URL = 'https://kwdapcjhhrxijvpteflg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZGFwY2poaHJ4aWp2cHRlZmxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MTA1MzksImV4cCI6MjEwNDk4NjUzOX0.SJYrdYjbwvKNp8f1YzkdLVl5HyrGqVNPg-GFzznJuao';

// Catálogo inicial de referencia
export const PRODUCTOS_INICIALES = [
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
    },
    {
        nombre_producto: 'Gaseosa Coca-Cola',
        presentacion: 'Botella 3 Litros',
        precio: 12000,
        imagen_url: 'https://megatiendas.vtexassets.com/arquivos/ids/174255/7702535024447.jpg?v=638697024878100000'
    },
    {
        nombre_producto: 'Gaseosa Quatro Toronja',
        presentacion: 'Botella 3 Litros',
        precio: 11000,
        imagen_url: 'https://exitocol.vtexassets.com/arquivos/ids/35048568/Quatro-Toronja-3-Litros-256395_a.jpg?v=639239483074500000'
    },
    {
        nombre_producto: 'Gaseosa Colombiana Postobón',
        presentacion: 'Botella 3.125 Litros',
        precio: 9500,
        imagen_url: 'https://carulla.vtexassets.com/arquivos/ids/13596766/Gaseosa-COLOMBIANA-3125-ml-1051515_a.jpg?v=638476694806770000'
    },
    {
        nombre_producto: 'Paquete Bon bon bum',
        presentacion: '2.220 g',
        precio: 10450,
        imagen_url: 'https://colombinacontentmanager-prd.s3.us-east-1.amazonaws.com/Dulces/7702011023285_A1N1_es.jpg'
    },
    {
        nombre_producto: 'Papas Margarita Pollo',
        presentacion: 'Paquete 105 g',
        precio: 4200,
        imagen_url: 'https://exitocol.vtexassets.com/arquivos/ids/24368504/Papas-Fritas-Pollo-MARGARITA-105-g-309536_a.jpg?v=638575037198270000'
    },
    {
        nombre_producto: 'Chocoramo Tradicional',
        presentacion: 'Ponqué 65 g',
        precio: 2800,
        imagen_url: 'https://carulla.vtexassets.com/arquivos/ids/13596796/Ponque-CHOCORAMO-65-g-1051543_a.jpg?v=638476695221970000'
    },
    {
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

/**
 * Obtiene los productos desde la tabla 'productos' en Supabase.
 * Si la tabla aún no tiene registros o hay un fallo, se consulta la API de respaldo.
 */
export async function obtenerProductos() {
    try {
        if (client) {
            const { data, error } = await client
                .from('productos')
                .select('*')
                .order('id_producto', { ascending: true });

            if (!error && data && data.length > 0) {
                return { source: 'supabase', productos: data, error: null };
            }
        }

        // Si no hay datos en cliente o cliente no disponible, consultar endpoint local
        const response = await fetch('/api/productos');
        if (response.ok) {
            const resData = await response.json();
            return {
                source: resData.source || 'supabase',
                productos: resData.productos || PRODUCTOS_INICIALES,
                error: null
            };
        }
    } catch (err) {
        console.warn('Fallo al obtener de Supabase, usando catálogo local:', err);
    }

    return { source: 'local', productos: PRODUCTOS_INICIALES, error: null };
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

        // Intento a través del backend (/api/contacto)
        const res = await fetch('/api/contacto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        const result = await res.json();
        return result;
    } catch (err) {
        console.error('Error al guardar contacto:', err);
        return { success: false, error: err.message || 'Error de conexión' };
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
        const res = await fetch('/api/productos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(producto)
        });

        return await res.json();
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Sincroniza o puebla la tabla de productos con los productos base.
 */
export async function sincronizarCatalogo() {
    try {
        const res = await fetch('/api/seed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        return await res.json();
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
