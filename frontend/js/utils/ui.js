class UIUtils {

    static mostrarNotificacion(tipo, mensaje, contenedor = 'message-area') {
        const messageArea = document.getElementById(contenedor);
        if (!messageArea) {
            console.warn(`Contenedor '${contenedor}' no encontrado`);
            return;
        }
        
        const alertClass = tipo === 'error' ? 'alert-danger' : 
                          tipo === 'warning' ? 'alert-warning' : 'alert-success';
        const icon = tipo === 'error' ? 'bi-exclamation-triangle-fill' : 
                    tipo === 'warning' ? 'bi-exclamation-circle-fill' : 'bi-check-circle-fill';
        
        messageArea.innerHTML = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                <i class="bi ${icon} me-2"></i>${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        // Scroll hacia el mensaje
        messageArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Auto-ocultar después de un tiempo
        if (tipo !== 'error') {
            setTimeout(() => {
                const alert = messageArea.querySelector('.alert');
                if (alert) {
                    alert.remove();
                }
            }, APP_CONSTANTS.UI_CONFIG.NOTIFICATION_DURATION);
        }
    }

    static limpiarNotificaciones(contenedor = 'message-area') {
        const messageArea = document.getElementById(contenedor);
        if (messageArea) {
            messageArea.innerHTML = '';
        }
    }

    static mostrarLoading(boton, textoLoading = 'Cargando...') {
        if (!boton) return;
        
        boton.dataset.originalText = boton.innerHTML;
        boton.disabled = true;
        boton.innerHTML = `<i class="spinner-border spinner-border-sm me-2"></i>${textoLoading}`;
    }

    static ocultarLoading(boton) {
        if (!boton) return;
        
        boton.disabled = false;
        boton.innerHTML = boton.dataset.originalText || boton.innerHTML;
    }

    static deshabilitarFormulario(formulario) {
        if (!formulario) return;
        
        const elementos = formulario.querySelectorAll('input, select, textarea, button');
        elementos.forEach(elemento => {
            elemento.disabled = true;
        });
    }

    // Habilitar formulario
    static habilitarFormulario(formulario) {
        if (!formulario) return;
        
        const elementos = formulario.querySelectorAll('input, select, textarea, button');
        elementos.forEach(elemento => {
            elemento.disabled = false;
        });
    }

    static limpiarFormulario(formulario) {
        if (!formulario) return;
        
        formulario.reset();
        
        const inputsEspeciales = formulario.querySelectorAll('[data-clear]');
        inputsEspeciales.forEach(input => {
            input.value = '';
        });
    }

    static debounce(func, delay = APP_CONSTANTS.UI_CONFIG.DEBOUNCE_DELAY) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    static async confirmarAccion(mensaje, titulo = '¿Estás seguro?') {
        return new Promise((resolve) => {
            const resultado = confirm(`${titulo}\n\n${mensaje}`);
            resolve(resultado);
        });
    }

    // Formatear fecha
    static formatearFecha(fecha, formato = 'dd/mm/yyyy') {
        if (!fecha) return '';
        
        const date = new Date(fecha);
        
        if (formato === 'dd/mm/yyyy') {
            return date.toLocaleDateString('es-ES');
        } else if (formato === 'relativa') {
            return this.fechaRelativa(date);
        }
        
        return date.toISOString();
    }

    // Fecha relativa (hace X tiempo)
    static fechaRelativa(fecha) {
        const ahora = new Date();
        const diferencia = ahora - fecha;
        
        const segundos = Math.floor(diferencia / 1000);
        const minutos = Math.floor(segundos / 60);
        const horas = Math.floor(minutos / 60);
        const dias = Math.floor(horas / 24);
        
        if (dias > 0) return `hace ${dias} día${dias > 1 ? 's' : ''}`;
        if (horas > 0) return `hace ${horas} hora${horas > 1 ? 's' : ''}`;
        if (minutos > 0) return `hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
        return 'hace un momento';
    }

    static truncarTexto(texto, longitud = 100) {
        if (!texto || texto.length <= longitud) return texto;
        return texto.substring(0, longitud) + '...';
    }

    static capitalizar(texto) {
        if (!texto) return '';
        return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
    }

    static validarElemento(id) {
        const elemento = document.getElementById(id);
        if (!elemento) {
            console.warn(`Elemento con ID '${id}' no encontrado`);
            return false;
        }
        return true;
    }

    // --- Toasts reutilizables ---
    static mostrarToast(mensaje, tipo = 'info', duracion = 4000) {
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        const tiposConfig = {
            success: { bg: 'bg-success', icon: 'bi-check-circle', titulo: 'Éxito' },
            error: { bg: 'bg-danger', icon: 'bi-exclamation-triangle', titulo: 'Error' },
            warning: { bg: 'bg-warning', icon: 'bi-exclamation-circle', titulo: 'Advertencia' },
            info: { bg: 'bg-info', icon: 'bi-info-circle', titulo: 'Información' }
        };
        const config = tiposConfig[tipo] || tiposConfig.info;
        const toastId = 'toast_' + Date.now();

        const toastHTML = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${config.bg} text-white">
                <i class="bi ${config.icon} me-2"></i>
                <strong class="me-auto">${config.titulo}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">${mensaje}</div>
        </div>`;

        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: duracion, autohide: true });
        toast.show();
        toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
    }

    // --- Mensajes flash entre páginas ---
    static setFlashMessage(key, { mensaje, tipo = 'info', duracion = 4000 }) {
        try {
            localStorage.setItem('flash_' + key, JSON.stringify({ mensaje, tipo, duracion, ts: Date.now() }));
        } catch (e) {
            console.warn('No se pudo almacenar flash message:', e);
        }
    }

    static consumeFlashMessage(key) {
        try {
            const raw = localStorage.getItem('flash_' + key);
            if (!raw) return null;
            localStorage.removeItem('flash_' + key);
            return JSON.parse(raw);
        } catch (e) {
            console.warn('No se pudo leer flash message:', e);
            return null;
        }
    }
}

// Exportar clase
window.UIUtils = UIUtils;