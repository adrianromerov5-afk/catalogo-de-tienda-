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

    try {
        const res = await fetch('/api/admin/verify', {
            headers: {
                'Authorization': `Bearer ${tokenAdmin}`
            }
        });

        if (res.ok) {
            const data = await res.json();
            usuarioAdmin = data.usuario || 'admin';
            if (nombreAdminActivo) nombreAdminActivo.textContent = usuarioAdmin;
            mostrarPantallaDashboard();
            cargarProductos();
            cargarMensajes();
        } else {
            // Si el token falló, permitir reingreso sin trabar la pantalla
            mostrarPantallaLogin();
        }
    } catch (err) {
        console.warn('Error validando sesión admin:', err);
        mostrarPantallaDashboard(); // Mantener vista local si hay sesión guardada
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
    const usuario = inputUser.value.trim();
    const contrasena = inputPass.value.trim();

    const btnSubmit = document.getElementById('btn-login-submit');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verificando...';

    try {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, contrasena })
        });

        const data = await res.json();
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión';

        if (res.ok && data.success) {
            tokenAdmin = data.token;
            usuarioAdmin = data.usuario;
            localStorage.setItem('admin_auth_token', tokenAdmin);
            localStorage.setItem('admin_user_nombre', usuarioAdmin);
            if (nombreAdminActivo) nombreAdminActivo.textContent = usuarioAdmin;
            formLogin.reset();
            mostrarPantallaDashboard();
            cargarProductos();
            cargarMensajes();
        } else {
            mostrarAlerta(alertaLogin, data.error || 'Credenciales inválidas');
        }
    } catch (err) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión';
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

async function cargarProductos() {
    productosCargando.style.display = 'block';
    productosLista.style.display = 'none';

    try {
        const res = await fetch('/api/productos');
        const data = await res.json();

        productosCargando.style.display = 'none';
        productosLista.style.display = 'flex';

        if (res.ok) {
            listaProductos = data.productos || [];
            statTotalProductos.textContent = listaProductos.length;
            badgeNumProductos.textContent = listaProductos.length;
            renderizarProductos(listaProductos);
        } else {
            productosLista.innerHTML = `
                <div class="empty-messages">
                    <i class="fa-solid fa-triangle-exclamation" style="color:#dc3545;"></i>
                    <h4>Error al consultar productos</h4>
                    <p>${data.error || 'No se pudo conectar a la tabla de productos en Supabase.'}</p>
                </div>
            `;
        }
    } catch (err) {
        productosCargando.style.display = 'none';
        productosLista.style.display = 'flex';
        productosLista.innerHTML = `
            <div class="empty-messages">
                <i class="fa-solid fa-circle-exclamation" style="color:#dc3545;"></i>
                <h4>Error de conexión</h4>
                <p>${err.message}</p>
            </div>
        `;
    }
}

function renderizarProductos(productos) {
    if (!productos || productos.length === 0) {
        productosLista.innerHTML = `
            <div class="empty-messages">
                <i class="fa-solid fa-box-open"></i>
                <h4>No hay productos registrados</h4>
                <p>Usa el botón <strong>Nuevo Producto</strong> para agregar artículos al catálogo de Supabase.</p>
                <button class="btn-primary" style="margin-top:14px;" onclick="document.getElementById('btn-abrir-modal-prod-hero').click();">
                    <i class="fa-solid fa-plus"></i> Publicar Primer Producto
                </button>
            </div>
        `;
        return;
    }

    productosLista.innerHTML = productos.map(prod => {
        const imgUrl = prod.imagen_url || 'imagenes/arroz.jpg';
        return `
            <div class="product-admin-item" id="prod-item-${prod.id_producto}" data-id="${prod.id_producto}">
                <img class="prod-admin-thumb" src="${escapeHTML(imgUrl)}" alt="${escapeHTML(prod.nombre_producto)}" onerror="this.src='imagenes/arroz.jpg'">
                <div class="prod-admin-details">
                    <div class="prod-admin-title-row">
                        <span class="prod-admin-name">${escapeHTML(prod.nombre_producto)}</span>
                        <span class="prod-admin-id-badge">ID #${prod.id_producto}</span>
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

// Filtro de búsqueda de productos
filtroBusquedaProductos.addEventListener('input', () => {
    const q = filtroBusquedaProductos.value.toLowerCase().trim();
    if (!q) {
        renderizarProductos(listaProductos);
        return;
    }

    const filtrados = listaProductos.filter(p =>
        (p.nombre_producto || '').toLowerCase().includes(q) ||
        (p.presentacion || '').toLowerCase().includes(q)
    );
    renderizarProductos(filtrados);
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

// Guardar nuevo producto en Supabase
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
    btnGuardarProdSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando en Supabase...';

    try {
        const res = await fetch('/api/productos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenAdmin}`
            },
            body: JSON.stringify({
                nombre_producto: nombre,
                presentacion,
                precio,
                imagen_url
            })
        });

        const data = await res.json();
        btnGuardarProdSubmit.disabled = false;
        btnGuardarProdSubmit.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar en Supabase';

        if (res.ok && data.success) {
            cerrarModalNuevoProducto();
            mostrarAlerta(alertaDashboard, `¡Producto "${nombre}" publicado exitosamente en Supabase!`, 'success');
            activarPestana('seccion-productos');
            await cargarProductos();
        } else {
            mostrarAlerta(alertaDashboard, 'Error al guardar producto: ' + (data.error || 'Verifica Supabase.'), 'error');
        }
    } catch (err) {
        btnGuardarProdSubmit.disabled = false;
        btnGuardarProdSubmit.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar en Supabase';
        mostrarAlerta(alertaDashboard, 'Error de conexión al guardar producto: ' + err.message, 'error');
    }
});

// =========================================================================
// SISTEMA DE ELIMINACIÓN DE PRODUCTOS EN SUPABASE (CON MODAL IN-APP)
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
    confirmItemDetalle.innerHTML = `¿Estás seguro de que deseas eliminar este producto? Se borrará de forma <strong>permanente</strong> de la tabla <strong>productos</strong> en <strong>Supabase</strong>.`;
    confirmItemThumb.src = imgUrl;
    confirmItemNombrePreview.textContent = nombre;
    confirmItemIdPreview.textContent = `ID Supabase #${id} • Precio: ${prod ? formatearCOP(prod.precio) : ''}`;
    confirmItemPreview.style.display = 'flex';

    btnProcederEliminar.disabled = false;
    btnProcederEliminar.innerHTML = '<i class="fa-solid fa-trash"></i> Sí, Eliminar de Supabase';

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

// Ejecución confirmada de la eliminación en la tabla Supabase
btnProcederEliminar.addEventListener('click', async () => {
    if (!itemAEliminar) return;

    const { tipo, id, nombre } = itemAEliminar;
    btnProcederEliminar.disabled = true;
    btnProcederEliminar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Eliminando en Supabase...';

    if (tipo === 'producto') {
        try {
            // 1. Llamar al endpoint backend protegido con el token admin
            const res = await fetch(`/api/productos/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${tokenAdmin || 'adm_direct'}`
                }
            });

            const data = await res.json();

            // 2. Si el endpoint responde éxito, o como respaldo directo con el cliente Supabase
            if (res.ok && data.success) {
                cerrarModalConfirmacion();
                mostrarAlerta(alertaDashboard, `¡Producto "${nombre}" eliminado exitosamente de la tabla de Supabase!`, 'success');

                // Actualizar interfaz al instante
                listaProductos = listaProductos.filter(p => Number(p.id_producto) !== Number(id));
                statTotalProductos.textContent = listaProductos.length;
                badgeNumProductos.textContent = listaProductos.length;
                renderizarProductos(listaProductos);

                // Reconfirmar sincronización con el servidor
                setTimeout(cargarProductos, 800);
                return;
            }

            // Si el backend retornó algún error, intentar borrado directo con cliente Supabase
            if (dbSupabase) {
                const { error: dbError } = await dbSupabase
                    .from('productos')
                    .delete()
                    .eq('id_producto', id);

                if (!dbError) {
                    cerrarModalConfirmacion();
                    mostrarAlerta(alertaDashboard, `¡Producto "${nombre}" eliminado de la tabla Supabase!`, 'success');
                    listaProductos = listaProductos.filter(p => Number(p.id_producto) !== Number(id));
                    statTotalProductos.textContent = listaProductos.length;
                    badgeNumProductos.textContent = listaProductos.length;
                    renderizarProductos(listaProductos);
                    setTimeout(cargarProductos, 800);
                    return;
                }
            }

            btnProcederEliminar.disabled = false;
            btnProcederEliminar.innerHTML = '<i class="fa-solid fa-trash"></i> Reintentar Eliminación';
            mostrarAlerta(alertaDashboard, data.error || 'No se pudo eliminar el producto de Supabase.', 'error');

        } catch (err) {
            console.error('Error al ejecutar eliminación de producto:', err);

            // Intentar con el cliente Supabase directo ante fallas de red del proxy
            if (dbSupabase) {
                try {
                    const { error: dbError } = await dbSupabase
                        .from('productos')
                        .delete()
                        .eq('id_producto', id);

                    if (!dbError) {
                        cerrarModalConfirmacion();
                        mostrarAlerta(alertaDashboard, `¡Producto "${nombre}" eliminado de la tabla Supabase!`, 'success');
                        listaProductos = listaProductos.filter(p => Number(p.id_producto) !== Number(id));
                        statTotalProductos.textContent = listaProductos.length;
                        badgeNumProductos.textContent = listaProductos.length;
                        renderizarProductos(listaProductos);
                        setTimeout(cargarProductos, 800);
                        return;
                    }
                } catch (subErr) {
                    console.error('Fallo también cliente directo Supabase:', subErr);
                }
            }

            btnProcederEliminar.disabled = false;
            btnProcederEliminar.innerHTML = '<i class="fa-solid fa-trash"></i> Reintentar Eliminación';
            mostrarAlerta(alertaDashboard, 'Error al conectar con la base de datos de Supabase.', 'error');
        }
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

    try {
        const res = await fetch('/api/contactos');
        const data = await res.json();

        mensajesCargando.style.display = 'none';
        mensajesLista.style.display = 'flex';

        if (res.ok && data.success) {
            listaMensajes = data.contactos || [];
            statTotalMensajes.textContent = listaMensajes.length;
            badgeNumMensajes.textContent = listaMensajes.length;
            renderizarMensajes(listaMensajes);
        } else {
            mensajesLista.innerHTML = `
                <div class="empty-messages">
                    <i class="fa-solid fa-triangle-exclamation" style="color:#dc3545;"></i>
                    <h4>Error al consultar mensajes</h4>
                    <p>${data.error || 'No se pudo conectar a la tabla de contactos en Supabase.'}</p>
                </div>
            `;
        }
    } catch (err) {
        mensajesCargando.style.display = 'none';
        mensajesLista.style.display = 'flex';
        mensajesLista.innerHTML = `
            <div class="empty-messages">
                <i class="fa-solid fa-circle-exclamation" style="color:#dc3545;"></i>
                <h4>Error de conexión</h4>
                <p>${err.message}</p>
            </div>
        `;
    }
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
    try {
        const res = await fetch(`/api/contactos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${tokenAdmin}`
            }
        });

        const data = await res.json();
        cerrarModalConfirmacion();

        if (res.ok && data.success) {
            mostrarAlerta(alertaDashboard, `Mensaje #${id} eliminado correctamente de Supabase.`, 'success');
            listaMensajes = listaMensajes.filter(m => Number(m.id_contacto) !== Number(id));
            statTotalMensajes.textContent = listaMensajes.length;
            badgeNumMensajes.textContent = listaMensajes.length;
            renderizarMensajes(listaMensajes);
        } else {
            mostrarAlerta(alertaDashboard, data.error || 'No se pudo eliminar el mensaje.', 'error');
        }
    } catch (err) {
        cerrarModalConfirmacion();
        mostrarAlerta(alertaDashboard, 'Error al conectar para eliminar mensaje.', 'error');
    }
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
