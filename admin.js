// Lógica del Panel Administrador de Mensajes
let tokenAdmin = localStorage.getItem('admin_auth_token') || '';
let usuarioAdmin = localStorage.getItem('admin_user_nombre') || 'admin';
let listaMensajes = [];
let mensajeSeleccionado = null;

const seccionLogin = document.getElementById('seccion-login');
const seccionDashboard = document.getElementById('seccion-dashboard');
const formLogin = document.getElementById('form-admin-login');
const inputUser = document.getElementById('admin-user');
const inputPass = document.getElementById('admin-pass');
const alertaLogin = document.getElementById('login-alerta');
const alertaDashboard = document.getElementById('dashboard-alerta');

const statTotalMensajes = document.getElementById('stat-total-mensajes');
const nombreAdminActivo = document.getElementById('nombre-admin-activo');
const mensajesCargando = document.getElementById('mensajes-cargando');
const mensajesLista = document.getElementById('mensajes-lista');
const filtroBusqueda = document.getElementById('filtro-busqueda-mensajes');
const btnRecargar = document.getElementById('btn-recargar-mensajes');
const btnLogout = document.getElementById('btn-cerrar-sesion');

// Modal
const modalDetalle = document.getElementById('modal-detalle-mensaje');
const modalCuerpo = document.getElementById('modal-detalle-cuerpo');
const btnCerrarModal = document.getElementById('btn-cerrar-modal');
const btnCerrarModalAccion = document.getElementById('btn-cerrar-modal-accion');
const btnEliminarMensajeModal = document.getElementById('btn-eliminar-mensaje-modal');
const btnResponderEmail = document.getElementById('btn-responder-email');

function mostrarAlerta(elemento, mensaje, tipo = 'error') {
    elemento.textContent = mensaje;
    elemento.className = 'alert-box ' + (tipo === 'error' ? 'alert-error' : 'alert-success');
    elemento.style.display = 'block';
    setTimeout(() => {
        elemento.style.display = 'none';
    }, 4500);
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
            nombreAdminActivo.textContent = usuarioAdmin;
            mostrarPantallaDashboard();
            cargarMensajes();
        } else {
            cerrarSesionLocal();
        }
    } catch (err) {
        console.warn('Error validando token admin:', err);
        mostrarPantallaLogin();
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
            nombreAdminActivo.textContent = usuarioAdmin;
            formLogin.reset();
            mostrarPantallaDashboard();
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

// ================= CARGAR MENSAJES =================
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

// ================= RENDERIZAR MENSAJES =================
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

    // Asignar listeners a los elementos de la lista
    mensajesLista.querySelectorAll('.message-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const btnDelete = e.target.closest('[data-action="delete"]');
            const id = Number(item.getAttribute('data-id'));
            if (btnDelete) {
                e.stopPropagation();
                confirmarYEliminar(id);
                return;
            }
            abrirModalMensaje(id);
        });
    });
}

// ================= FILTRAR MENSAJES =================
filtroBusqueda.addEventListener('input', () => {
    const q = filtroBusqueda.value.toLowerCase().trim();
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

btnRecargar.addEventListener('click', () => {
    cargarMensajes();
    mostrarAlerta(alertaDashboard, 'Bandeja de mensajes actualizada.', 'success');
});

// ================= MODAL DETALLE =================
function abrirModalMensaje(id) {
    const msg = listaMensajes.find(m => m.id_contacto === id);
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

    // Enlace de responder por correo
    const mailtoSubject = encodeURIComponent(`Re: ${msg.asunto || 'Consulta en Supermarket Tame'}`);
    const mailtoBody = encodeURIComponent(`Hola ${msg.nombre_completo},\n\nGracias por comunicarte con Supermarket Tame.\nEn relación a tu mensaje:\n"${msg.mensaje}"\n\n`);
    btnResponderEmail.href = `mailto:${encodeURIComponent(msg.correo_electronico)}?subject=${mailtoSubject}&body=${mailtoBody}`;

    modalDetalle.style.display = 'flex';
}

function cerrarModal() {
    modalDetalle.style.display = 'none';
    mensajeSeleccionado = null;
}

btnCerrarModal.addEventListener('click', cerrarModal);
btnCerrarModalAccion.addEventListener('click', cerrarModal);
modalDetalle.addEventListener('click', (e) => {
    if (e.target === modalDetalle) cerrarModal();
});

// ================= ELIMINAR MENSAJE =================
btnEliminarMensajeModal.addEventListener('click', () => {
    if (mensajeSeleccionado) {
        const id = mensajeSeleccionado.id_contacto;
        cerrarModal();
        confirmarYEliminar(id);
    }
});

async function confirmarYEliminar(id) {
    if (!confirm(`¿Estás seguro de que deseas eliminar el mensaje #${id}? Esta acción no se puede deshacer.`)) {
        return;
    }

    try {
        const res = await fetch(`/api/contactos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${tokenAdmin}`
            }
        });

        const data = await res.json();
        if (res.ok && data.success) {
            mostrarAlerta(alertaDashboard, `Mensaje #${id} eliminado correctamente.`, 'success');
            listaMensajes = listaMensajes.filter(m => m.id_contacto !== id);
            statTotalMensajes.textContent = listaMensajes.length;
            renderizarMensajes(listaMensajes);
        } else {
            mostrarAlerta(alertaDashboard, data.error || 'No se pudo eliminar el mensaje.', 'error');
        }
    } catch (err) {
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

// Iniciar verificación
verificarSesion();
