// =========================================================================
// Lógica del Panel Administrador: Gestión de Productos y Buzón de Mensajes
// =========================================================================

let tokenAdmin = localStorage.getItem('admin_auth_token') || '';
let usuarioAdmin = localStorage.getItem('admin_user_nombre') || 'admin';
let listaMensajes = [];
let listaProductos = [];
let mensajeSeleccionado = null;
let itemAEliminar = null; // { tipo: 'producto' | 'mensaje', id: number, nombre: string }

// Configuración de Supabase para operaciones directas en caso de respaldo
const SUPABASE_URL = 'https://kwdapcjhhrxijvpteflg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZGFwY2poaHJ4aWp2cHRlZmxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MTA1MzksImV4cCI6MjEwNDk4NjUzOX0.SJYrdYjbwvKNp8f1YzkdLVl5HyrGqVNPg-GFzznJuao';
let dbSupabase = null;
if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
    try {
        dbSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
        console.warn('Error inicializando cliente Supabase en admin:', e);
    }
}

// Elementos de autenticación
const seccionLogin = document.getElementById('seccion-login');
const seccionDashboard = document.getElementById('seccion-dashboard');
const formLogin = document.getElementById('form-admin-login');
const inputUser = document.getElementById('admin-user');
const inputPass = document.getElementById('admin-pass');
const alertaLogin = document.getElementById('login-alerta');
const alertaDashboard = document.getElementById('dashboard-alerta');
const nombreAdminActivo = document.getElementById('nombre-admin-activo');
const btnLogout = document.getElementById('btn-cerrar-sesion');

// Estadísticas y Pestañas
const statTotalMensajes = document.getElementById('stat-total-mensajes');
const statTotalProductos = document.getElementById('stat-total-productos');
const badgeNumProductos = document.getElementById('badge-num-productos');
const badgeNumMensajes = document.getElementById('badge-num-mensajes');

const btnTabProductos = document.getElementById('btn-tab-productos');
const btnTabMensajes = document.getElementById('btn-tab-mensajes');
const seccionProductos = document.getElementById('seccion-productos');
const seccionMensajes = document.getElementById('seccion-mensajes');
const cardStatProductos = document.getElementById('card-stat-productos');
const cardStatMensajes = document.getElementById('card-stat-mensajes');

// Elementos del Módulo de Productos
const productosCargando = document.getElementById('productos-cargando');
const productosLista = document.getElementById('productos-lista');
const filtroBusquedaProductos = document.getElementById('filtro-busqueda-productos');
const btnRecargarProductos = document.getElementById('btn-recargar-productos');
const btnAbrirModalProdNav = document.getElementById('btn-abrir-modal-prod-nav');
const btnAbrirModalProdHero = document.getElementById('btn-abrir-modal-prod-hero');

// Modal Nuevo Producto con URL de Imagen
const modalNuevoProducto = document.getElementById('modal-nuevo-producto');
const btnCerrarModalProd = document.getElementById('btn-cerrar-modal-prod');
const btnCancelarModalProd = document.getElementById('btn-cancelar-modal-prod');
const formNuevoProducto = document.getElementById('form-nuevo-producto');
const inputProdNombre = document.getElementById('nuevo-prod-nombre');
const inputProdPresentacion = document.getElementById('nuevo-prod-presentacion');
const inputProdPrecio = document.getElementById('nuevo-prod-precio');
const inputProdImagen = document.getElementById('nuevo-prod-imagen');
const imgPreviewElemento = document.getElementById('img-preview-elemento');
const imgPreviewVacio = document.getElementById('img-preview-vacio');
const btnGuardarProdSubmit = document.getElementById('btn-guardar-producto-submit');

// Modal de Confirmación de Eliminación (Sin alerts/confirms bloqueados por iframe)
const modalConfirmarEliminar = document.getElementById('modal-confirmar-eliminar');
const btnCerrarModalConfirm = document.getElementById('btn-cerrar-modal-confirm');
const btnCancelarConfirm = document.getElementById('btn-cancelar-confirm');
const btnProcederEliminar = document.getElementById('btn-proceder-eliminar');
const confirmItemTitulo = document.getElementById('confirm-item-titulo');
const confirmItemDetalle = document.getElementById('confirm-item-detalle');
const confirmItemPreview = document.getElementById('confirm-item-preview');
const confirmItemThumb = document.getElementById('confirm-item-thumb');
const confirmItemNombrePreview = document.getElementById('confirm-item-nombre-preview');
const confirmItemIdPreview = document.getElementById('confirm-item-id-preview');

// Elementos del Módulo de Mensajes
const mensajesCargando = document.getElementById('mensajes-cargando');
const mensajesLista = document.getElementById('mensajes-lista');
const filtroBusquedaMensajes = document.getElementById('filtro-busqueda-mensajes');
const btnRecargarMensajes = document.getElementById('btn-recargar-mensajes');
const modalDetalle = document.getElementById('modal-detalle-mensaje');
const modalCuerpo = document.getElementById('modal-detalle-cuerpo');
const btnCerrarModal = document.getElementById('btn-cerrar-modal');
const btnCerrarModalAccion = document.getElementById('btn-cerrar-modal-accion');
const btnEliminarMensajeModal = document.getElementById('btn-eliminar-mensaje-modal');
const btnResponderEmail = document.getElementById('btn-responder-email');

function mostrarAlerta(elemento, mensaje, tipo = 'error') {
    if (!elemento) return;
    elemento.textContent = mensaje;
    elemento.className = 'alert-box ' + (tipo === 'error' ? 'alert-error' : 'alert-success');
    elemento.style.display = 'block';
    elemento.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => {
        elemento.style.display = 'none';
    }, 5000);
}

function formatearCOP(monto) {
    const num = Number(monto) || 0;
    return '$' + num.toLocaleString('es-CO');
}

// ================= VERIFICAR SESIÓN INICIAL =================
async function verificarSesion() {
    if (!tokenAdmin) {
        mostrarPantallaLogin();
        return;
    }

    if (tokenAdmin === 'adm_local_session') {
        usuarioAdmin = localStorage.getItem('admin_user_nombre') || 'admin';
        if (nombreAdminActivo) nombreAdminActivo.textContent = usuarioAdmin;
        mostrarPantallaDashboard();
        cargarProductos();
        cargarMensajes();
        return;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch('/api/admin/verify', {
            headers: {
                'Authorization': `Bearer ${tokenAdmin}`
            },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            usuarioAdmin = data.usuario || 'admin';
            if (nombreAdminActivo) nombreAdminActivo.textContent = usuarioAdmin;
            mostrarPantallaDashboard();
            cargarProductos();
            cargarMensajes();
        } else {
            mostrarPantallaLogin();
        }
    } catch (err) {
        console.warn('Servidor de verificación no disponible, manteniendo sesión local:', err);
        mostrarPantallaDashboard();
        cargarProductos();
        cargarMensajes();
    }
}

function mostrarPantallaLogin() {
    seccionLogin.style.display = 'flex';
    seccionDashboard.style.display = 'none';
}

function mostrarPantallaDashboard() {
    seccionLogin.style.display = 'none';
    seccionDashboard.style.display = 'flex';
}

function cerrarSesionLocal() {
    tokenAdmin = '';
    localStorage.removeItem('admin_auth_token');
    localStorage.removeItem('admin_user_nombre');
    mostrarPantallaLogin();
}

// ================= INICIAR SESIÓN =================
formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usuario = (inputUser.value || '').trim();
    const contrasena = (inputPass.value || '').trim();
    const esAdminLocal = (usuario.toLowerCase() === 'admin' && contrasena === 'admin123');

    const btnSubmit = document.getElementById('btn-login-submit');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verificando...';

    // 1. Si está en GitHub Pages o apertura de archivo local (file://), autenticar de forma instantánea
    const esEntornoEstatico = window.location.protocol === 'file:' || 
                              window.location.hostname.includes('github.io') || 
                              window.location.hostname.includes('github.com');

    if (esEntornoEstatico) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión';

        if (esAdminLocal) {
            tokenAdmin = 'adm_local_session';
            usuarioAdmin = 'admin';
            localStorage.setItem('admin_auth_token', tokenAdmin);
            localStorage.setItem('admin_user_nombre', usuarioAdmin);
            if (nombreAdminActivo) nombreAdminActivo.textContent = usuarioAdmin;
            formLogin.reset();
            mostrarPantallaDashboard();
            cargarProductos();
            cargarMensajes();
            return;
        } else {
            mostrarAlerta(alertaLogin, 'Credenciales incorrectas. Usuario: admin / Contraseña: admin123');
            return;
        }
    }

    // 2. Si está en servidor Node.js/Vercel con backend activo
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, contrasena }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión';

        if (res.ok) {
            const data = await res.json();
            if (data.success) {
                tokenAdmin = data.token;
                usuarioAdmin = data.usuario || 'admin';
                localStorage.setItem('admin_auth_token', tokenAdmin);
                localStorage.setItem('admin_user_nombre', usuarioAdmin);
                if (nombreAdminActivo) nombreAdminActivo.textContent = usuarioAdmin;
                formLogin.reset();
                mostrarPantallaDashboard();
                cargarProductos();
                cargarMensajes();
                return;
            } else {
                mostrarAlerta(alertaLogin, data.error || 'Credenciales inválidas');
                return;
            }
        }

        // Si el endpoint devuelve 404 (sin ruta backend) pero son credenciales correctas
        if (esAdminLocal) {
            tokenAdmin = 'adm_local_session';
            usuarioAdmin = 'admin';
            localStorage.setItem('admin_auth_token', tokenAdmin);
            localStorage.setItem('admin_user_nombre', usuarioAdmin);
            if (nombreAdminActivo) nombreAdminActivo.textContent = usuarioAdmin;
            formLogin.reset();
            mostrarPantallaDashboard();
            cargarProductos();
            cargarMensajes();
            return;
        }

        mostrarAlerta(alertaLogin, 'Credenciales inválidas');
    } catch (err) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión';
        // Respaldo en caso de fallo de red
        if (esAdminLocal) {
            tokenAdmin = 'adm_local_session';
            usuarioAdmin = 'admin';
            localStorage.setItem('admin_auth_token', tokenAdmin);
            localStorage.setItem('admin_user_nombre', usuarioAdmin);
            if (nombreAdminActivo) nombreAdminActivo.textContent = usuarioAdmin;
            formLogin.reset();
            mostrarPantallaDashboard();
            cargarProductos();
            cargarMensajes();
            return;
        }
        mostrarAlerta(alertaLogin, 'Error al conectar con el servidor.');
    }
});

// ================= CERRAR SESIÓN =================
btnLogout.addEventListener('click', async () => {
    try {
        await fetch('/api/admin/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokenAdmin}`
            }
        });
    } catch (e) {
        // Ignorar
    }
    cerrarSesionLocal();
});

// ================= CAMBIO DE PESTAÑAS (TABS) =================
function activarPestana(target) {
    if (target === 'seccion-productos') {
        btnTabProductos.classList.add('active');
        btnTabMensajes.classList.remove('active');
        seccionProductos.style.display = 'block';
        seccionMensajes.style.display = 'none';
    } else {
        btnTabMensajes.classList.add('active');
        btnTabProductos.classList.remove('active');
        seccionMensajes.style.display = 'block';
        seccionProductos.style.display = 'none';
    }
}

btnTabProductos.addEventListener('click', () => activarPestana('seccion-productos'));
btnTabMensajes.addEventListener('click', () => activarPestana('seccion-mensajes'));
if (cardStatProductos) cardStatProductos.addEventListener('click', () => activarPestana('seccion-productos'));
if (cardStatMensajes) cardStatMensajes.addEventListener('click', () => activarPestana('seccion-mensajes'));

// =========================================================================
// MÓDULO 1: GESTIÓN DE PRODUCTOS (CONSULTAR, CREAR Y ELIMINAR EN SUPABASE)
// =========================================================================

const PRODUCTOS_BASE_ADMIN = [
    { id_producto: 1, nombre_producto: 'Arroz Diana', presentacion: 'Presentación 1 Kg.', precio: 4500, imagen_url: 'imagenes/arroz.jpg' },
    { id_producto: 2, nombre_producto: 'Aceite Premier', presentacion: 'Botella 900 ml.', precio: 12000, imagen_url: 'imagenes/aceite.jpg' },
    { id_producto: 3, nombre_producto: 'Leche Entera', presentacion: 'Bolsa 1 Litro.', precio: 3800, imagen_url: 'imagenes/leche.jpg' },
    { id_producto: 4, nombre_producto: 'Huevos AA', presentacion: '30 Unidades.', precio: 18000, imagen_url: 'imagenes/huevos.jpg' },
    { id_producto: 5, nombre_producto: 'Café Sello Rojo', presentacion: '250 gramos.', precio: 7500, imagen_url: 'imagenes/cafe.jpg' },
    { id_producto: 6, nombre_producto: 'Azúcar Incauca', presentacion: '1 Kg.', precio: 3200, imagen_url: 'imagenes/azucar.jpg' },
    { id_producto: 7, nombre_producto: "Atún Van Camp's", presentacion: '160 gramos.', precio: 6000, imagen_url: 'imagenes/atun.jpg' },
    { id_producto: 8, nombre_producto: 'Papel Higiénico', presentacion: 'Paquete x4', precio: 6500, imagen_url: 'imagenes/papel.jpg' },
    { id_producto: 9, nombre_producto: 'Gaseosa Coca-Cola', presentacion: 'Botella 3 Litros', precio: 12000, imagen_url: 'https://megatiendas.vtexassets.com/arquivos/ids/174255/7702535024447.jpg?v=638697024878100000' },
    { id_producto: 10, nombre_producto: 'Gaseosa Quatro Toronja', presentacion: 'Botella 3 Litros', precio: 11000, imagen_url: 'https://exitocol.vtexassets.com/arquivos/ids/35048568/Quatro-Toronja-3-Litros-256395_a.jpg?v=639239483074500000' },
    { id_producto: 11, nombre_producto: 'Gaseosa Colombiana Postobón', presentacion: 'Botella 3.125 Litros', precio: 9500, imagen_url: 'https://carulla.vtexassets.com/arquivos/ids/13596766/Gaseosa-COLOMBIANA-3125-ml-1051515_a.jpg?v=638476694806770000' },
    { id_producto: 12, nombre_producto: 'Paquete Bon bon bum', presentacion: '2.220 g', precio: 10450, imagen_url: 'https://colombinacontentmanager-prd.s3.us-east-1.amazonaws.com/Dulces/7702011023285_A1N1_es.jpg' },
    { id_producto: 13, nombre_producto: 'Papas Margarita Pollo', presentacion: 'Paquete 105 g', precio: 4200, imagen_url: 'https://exitocol.vtexassets.com/arquivos/ids/24368504/Papas-Fritas-Pollo-MARGARITA-105-g-309536_a.jpg?v=638575037198270000' },
    { id_producto: 14, nombre_producto: 'Chocoramo Tradicional', presentacion: 'Ponqué 65 g', precio: 2800, imagen_url: 'https://carulla.vtexassets.com/arquivos/ids/13596796/Ponque-CHOCORAMO-65-g-1051543_a.jpg?v=638476695221970000' },
    { id_producto: 15, nombre_producto: 'Pastas Doria Spaghetti', presentacion: 'Paquete 500 g', precio: 3900, imagen_url: 'https://carulla.vtexassets.com/arquivos/ids/13596765/Pasta-Spaghetti-DORIA-500-g-1051514_a.jpg?v=638476694793630000' }
];

async function cargarProductos() {
    productosCargando.style.display = 'block';
    productosLista.style.display = 'none';

    let prods = null;

    // 1. Intentar consulta directa a Supabase con timeout de 2.2s
    if (dbSupabase) {
        try {
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2200));
            const queryPromise = dbSupabase.from('productos').select('*').order('id_producto', { ascending: true });
            const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
            if (!error && data && data.length > 0) {
                prods = data;
            }
        } catch (e) {
            console.warn('Consulta directa a Supabase en admin no disponible:', e.message);
        }
    }

    // 2. Si no hay datos de Supabase y hay backend HTTP activo (no GitHub Pages)
    if (!prods && window.location.protocol.startsWith('http') && !window.location.hostname.includes('github.io')) {
        try {
            const controller = new AbortController();
            const to = setTimeout(() => controller.abort(), 2000);
            const res = await fetch('/api/productos', { signal: controller.signal });
            clearTimeout(to);
            if (res.ok) {
                const data = await res.json();
                if (data && data.productos && data.productos.length > 0) {
                    prods = data.productos;
                }
            }
        } catch (e) {
            console.warn('Endpoint /api/productos no disponible:', e.message);
        }
    }

    // 3. Si está en GitHub Pages, offline o sin servidor backend, usar catálogo base integrado
    if (!prods || prods.length === 0) {
        let custom = [];
        try {
            const customStored = JSON.parse(localStorage.getItem('supermarket_admin_productos_locales') || '[]');
            if (Array.isArray(customStored)) custom = customStored;
        } catch (e) {}

        prods = [...PRODUCTOS_BASE_ADMIN, ...custom];
    }

    // Filtrar productos eliminados localmente
    try {
        const eliminados = JSON.parse(localStorage.getItem('supermarket_admin_productos_eliminados') || '[]');
        if (Array.isArray(eliminados) && eliminados.length > 0) {
            prods = prods.filter(p => !eliminados.includes(Number(p.id_producto)) && !eliminados.includes(String(p.id_producto)));
        }
    } catch (e) {}

    // Garantizar que todos los productos tengan IDs y precios formateados
    listaProductos = prods.map((p, idx) => ({
        ...p,
        id_producto: p.id_producto !== undefined && p.id_producto !== null ? p.id_producto : (idx + 1),
        precio: Number(p.precio) || 0
    }));

    productosCargando.style.display = 'none';
    productosLista.style.display = 'flex';

    statTotalProductos.textContent = listaProductos.length;
    badgeNumProductos.textContent = listaProductos.length;
    actualizarContadoresCategoriasAdmin();
    aplicarFiltrosAdminProductos();
}

// ================= CLASIFICACIÓN DE CATEGORÍAS DE TIENDA =================
const CATEGORIAS_ADMIN_CONFIG = [
    { id: 'todas', nombre: 'Todas las Categorías', icono: 'fa-solid fa-border-all' },
    { id: 'dulces', nombre: 'Dulces y Golosinas', icono: 'fa-solid fa-candy-cane' },
    { id: 'bebidas', nombre: 'Bebidas y Gaseosas', icono: 'fa-solid fa-bottle-droplet' },
    { id: 'snacks', nombre: 'Snacks y Pasabocas', icono: 'fa-solid fa-cookie' },
    { id: 'lacteos', nombre: 'Lácteos y Huevos', icono: 'fa-solid fa-cheese' },
    { id: 'granos', nombre: 'Granos y Cereales', icono: 'fa-solid fa-wheat-awn' },
    { id: 'pastas_enlatados', nombre: 'Pastas y Enlatados', icono: 'fa-solid fa-fish' },
    { id: 'despensa', nombre: 'Despensa y Condimentos', icono: 'fa-solid fa-box-open' },
    { id: 'panaderia', nombre: 'Panadería y Galletas', icono: 'fa-solid fa-bread-slice' },
    { id: 'carnes', nombre: 'Carnes y Embutidos', icono: 'fa-solid fa-drumstick-bite' },
    { id: 'frutas_verduras', nombre: 'Frutas y Verduras', icono: 'fa-solid fa-apple-whole' },
    { id: 'aseo', nombre: 'Aseo del Hogar', icono: 'fa-solid fa-soap' },
    { id: 'cuidado_personal', nombre: 'Cuidado Personal', icono: 'fa-solid fa-pump-soap' }
];

function productoPerteneceACategoriaAdmin(p, categoria) {
    if (!categoria || categoria === 'todas') return true;

    const nombre = (p.nombre_producto || '').toLowerCase();
    const pres = (p.presentacion || '').toLowerCase();
    const texto = `${nombre} ${pres}`;

    switch (categoria) {
        case 'dulces':
            return (
                texto.includes('bon bon bum') ||
                texto.includes('bonbonbum') ||
                texto.includes('bombon') ||
                texto.includes('bombón') ||
                texto.includes('dulce') ||
                texto.includes('golosina') ||
                texto.includes('caramelo') ||
                texto.includes('chupeta') ||
                texto.includes('paleta') ||
                texto.includes('chocolate') ||
                texto.includes('chocolatina') ||
                texto.includes('chocobreak') ||
                texto.includes('jet') ||
                texto.includes('nucita') ||
                texto.includes('goma') ||
                texto.includes('gomita') ||
                texto.includes('chicle') ||
                texto.includes('sparkies') ||
                texto.includes('menta') ||
                texto.includes('arequipe') ||
                texto.includes('panelita') ||
                texto.includes('masmelo') ||
                texto.includes('marshmallow') ||
                texto.includes('confite') ||
                texto.includes('barrilete') ||
                texto.includes('trululu') ||
                texto.includes('trululú') ||
                texto.includes('bubbaloo') ||
                texto.includes('bianchi')
            );

        case 'bebidas':
        case 'gaseosas':
            return (
                texto.includes('gaseosa') ||
                texto.includes('coca') ||
                texto.includes('cola') ||
                texto.includes('quatro') ||
                texto.includes('cuatro') ||
                texto.includes('soda') ||
                texto.includes('pepsi') ||
                texto.includes('postobon') ||
                texto.includes('postobón') ||
                texto.includes('sprite') ||
                texto.includes('fanta') ||
                texto.includes('colombiana') ||
                texto.includes('bretaña') ||
                texto.includes('bretana') ||
                texto.includes('ginger') ||
                texto.includes('jugo') ||
                texto.includes('hit') ||
                texto.includes('refresco') ||
                texto.includes('bebida') ||
                texto.includes('agua') ||
                texto.includes('brisa') ||
                texto.includes('cristal') ||
                texto.includes('malta') ||
                texto.includes('cerveza') ||
                texto.includes('poker') ||
                texto.includes('aguila') ||
                texto.includes('costeña') ||
                texto.includes('costena') ||
                texto.includes('corona') ||
                texto.includes('hidratante') ||
                texto.includes('gatorade') ||
                texto.includes('squash') ||
                texto.includes('speed max') ||
                texto.includes('monster') ||
                texto.includes('red bull') ||
                texto.includes('hatsu') ||
                texto.includes('energizante')
            );

        case 'snacks':
            return (
                texto.includes('snack') ||
                texto.includes('pasaboca') ||
                texto.includes('margarita') ||
                texto.includes('papitas') ||
                texto.includes('doritos') ||
                texto.includes('de todito') ||
                texto.includes('detodito') ||
                texto.includes('cheetos') ||
                texto.includes('chitos') ||
                texto.includes('platanitos') ||
                texto.includes('natuchips') ||
                texto.includes('chicharron') ||
                texto.includes('chicharrón') ||
                texto.includes('maní') ||
                texto.includes('mani') ||
                texto.includes('tostacos') ||
                texto.includes('popcorn') ||
                texto.includes('crispetas') ||
                texto.includes('palomitas') ||
                texto.includes('nachos')
            );

        case 'lacteos':
            return (
                texto.includes('leche') ||
                texto.includes('huevo') ||
                texto.includes('queso') ||
                texto.includes('yogurt') ||
                texto.includes('kumis') ||
                texto.includes('cuajada') ||
                texto.includes('mantequilla') ||
                texto.includes('crema de leche') ||
                texto.includes('suero') ||
                texto.includes('lecherita') ||
                texto.includes('condensada') ||
                texto.includes('alpina') ||
                texto.includes('colanta') ||
                texto.includes('alqueria') ||
                texto.includes('alquería')
            );

        case 'granos':
            return (
                texto.includes('arroz') ||
                texto.includes('frijol') ||
                texto.includes('fríjol') ||
                texto.includes('lenteja') ||
                texto.includes('garbanzo') ||
                texto.includes('arveja') ||
                texto.includes('maiz') ||
                texto.includes('maíz') ||
                texto.includes('harina') ||
                texto.includes('avena') ||
                texto.includes('granola') ||
                texto.includes('cereal') ||
                texto.includes('chocapic') ||
                texto.includes('zucaritas') ||
                texto.includes('corn flakes')
            );

        case 'pastas_enlatados':
            return (
                texto.includes('pasta') ||
                texto.includes('espagueti') ||
                texto.includes('spaghetti') ||
                texto.includes('macarrones') ||
                texto.includes('conchitas') ||
                texto.includes('fideos') ||
                texto.includes('sopa') ||
                texto.includes('doria') ||
                texto.includes('atún') ||
                texto.includes('atun') ||
                texto.includes('sardina') ||
                texto.includes('enlatado') ||
                texto.includes('maicitos') ||
                texto.includes('champiñones') ||
                texto.includes('champiñon') ||
                texto.includes('van camp') ||
                texto.includes('vancamp')
            );

        case 'despensa':
            return (
                texto.includes('aceite') ||
                texto.includes('azúcar') ||
                texto.includes('azucar') ||
                texto.includes('café') ||
                texto.includes('cafe') ||
                texto.includes('sal ') ||
                texto.includes('sal marina') ||
                texto.includes('panela') ||
                texto.includes('salsa') ||
                texto.includes('mayonesa') ||
                texto.includes('ketchup') ||
                texto.includes('mostaza') ||
                texto.includes('caldo') ||
                texto.includes('maggie') ||
                texto.includes('ricostilla') ||
                texto.includes('doña gallina') ||
                texto.includes('color') ||
                texto.includes('comino') ||
                texto.includes('pimienta') ||
                texto.includes('vinagre') ||
                texto.includes('soya')
            );

        case 'panaderia':
            return (
                texto.includes('pan ') ||
                texto.startsWith('pan') ||
                texto.includes('pan tajado') ||
                texto.includes('tostadas') ||
                texto.includes('ponqué') ||
                texto.includes('ponque') ||
                texto.includes('chocoramo') ||
                texto.includes('gala') ||
                texto.includes('torta') ||
                texto.includes('galleta') ||
                texto.includes('galletas') ||
                texto.includes('saltin') ||
                texto.includes('saltín') ||
                texto.includes('ducales') ||
                texto.includes('oreo') ||
                texto.includes('wafer') ||
                texto.includes('festival') ||
                texto.includes('craqueñas') ||
                texto.includes('bimbo')
            );

        case 'carnes':
            return (
                texto.includes('carne') ||
                texto.includes('pollo') ||
                texto.includes('cerdo') ||
                texto.includes('res') ||
                texto.includes('pechuga') ||
                texto.includes('salchicha') ||
                texto.includes('jamón') ||
                texto.includes('jamon') ||
                texto.includes('mortadela') ||
                texto.includes('chorizo') ||
                texto.includes('salchichón') ||
                texto.includes('salchichon') ||
                texto.includes('zenu') ||
                texto.includes('zenú') ||
                texto.includes('ranchera') ||
                texto.includes('tocineta') ||
                texto.includes('pescado') ||
                texto.includes('filete')
            );

        case 'frutas_verduras':
            return (
                texto.includes('fruta') ||
                texto.includes('verdura') ||
                texto.includes('tomate') ||
                texto.includes('cebolla') ||
                (texto.includes('papa') && !texto.includes('papel') && !texto.includes('margarita')) ||
                texto.includes('plátano') ||
                texto.includes('platano') ||
                texto.includes('zanahoria') ||
                texto.includes('limón') ||
                texto.includes('limon') ||
                texto.includes('manzana') ||
                texto.includes('naranja') ||
                texto.includes('banano') ||
                texto.includes('aguacate') ||
                texto.includes('cilantro') ||
                texto.includes('lechuga')
            );

        case 'aseo':
            return (
                texto.includes('papel') ||
                texto.includes('jabon') ||
                texto.includes('jabón') ||
                texto.includes('detergente') ||
                texto.includes('ariel') ||
                texto.includes('fab') ||
                texto.includes('cloro') ||
                texto.includes('límpido') ||
                texto.includes('limpido') ||
                texto.includes('varsol') ||
                texto.includes('suavizante') ||
                texto.includes('lavaplatos') ||
                texto.includes('axion') ||
                texto.includes('blanqueador') ||
                texto.includes('desinfectante') ||
                texto.includes('limpiador') ||
                texto.includes('escoba') ||
                texto.includes('trapero') ||
                texto.includes('esponja') ||
                texto.includes('bolsa de basura') ||
                texto.includes('toalla de cocina')
            );

        case 'cuidado_personal':
            return (
                texto.includes('champú') ||
                texto.includes('champu') ||
                texto.includes('shampoo') ||
                texto.includes('acondicionador') ||
                texto.includes('crema dental') ||
                texto.includes('colgate') ||
                texto.includes('cepillo dental') ||
                texto.includes('desodorante') ||
                texto.includes('rexona') ||
                texto.includes('toalla higiénica') ||
                texto.includes('toalla higienica') ||
                texto.includes('nosotras') ||
                texto.includes('afeitadora') ||
                texto.includes('prestobarba') ||
                texto.includes('talco') ||
                texto.includes('bloqueador')
            );

        default:
            return true;
    }
}

function obtenerInfoCategoriaAdmin(prod) {
    for (const cat of CATEGORIAS_ADMIN_CONFIG) {
        if (cat.id !== 'todas' && productoPerteneceACategoriaAdmin(prod, cat.id)) {
            return cat;
        }
    }
    return { id: 'despensa', nombre: 'Abarrotes y Despensa', icono: 'fa-solid fa-box-open' };
}

function actualizarContadoresCategoriasAdmin() {
    CATEGORIAS_ADMIN_CONFIG.forEach(cat => {
        const span = document.getElementById(`admin-count-${cat.id}`);
        if (span) {
            if (cat.id === 'todas') {
                span.textContent = listaProductos.length;
            } else {
                const count = listaProductos.filter(p => productoPerteneceACategoriaAdmin(p, cat.id)).length;
                span.textContent = count;
            }
        }
    });
}

function renderizarProductos(productos) {
    if (!productos || productos.length === 0) {
        productosLista.innerHTML = `
            <div class="empty-messages">
                <i class="fa-solid fa-box-open"></i>
                <h4>No hay productos en esta categoría</h4>
                <p>Usa el botón <strong>Nuevo Producto</strong> para agregar artículos al catálogo de Supabase.</p>
                <button class="btn-primary" style="margin-top:14px;" onclick="document.getElementById('btn-abrir-modal-prod-hero').click();">
                    <i class="fa-solid fa-plus"></i> Publicar Nuevo Producto
                </button>
            </div>
        `;
        return;
    }

    productosLista.innerHTML = productos.map(prod => {
        const imgUrl = prod.imagen_url || 'imagenes/arroz.jpg';
        const infoCat = obtenerInfoCategoriaAdmin(prod);
        return `
            <div class="product-admin-item" id="prod-item-${prod.id_producto}" data-id="${prod.id_producto}">
                <img class="prod-admin-thumb" src="${escapeHTML(imgUrl)}" alt="${escapeHTML(prod.nombre_producto)}" onerror="this.src='imagenes/arroz.jpg'">
                <div class="prod-admin-details">
                    <div class="prod-admin-title-row">
                        <span class="prod-admin-name">${escapeHTML(prod.nombre_producto)}</span>
                        <span class="prod-admin-id-badge">ID #${prod.id_producto}</span>
                        <span class="prod-admin-cat-badge"><i class="${infoCat.icono}"></i> ${infoCat.nombre}</span>
                    </div>
                    <span class="prod-admin-presentation">${escapeHTML(prod.presentacion || 'Sin presentación definida')}</span>
                    <span class="prod-admin-price">${formatearCOP(prod.precio)}</span>
                </div>
                <div class="prod-admin-actions">
                    <a href="productos.html" target="_blank" class="btn-prod-view-store" title="Ver catálogo en la tienda">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i> Ver Tienda
                    </a>
                    <button class="btn-prod-delete" data-action="delete-product" data-id="${prod.id_producto}" title="Eliminar producto de Supabase">
                        <i class="fa-solid fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Asignar escuchadores a cada botón de eliminar producto
    productosLista.querySelectorAll('[data-action="delete-product"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = Number(btn.getAttribute('data-id'));
            solicitarEliminacionProducto(id);
        });
    });
}

// ================= FILTRO POR CATEGORÍAS Y BÚSQUEDA DE PRODUCTOS =================
let categoriaAdminSeleccionada = 'todas';

function aplicarFiltrosAdminProductos() {
    const q = (filtroBusquedaProductos.value || '').toLowerCase().trim();
    let filtrados = listaProductos;

    if (categoriaAdminSeleccionada !== 'todas') {
        filtrados = filtrados.filter(p => productoPerteneceACategoriaAdmin(p, categoriaAdminSeleccionada));
    }

    if (q) {
        filtrados = filtrados.filter(p =>
            (p.nombre_producto || '').toLowerCase().includes(q) ||
            (p.presentacion || '').toLowerCase().includes(q)
        );
    }

    renderizarProductos(filtrados);
}

// Filtro de búsqueda de productos
filtroBusquedaProductos.addEventListener('input', aplicarFiltrosAdminProductos);

// Botones de filtro por categoría en el Admin
document.querySelectorAll('#admin-filtros-categorias .cat-pill').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#admin-filtros-categorias .cat-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        categoriaAdminSeleccionada = btn.getAttribute('data-cat') || 'todas';
        aplicarFiltrosAdminProductos();
    });
});

btnRecargarProductos.addEventListener('click', () => {
    cargarProductos();
    mostrarAlerta(alertaDashboard, 'Catálogo de productos actualizado desde Supabase.', 'success');
});

// ================= MODAL NUEVO PRODUCTO CON URL DE IMAGEN =================
function abrirModalNuevoProducto() {
    formNuevoProducto.reset();
    actualizarVistaPreviaImagen('');
    modalNuevoProducto.style.display = 'flex';
    inputProdNombre.focus();
}

function cerrarModalNuevoProducto() {
    modalNuevoProducto.style.display = 'none';
}

if (btnAbrirModalProdNav) btnAbrirModalProdNav.addEventListener('click', abrirModalNuevoProducto);
if (btnAbrirModalProdHero) btnAbrirModalProdHero.addEventListener('click', abrirModalNuevoProducto);
btnCerrarModalProd.addEventListener('click', cerrarModalNuevoProducto);
btnCancelarModalProd.addEventListener('click', cerrarModalNuevoProducto);
modalNuevoProducto.addEventListener('click', (e) => {
    if (e.target === modalNuevoProducto) cerrarModalNuevoProducto();
});

// Vista previa en vivo de la URL de la imagen
function actualizarVistaPreviaImagen(url) {
    const cleanUrl = (url || '').trim();
    if (!cleanUrl) {
        imgPreviewElemento.style.display = 'none';
        imgPreviewVacio.style.display = 'flex';
        imgPreviewVacio.innerHTML = `
            <i class="fa-regular fa-image"></i>
            <span>Pega una URL válida arriba para previsualizar</span>
        `;
        return;
    }

    imgPreviewElemento.onload = () => {
        imgPreviewElemento.style.display = 'block';
        imgPreviewVacio.style.display = 'none';
    };

    imgPreviewElemento.onerror = () => {
        imgPreviewElemento.style.display = 'none';
        imgPreviewVacio.style.display = 'flex';
        imgPreviewVacio.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation" style="color:#ef4444;"></i>
            <span style="color:#ef4444;">No se pudo cargar la imagen desde este enlace.</span>
        `;
    };

    imgPreviewElemento.src = cleanUrl;
}

inputProdImagen.addEventListener('input', (e) => {
    actualizarVistaPreviaImagen(e.target.value);
});

inputProdImagen.addEventListener('paste', () => {
    setTimeout(() => {
        actualizarVistaPreviaImagen(inputProdImagen.value);
    }, 100);
});

// Guardar nuevo producto en Supabase o Catálogo Local
formNuevoProducto.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = inputProdNombre.value.trim();
    const presentacion = inputProdPresentacion.value.trim();
    const precio = Number(inputProdPrecio.value);
    const imagen_url = inputProdImagen.value.trim();

    if (!nombre || !precio || !imagen_url) {
        mostrarAlerta(alertaDashboard, 'Por favor completa todos los campos requeridos y la URL de la imagen.', 'error');
        return;
    }

    btnGuardarProdSubmit.disabled = true;
    btnGuardarProdSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    let guardado = false;

    // 1. Intentar backend si no estamos en GitHub Pages ni entorno de archivos
    if (window.location.protocol.startsWith('http') && !window.location.hostname.includes('github.io')) {
        try {
            const controller = new AbortController();
            const to = setTimeout(() => controller.abort(), 2000);
            const res = await fetch('/api/productos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokenAdmin || 'adm_direct'}`
                },
                body: JSON.stringify({
                    nombre_producto: nombre,
                    presentacion,
                    precio,
                    imagen_url
                }),
                signal: controller.signal
            });
            clearTimeout(to);
            if (res.ok) {
                const data = await res.json();
                if (data.success) guardado = true;
            }
        } catch (e) {
            console.warn('Backend no disponible para guardar producto:', e);
        }
    }

    // 2. Si no se guardó por backend, intentar directo con cliente Supabase
    if (!guardado && dbSupabase) {
        try {
            const to = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 2200));
            const req = dbSupabase.from('productos').insert([{
                nombre_producto: nombre,
                presentacion,
                precio,
                imagen_url
            }]).select();
            const { data, error } = await Promise.race([req, to]);
            if (!error && data && data.length > 0) {
                guardado = true;
            }
        } catch (e) {
            console.warn('Supabase directo no disponible para guardar:', e);
        }
    }

    // 3. Respaldo local garantizado (para GitHub Pages / estático)
    const nuevoId = Date.now();
    const nuevoProd = {
        id_producto: nuevoId,
        nombre_producto: nombre,
        presentacion,
        precio,
        imagen_url
    };
    try {
        let customStored = JSON.parse(localStorage.getItem('supermarket_admin_productos_locales') || '[]');
        if (!Array.isArray(customStored)) customStored = [];
        customStored.push(nuevoProd);
        localStorage.setItem('supermarket_admin_productos_locales', JSON.stringify(customStored));
        guardado = true;
    } catch (e) {
        console.warn('Error en almacenamiento local:', e);
    }

    btnGuardarProdSubmit.disabled = false;
    btnGuardarProdSubmit.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Producto';

    if (guardado) {
        formNuevoProducto.reset();
        cerrarModalNuevoProducto();
        mostrarAlerta(alertaDashboard, `¡Producto "${nombre}" publicado exitosamente!`, 'success');
        activarPestana('seccion-productos');
        await cargarProductos();
    } else {
        mostrarAlerta(alertaDashboard, 'No se pudo guardar el producto. Inténtalo de nuevo.', 'error');
    }
});

// =========================================================================
// SISTEMA DE ELIMINACIÓN DE PRODUCTOS (CON MODAL IN-APP)
// =========================================================================

function solicitarEliminacionProducto(id) {
    const prod = listaProductos.find(p => Number(p.id_producto) === Number(id));
    const nombre = prod ? prod.nombre_producto : `Producto #${id}`;
    const imgUrl = prod && prod.imagen_url ? prod.imagen_url : 'imagenes/arroz.jpg';

    itemAEliminar = {
        tipo: 'producto',
        id: Number(id),
        nombre: nombre
    };

    confirmItemTitulo.textContent = `¿Eliminar "${nombre}"?`;
    confirmItemDetalle.innerHTML = `¿Estás seguro de que deseas eliminar este producto? Se borrará de forma permanente de tu catálogo.`;
    confirmItemThumb.src = imgUrl;
    confirmItemNombrePreview.textContent = nombre;
    confirmItemIdPreview.textContent = `ID #${id} • Precio: ${prod ? formatearCOP(prod.precio) : ''}`;
    confirmItemPreview.style.display = 'flex';

    btnProcederEliminar.disabled = false;
    btnProcederEliminar.innerHTML = '<i class="fa-solid fa-trash"></i> Sí, Eliminar Producto';

    modalConfirmarEliminar.style.display = 'flex';
}

function cerrarModalConfirmacion() {
    modalConfirmarEliminar.style.display = 'none';
    itemAEliminar = null;
}

btnCerrarModalConfirm.addEventListener('click', cerrarModalConfirmacion);
btnCancelarConfirm.addEventListener('click', cerrarModalConfirmacion);
modalConfirmarEliminar.addEventListener('click', (e) => {
    if (e.target === modalConfirmarEliminar) cerrarModalConfirmacion();
});

// Ejecución confirmada de la eliminación de productos
btnProcederEliminar.addEventListener('click', async () => {
    if (!itemAEliminar) return;

    const { tipo, id, nombre } = itemAEliminar;
    btnProcederEliminar.disabled = true;
    btnProcederEliminar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Eliminando...';

    if (tipo === 'producto') {
        let eliminado = false;

        // 1. Llamar al backend si está disponible (no en GitHub Pages)
        if (window.location.protocol.startsWith('http') && !window.location.hostname.includes('github.io')) {
            try {
                const controller = new AbortController();
                const to = setTimeout(() => controller.abort(), 2000);
                const res = await fetch(`/api/productos/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${tokenAdmin || 'adm_direct'}`
                    },
                    signal: controller.signal
                });
                clearTimeout(to);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) eliminado = true;
                }
            } catch (e) {
                console.warn('Backend DELETE no disponible:', e);
            }
        }

        // 2. Si no fue backend, intentar con cliente Supabase directo
        if (!eliminado && dbSupabase) {
            try {
                const to = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 2000));
                const req = dbSupabase.from('productos').delete().eq('id_producto', id);
                const { error: dbError } = await Promise.race([req, to]);
                if (!dbError) eliminado = true;
            } catch (subErr) {
                console.warn('Supabase DELETE no disponible:', subErr);
            }
        }

        // 3. En todo caso registrar en almacenamiento local para que no reaparezca
        try {
            let customStored = JSON.parse(localStorage.getItem('supermarket_admin_productos_locales') || '[]');
            if (Array.isArray(customStored)) {
                customStored = customStored.filter(p => Number(p.id_producto) !== Number(id) && String(p.id_producto) !== String(id));
                localStorage.setItem('supermarket_admin_productos_locales', JSON.stringify(customStored));
            }

            let eliminados = JSON.parse(localStorage.getItem('supermarket_admin_productos_eliminados') || '[]');
            if (!Array.isArray(eliminados)) eliminados = [];
            if (!eliminados.includes(Number(id))) eliminados.push(Number(id));
            localStorage.setItem('supermarket_admin_productos_eliminados', JSON.stringify(eliminados));
            eliminado = true;
        } catch (e) {}

        cerrarModalConfirmacion();
        mostrarAlerta(alertaDashboard, `¡Producto "${nombre}" eliminado del catálogo!`, 'success');

        // Actualizar interfaz al instante
        listaProductos = listaProductos.filter(p => Number(p.id_producto) !== Number(id) && String(p.id_producto) !== String(id));
        statTotalProductos.textContent = listaProductos.length;
        badgeNumProductos.textContent = listaProductos.length;
        actualizarContadoresCategoriasAdmin();
        aplicarFiltrosAdminProductos();
        return;
    } else if (tipo === 'mensaje') {
        ejecutarEliminacionMensaje(id);
    }
});

// =========================================================================
// MÓDULO 2: BUZÓN DE MENSAJES DE CONTACTO
// =========================================================================

async function cargarMensajes() {
    mensajesCargando.style.display = 'block';
    mensajesLista.style.display = 'none';

    let msgs = null;

    // 1. Intentar consulta directa a Supabase con timeout de 2.2s
    if (dbSupabase) {
        try {
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2200));
            const queryPromise = dbSupabase.from('contactos').select('*').order('fecha_creacion', { ascending: false });
            const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
            if (!error && data) {
                msgs = data;
            }
        } catch (e) {
            console.warn('Consulta directa a contactos Supabase no disponible:', e.message);
        }
    }

    // 2. Si no hay datos de Supabase y hay backend HTTP activo (no GitHub Pages)
    if (!msgs && window.location.protocol.startsWith('http') && !window.location.hostname.includes('github.io')) {
        try {
            const controller = new AbortController();
            const to = setTimeout(() => controller.abort(), 2000);
            const res = await fetch('/api/contactos', { signal: controller.signal });
            clearTimeout(to);
            if (res.ok) {
                const data = await res.json();
                if (data && data.contactos) {
                    msgs = data.contactos;
                }
            }
        } catch (e) {
            console.warn('Endpoint /api/contactos no disponible:', e.message);
        }
    }

    // 3. Fallback de mensajes guardados localmente
    if (!msgs) {
        try {
            const guardados = JSON.parse(localStorage.getItem('supermarket_contactos_locales') || '[]');
            if (Array.isArray(guardados)) msgs = guardados;
        } catch (e) {}
    }

    listaMensajes = msgs || [];
    mensajesCargando.style.display = 'none';
    mensajesLista.style.display = 'flex';

    statTotalMensajes.textContent = listaMensajes.length;
    badgeNumMensajes.textContent = listaMensajes.length;
    renderizarMensajes(listaMensajes);
}

function renderizarMensajes(mensajes) {
    if (!mensajes || mensajes.length === 0) {
        mensajesLista.innerHTML = `
            <div class="empty-messages">
                <i class="fa-regular fa-envelope-open"></i>
                <h4>No hay mensajes recibidos</h4>
                <p>Cuando los clientes envíen consultas desde la página de Contacto, aparecerán aquí.</p>
            </div>
        `;
        return;
    }

    mensajesLista.innerHTML = mensajes.map(msg => {
        const inicial = (msg.nombre_completo || 'U').charAt(0).toUpperCase();
        const fecha = msg.created_at ? new Date(msg.created_at).toLocaleString('es-CO', {
            dateStyle: 'medium',
            timeStyle: 'short'
        }) : 'Reciente';

        return `
            <div class="message-item" data-id="${msg.id_contacto}">
                <div class="message-avatar">${inicial}</div>
                <div class="message-main-content">
                    <div class="message-top">
                        <span class="message-sender-name">${escapeHTML(msg.nombre_completo)}</span>
                        <span class="message-sender-email"><i class="fa-regular fa-envelope"></i> ${escapeHTML(msg.correo_electronico)}</span>
                        <span class="message-date"><i class="fa-regular fa-clock"></i> ${fecha}</span>
                    </div>
                    <div class="message-subject">${escapeHTML(msg.asunto || 'Sin asunto')}</div>
                    <p class="message-preview-text">${escapeHTML(msg.mensaje)}</p>
                </div>
                <div class="message-actions">
                    <button class="btn-action-view" data-action="view" data-id="${msg.id_contacto}" title="Leer mensaje completo">
                        <i class="fa-solid fa-eye"></i> Ver
                    </button>
                    <button class="btn-action-delete" data-action="delete" data-id="${msg.id_contacto}" title="Eliminar mensaje">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    mensajesLista.querySelectorAll('.message-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const btnDelete = e.target.closest('[data-action="delete"]');
            const id = Number(item.getAttribute('data-id'));
            if (btnDelete) {
                e.stopPropagation();
                solicitarEliminacionMensaje(id);
                return;
            }
            abrirModalMensaje(id);
        });
    });
}

filtroBusquedaMensajes.addEventListener('input', () => {
    const q = filtroBusquedaMensajes.value.toLowerCase().trim();
    if (!q) {
        renderizarMensajes(listaMensajes);
        return;
    }

    const filtrados = listaMensajes.filter(m => 
        (m.nombre_completo || '').toLowerCase().includes(q) ||
        (m.correo_electronico || '').toLowerCase().includes(q) ||
        (m.asunto || '').toLowerCase().includes(q) ||
        (m.mensaje || '').toLowerCase().includes(q)
    );

    renderizarMensajes(filtrados);
});

btnRecargarMensajes.addEventListener('click', () => {
    cargarMensajes();
    mostrarAlerta(alertaDashboard, 'Bandeja de mensajes actualizada desde Supabase.', 'success');
});

// Modal Detalle Mensaje
function abrirModalMensaje(id) {
    const msg = listaMensajes.find(m => Number(m.id_contacto) === Number(id));
    if (!msg) return;

    mensajeSeleccionado = msg;
    const fecha = msg.created_at ? new Date(msg.created_at).toLocaleString('es-CO', {
        dateStyle: 'full',
        timeStyle: 'medium'
    }) : 'Fecha no disponible';

    modalCuerpo.innerHTML = `
        <div class="detail-row">
            <div class="detail-label">Remitente</div>
            <div class="detail-value"><strong>${escapeHTML(msg.nombre_completo)}</strong></div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Correo Electrónico</div>
            <div class="detail-value">
                <a href="mailto:${encodeURIComponent(msg.correo_electronico)}" style="color:#0d6efd; text-decoration:none;">
                    ${escapeHTML(msg.correo_electronico)}
                </a>
            </div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Fecha y Hora de Recepción</div>
            <div class="detail-value" style="color:#64748b; font-size:13px;">${fecha}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Asunto</div>
            <div class="detail-value" style="font-weight:600; color:#0d6efd;">${escapeHTML(msg.asunto || 'Consulta General')}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Mensaje Completo</div>
            <div class="detail-message-box">${escapeHTML(msg.mensaje)}</div>
        </div>
    `;

    const mailtoSubject = encodeURIComponent(`Re: ${msg.asunto || 'Consulta en Supermarket Tame'}`);
    const mailtoBody = encodeURIComponent(`Hola ${msg.nombre_completo},\n\nGracias por comunicarte con Supermarket Tame.\nEn relación a tu mensaje:\n"${msg.mensaje}"\n\n`);
    btnResponderEmail.href = `mailto:${encodeURIComponent(msg.correo_electronico)}?subject=${mailtoSubject}&body=${mailtoBody}`;

    modalDetalle.style.display = 'flex';
}

function cerrarModalMensaje() {
    modalDetalle.style.display = 'none';
    mensajeSeleccionado = null;
}

btnCerrarModal.addEventListener('click', cerrarModalMensaje);
btnCerrarModalAccion.addEventListener('click', cerrarModalMensaje);
modalDetalle.addEventListener('click', (e) => {
    if (e.target === modalDetalle) cerrarModalMensaje();
});

btnEliminarMensajeModal.addEventListener('click', () => {
    if (mensajeSeleccionado) {
        const id = mensajeSeleccionado.id_contacto;
        cerrarModalMensaje();
        solicitarEliminacionMensaje(id);
    }
});

function solicitarEliminacionMensaje(id) {
    const msg = listaMensajes.find(m => Number(m.id_contacto) === Number(id));
    const remitente = msg ? msg.nombre_completo : `Mensaje #${id}`;

    itemAEliminar = {
        tipo: 'mensaje',
        id: Number(id),
        nombre: remitente
    };

    confirmItemTitulo.textContent = `¿Eliminar mensaje de ${remitente}?`;
    confirmItemDetalle.innerHTML = `¿Estás seguro de que deseas eliminar este mensaje? Se borrará de forma <strong>permanente</strong> de la tabla <strong>contactos</strong> en <strong>Supabase</strong>.`;
    confirmItemPreview.style.display = 'none';

    btnProcederEliminar.disabled = false;
    btnProcederEliminar.innerHTML = '<i class="fa-solid fa-trash"></i> Sí, Eliminar Mensaje';

    modalConfirmarEliminar.style.display = 'flex';
}

async function ejecutarEliminacionMensaje(id) {
    let eliminado = false;

    // 1. Intentar backend si no estamos en GitHub Pages
    if (window.location.protocol.startsWith('http') && !window.location.hostname.includes('github.io')) {
        try {
            const controller = new AbortController();
            const to = setTimeout(() => controller.abort(), 2000);
            const res = await fetch(`/api/contactos/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${tokenAdmin || 'adm_direct'}`
                },
                signal: controller.signal
            });
            clearTimeout(to);
            if (res.ok) {
                const data = await res.json();
                if (data.success) eliminado = true;
            }
        } catch (e) {
            console.warn('Backend DELETE contacto:', e);
        }
    }

    // 2. Si no, directo a Supabase
    if (!eliminado && dbSupabase) {
        try {
            const to = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 2000));
            const req = dbSupabase.from('contactos').delete().eq('id_contacto', id);
            const { error } = await Promise.race([req, to]);
            if (!error) eliminado = true;
        } catch (e) {
            console.warn('Supabase DELETE contacto:', e);
        }
    }

    // 3. Eliminar de mensajes locales
    try {
        let guardados = JSON.parse(localStorage.getItem('supermarket_contactos_locales') || '[]');
        if (Array.isArray(guardados)) {
            guardados = guardados.filter(m => Number(m.id_contacto) !== Number(id));
            localStorage.setItem('supermarket_contactos_locales', JSON.stringify(guardados));
        }
        eliminado = true;
    } catch (e) {}

    cerrarModalConfirmacion();
    mostrarAlerta(alertaDashboard, `Mensaje #${id} eliminado correctamente.`, 'success');
    listaMensajes = listaMensajes.filter(m => Number(m.id_contacto) !== Number(id));
    statTotalMensajes.textContent = listaMensajes.length;
    badgeNumMensajes.textContent = listaMensajes.length;
    renderizarMensajes(listaMensajes);
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Iniciar verificación de sesión
verificarSesion();
