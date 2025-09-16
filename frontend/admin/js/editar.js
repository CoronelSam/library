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
        this.librosTabla = document.getElementById('libros-tbody');
        this.loadingContainer = document.getElementById('loading-container');
        this.noLibrosMessage = document.getElementById('no-libros-message');
        this.paginationContainer = document.getElementById('pagination-container');
        this.paginationList = document.getElementById('pagination-list');
        // Elementos de género (edición)
        this.editGeneroInput = document.getElementById('edit-genero-input');
        this.editGeneroSelect = document.getElementById('edit-genero-select');
        this.editGeneroSuggestions = document.getElementById('edit-genre-suggestions');
    }

    inicializarEventListeners() {
        // Búsqueda optimizada usando árbol
        this._debounceId = null;
        this.buscarInput.addEventListener('input', () => {
            clearTimeout(this._debounceId);
            const valor = this.buscarInput.value.trim();
            if (!valor) {
                // Reset a dataset local completo
                this.librosFiltrados = [...this.libros];
                this.paginaActual = 1;
                this.renderizarLibros();
                return;
            }
            this._debounceId = setTimeout(() => this.ejecutarBusquedaRemota(valor), 300);
        });

        this.buscarBtn.addEventListener('click', () => {
            const valor = this.buscarInput.value.trim();
            if (valor) {
                this.ejecutarBusquedaRemota(valor);
            } else {
                this.librosFiltrados = [...this.libros];
                this.paginaActual = 1;
                this.renderizarLibros();
            }
        });

        this.limpiarBtn.addEventListener('click', () => {
            this.limpiarBusqueda();
        });

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

    async ejecutarBusquedaRemota(termino) {
        try {
            this.mostrarLoading(true);
            // Buscar con prefijo para mejorar velocidad/autocompletado
            const resp = await LibroService.busquedaOptimizada(termino, { prefijo: true, limite: 300 });
            if (resp.success) {
                this.librosFiltrados = resp.data || [];
                this.paginaActual = 1;
                if (this.librosFiltrados.length === 0 && (resp.sugerencias && resp.sugerencias.length)) {
                    UIUtils.mostrarNotificacion('info', 'Sin coincidencias exactas. Mostrando sugerencias similares.');
                    this.librosFiltrados = resp.sugerencias;
                }
                this.renderizarLibros();
            } else {
                throw new Error(resp.mensaje || 'Error en búsqueda');
            }
        } catch (e) {
            console.error('Error en búsqueda remota:', e);
            UIUtils.mostrarNotificacion('error', `Error en búsqueda: ${e.message}`);
        } finally {
            this.mostrarLoading(false);
        }
    }

    limpiarBusqueda() {
        this.buscarInput.value = '';
        this.librosFiltrados = [...this.libros];
        this.paginaActual = 1;
        this.renderizarLibros();
    }

    limpiarBusqueda() {
        this.buscarInput.value = '';
        this.librosFiltrados = [...this.libros];
        this.paginaActual = 1;
        this.renderizarLibros();
    }

    renderizarLibros() {
        if (this.librosFiltrados.length === 0) {
            this.mostrarMensajeSinLibros();
            return;
        }

        this.mostrarTabla(true);
        
        const inicio = (this.paginaActual - 1) * this.librosPorPagina;
        const fin = inicio + this.librosPorPagina;
        const librosParaMostrar = this.librosFiltrados.slice(inicio, fin);

        // Renderizar filas de la tabla
        this.librosTabla.innerHTML = librosParaMostrar.map(libro => this.crearFilaLibro(libro)).join('');

        // Renderizar paginación
        this.renderizarPaginacion();

        // Agregar event listeners a los botones
        this.agregarEventListenersBotones();
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

            // Crear FormData si hay archivo
            let formData;
            if (portadaFile) {
                formData = new FormData();
                Object.keys(datosActualizados).forEach(key => {
                    const valor = datosActualizados[key] !== null ? datosActualizados[key] : '';
                    formData.append(key, valor);
                    if (key === 'año_publicacion' && valor !== '') {
                        // Alias sin tilde
                        formData.append('anio_publicacion', valor.toString());
                    }
                });
                formData.append('portada', portadaFile);
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
        this.paginationContainer.style.display = mostrar ? 'block' : 'none';
    }

    mostrarMensajeSinLibros() {
        const tabla = document.querySelector('.table-responsive');
        tabla.style.display = 'none';
        this.paginationContainer.style.display = 'none';
        this.noLibrosMessage.style.display = 'block';
    }

    /* ======================== AUTOCOMPLETADO COMPARTIDO ======================== */
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
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const editarPage = new EditarLibrosPage();
    editarPage.init();
});