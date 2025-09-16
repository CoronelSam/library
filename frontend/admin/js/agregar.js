class AgregarLibroPage {
    constructor() {
        this.formulario = null;
        this.generoInput = null;
        this.generoSelect = null;
        this.suggestionsList = null; // contenedor de sugerencias
        this.autocompleteInstance = null; // instancia del util
    }

    init() {
        this.validarDependencias();
        this.obtenerElementos();
        this.prefillTituloDesdeQuery();
        this.inicializarFormulario();
        this.inicializarAutocompletadoCompartido();
        // Log inicial (único) para diagnosticar carga de la página (mantener si se desea monitoreo básico)
        console.log('📚 [AgregarLibro] Página inicializada');
    }

    validarDependencias() {
        const dependencias = ['API_CONFIG', 'APP_CONSTANTS', 'LibroService', 'Validation', 'UIUtils'];
        const faltantes = dependencias.filter(dep => !window[dep]);
        
        if (faltantes.length > 0) {
            console.error('Dependencias faltantes:', faltantes);
            UIUtils.mostrarNotificacion('error', 'Error al cargar el sistema. Recarga la página.');
            return false;
        }
        
        return true;
    }

    obtenerElementos() {
        this.formulario = document.getElementById('libro-form');
        this.generoInput = document.getElementById('genero-input');
        this.generoSelect = document.getElementById('genero');
        this.suggestionsList = document.getElementById('genre-suggestions');
    }

    inicializarFormulario() {
        if (!this.formulario) {
            console.error('Formulario no encontrado');
            return;
        }

        this.formulario.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.enviarFormulario();
        });
    }

    recopilarDatos() {
        return {
            titulo: document.getElementById('titulo')?.value || '',
            autor: document.getElementById('autor')?.value || '',
            genero: this.obtenerGenero(),
            editorial: document.getElementById('editorial')?.value || '',
            año_publicacion: document.getElementById('año_publicacion')?.value || '',
            descripcion: document.getElementById('descripcion')?.value || ''
        };
    }

    obtenerGenero() {
        if (this.generoInput?.value.trim()) {
            return this.generoInput.value.trim();
        } else if (this.generoSelect?.value && this.generoSelect.selectedIndex > 0) {
            return this.generoSelect.value;
        }
        return '';
    }

    async enviarFormulario() {
        const guardarBtn = document.getElementById('guardar-btn');
        
        try {
            UIUtils.mostrarLoading(guardarBtn, 'Guardando...');
            UIUtils.limpiarNotificaciones();

            const datosOriginales = this.recopilarDatos();
            // Normalizar año: eliminar espacios y validar número
            if (datosOriginales.año_publicacion) {
                const raw = datosOriginales.año_publicacion.toString().trim();
                if (/^\d{1,4}$/.test(raw)) {
                    datosOriginales.año_publicacion = raw; // mantener string numérica para logging
                } else {
                    console.warn('[AgregarLibro] Año inválido, se ignorará:', raw);
                    datosOriginales.año_publicacion = '';
                }
            }
            const datosLimpios = Validation.limpiarDatos(datosOriginales);

            const validacion = Validation.validarLibro(datosLimpios);
            if (!validacion.valido) {
                throw new Error(validacion.errores.join(', '));
            }

            const portadaFile = document.getElementById('portada')?.files[0];
            const archivoFile = document.getElementById('archivo')?.files[0];

            let datosParaEnviar;
            
            if (portadaFile || archivoFile) {
                // Crear FormData para archivos
                datosParaEnviar = new FormData();
                
                // Agregar datos del libro
                datosParaEnviar.append('titulo', datosLimpios.titulo);
                datosParaEnviar.append('autor', datosLimpios.autor);
                datosParaEnviar.append('genero', datosLimpios.genero);
                
                if (datosLimpios.editorial) {
                    datosParaEnviar.append('editorial', datosLimpios.editorial);
                }
                
                if (datosLimpios.año_publicacion && datosLimpios.año_publicacion.trim() !== '') {
                    const añoNum = parseInt(datosLimpios.año_publicacion, 10);
                    if (!isNaN(añoNum)) {
                        datosParaEnviar.append('año_publicacion', añoNum.toString());
                        // Alias sin tilde para compatibilidad potencial
                        datosParaEnviar.append('anio_publicacion', añoNum.toString());
                    }
                }
                
                if (datosLimpios.descripcion) {
                    datosParaEnviar.append('descripcion', datosLimpios.descripcion);
                }

                // Agregar archivos si existen
                if (portadaFile) {
                    datosParaEnviar.append('portada', portadaFile);
                }
                
                if (archivoFile) {
                    datosParaEnviar.append('archivo', archivoFile);
                }
            } else {
                // Sin archivos, usar JSON normal
                datosParaEnviar = {
                    titulo: datosLimpios.titulo,
                    autor: datosLimpios.autor,
                    genero: datosLimpios.genero,
                    editorial: datosLimpios.editorial || null,
                    año_publicacion: datosLimpios.año_publicacion ? parseInt(datosLimpios.año_publicacion, 10) : null,
                    descripcion: datosLimpios.descripcion || null
                };
            }

            const resultado = await LibroService.crear(datosParaEnviar);

            // Mostrar solo toast (se elimina la alerta clásica)
            UIUtils.mostrarToast(`Libro "${datosLimpios.titulo}" guardado correctamente`, 'success');

            this.limpiarFormulario();

            // Refuerzo asíncrono (por si el navegador reinyecta autofill)
            requestAnimationFrame(() => {
                this.reforzarLimpieza();
            });

            setTimeout(async () => {
                // Refuerzo justo antes del confirm
                this.reforzarLimpieza();
                const continuar = await UIUtils.confirmarAccion(
                    '¿Deseas agregar otro libro?',
                    'Libro guardado exitosamente'
                );
                
                if (!continuar) {
                    UIUtils.setFlashMessage('libro_creado', { 
                        mensaje: `El libro "${datosLimpios.titulo}" se agregó correctamente`,
                        tipo: 'success',
                        duracion: 5000
                    });
                    window.location.href = 'admin.html';
                }
            }, 2000);

        } catch (error) {
            console.error('Error al enviar formulario:', error);
            UIUtils.mostrarNotificacion('error', `❌ Error: ${error.message}`);
        } finally {
            UIUtils.ocultarLoading(guardarBtn);
        }
    }

    // Limpiar formulario
    limpiarFormulario() {
        // Limpiar formulario básico
        UIUtils.limpiarFormulario(this.formulario);
        
        // Limpiar campos específicos
        if (this.generoInput) {
            this.generoInput.value = '';
        }
        
        // Resetear select de género al estado inicial
        if (this.generoSelect) {
            this.generoSelect.selectedIndex = 0;
        }
        
        // Ocultar sugerencias de género
        if (this.suggestionsList) {
            this.suggestionsList.style.display = 'none';
            this.suggestionsList.innerHTML = '';
        }
        
        // Limpiar campos de archivo específicamente
        const portadaInput = document.getElementById('portada');
        const archivoInput = document.getElementById('archivo');
        
        if (portadaInput) {
            portadaInput.value = '';
            if (portadaInput.files && portadaInput.files.length) {
                // Crear un input temporal para reset duro si el navegador mantiene referencia
                const clone = portadaInput.cloneNode(true);
                portadaInput.parentNode.replaceChild(clone, portadaInput);
            }
        }
        
        if (archivoInput) {
            archivoInput.value = '';
            if (archivoInput.files && archivoInput.files.length) {
                const clone = archivoInput.cloneNode(true);
                archivoInput.parentNode.replaceChild(clone, archivoInput);
            }
        }
        
        // Limpiar notificaciones
        // No limpiar notificaciones aquí para que el mensaje de éxito permanezca visible
    }

    // Refuerzo de limpieza profundo
    reforzarLimpieza() {
        try {
            if (!this.formulario) return;
            const textos = this.formulario.querySelectorAll('input[type="text"], input[type="number"], textarea');
            textos.forEach(i => {
                if (i.value !== '') {
                    i.value = '';
                }
            });
            const portadaInput = document.getElementById('portada');
            const archivoInput = document.getElementById('archivo');
            [portadaInput, archivoInput].forEach(inp => {
                if (inp) {
                    const nuevo = inp.cloneNode(true);
                    inp.parentNode.replaceChild(nuevo, inp);
                }
            });
            if (this.generoSelect) this.generoSelect.selectedIndex = 0;
            if (this.generoInput) this.generoInput.value = '';
            // Refuerzo de limpieza silencioso (log eliminado para producción)
        } catch (e) {
            console.warn('[AgregarLibro] Error en refuerzo de limpieza:', e);
        }
    }

    // Nueva inicialización usando util compartido
    inicializarAutocompletadoCompartido() {
        if (!window.GeneroAutocomplete) {
            console.warn('[AgregarLibro] GeneroAutocomplete util no cargado');
            return;
        }
        if (!this.generoInput || !this.suggestionsList) return;
        this.autocompleteInstance = window.GeneroAutocomplete.setup({
            input: this.generoInput,
            select: this.generoSelect,
            suggestionsContainer: this.suggestionsList
        });
    }

    // Prefill del título cuando se llega desde la búsqueda en editar (query param ?titulo=)
    prefillTituloDesdeQuery() {
        try {
            const params = new URLSearchParams(window.location.search);
            let titulo = params.get('titulo');
            if (!titulo) return;
            titulo = titulo.trim();
            if (!titulo) return;
            const input = document.getElementById('titulo');
            if (input && !input.value) {
                // Limitar longitud extrema para evitar inyecciones UI raras
                if (titulo.length > 180) {
                    titulo = titulo.slice(0, 180);
                }
                input.value = titulo;
                // Disparar evento input por si hay validaciones en vivo
                input.dispatchEvent(new Event('input', { bubbles: true }));
                // Notificación discreta (si UIUtils soporta tipo info)
                if (window.UIUtils && typeof UIUtils.mostrarNotificacion === 'function') {
                    UIUtils.mostrarNotificacion('info', 'Título prellenado desde búsqueda');
                }
                // Mostrar badge visual
                const badge = document.getElementById('titulo-prefill-badge');
                if (badge) {
                    badge.style.display = 'inline-block';
                    // Opcional: ocultar después de unos segundos
                    setTimeout(() => {
                        if (badge) badge.style.opacity = '0.35';
                    }, 6000);
                }
                // Foco en el siguiente campo para acelerar flujo
                const autorInput = document.getElementById('autor');
                autorInput?.focus();
                // Eliminar query param para evitar repetir prefill en refrescos o al copiar URL
                try {
                    const cleanUrl = window.location.pathname;
                    window.history.replaceState({}, document.title, cleanUrl);
                } catch (e) {
                    console.warn('[AgregarLibro] No se pudo limpiar la URL:', e);
                }
            }
        } catch (e) {
            console.warn('[AgregarLibro] Error al prellenar título desde query:', e);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const agregarPage = new AgregarLibroPage();
    agregarPage.init();
});