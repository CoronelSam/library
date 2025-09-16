class EditarLibrosPage {
    constructor() {
        this.libros = [];
        this.librosFiltrados = [];
        this.paginaActual = 1;
        this.librosPorPagina = 10;
        this.libroSeleccionadoParaEliminar = null;
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
        // Nuevos filtros múltiples
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
        // Elementos de género (edición)
        this.editGeneroInput = document.getElementById('edit-genero-input');
        this.editGeneroSelect = document.getElementById('edit-genero-select');
        this.editGeneroSuggestions = document.getElementById('edit-genre-suggestions');
        // Botón agregar desde búsqueda
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

        // Guardar cambios en modal de editar
        document.getElementById('guardar-cambios-btn').addEventListener('click', () => {
            this.guardarCambios();
        });

        // Confirmar eliminación
        document.getElementById('confirmar-eliminar-btn').addEventListener('click', () => {
            this.eliminarLibro();
        });

        // Limpiar formulario cuando se cierre el modal de editar
        document.getElementById('editarLibroModal').addEventListener('hidden.bs.modal', () => {
            this.limpiarFormularioEdicion();
            if (this.editGeneroSuggestions) {
                this.editGeneroSuggestions.innerHTML = '';
                this.editGeneroSuggestions.style.display = 'none';
            }
        });
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

        // Renderizar filas de la tabla
        this.librosTabla.innerHTML = librosParaMostrar.map(libro => this.crearFilaLibro(libro)).join('');

        // Renderizar paginación
        this.renderizarPaginacion();

        // Agregar event listeners a los botones
        this.agregarEventListenersBotones();
        this.actualizarBotonAgregar();
    }

    crearFilaLibro(libro) {
        const portada = libro.portada 
            ? `<img src="${libro.portada}" alt="Portada" class="img-thumbnail" style="width: 50px; height: 70px; object-fit: cover;">`
            : `<div class="bg-light d-flex align-items-center justify-content-center" style="width: 50px; height: 70px; border-radius: 4px;">
                 <i class="bi bi-book text-muted"></i>
               </div>`;

        return `
            <tr>
                <th scope="row">${libro.id}</th>
                <td>${portada}</td>
                <td class="fw-bold">${libro.titulo}</td>
                <td>${libro.autor}</td>
                <td>
                    <span class="badge bg-primary rounded-pill">${libro.genero}</span>
                </td>
                <td>${libro.editorial || '<em class="text-muted">No especificada</em>'}</td>
                <td>${libro.año_publicacion || '<em class="text-muted">N/A</em>'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-warning me-2 editar-btn" data-libro-id="${libro.id}">
                        <i class="bi bi-pencil"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-outline-danger eliminar-btn" data-libro-id="${libro.id}">
                        <i class="bi bi-trash"></i> Eliminar
                    </button>
                </td>
            </tr>
        `;
    }

    agregarEventListenersBotones() {
        // Botones de editar
        document.querySelectorAll('.editar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const libroId = parseInt(e.currentTarget.dataset.libroId);
                this.abrirModalEditar(libroId);
            });
        });

        // Botones de eliminar
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

        this.limpiarFormularioEdicion();

        // Llenar el formulario con los datos del libro
        document.getElementById('edit-libro-id').value = libro.id;
        document.getElementById('edit-titulo').value = libro.titulo;
        document.getElementById('edit-autor').value = libro.autor;
        // Manejo de género: intentar encontrar opción en select, si no existe se coloca en input libre
        const generoSelect = document.getElementById('edit-genero-select');
        const generoInputLibre = document.getElementById('edit-genero-input');
        if (generoSelect) {
            let encontrado = false;
            Array.from(generoSelect.options).forEach(opt => {
                if (opt.value.toLowerCase() === libro.genero.toLowerCase()) {
                    generoSelect.value = opt.value;
                    encontrado = true;
                }
            });
            if (!encontrado && generoInputLibre) {
                generoSelect.value = 'Seleccionar género...';
                generoInputLibre.value = libro.genero;
            } else if (encontrado && generoInputLibre) {
                generoInputLibre.value = '';
            }
        }
        document.getElementById('edit-editorial').value = libro.editorial || '';
        document.getElementById('edit-año').value = libro.año_publicacion || '';
        document.getElementById('edit-descripcion').value = libro.descripcion || '';

        // Mostrar portada actual si existe
        if (libro.portada) {
            document.getElementById('portada-actual').src = libro.portada;
            document.getElementById('portada-actual-container').style.display = 'block';
        } else {
            document.getElementById('portada-actual-container').style.display = 'none';
        }

        // Manejo PDF actual
        const archivoActualContainer = document.getElementById('archivo-actual-container');
        const sinArchivoContainer = document.getElementById('sin-archivo-container');
        const verArchivoLink = document.getElementById('ver-archivo-link');
        const descargarArchivoLink = document.getElementById('descargar-archivo-link');
        const infoArchivo = document.getElementById('archivo-actual-info');
        const eliminarCheckbox = document.getElementById('eliminar-archivo-checkbox');
        if (eliminarCheckbox) eliminarCheckbox.checked = false;

        if (libro.archivo) {
            archivoActualContainer.style.display = 'block';
            sinArchivoContainer.style.display = 'none';
            infoArchivo.textContent = 'Hay un PDF asociado a este libro';
            // Enlaces usando helpers centralizados
            verArchivoLink.href = LibroService.pdfViewUrl(libro.id);
            descargarArchivoLink.href = LibroService.pdfDownloadUrl(libro.id, { proxy: true });
            // También agregar listeners explícitos (por si el navegador bloquea target)
            verArchivoLink.onclick = (e) => { e.preventDefault(); LibroService.abrirPDF(libro.id); };
            descargarArchivoLink.onclick = (e) => { e.preventDefault(); LibroService.descargarPDFProxy ? LibroService.descargarPDFProxy(libro.id) : LibroService.descargarPDF(libro.id); };
        } else {
            archivoActualContainer.style.display = 'none';
            sinArchivoContainer.style.display = 'block';
        }

        // Configurar confirmación de eliminación PDF
        if (eliminarCheckbox) {
            eliminarCheckbox.onchange = (e) => {
                if (e.target.checked) {
                    const confirmado = window.confirm('¿Seguro que deseas eliminar el PDF actual? Esta acción no se puede deshacer si no subes otro antes de guardar.');
                    if (!confirmado) {
                        e.target.checked = false;
                    }
                }
            };
        }

        const nuevoArchivoInput = document.getElementById('edit-archivo');
        if (nuevoArchivoInput) {
            nuevoArchivoInput.onchange = () => {
                if (nuevoArchivoInput.files && nuevoArchivoInput.files.length > 0 && eliminarCheckbox && eliminarCheckbox.checked) {
                    eliminarCheckbox.checked = false;
                }
            };
        }

        this.editarModal.show();
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
            const archivoFile = document.getElementById('edit-archivo') ? document.getElementById('edit-archivo').files[0] : null;
            const eliminarArchivo = document.getElementById('eliminar-archivo-checkbox')?.checked || false;

            // Recopilar datos del formulario
            let añoRaw = document.getElementById('edit-año').value.trim();
            if (añoRaw && !/^\d{1,4}$/.test(añoRaw)) {
                console.warn('[EditarLibro] Año inválido ingresado, se ignorará:', añoRaw);
                añoRaw = '';
            }
            const datosActualizados = {
                titulo: document.getElementById('edit-titulo').value.trim(),
                autor: document.getElementById('edit-autor').value.trim(),
                genero: (function(){
                    const sel = document.getElementById('edit-genero-select');
                    const libre = document.getElementById('edit-genero-input');
                    if (sel && sel.value && sel.value !== 'Seleccionar género...') return sel.value.trim();
                    if (libre && libre.value.trim()) return libre.value.trim();
                    return '';
                })(),
                editorial: document.getElementById('edit-editorial').value.trim(),
                año_publicacion: añoRaw ? parseInt(añoRaw, 10) : null,
                descripcion: document.getElementById('edit-descripcion').value.trim()
            };

            // Validar campos requeridos
            if (!datosActualizados.titulo || !datosActualizados.autor || !datosActualizados.genero) {
                UIUtils.mostrarNotificacion('error', 'Título, autor y género son campos obligatorios');
                return;
            }

            const guardarBtn = document.getElementById('guardar-cambios-btn');
            UIUtils.mostrarLoading(guardarBtn, 'Guardando...');

            // Crear FormData si hay archivo de portada, pdf o se quiere eliminar el existente
            let formData;
            if (portadaFile || archivoFile || eliminarArchivo) {
                formData = new FormData();
                Object.keys(datosActualizados).forEach(key => {
                    const valor = datosActualizados[key] !== null ? datosActualizados[key] : '';
                    formData.append(key, valor);
                    if (key === 'año_publicacion' && valor !== '') {
                        // Alias sin tilde
                        formData.append('anio_publicacion', valor.toString());
                    }
                });
                if (portadaFile) formData.append('portada', portadaFile);
                if (archivoFile) formData.append('archivo', archivoFile);
                if (eliminarArchivo) formData.append('removeArchivo', 'true');
            } else {
                // Añadir alias también en JSON si aplica
                if (datosActualizados.año_publicacion !== null) {
                    datosActualizados.anio_publicacion = datosActualizados.año_publicacion;
                }
            }

            const response = await LibroService.actualizar(libroId, formData || datosActualizados);

            if (response.success) {
                UIUtils.mostrarNotificacion('success', 'Libro actualizado correctamente');
                UIUtils.mostrarToast('Libro actualizado correctamente', 'success');
                this.editarModal.hide();
                await this.cargarLibros(); // Recargar la lista
            } else {
                throw new Error(response.mensaje || 'Error al actualizar libro');
            }

        } catch (error) {
            console.error('❌ Error al actualizar libro:', error);
            UIUtils.mostrarNotificacion('error', `Error al actualizar libro: ${error.message}`);
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
                await this.cargarLibros(); // Recargar la lista
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
        
        // Botón anterior
        paginacionHTML += `
            <li class="page-item ${this.paginaActual === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-pagina="${this.paginaActual - 1}">Anterior</a>
            </li>
        `;

        // Números de página
        for (let i = 1; i <= totalPaginas; i++) {
            if (i === 1 || i === totalPaginas || (i >= this.paginaActual - 2 && i <= this.paginaActual + 2)) {
                paginacionHTML += `
                    <li class="page-item ${i === this.paginaActual ? 'active' : ''}">
                        <a class="page-link" href="#" data-pagina="${i}">${i}</a>
                    </li>
                `;
            } else if (i === this.paginaActual - 3 || i === this.paginaActual + 3) {
                paginacionHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        // Botón siguiente
        paginacionHTML += `
            <li class="page-item ${this.paginaActual === totalPaginas ? 'disabled' : ''}">
                <a class="page-link" href="#" data-pagina="${this.paginaActual + 1}">Siguiente</a>
            </li>
        `;

        this.paginationList.innerHTML = paginacionHTML;

        // Agregar event listeners a los enlaces de paginación
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
        // Limpiar todos los campos del formulario
        document.getElementById('edit-libro-id').value = '';
        document.getElementById('edit-titulo').value = '';
        document.getElementById('edit-autor').value = '';
    const generoSelect = document.getElementById('edit-genero-select');
    const generoInputLibre = document.getElementById('edit-genero-input');
    if (generoSelect) generoSelect.selectedIndex = 0;
    if (generoInputLibre) generoInputLibre.value = '';
        document.getElementById('edit-editorial').value = '';
        document.getElementById('edit-año').value = '';
        document.getElementById('edit-descripcion').value = '';
        
        // Limpiar campos de archivo - esto es lo más importante
        document.getElementById('edit-portada').value = '';
        
        // Verificar si existe el campo de archivo (aunque no esté visible en el modal actual)
        const archivoInput = document.getElementById('edit-archivo');
        if (archivoInput) {
            archivoInput.value = '';
        }

        // Ocultar portada actual
        document.getElementById('portada-actual-container').style.display = 'none';
        document.getElementById('portada-actual').src = '';

        // Formulario de edición limpiado (log de debug removido)
    }

    mostrarLoading(mostrar) {
        this.loadingContainer.style.display = mostrar ? 'block' : 'none';
        this.mostrarTabla(!mostrar);
    }

    mostrarTabla(mostrar) {
        const tabla = document.querySelector('.table-responsive');
        tabla.style.display = mostrar ? 'block' : 'none';
        this.noLibrosMessage.style.display = 'none';
        // Quitar manejo directo de paginación aquí; se controla en renderizarPaginacion
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
        // Mostrar si hay término de búsqueda y no hay resultados exactos (sin sugerencias mostradas como resultados reales)
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
        // Creamos instancia que reutiliza los mismos endpoints
        this.buscador = BuscadorLibros.crear({
            obtenerRecorrido: (params)=> LibroService.obtenerRecorrido(params),
            busquedaOptimizada: (q, opts)=> LibroService.busquedaOptimizada(q, opts),
            minQuery: 2,
            limiteRecorrido: 500,
            limiteBusqueda: 300
        });
        this.buscador.onResultados = (lista, meta) => {
            // En este contexto sólo nos interesa la lista resultante para filtrar tabla
            if(Array.isArray(lista)){
                this.librosFiltrados = lista;
                this.paginaActual = 1;
                this.renderizarLibros();
            }
            this.actualizarBotonAgregar();
        };
        this.buscador.onEstado = (msg)=> { if(this.estadoBusqueda) this.estadoBusqueda.textContent = msg || ''; };
        this.buscador.onError = (m,e)=> console.error('[EditarLibros][Buscador]', m, e);
        // Cargar recorrido inicial al iniciar buscador
        const tipoInicial = this.selectRecorrido ? this.selectRecorrido.value : 'inorden';
        this.buscador.cargarRecorrido({ tipo: tipoInicial, genero: this.inputGenero?.value.trim() || '', autor: this.inputAutor?.value.trim() || '', force: true });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const editarPage = new EditarLibrosPage();
    editarPage.init();
});