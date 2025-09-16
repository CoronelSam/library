import { renderizarLibros } from './render.js';

export const UIEditarLibros = {
  mostrarLoading(refs, mostrar){
    refs.loadingContainer.style.display = mostrar ? 'block' : 'none';
    this.mostrarTabla(refs, !mostrar);
  },
  mostrarTabla(refs, mostrar){
    const tabla = document.querySelector('.table-responsive');
    if(tabla) tabla.style.display = mostrar ? 'block' : 'none';
    if(refs.noLibrosMessage) refs.noLibrosMessage.style.display = 'none';
  },
  mostrarMensajeSinLibros(refs){
    const tabla = document.querySelector('.table-responsive');
    if(tabla) tabla.style.display = 'none';
    if(refs.paginationContainer) refs.paginationContainer.style.display = 'none';
    if(refs.noLibrosMessage) refs.noLibrosMessage.style.display = 'block';
  },
  actualizarBotonAgregar(context){
    const { refs, state } = context;
    if(!refs.agregarDesdeBusquedaContainer) return;
    const termino = (refs.buscarInput?.value || '').trim();
    const sinResultados = state.librosFiltrados.length === 0;
    if(termino && sinResultados){
      refs.agregarDesdeBusquedaTitulo.textContent = termino.length > 40 ? termino.slice(0,40)+'…' : termino;
      refs.agregarDesdeBusquedaContainer.style.display = 'block';
    } else {
      refs.agregarDesdeBusquedaContainer.style.display = 'none';
    }
  },
  limpiarFormularioEdicion(){
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
    document.getElementById('edit-portada').value = '';
    const archivoInput = document.getElementById('edit-archivo');
    if (archivoInput) archivoInput.value = '';
    document.getElementById('portada-actual-container').style.display = 'none';
    document.getElementById('portada-actual').src = '';
  },
  abrirModalEditar(context, libroId){
    const { state } = context;
    const libro = state.libros.find(l=> l.id === libroId);
    if(!libro){ UIUtils.mostrarNotificacion('error','Libro no encontrado'); return; }
    this.limpiarFormularioEdicion();
    document.getElementById('edit-libro-id').value = libro.id;
    document.getElementById('edit-titulo').value = libro.titulo;
    document.getElementById('edit-autor').value = libro.autor;
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

    if(libro.portada){
      document.getElementById('portada-actual').src = libro.portada;
      document.getElementById('portada-actual-container').style.display = 'block';
    } else {
      document.getElementById('portada-actual-container').style.display = 'none';
    }

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
      verArchivoLink.href = LibroService.pdfViewUrl(libro.id);
      descargarArchivoLink.href = LibroService.pdfDownloadUrl(libro.id, { proxy: true });
      verArchivoLink.onclick = (e)=>{ e.preventDefault(); LibroService.abrirPDF(libro.id); };
      descargarArchivoLink.onclick = (e)=>{ e.preventDefault(); LibroService.descargarPDFProxy ? LibroService.descargarPDFProxy(libro.id) : LibroService.descargarPDF(libro.id); };
    } else {
      archivoActualContainer.style.display = 'none';
      sinArchivoContainer.style.display = 'block';
    }

    if (eliminarCheckbox) {
      eliminarCheckbox.onchange = (e) => {
        if (e.target.checked) {
          const confirmado = window.confirm('¿Seguro que deseas eliminar el PDF actual? Esta acción no se puede deshacer si no subes otro antes de guardar.');
          if (!confirmado) e.target.checked = false;
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

    context.modals.editar.show();
  },
  abrirModalEliminar(context, libroId){
    const { state } = context;
    const libro = state.libros.find(l => l.id === libroId);
    if(!libro){ UIUtils.mostrarNotificacion('error','Libro no encontrado'); return; }
    state.libroSeleccionadoParaEliminar = libro;
    document.getElementById('libro-a-eliminar-titulo').textContent = libro.titulo;
    context.modals.eliminar.show();
  }
};
