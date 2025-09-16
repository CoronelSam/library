// Manejo del formulario de registro
document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('registerForm');
    const campos = {
        usuario: document.getElementById('usuario'),
        email: document.getElementById('email'),
        clave: document.getElementById('clave'),
        confirmarClave: document.getElementById('confirmarClave')
    };
    
    const errores = {
        usuario: document.getElementById('errorUsuario'),
        email: document.getElementById('errorEmail'),
        clave: document.getElementById('errorClave'),
        confirmarClave: document.getElementById('errorConfirmarClave')
    };

    // Configurar validaciones en tiempo real
    configurarValidaciones();
    
    // Manejar envío del formulario
    formulario.addEventListener('submit', manejarEnvio);

    function configurarValidaciones() {
        // Validación de usuario
        campos.usuario.addEventListener('input', function() {
            validarUsuario(this.value);
        });

        // Validación de email
        campos.email.addEventListener('input', function() {
            validarEmail(this.value);
        });

        // Validación de contraseña
        campos.clave.addEventListener('input', function() {
            validarClave(this.value);
            if (campos.confirmarClave.value) {
                validarConfirmacionClave(campos.confirmarClave.value, this.value);
            }
        });

        // Validación de confirmación de contraseña
        campos.confirmarClave.addEventListener('input', function() {
            validarConfirmacionClave(this.value, campos.clave.value);
        });
    }

    function validarUsuario(usuario) {
        const regex = /^[a-zA-Z0-9]+$/;
        const valido = usuario.length >= 5 && regex.test(usuario);
        
        mostrarError('usuario', !valido);
        campos.usuario.classList.toggle('is-invalid', !valido);
        campos.usuario.classList.toggle('is-valid', valido);
        
        return valido;
    }

    function validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const valido = regex.test(email);
        
        mostrarError('email', !valido);
        campos.email.classList.toggle('is-invalid', !valido);
        campos.email.classList.toggle('is-valid', valido);
        
        return valido;
    }

    function validarClave(clave) {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        const valido = regex.test(clave);
        
        mostrarError('clave', !valido);
        campos.clave.classList.toggle('is-invalid', !valido);
        campos.clave.classList.toggle('is-valid', valido);
        
        return valido;
    }

    function validarConfirmacionClave(confirmacion, clave) {
        const valido = confirmacion === clave && clave.length > 0;
        
        mostrarError('confirmarClave', !valido);
        campos.confirmarClave.classList.toggle('is-invalid', !valido);
        campos.confirmarClave.classList.toggle('is-valid', valido);
        
        return valido;
    }

    function mostrarError(campo, mostrar) {
        if (errores[campo]) {
            errores[campo].style.display = mostrar ? 'block' : 'none';
        }
    }

    function validarFormularioCompleto() {
        const usuario = validarUsuario(campos.usuario.value);
        const email = validarEmail(campos.email.value);
        const clave = validarClave(campos.clave.value);
        const confirmacion = validarConfirmacionClave(campos.confirmarClave.value, campos.clave.value);
        
        return usuario && email && clave && confirmacion;
    }

    async function manejarEnvio(e) {
        e.preventDefault();
        
        // Validar formulario
        if (!validarFormularioCompleto()) {
            mostrarToast('Por favor corrige los errores en el formulario', 'error');
            return;
        }

        // Preparar datos
        const datosRegistro = {
            usuario: campos.usuario.value.trim(),
            email: campos.email.value.trim().toLowerCase(),
            clave: campos.clave.value
        };

        try {
            // Mostrar loading
            const botonSubmit = formulario.querySelector('button[type="submit"]');
            const textoOriginal = botonSubmit.innerHTML;
            botonSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Registrando...';
            botonSubmit.disabled = true;

            // Enviar solicitud al backend
            const response = await fetch(`${API_URL}/auth/registro`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosRegistro)
            });

            const data = await response.json();

            if (data.success) {
                mostrarToast('¡Registro exitoso! Redirigiendo al login...', 'success');
                
                // Limpiar formulario
                formulario.reset();
                limpiarValidaciones();
                
                // Redirigir después de 2 segundos
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                
            } else {
                // Manejar errores específicos
                if (data.errors && Array.isArray(data.errors)) {
                    data.errors.forEach(error => {
                        mostrarToast(error.msg || error.message, 'error');
                    });
                } else {
                    mostrarToast(data.message || 'Error en el registro', 'error');
                }
            }

        } catch (error) {
            console.error('Error en registro:', error);
            mostrarToast('Error de conexión. Intenta nuevamente.', 'error');
        } finally {
            // Restaurar botón
            const botonSubmit = formulario.querySelector('button[type="submit"]');
            botonSubmit.innerHTML = textoOriginal;
            botonSubmit.disabled = false;
        }
    }

    function limpiarValidaciones() {
        Object.values(campos).forEach(campo => {
            campo.classList.remove('is-valid', 'is-invalid');
        });
        
        Object.values(errores).forEach(error => {
            if (error) error.style.display = 'none';
        });
    }
});

// Sistema de notificaciones toast
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