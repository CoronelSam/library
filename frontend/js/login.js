document.addEventListener('DOMContentLoaded', function() {

    if (authService.isAuthenticated()) {
        authService.redirectToRolePage();
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const campos = {
        usuario: document.getElementById('usuario'),
        clave: document.getElementById('clave')
    };

    if (loginForm) {
        loginForm.addEventListener('submit', manejarLogin);
    }

    async function manejarLogin(e) {
        e.preventDefault();

        if (!validarCampos()) {
            return;
        }

        const credenciales = {
            usuario: campos.usuario.value.trim(),
            clave: campos.clave.value
        };

        const botonSubmit = loginForm.querySelector('button[type="submit"]');
        const textoOriginal = botonSubmit.innerHTML;

        try {
            botonSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Iniciando sesión...';
            botonSubmit.disabled = true;

            const resultado = await authService.login(credenciales);

            if (resultado.success) {
                mostrarToast('¡Bienvenido! Redirigiendo...', 'success');
                
                setTimeout(() => {
                    authService.redirectToRolePage();
                }, 1000);

            } else {
                if (resultado.errors && Array.isArray(resultado.errors)) {
                    resultado.errors.forEach(error => {
                        mostrarToast(error.msg || error.message, 'error');
                    });
                } else {
                    mostrarToast(resultado.message || 'Error en el inicio de sesión', 'error');
                }

                campos.clave.value = '';
                campos.clave.focus();
            }

        } catch (error) {
            console.error('Error en login:', error);
            mostrarToast('Error de conexión. Intenta nuevamente.', 'error');

            campos.clave.value = '';
            campos.clave.focus();
            
        } finally {
            if (botonSubmit) {
                botonSubmit.innerHTML = textoOriginal;
                botonSubmit.disabled = false;
            }
        }
    }

    function validarCampos() {
        let valido = true;

        if (!campos.usuario.value.trim()) {
            mostrarError(campos.usuario, 'El usuario es requerido');
            valido = false;
        } else {
            limpiarError(campos.usuario);
        }

        if (!campos.clave.value) {
            mostrarError(campos.clave, 'La contraseña es requerida');
            valido = false;
        } else {
            limpiarError(campos.clave);
        }

        return valido;
    }

    function mostrarError(campo, mensaje) {
        campo.classList.add('is-invalid');
        
        let errorElement = campo.parentNode.querySelector('.invalid-feedback');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'invalid-feedback';
            campo.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = mensaje;
    }

    function limpiarError(campo) {
        campo.classList.remove('is-invalid');
        const errorElement = campo.parentNode.querySelector('.invalid-feedback');
        if (errorElement) {
            errorElement.remove();
        }
    }

    Object.values(campos).forEach(campo => {
        campo.addEventListener('input', function() {
            limpiarError(this);
        });
    });
});

function mostrarToast(mensaje, tipo = 'info', duracion = 4000) {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }

    const tiposConfig = {
        'success': { bg: 'bg-success', icon: 'bi-check-circle', titulo: 'Éxito' },
        'error': { bg: 'bg-danger', icon: 'bi-exclamation-triangle', titulo: 'Error' },
        'warning': { bg: 'bg-warning', icon: 'bi-exclamation-circle', titulo: 'Advertencia' },
        'info': { bg: 'bg-info', icon: 'bi-info-circle', titulo: 'Información' }
    };

    const config = tiposConfig[tipo] || tiposConfig['info'];
    const toastId = 'toast_' + Date.now();

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

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);

    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { 
        delay: duracion,
        autohide: true 
    });
    
    toast.show();

    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}