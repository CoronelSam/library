// Servicio de autenticación
class AuthService {
    constructor() {
        this.token = localStorage.getItem('token');
        this.usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    }

    // Login de usuario
    async login(credenciales) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credenciales)
            });

            // Verificar si la respuesta es válida JSON
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                console.error('Error al parsear JSON:', jsonError);
                return {
                    success: false,
                    message: 'Error en la respuesta del servidor.'
                };
            }

            // Verificar si la petición fue exitosa
            if (response.ok && data.success) {
                // Guardar datos en localStorage
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('usuario', JSON.stringify(data.data.usuario));
                
                this.token = data.data.token;
                this.usuario = data.data.usuario;

                return {
                    success: true,
                    usuario: data.data.usuario,
                    message: data.message
                };
            } else {
                // Manejar errores del servidor (401, 400, etc.)
                return {
                    success: false,
                    message: data.message || 'Error en el inicio de sesión',
                    errors: data.errors
                };
            }

        } catch (error) {
            console.error('Error en login:', error);
            return {
                success: false,
                message: 'Error de conexión. Intenta nuevamente.'
            };
        }
    }

    // Registro de usuario
    async registro(datosUsuario) {
        try {
            const response = await fetch(`${API_URL}/auth/registro`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosUsuario)
            });

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                console.error('Error al parsear JSON:', jsonError);
                return {
                    success: false,
                    message: 'Error en la respuesta del servidor.'
                };
            }

            // Verificar si la petición fue exitosa
            if (response.ok && data.success) {
                // Si el registro incluye auto-login
                if (data.data && data.data.token) {
                    localStorage.setItem('token', data.data.token);
                    localStorage.setItem('usuario', JSON.stringify(data.data.usuario));
                    
                    this.token = data.data.token;
                    this.usuario = data.data.usuario;
                }
            }

            return data;

        } catch (error) {
            console.error('Error en registro:', error);
            return {
                success: false,
                message: 'Error de conexión. Intenta nuevamente.'
            };
        }
    }

    // Verificar token
    async verificarToken() {
        if (!this.token) return false;

        try {
            const response = await fetch(`${API_URL}/auth/verificar`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (data.success) {
                this.usuario = data.data.usuario;
                localStorage.setItem('usuario', JSON.stringify(this.usuario));
                return true;
            } else {
                this.logout();
                return false;
            }

        } catch (error) {
            console.error('Error verificando token:', error);
            this.logout();
            return false;
        }
    }

    // Cerrar sesión
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        this.token = null;
        this.usuario = {};
        
        // Redirigir a la página de login
        // Verificar si estamos en una subcarpeta (user/ o admin/)
        const currentPath = window.location.pathname;
        if (currentPath.includes('/user/') || currentPath.includes('/admin/')) {
            window.location.href = '../login.html';
        } else {
            window.location.href = 'login.html';
        }
    }

    // Verificar si está autenticado
    isAuthenticated() {
        return !!this.token && Object.keys(this.usuario).length > 0;
    }

    // Obtener usuario actual
    getCurrentUser() {
        return this.usuario;
    }

    // Obtener token
    getToken() {
        return this.token;
    }

    // Obtener rol del usuario actual
    getUserRole() {
        return this.usuario.rol || null;
    }

    // Verificar rol específico
    hasRole(rol) {
        return this.usuario.rol === rol;
    }

    // Verificar múltiples roles
    hasAnyRole(roles) {
        return roles.includes(this.usuario.rol);
    }

    // Redireccionar según el rol del usuario
    redirectToRolePage() {
        const usuario = this.getCurrentUser();
        
        if (!usuario || !usuario.rol) {
            window.location.href = 'login.html';
            return;
        }

        switch (usuario.rol) {
            case 'usuario':
                window.location.href = 'user/dashboard.html';
                break;
            case 'mod':
            case 'admin':
                window.location.href = 'admin/admin.html';
                break;
            default:
                window.location.href = 'index.html';
                break;
        }
    }

    // Verificar acceso a página según rol
    verifyPageAccess(requiredRoles = []) {
        if (!this.isAuthenticated()) {
            window.location.href = '../login.html';
            return false;
        }

        if (requiredRoles.length > 0 && !this.hasAnyRole(requiredRoles)) {
            this.showAccessDenied();
            return false;
        }

        return true;
    }

    // Mostrar modal de acceso denegado
    showAccessDenied() {
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
                            <p class="text-muted mb-4">No tienes los permisos necesarios para acceder a esta página.</p>
                        </div>
                        <div class="modal-footer border-0 justify-content-center">
                            <button type="button" class="btn btn-primary px-4" onclick="authService.redirectToRolePage()">
                                <i class="bi bi-house me-2"></i>Ir a mi Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('accessDeniedModal'));
        modal.show();
    }

    // Obtener perfil actualizado desde backend
    async getPerfil() {
        if (!this.token) return { success: false, message: 'No autenticado' };
        try {
            const resp = await fetch(`${API_URL}/auth/perfil`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await resp.json();
            if (resp.ok && data.success) {
                this.usuario = data.data;
                localStorage.setItem('usuario', JSON.stringify(this.usuario));
            }
            return data;
        } catch (e) {
            console.error('Error obteniendo perfil:', e);
            return { success: false, message: 'Error de red' };
        }
    }

    // Actualizar perfil (usuario/email/clave)
    async actualizarPerfil(payload) {
        if (!this.token) return { success: false, message: 'No autenticado' };
        try {
            const resp = await fetch(`${API_URL}/auth/perfil`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await resp.json();
            if (resp.ok && data.success) {
                if (data.data && data.data.usuario) {
                    this.usuario = data.data.usuario;
                    localStorage.setItem('usuario', JSON.stringify(this.usuario));
                }
            }
            return data;
        } catch (e) {
            console.error('Error actualizando perfil:', e);
            return { success: false, message: 'Error de red' };
        }
    }
}

// Crear instancia global
const authService = new AuthService();

// Exportar para uso global
window.authService = authService;