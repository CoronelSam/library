class AgregarLibroPage {
    constructor() {
        this.formulario = null;
        this.generoInput = null;
        this.generoSelect = null;
        this.suggestionsList = null;
        this.autocompleteInstance = null;
    }

    init() {
        this.validarDependencias();
        this.obtenerElementos();
        this.prefillTituloDesdeQuery();
        this.inicializarFormulario();
        this.inicializarAutocompletadoCompartido();
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
            isbn: document.getElementById('isbn')?.value || '',
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

            // ▶▶▶ OBTENER ARCHIVOS - ESTO ES LO QUE FALTABA
            const portadaFile = document.getElementById('portada')?.files[0];
            const archivoFile = document.getElementById('archivo')?.files[0];
            const imagenesAdicionalesInput = document.getElementById('imagenes_adicionales');
            const imagenesAdicionalesFiles = imagenesAdicionalesInput ? Array.from(imagenesAdicionalesInput.files) : [];
            // ◀◀◀

            const datosOriginales = this.recopilarDatos();
            
            if (datosOriginales.año_publicacion) {
                const raw = datosOriginales.año_publicacion.toString().trim();
                if (/^\d{1,4}$/.test(raw)) {
                    datosOriginales.año_publicacion = raw;
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

            let datosParaEnviar;
            
            // ▶▶▶ CAMBIAR LA CONDICIÓN PARA INCLUIR IMÁGENES ADICIONALES
            if (portadaFile || archivoFile || imagenesAdicionalesFiles.length > 0) {
                datosParaEnviar = new FormData();
                
                datosParaEnviar.append('titulo', datosLimpios.titulo);
                datosParaEnviar.append('autor', datosLimpios.autor);
                datosParaEnviar.append('genero', datosLimpios.genero);
                datosParaEnviar.append('isbn', datosLimpios.isbn || '');
                
                if (datosLimpios.editorial) {
                    datosParaEnviar.append('editorial', datosLimpios.editorial);
                }
                
                if (datosLimpios.año_publicacion && datosLimpios.año_publicacion.trim() !== '') {
                    const añoNum = parseInt(datosLimpios.año_publicacion, 10);
                    if (!isNaN(añoNum)) {
                        datosParaEnviar.append('año_publicacion', añoNum.toString());
                        datosParaEnviar.append('anio_publicacion', añoNum.toString());
                    }
                }
                
                if (datosLimpios.descripcion) {
                    datosParaEnviar.append('descripcion', datosLimpios.descripcion);
                }

                if (portadaFile) {
                    datosParaEnviar.append('portada', portadaFile);
                }

                // ▶▶▶ AGREGAR IMÁGENES ADICIONALES AL FORM DATA
                if (imagenesAdicionalesFiles.length > 0) {
                    imagenesAdicionalesFiles.forEach((file, index) => {
                        datosParaEnviar.append('imagenes_adicionales', file);
                    });
                }
                
                if (archivoFile) {
                    datosParaEnviar.append('archivo', archivoFile);
                }
            } else {
                datosParaEnviar = {
                    titulo: datosLimpios.titulo,
                    autor: datosLimpios.autor,
                    genero: datosLimpios.genero,
                    isbn: datosLimpios.isbn || null,
                    editorial: datosLimpios.editorial || null,
                    año_publicacion: datosLimpios.año_publicacion ? parseInt(datosLimpios.año_publicacion, 10) : null,
                    descripcion: datosLimpios.descripcion || null
                };
            }

            const resultado = await LibroService.crear(datosParaEnviar);

            UIUtils.mostrarToast(`Libro "${datosLimpios.titulo}" guardado correctamente`, 'success');
            this.limpiarFormulario();

            requestAnimationFrame(() => {
                this.reforzarLimpieza();
            });

            setTimeout(async () => {
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

    limpiarFormulario() {
        UIUtils.limpiarFormulario(this.formulario);
        
        if (this.generoInput) {
            this.generoInput.value = '';
        }
        
        if (this.generoSelect) {
            this.generoSelect.selectedIndex = 0;
        }
        
        if (this.suggestionsList) {
            this.suggestionsList.style.display = 'none';
            this.suggestionsList.innerHTML = '';
        }
        
        const portadaInput = document.getElementById('portada');
        const archivoInput = document.getElementById('archivo');
        const imagenesInput = document.getElementById('imagenes_adicionales'); // ▶▶▶ NUEVO
        
        if (portadaInput) {
            portadaInput.value = '';
            if (portadaInput.files && portadaInput.files.length) {
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
        
        // ▶▶▶ LIMPIAR INPUT DE IMÁGENES ADICIONALES
        if (imagenesInput) {
            imagenesInput.value = '';
            if (imagenesInput.files && imagenesInput.files.length) {
                const clone = imagenesInput.cloneNode(true);
                imagenesInput.parentNode.replaceChild(clone, imagenesInput);
            }
        }
    }

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
            const imagenesInput = document.getElementById('imagenes_adicionales'); // ▶▶▶ NUEVO
            
            [portadaInput, archivoInput, imagenesInput].forEach(inp => {
                if (inp) {
                    const nuevo = inp.cloneNode(true);
                    inp.parentNode.replaceChild(nuevo, inp);
                }
            });
            
            if (this.generoSelect) this.generoSelect.selectedIndex = 0;
            if (this.generoInput) this.generoInput.value = '';
            
        } catch (e) {
            console.warn('[AgregarLibro] Error en refuerzo de limpieza:', e);
        }
    }

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

    prefillTituloDesdeQuery() {
        try {
            const params = new URLSearchParams(window.location.search);
            let titulo = params.get('titulo');
            if (!titulo) return;
            titulo = titulo.trim();
            if (!titulo) return;
            const input = document.getElementById('titulo');
            if (input && !input.value) {
                if (titulo.length > 180) {
                    titulo = titulo.slice(0, 180);
                }
                input.value = titulo;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                
                if (window.UIUtils && typeof UIUtils.mostrarNotificacion === 'function') {
                    UIUtils.mostrarNotificacion('info', 'Título prellenado desde búsqueda');
                }
                
                const badge = document.getElementById('titulo-prefill-badge');
                if (badge) {
                    badge.style.display = 'inline-block';
                    setTimeout(() => {
                        if (badge) badge.style.opacity = '0.35';
                    }, 6000);
                }
                
                const autorInput = document.getElementById('autor');
                autorInput?.focus();
                
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