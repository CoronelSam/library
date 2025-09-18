class EditarLibrosPage {
    constructor() {
        this.libros = [];
        this.librosFiltrados = [];
        this.paginaActual = 1;
        this.librosPorPagina = 10;
        this.libroSeleccionadoParaEliminar = null;
        this.libroEnEdicion = null; 
        this.editarModal = null;
        this.eliminarModal = null;
        this.editGeneroInput = null;
        this.editGeneroSelect = null;
        this.editGeneroSuggestions = null;
        this.autocompleteInstance = null;
    }

    async init() {
        this.validarDependencias();
        this.obtenerElementos();
        this.inicializarEventListeners();
        this.inicializarModales();
        this.inicializarAutocompletadoCompartido();
        await this.cargarLibros();
        this.inicializarBuscadorCompartido();
        console.log('📚 [EditarLibros] Página inicializada');
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
        this.buscarInput = document.getElementById('buscar-input');
        this.buscarBtn = document.getElementById('buscar-btn');
        this.limpiarBtn = document.getElementById('limpiar-btn');
        this.selectRecorrido = document.getElementById('selectRecorrido');
        this.inputGenero = document.getElementById('inputGenero');
        this.inputAutor = document.getElementById('inputAutor');
        this.btnRefrescar = document.getElementById('btnRefrescar');
        this.estadoBusqueda = document.getElementById('estadoBusqueda');
        this.librosTabla = document.getElementById('libros-tbody');
        this.loadingContainer = document.getElementById('loading-container');
        this.noLibrosMessage = document.getElementById('no-libros-message');
        this.paginationContainer = document.getElementById('pagination-container');
        this.paginationList = document.getElementById('pagination-list');
        this.editGeneroInput = document.getElementById('edit-genero-input');
        this.editGeneroSelect = document.getElementById('edit-genero-select');
        this.editGeneroSuggestions = document.getElementById('edit-genre-suggestions');
        this.agregarDesdeBusquedaContainer = document.getElementById('agregar-desde-busqueda-container');
        this.agregarDesdeBusquedaBtn = document.getElementById('agregar-desde-busqueda-btn');
        this.agregarDesdeBusquedaTitulo = document.getElementById('agregar-desde-busqueda-titulo');
    }

    inicializarEventListeners() {
        const MIN_QUERY = 2;
        const debounceDelay = APP_CONSTANTS.UI_CONFIG?.DEBOUNCE_DELAY || 300;

        const ejecutarBusqueda = () => {
            const q = this.buscarInput.value.trim();
            const genero = this.inputGenero.value.trim();
            const autor = this.inputAutor.value.trim();
            this.buscador?.buscar({ q, genero, autor, prefijo: true });
        };

        const debounceBusqueda = () => {
            const q = this.buscarInput.value.trim();
            const genero = this.inputGenero.value.trim();
            const autor = this.inputAutor.value.trim();
            this.buscador?.debounceBuscar({ q, genero, autor, prefijo: true }, debounceDelay);
        };

        const cargarRecorridoInicial = (force = false) => {
            const tipo = this.selectRecorrido.value;
            const genero = this.inputGenero.value.trim();
            const autor = this.inputAutor.value.trim();
            this.buscador?.cargarRecorrido({ tipo, genero, autor, force, qActual: this.buscarInput.value.trim() });
        };

        if(this.buscarInput){
            this.buscarInput.addEventListener('input', () => {
                if(this.buscarInput.value.trim().length >= MIN_QUERY){
                    debounceBusqueda();
                } else {
                    cargarRecorridoInicial();
                }
            });
        }
        if(this.buscarBtn){
            this.buscarBtn.addEventListener('click', () => {
                if(this.buscarInput.value.trim().length >= MIN_QUERY){
                    ejecutarBusqueda();
                } else {
                    cargarRecorridoInicial(true);
                }
            });
        }
        if(this.limpiarBtn){
            this.limpiarBtn.addEventListener('click', () => {
                this.limpiarBusqueda();
                cargarRecorridoInicial(true);
            });
        }
        if(this.selectRecorrido){
            this.selectRecorrido.addEventListener('change', () => cargarRecorridoInicial(true));
        }
        if(this.inputGenero){
            this.inputGenero.addEventListener('input', () => {
                if(this.buscarInput.value.trim().length >= MIN_QUERY){
                    debounceBusqueda();
                } else {
                    cargarRecorridoInicial();
                }
            });
        }
        if(this.inputAutor){
            this.inputAutor.addEventListener('input', () => {
                if(this.buscarInput.value.trim().length >= MIN_QUERY){
                    debounceBusqueda();
                } else {
                    cargarRecorridoInicial();
                }
            });
        }
        if(this.btnRefrescar){
            this.btnRefrescar.addEventListener('click', (e) => { e.preventDefault(); cargarRecorridoInicial(true); });
        }

        if (this.agregarDesdeBusquedaBtn) {
            this.agregarDesdeBusquedaBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const tituloRaw = (this.buscarInput.value || '').trim();
                if (!tituloRaw) return;
                const qp = new URLSearchParams({ titulo: tituloRaw });
                window.location.href = `agregar.html?${qp.toString()}`;
            });
        }

        document.getElementById('guardar-cambios-btn').addEventListener('click', () => this.guardarCambios());
        document.getElementById('confirmar-eliminar-btn').addEventListener('click', () => this.eliminarLibro());
        document.getElementById('editarLibroModal').addEventListener('hidden.bs.modal', () => this.limpiarFormularioEdicion());
    }

    inicializarModales() {
        this.editarModal = new bootstrap.Modal(document.getElementById('editarLibroModal'));
        this.eliminarModal = new bootstrap.Modal(document.getElementById('confirmarEliminarModal'));
    }

    async cargarLibros() {
        try {
            this.mostrarLoading(true);
            UIUtils.limpiarNotificaciones();

            const response = await LibroService.obtenerTodos();

            if (response.success) {
                this.libros = response.data;
                this.librosFiltrados = [...this.libros];
                this.renderizarLibros();
            } else {
                throw new Error(response.mensaje || 'Error al cargar libros');
            }

        } catch (error) {
            console.error('❌ Error al cargar libros:', error);
            UIUtils.mostrarNotificacion('error', `Error al cargar libros: ${error.message}`);
            this.mostrarMensajeSinLibros();
        } finally {
            this.mostrarLoading(false);
        }
    }


    limpiarBusqueda() {
        if(this.buscarInput) this.buscarInput.value = '';
        if(this.inputGenero) this.inputGenero.value = '';
        if(this.inputAutor) this.inputAutor.value = '';
        this.librosFiltrados = [...this.libros];
        this.paginaActual = 1;
        this.renderizarLibros();
        this.actualizarBotonAgregar();
        if(this.estadoBusqueda) this.estadoBusqueda.textContent = '';
    }

    renderizarLibros() {
        if (this.librosFiltrados.length === 0) {
            this.mostrarMensajeSinLibros();
            this.actualizarBotonAgregar();
            return;
        }
        this.mostrarTabla(true);

        const totalPaginas = Math.max(1, Math.ceil(this.librosFiltrados.length / this.librosPorPagina));
        if (this.paginaActual > totalPaginas) this.paginaActual = 1;
        const inicio = (this.paginaActual - 1) * this.librosPorPagina;
        const fin = inicio + this.librosPorPagina;
        const librosParaMostrar = this.librosFiltrados.slice(inicio, fin);

        this.librosTabla.innerHTML = librosParaMostrar.map(libro => this.crearFilaLibro(libro)).join('');

        this.renderizarPaginacion();
        this.agregarEventListenersBotones();
        this.actualizarBotonAgregar();
    }

    crearFilaLibro(libro) {
        const portada = libro.portada 
        ? `<img src="${libro.portada}" alt="Portada" class="img-thumbnail" style="width: 50px; height: 70px; object-fit: cover;">`
        : `<div class="bg-light d-flex align-items-center justify-content-center" style="width: 50px; height: 70px; border-radius: 4px;"><i class="bi bi-book text-muted"></i></div>`;

        return `
            <tr>
                <th scope="row">${libro.id}</th>
                <td>${portada}</td>
                <td class="fw-bold">${libro.titulo}</td>
                <td>${libro.autor}</td>
                <td><span class="badge bg-primary rounded-pill">${libro.genero}</span></td>
                <td>${libro.isbn || '<em class="text-muted">N/A</em>'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-warning me-2 editar-btn" data-libro-id="${libro.id}"><i class="bi bi-pencil"></i> Editar</button>
                    <button class="btn btn-sm btn-outline-danger eliminar-btn" data-libro-id="${libro.id}"><i class="bi bi-trash"></i> Eliminar</button>
                </td>
            </tr>
        `;
    }

    agregarEventListenersBotones() {
        document.querySelectorAll('.editar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const libroId = parseInt(e.currentTarget.dataset.libroId);
                this.abrirModalEditar(libroId);
            });
        });

        document.querySelectorAll('.eliminar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const libroId = parseInt(e.currentTarget.dataset.libroId);
                this.abrirModalEliminar(libroId);
            });
        });
    }

    abrirModalEditar(libroId) {
        const libro = this.libros.find(l => l.id === libroId);
        if (!libro) {
            UIUtils.mostrarNotificacion('error', 'Libro no encontrado');
            return;
        }

        this.libroEnEdicion = JSON.parse(JSON.stringify(libro));
        
        document.getElementById('editar-libro-form').reset();

        document.getElementById('edit-libro-id').value = this.libroEnEdicion.id;
        document.getElementById('edit-titulo').value = this.libroEnEdicion.titulo;
        document.getElementById('edit-autor').value = this.libroEnEdicion.autor;
        document.getElementById('edit-isbn').value = this.libroEnEdicion.isbn || '';
        
        const generoSelect = document.getElementById('edit-genero-select');
        const generoInputLibre = document.getElementById('edit-genero-input');
        if (generoSelect) {
            let encontrado = Array.from(generoSelect.options).some(opt => {
                if (opt.value.toLowerCase() === this.libroEnEdicion.genero.toLowerCase()) {
                    generoSelect.value = opt.value;
                    return true;
                }
                return false;
            });
            if (!encontrado && generoInputLibre) {
                generoSelect.value = 'Otro';
                generoInputLibre.value = this.libroEnEdicion.genero;
            } else if (encontrado && generoInputLibre) {
                generoInputLibre.value = '';
            }
        }
        
        document.getElementById('edit-editorial').value = this.libroEnEdicion.editorial || '';
        
        // ================== CORRECCIÓN CLAVE AQUÍ ==================
        // Esta era la línea que faltaba y causaba que el año se viera en blanco.
        document.getElementById('edit-año').value = this.libroEnEdicion.año_publicacion || '';
        // =========================================================
        
        document.getElementById('edit-descripcion').value = this.libroEnEdicion.descripcion || '';

        const portadaContainer = document.getElementById('portada-actual-container');
        if (this.libroEnEdicion.portada) {
            document.getElementById('portada-actual').src = this.libroEnEdicion.portada;
            portadaContainer.style.display = 'block';
        } else {
            portadaContainer.style.display = 'none';
        }
        
        this.renderizarGaleriaEdicion();

        const archivoActualContainer = document.getElementById('archivo-actual-container');
        const sinArchivoContainer = document.getElementById('sin-archivo-container');
        const verArchivoLink = document.getElementById('ver-archivo-link');
        const descargarArchivoLink = document.getElementById('descargar-archivo-link');
        const infoArchivo = document.getElementById('archivo-actual-info');
        const eliminarCheckbox = document.getElementById('eliminar-archivo-checkbox');
        if (eliminarCheckbox) eliminarCheckbox.checked = false;

        if (this.libroEnEdicion.archivo) {
            archivoActualContainer.style.display = 'block';
            sinArchivoContainer.style.display = 'none';
            infoArchivo.textContent = 'Hay un PDF asociado a este libro';
            verArchivoLink.href = LibroService.pdfViewUrl(this.libroEnEdicion.id);
            descargarArchivoLink.href = LibroService.pdfDownloadUrl(this.libroEnEdicion.id, { proxy: true });
            
            // Agregar evento para actualizar estadísticas después de descarga
            descargarArchivoLink.onclick = (e) => {
                e.preventDefault();
                // Realizar descarga
                LibroService.descargarPDFProxy ? LibroService.descargarPDFProxy(this.libroEnEdicion.id) : LibroService.descargarPDF(this.libroEnEdicion.id);
                // Actualizar estadísticas después de un pequeño delay
                setTimeout(() => {
                    this.actualizarEstadisticasDescarga(this.libroEnEdicion.id);
                }, 1000);
            };
        } else {
            archivoActualContainer.style.display = 'none';
            sinArchivoContainer.style.display = 'block';
        }

        // Mostrar estadísticas del libro
        this.mostrarEstadisticasLibro();

        this.editarModal.show();
    }

    renderizarGaleriaEdicion() {
        const galeriaContainer = document.getElementById('galeria-imagenes-container');
        const galeriaElement = document.getElementById('galeria-imagenes');
        
        galeriaElement.innerHTML = '';

        if (this.libroEnEdicion && this.libroEnEdicion.imagenes_adicionales && this.libroEnEdicion.imagenes_adicionales.length > 0) {
            galeriaContainer.style.display = 'block';
            this.libroEnEdicion.imagenes_adicionales.forEach(url => {
                const col = document.createElement('div');
                col.className = 'col-md-3 col-4 mb-2 thumbnail-container';
                col.innerHTML = `
                    <img src="${url}" class="img-thumbnail" style="height: 100px; width: 100%; object-fit: cover;">
                    <button type="button" class="btn btn-danger btn-sm thumbnail-delete-btn" data-url="${url}" title="Marcar para eliminar">
                        <i class="bi bi-x-lg"></i>
                    </button>
                `;
                galeriaElement.appendChild(col);
            });

            galeriaElement.querySelectorAll('.thumbnail-delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.eliminarImagenAdicional(e.currentTarget.dataset.url));
            });
        } else {
            galeriaContainer.style.display = 'none';
        }
    }

    eliminarImagenAdicional(urlAEliminar) {
        if (!this.libroEnEdicion) return;

        this.libroEnEdicion.imagenes_adicionales = this.libroEnEdicion.imagenes_adicionales.filter(url => url !== urlAEliminar);
        
        this.renderizarGaleriaEdicion();
        UIUtils.mostrarToast('Imagen marcada para eliminar. Guarda los cambios para confirmar.', 'info');
    }

    abrirModalEliminar(libroId) {
        const libro = this.libros.find(l => l.id === libroId);
        if (!libro) {
            UIUtils.mostrarNotificacion('error', 'Libro no encontrado');
            return;
        }

        this.libroSeleccionadoParaEliminar = libro;
        document.getElementById('libro-a-eliminar-titulo').textContent = libro.titulo;
        this.eliminarModal.show();
    }

    async guardarCambios() {
        try {
            const libroId = document.getElementById('edit-libro-id').value;
            const portadaFile = document.getElementById('edit-portada').files[0];
            const archivoFile = document.getElementById('edit-archivo').files[0];
            const nuevasImagenesFiles = Array.from(document.getElementById('edit-imagenes-adicionales').files);
            const eliminarArchivo = document.getElementById('eliminar-archivo-checkbox')?.checked || false;

            // ================== CORRECCIÓN DEFINITIVA EN FRONT-END ==================
            // Recogemos el valor del año como un string, sin convertirlo a `null` aquí.
            // Si el campo está vacío, se enviará como una cadena vacía `''`.
            // El backend se encargará de interpretarlo correctamente.
            const datosActualizados = {
                titulo: document.getElementById('edit-titulo').value.trim(),
                autor: document.getElementById('edit-autor').value.trim(),
                isbn: document.getElementById('edit-isbn').value.trim() || null,
                genero: document.getElementById('edit-genero-input').value.trim() || document.getElementById('edit-genero-select').value,
                editorial: document.getElementById('edit-editorial').value.trim(),
                anio_publicacion: document.getElementById('edit-año').value.trim(), // <-- ESTA LÍNEA ES LA CORREGIDA
                descripcion: document.getElementById('edit-descripcion').value.trim(),
                imagenes_adicionales: this.libroEnEdicion.imagenes_adicionales
            };
            // =======================================================================

            if (!datosActualizados.titulo || !datosActualizados.autor || !datosActualizados.genero) {
                UIUtils.mostrarNotificacion('error', 'Título, autor y género son campos obligatorios');
                return;
            }

            const guardarBtn = document.getElementById('guardar-cambios-btn');
            UIUtils.mostrarLoading(guardarBtn, 'Guardando...');

            const formData = new FormData();
            
            Object.keys(datosActualizados).forEach(key => {
                let valor = datosActualizados[key];
                if (key === 'imagenes_adicionales' && Array.isArray(valor)) {
                    valor = JSON.stringify(valor);
                }
                // Importante: FormData trata `null` como el texto "null", pero una cadena vacía viaja como tal.
                formData.append(key, valor !== null ? valor : '');
            });
            
            if (portadaFile) formData.append('portada', portadaFile);
            if (archivoFile) formData.append('archivo', archivoFile);
            if (eliminarArchivo) formData.append('removeArchivo', 'true');
            if (nuevasImagenesFiles.length > 0) {
                nuevasImagenesFiles.forEach(file => formData.append('imagenes_adicionales', file));
            }

            const response = await LibroService.actualizar(libroId, formData);

            if (response.success) {
                UIUtils.mostrarToast('Libro actualizado correctamente', 'success');
                this.editarModal.hide();
                await this.cargarLibros();
            } else {
                throw new Error(response.mensaje || 'Error al actualizar libro');
            }

        } catch (error) {
            console.error('❌ Error al guardar cambios:', error);
            UIUtils.mostrarNotificacion('error', `Error al actualizar: ${error.message}`);
        } finally {
            UIUtils.ocultarLoading(document.getElementById('guardar-cambios-btn'));
        }
    }

    async eliminarLibro() {
        try {
            if (!this.libroSeleccionadoParaEliminar) return;

            const confirmarBtn = document.getElementById('confirmar-eliminar-btn');
            UIUtils.mostrarLoading(confirmarBtn, 'Eliminando...');

            const response = await LibroService.eliminar(this.libroSeleccionadoParaEliminar.id);

            if (response.success) {
                UIUtils.mostrarNotificacion('success', 'Libro eliminado correctamente');
                this.eliminarModal.hide();
                await this.cargarLibros();
            } else {
                throw new Error(response.mensaje || 'Error al eliminar libro');
            }

        } catch (error) {
            console.error('❌ Error al eliminar libro:', error);
            UIUtils.mostrarNotificacion('error', `Error al eliminar libro: ${error.message}`);
        } finally {
            UIUtils.ocultarLoading(document.getElementById('confirmar-eliminar-btn'));
            this.libroSeleccionadoParaEliminar = null;
        }
    }

    renderizarPaginacion() {
        const totalPaginas = Math.ceil(this.librosFiltrados.length / this.librosPorPagina);
        if (totalPaginas <= 1) {
            this.paginationContainer.style.display = 'none';
            if (this.paginationList) this.paginationList.innerHTML = '';
            return;
        }
        this.paginationContainer.style.display = 'block';
        
        let paginacionHTML = '';
        
        paginacionHTML += `<li class="page-item ${this.paginaActual === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-pagina="${this.paginaActual - 1}">Anterior</a></li>`;

        for (let i = 1; i <= totalPaginas; i++) {
            if (i === 1 || i === totalPaginas || (i >= this.paginaActual - 2 && i <= this.paginaActual + 2)) {
                paginacionHTML += `<li class="page-item ${i === this.paginaActual ? 'active' : ''}"><a class="page-link" href="#" data-pagina="${i}">${i}</a></li>`;
            } else if (i === this.paginaActual - 3 || i === this.paginaActual + 3) {
                paginacionHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        paginacionHTML += `<li class="page-item ${this.paginaActual === totalPaginas ? 'disabled' : ''}"><a class="page-link" href="#" data-pagina="${this.paginaActual + 1}">Siguiente</a></li>`;

        this.paginationList.innerHTML = paginacionHTML;

        this.paginationList.querySelectorAll('a.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pagina = parseInt(e.target.dataset.pagina);
                if (pagina && pagina !== this.paginaActual) {
                    this.paginaActual = pagina;
                    this.renderizarLibros();
                }
            });
        });
    }

    limpiarFormularioEdicion() {
        document.getElementById('editar-libro-form').reset();
        document.getElementById('portada-actual-container').style.display = 'none';
        document.getElementById('galeria-imagenes-container').style.display = 'none';
        document.getElementById('galeria-imagenes').innerHTML = '';
        this.libroEnEdicion = null;
    }

    mostrarLoading(mostrar) {
        this.loadingContainer.style.display = mostrar ? 'block' : 'none';
        this.mostrarTabla(!mostrar);
    }

    mostrarTabla(mostrar) {
        const tabla = document.querySelector('.table-responsive');
        tabla.style.display = mostrar ? 'block' : 'none';
        this.noLibrosMessage.style.display = 'none';
    }

    mostrarMensajeSinLibros() {
        const tabla = document.querySelector('.table-responsive');
        tabla.style.display = 'none';
        this.paginationContainer.style.display = 'none';
        this.noLibrosMessage.style.display = 'block';
        this.actualizarBotonAgregar();
    }

    actualizarBotonAgregar() {
        if (!this.agregarDesdeBusquedaContainer) return;
        const termino = (this.buscarInput?.value || '').trim();
        const sinResultados = this.librosFiltrados.length === 0;
        if (termino && sinResultados) {
            this.agregarDesdeBusquedaTitulo.textContent = termino.length > 40 ? termino.slice(0,40)+'…' : termino;
            this.agregarDesdeBusquedaContainer.style.display = 'block';
        } else {
            this.agregarDesdeBusquedaContainer.style.display = 'none';
        }
    }

    inicializarAutocompletadoCompartido() {
        if (!window.GeneroAutocomplete) {
            console.warn('[EditarLibros] GeneroAutocomplete util no cargado');
            return;
        }
        if (!this.editGeneroInput || !this.editGeneroSuggestions) return;
        this.autocompleteInstance = window.GeneroAutocomplete.setup({
            input: this.editGeneroInput,
            select: this.editGeneroSelect,
            suggestionsContainer: this.editGeneroSuggestions
        });
    }

    inicializarBuscadorCompartido(){
        if(!window.BuscadorLibros){
            console.warn('[EditarLibros] BuscadorLibros util no cargado');
            return;
        }
        this.buscador = BuscadorLibros.crear({
            obtenerRecorrido: (params)=> LibroService.obtenerRecorrido(params),
            busquedaOptimizada: (q, opts)=> LibroService.busquedaOptimizada(q, opts),
            minQuery: 2,
            limiteRecorrido: 500,
            limiteBusqueda: 300
        });
        this.buscador.onResultados = (lista, meta) => {
            if(Array.isArray(lista)){
                this.librosFiltrados = lista;
                this.paginaActual = 1;
                this.renderizarLibros();
            }
            this.actualizarBotonAgregar();
        };
        this.buscador.onEstado = (msg)=> { if(this.estadoBusqueda) this.estadoBusqueda.textContent = msg || ''; };
        this.buscador.onError = (m,e)=> console.error('[EditarLibros][Buscador]', m, e);
        const tipoInicial = this.selectRecorrido ? this.selectRecorrido.value : 'inorden';
        this.buscador.cargarRecorrido({ tipo: tipoInicial, genero: this.inputGenero?.value.trim() || '', autor: this.inputAutor?.value.trim() || '', force: true });
    }

    mostrarEstadisticasLibro() {
        if (!this.libroEnEdicion) return;

        // Mostrar descargas
        const elementoDescargas = document.getElementById('estadistica-descargas');
        if (elementoDescargas) {
            const descargas = this.libroEnEdicion.descargas || 0;
            elementoDescargas.textContent = new Intl.NumberFormat('es-ES').format(descargas);
        }

        // Mostrar fecha de creación
        const elementoFechaCreacion = document.getElementById('estadistica-fecha-creacion');
        if (elementoFechaCreacion && this.libroEnEdicion.createdAt) {
            try {
                const fecha = new Date(this.libroEnEdicion.createdAt);
                elementoFechaCreacion.textContent = fecha.toLocaleDateString('es-ES', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                });
            } catch (error) {
                elementoFechaCreacion.textContent = 'No disponible';
            }
        }

        // Mostrar fecha de actualización
        const elementoFechaActualizacion = document.getElementById('estadistica-fecha-actualizacion');
        if (elementoFechaActualizacion && this.libroEnEdicion.updatedAt) {
            try {
                const fecha = new Date(this.libroEnEdicion.updatedAt);
                elementoFechaActualizacion.textContent = fecha.toLocaleDateString('es-ES', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                });
            } catch (error) {
                elementoFechaActualizacion.textContent = 'No disponible';
            }
        }
    }

    async actualizarEstadisticasDescarga(libroId) {
        try {
            // Consultar estadísticas actualizadas del backend
            const response = await fetch(`${API_CONFIG.FULL_ENDPOINTS.LIBROS}/${libroId}/estadisticas-descarga`);
            const data = await response.json();
            
            if (data.success && data.data) {
                // Actualizar el campo de descargas en la interfaz
                const elementoDescargas = document.getElementById('estadistica-descargas');
                if (elementoDescargas) {
                    elementoDescargas.textContent = new Intl.NumberFormat('es-ES').format(data.data.descargas);
                }
                
                // Actualizar también el libro en edición para mantener consistencia
                if (this.libroEnEdicion && this.libroEnEdicion.id === libroId) {
                    this.libroEnEdicion.descargas = data.data.descargas;
                }
            }
        } catch (error) {
            console.error('Error al actualizar estadísticas de descarga:', error);
            // No mostrar error al usuario, es solo una actualización de estadísticas
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const editarPage = new EditarLibrosPage();
    window.editarLibrosPageInstance = editarPage;
    editarPage.init();
});