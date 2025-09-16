// Estado global de la aplicación
let currentPage = 1;
let currentSearch = '';
let currentRolFilter = '';
let currentItemsPerPage = 10;
let usuarios = [];
let usuarioSeleccionado = null;

// Elementos del DOM
const loadingUsers = document.getElementById('loadingUsers');
const usersTable = document.getElementById('usersTable');
const emptyState = document.getElementById('emptyState');
const usersTableBody = document.getElementById('usersTableBody');
const pagination = document.getElementById('pagination');
const totalUsuariosElement = document.getElementById('totalUsuarios');
const estadisticasRolesElement = document.getElementById('estadisticasRoles');

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    verificarAutenticacion();
    configurarEventListeners();
    cargarDatos();
});

// Verificar que el usuario esté autenticado y sea admin
function verificarAutenticacion() {
    const token = localStorage.getItem('token');
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    
    // Solo admin puede acceder a gestión de usuarios
    if (!token || usuario.rol !== 'admin') {
        mostrarModalAccesoDenegado();
        return;
    }
}

// Mostrar modal elegante de acceso denegado
function mostrarModalAccesoDenegado() {
    // Crear el modal dinámicamente
    const modalHTML = `
        <div class="modal fade" id="accessDeniedModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg">
                    <div class="modal-header bg-danger text-white border-0">
                        <h5 class="modal-title">
                            <i class="bi bi-shield-x me-2"></i>Acceso Denegado
                        </h5>
                    </div>
                    <div class="modal-body text-center py-4">
                        <div class="mb-3">
                            <i class="bi bi-exclamation-triangle text-warning" style="font-size: 4rem;"></i>
                        </div>
                        <h5 class="text-dark mb-3">Permisos Insuficientes</h5>
                        <p class="text-muted mb-4">
                            Solo los <strong>administradores</strong> pueden acceder a la gestión de usuarios.
                            <br>Tu rol actual no tiene los permisos necesarios.
                        </p>
                        <div class="alert alert-light border">
                            <small class="text-muted">
                                <i class="bi bi-info-circle me-1"></i>
                                Si crees que esto es un error, contacta con un administrador del sistema.
                            </small>
                        </div>
                    </div>
                    <div class="modal-footer border-0 justify-content-center">
                        <button type="button" class="btn btn-primary px-4" onclick="redirigirLogin()">
                            <i class="bi bi-box-arrow-in-right me-2"></i>Ir al Login
                        </button>
                        <button type="button" class="btn btn-outline-secondary px-4" onclick="volverInicio()">
                            <i class="bi bi-house me-2"></i>Ir al Inicio
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Agregar el modal al body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('accessDeniedModal'));
    modal.show();
}

// Funciones para los botones del modal
function redirigirLogin() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '../login.html';
}

function volverInicio() {
    window.location.href = 'admin.html';
}

// Configurar event listeners
function configurarEventListeners() {
    // Búsqueda en tiempo real
    document.getElementById('searchInput').addEventListener('input', debounce(buscarUsuarios, 300));
    
    // Filtros
    document.getElementById('rolFilter').addEventListener('change', buscarUsuarios);
    document.getElementById('itemsPerPage').addEventListener('change', function() {
        currentItemsPerPage = this.value;
        currentPage = 1;
        buscarUsuarios();
    });
}

// Debounce para la búsqueda
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function cargarDatos() {
    await Promise.all([
        cargarUsuarios(),
        cargarEstadisticas()
    ]);
}

async function cargarUsuarios() {
    try {
        mostrarLoading(true);
        
        const params = new URLSearchParams({
            page: currentPage,
            limit: currentItemsPerPage,
            search: currentSearch,
            rol: currentRolFilter
        });

        const response = await fetch(`${API_URL}/admin/usuarios?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            usuarios = data.data.usuarios;
            mostrarUsuarios(usuarios);
            mostrarPaginacion(data.data.pagination);
        } else {
            throw new Error(data.message);
        }

    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        mostrarError('Error al cargar la lista de usuarios');
    } finally {
        mostrarLoading(false);
    }
}

async function cargarEstadisticas() {
    try {
        const response = await fetch(`${API_URL}/admin/usuarios/estadisticas`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            mostrarEstadisticas(data.data);
        }

    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// Mostrar usuarios en la tabla
function mostrarUsuarios(usuarios) {
    if (usuarios.length === 0) {
        usersTable.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    usersTable.style.display = 'block';
    emptyState.style.display = 'none';

    usersTableBody.innerHTML = usuarios.map(usuario => `
        <tr>
            <td>${usuario.id}</td>
            <td>
                <strong>${usuario.usuario}</strong>
            </td>
            <td>${usuario.email}</td>
            <td>
                <span class="badge ${getRoleBadgeClass(usuario.rol)} badge-role">
                    ${getRoleDisplayName(usuario.rol)}
                </span>
            </td>
            <td>
                <span class="badge ${usuario.activo ? 'bg-success' : 'bg-danger'}">
                    ${usuario.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>${formatearFecha(usuario.created_at)}</td>
            <td>
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-sm btn-outline-primary" 
                            onclick="abrirModalCambioRol(${usuario.id})"
                            title="Cambiar rol">
                        <i class="bi bi-person-gear"></i>
                    </button>
                    <button type="button" class="btn btn-sm ${usuario.activo ? 'btn-outline-warning' : 'btn-outline-success'}" 
                            onclick="toggleActivarUsuario(${usuario.id})"
                            title="${usuario.activo ? 'Desactivar' : 'Activar'} usuario">
                        <i class="bi ${usuario.activo ? 'bi-person-slash' : 'bi-person-check'}"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function mostrarEstadisticas(stats) {
    totalUsuariosElement.textContent = stats.totalUsuarios;
    
    const roles = [
        { key: 'usuario', name: 'Usuarios', icon: 'bi-person', color: 'primary' },
        { key: 'mod', name: 'Moderadores', icon: 'bi-person-check', color: 'warning' },
        { key: 'admin', name: 'Administradores', icon: 'bi-person-gear', color: 'danger' }
    ];

    estadisticasRolesElement.innerHTML = roles.map(rol => `
        <div class="col-md-4">
            <div class="card border-${rol.color}">
                <div class="card-body text-center">
                    <i class="bi ${rol.icon} text-${rol.color}" style="font-size: 2rem;"></i>
                    <h5 class="card-title mt-2">${rol.name}</h5>
                    <h3 class="text-${rol.color}">${stats.porRol[rol.key] || 0}</h3>
                </div>
            </div>
        </div>
    `).join('');
}

// Mostrar paginación
function mostrarPaginacion(pagination) {
    if (pagination.totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';
    
    // Página anterior
    html += `
        <li class="page-item ${pagination.currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="cambiarPagina(${pagination.currentPage - 1})">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;

    // Páginas
    for (let i = 1; i <= pagination.totalPages; i++) {
        if (i === pagination.currentPage || 
            i === 1 || 
            i === pagination.totalPages || 
            (i >= pagination.currentPage - 1 && i <= pagination.currentPage + 1)) {
            
            html += `
                <li class="page-item ${i === pagination.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="cambiarPagina(${i})">${i}</a>
                </li>
            `;
        } else if ((i === pagination.currentPage - 2 && i > 2) || 
                   (i === pagination.currentPage + 2 && i < pagination.totalPages - 1)) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }

    // Página siguiente
    html += `
        <li class="page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="cambiarPagina(${pagination.currentPage + 1})">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;

    pagination.innerHTML = html;
}

// Funciones de utilidad
function getRoleBadgeClass(rol) {
    const classes = {
        'usuario': 'bg-primary',
        'mod': 'bg-warning',
        'admin': 'bg-danger'
    };
    return classes[rol] || 'bg-secondary';
}

function getRoleDisplayName(rol) {
    const names = {
        'usuario': 'Usuario',
        'mod': 'Moderador',
        'admin': 'Administrador'
    };
    return names[rol] || rol;
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function mostrarLoading(show) {
    loadingUsers.style.display = show ? 'block' : 'none';
    usersTable.style.display = show ? 'none' : 'block';
}

function mostrarError(mensaje) {
    mostrarToast(mensaje, 'error');
}

// Sistema de notificaciones toast elegante
function mostrarToast(mensaje, tipo = 'info', duracion = 4000) {
    // Crear contenedor de toasts si no existe
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }

    // Configuración de tipos de toast
    const tiposConfig = {
        'success': { bg: 'bg-success', icon: 'bi-check-circle', titulo: 'Éxito' },
        'error': { bg: 'bg-danger', icon: 'bi-exclamation-triangle', titulo: 'Error' },
        'warning': { bg: 'bg-warning', icon: 'bi-exclamation-circle', titulo: 'Advertencia' },
        'info': { bg: 'bg-info', icon: 'bi-info-circle', titulo: 'Información' }
    };

    const config = tiposConfig[tipo] || tiposConfig['info'];
    const toastId = 'toast_' + Date.now();

    // HTML del toast
    const toastHTML = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${config.bg} text-white">
                <i class="bi ${config.icon} me-2"></i>
                <strong class="me-auto">${config.titulo}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${mensaje}
            </div>
        </div>
    `;

    // Agregar toast al contenedor
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);

    // Mostrar toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { 
        delay: duracion,
        autohide: true 
    });
    
    toast.show();

    // Limpiar toast después de ocultarlo
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

// Funciones de acción
function buscarUsuarios() {
    currentSearch = document.getElementById('searchInput').value;
    currentRolFilter = document.getElementById('rolFilter').value;
    currentPage = 1;
    cargarUsuarios();
}

function cambiarPagina(page) {
    currentPage = page;
    cargarUsuarios();
}

function abrirModalCambioRol(usuarioId) {
    usuarioSeleccionado = usuarios.find(u => u.id === usuarioId);
    if (!usuarioSeleccionado) return;

    document.getElementById('modalUsuarioNombre').textContent = usuarioSeleccionado.usuario;
    document.getElementById('modalUsuarioEmail').textContent = usuarioSeleccionado.email;
    document.getElementById('nuevoRol').value = usuarioSeleccionado.rol;

    const modal = new bootstrap.Modal(document.getElementById('cambiarRolModal'));
    modal.show();
}

async function confirmarCambioRol() {
    if (!usuarioSeleccionado) return;

    const nuevoRol = document.getElementById('nuevoRol').value;
    
    if (nuevoRol === usuarioSeleccionado.rol) {
        mostrarToast('El rol seleccionado es el mismo que el actual.', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/usuarios/${usuarioSeleccionado.id}/rol`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rol: nuevoRol })
        });

        const data = await response.json();

        if (data.success) {
            mostrarToast('Rol actualizado exitosamente', 'success');
            bootstrap.Modal.getInstance(document.getElementById('cambiarRolModal')).hide();
            cargarDatos(); // Recargar datos
        } else {
            throw new Error(data.message);
        }

    } catch (error) {
        console.error('Error al cambiar rol:', error);
        mostrarError('Error al cambiar el rol del usuario');
    }
}

async function toggleActivarUsuario(usuarioId) {
    const usuario = usuarios.find(u => u.id === usuarioId);
    if (!usuario) return;

    const accion = usuario.activo ? 'desactivar' : 'activar';
    const claseBoton = usuario.activo ? 'btn-warning' : 'btn-success';
    
    mostrarModalConfirmacion(
        `${accion.charAt(0).toUpperCase() + accion.slice(1)} Usuario`,
        `¿Estás seguro de que quieres ${accion} a ${usuario.usuario}?`,
        usuario.activo ? 'El usuario no podrá acceder al sistema.' : 'El usuario podrá acceder al sistema nuevamente.',
        accion.charAt(0).toUpperCase() + accion.slice(1),
        claseBoton,
        async function() {
            await ejecutarToggleActivarUsuario(usuarioId);
        }
    );
}

async function ejecutarToggleActivarUsuario(usuarioId) {

    try {
        const response = await fetch(`${API_URL}/admin/usuarios/${usuarioId}/toggle-activo`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            mostrarToast(data.message, 'success');
            cargarDatos(); // Recargar datos
        } else {
            throw new Error(data.message);
        }

    } catch (error) {
        console.error('Error al cambiar estado del usuario:', error);
        mostrarError('Error al cambiar el estado del usuario');
    }
}

function logout() {
    mostrarModalConfirmacion(
        'Cerrar Sesión',
        '¿Estás seguro de que quieres cerrar sesión?',
        'Se perderán los datos no guardados.',
        'Cerrar Sesión',
        'btn-danger',
        function() {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            mostrarToast('Sesión cerrada exitosamente', 'info');
            setTimeout(() => {
                window.location.href = '../login.html';
            }, 1000);
        }
    );
}

// Modal de confirmación reutilizable
function mostrarModalConfirmacion(titulo, mensaje, detalle, textoBoton, claseBoton, callback) {
    const modalId = 'confirmModal_' + Date.now();
    const modalHTML = `
        <div class="modal fade" id="${modalId}" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg">
                    <div class="modal-header border-0">
                        <h5 class="modal-title">
                            <i class="bi bi-question-circle text-warning me-2"></i>${titulo}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <div class="mb-3">
                            <i class="bi bi-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
                        </div>
                        <h6 class="mb-3">${mensaje}</h6>
                        ${detalle ? `<p class="text-muted small">${detalle}</p>` : ''}
                    </div>
                    <div class="modal-footer border-0 justify-content-center">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                            Cancelar
                        </button>
                        <button type="button" class="btn ${claseBoton}" onclick="ejecutarConfirmacion('${modalId}')">
                            ${textoBoton}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Agregar modal al body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Guardar callback
    window[`callback_${modalId}`] = callback;
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
    
    // Limpiar cuando se cierre
    document.getElementById(modalId).addEventListener('hidden.bs.modal', function() {
        delete window[`callback_${modalId}`];
        this.remove();
    });
}

function ejecutarConfirmacion(modalId) {
    const callback = window[`callback_${modalId}`];
    if (callback) callback();
    bootstrap.Modal.getInstance(document.getElementById(modalId)).hide();
}