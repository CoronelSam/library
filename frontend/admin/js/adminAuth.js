document.addEventListener('DOMContentLoaded', function() {
    verificarAccesoAdmin();
    configurarNavegacion();
});

function verificarAccesoAdmin() {
    const token = localStorage.getItem('token');
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

    if (!token || !['admin', 'mod'].includes(usuario.rol)) {
        mostrarModalAccesoDenegado();
        return false;
    }
    
    return true;
}

function configurarNavegacion() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    
    const enlaceUsuarios = document.querySelector('a[href="gestion-usuarios.html"]');
    if (enlaceUsuarios && usuario.rol !== 'admin') {
        enlaceUsuarios.style.display = 'none';
    }
    
    mostrarInfoUsuario(usuario);
}


function mostrarInfoUsuario(usuario) {
    const rolBadge = document.getElementById('rolBadge');
    const nombreUsuario = document.getElementById('nombreUsuario');
    
    if (rolBadge) {
        const rolConfig = {
            'admin': { clase: 'bg-danger', texto: 'Administrador' },
            'mod': { clase: 'bg-warning text-dark', texto: 'Moderador' }
        };
        
        const config = rolConfig[usuario.rol] || { clase: 'bg-secondary', texto: usuario.rol };
        rolBadge.className = `badge ${config.clase}`;
        rolBadge.textContent = config.texto;
    }
    
    if (nombreUsuario) {
        nombreUsuario.textContent = usuario.usuario || 'Usuario';
    }
}

function mostrarModalAccesoDenegado() {
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
                            Solo los <strong>administradores</strong> y <strong>moderadores</strong> pueden acceder al panel de administración.
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
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('accessDeniedModal'));
    modal.show();
}

function redirigirLogin() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '../login.html';
}

function volverInicio() {
    window.location.href = '../index.html';
}

function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = '../login.html';
    }
}

function verificarPermisoAdmin() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    return usuario.rol === 'admin';
}

function verificarPermisoModerador() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    return ['admin', 'mod'].includes(usuario.rol);
}