// Clase principal refactorizada en módulos
import { EDITAR_CONFIG } from './constants.js';
import { obtenerReferenciasDOM } from './domRefs.js';
import { renderizarLibros } from './render.js';
import { UIEditarLibros } from './uiLogic.js';
import { configurarBuscador, wireEventosBusqueda } from './buscadorHandler.js';

class EditarLibrosPage {
  constructor(){
    this.state = {
      libros: [],
      librosFiltrados: [],
      paginaActual: 1,
      librosPorPagina: 10,
      libroSeleccionadoParaEliminar: null
    };
    this.refs = {};
    this.modals = { editar: null, eliminar: null };
    this.buscador = null;
    this.autocompleteInstance = null;
  }
  async init(){
    if(!this.validarDependencias()) return;
    this.refs = obtenerReferenciasDOM();
    this.initModals();
    this.initGeneroAutocomplete();
    await this.cargarLibros();
    configurarBuscador(this);
    wireEventosBusqueda(this);
    this.wireBotonAgregarDesdeBusqueda();
    this.wireAccionesCRUD();
    console.log('📚 [EditarLibros] Página inicializada (modular)');
  }
  validarDependencias(){
    const deps = ['API_CONFIG','APP_CONSTANTS','LibroService','UIUtils'];
    const faltantes = deps.filter(d=> !window[d]);
    if(faltantes.length){
      console.error('Dependencias faltantes:', faltantes);
      UIUtils.mostrarNotificacion('error','Error al cargar el sistema. Recarga la página.');
      return false; }
    return true;
  }
  initModals(){
    this.modals.editar = new bootstrap.Modal(document.getElementById('editarLibroModal'));
    this.modals.eliminar = new bootstrap.Modal(document.getElementById('confirmarEliminarModal'));
    document.getElementById('editarLibroModal').addEventListener('hidden.bs.modal', ()=>{
      UIEditarLibros.limpiarFormularioEdicion();
      if(this.refs.editGeneroSuggestions){
        this.refs.editGeneroSuggestions.innerHTML='';
        this.refs.editGeneroSuggestions.style.display='none';
      }
    });
  }
  initGeneroAutocomplete(){
    if(!window.GeneroAutocomplete) return;
    if(this.refs.editGeneroInput && this.refs.editGeneroSuggestions){
      this.autocompleteInstance = window.GeneroAutocomplete.setup({
        input: this.refs.editGeneroInput,
        select: this.refs.editGeneroSelect,
        suggestionsContainer: this.refs.editGeneroSuggestions
      });
    }
  }
  async cargarLibros(){
    try {
      UIEditarLibros.mostrarLoading(this.refs, true);
      UIUtils.limpiarNotificaciones();
      const resp = await LibroService.obtenerTodos();
      if(resp.success){
        this.state.libros = resp.data;
        this.state.librosFiltrados = [...resp.data];
        renderizarLibros(this);
      } else throw new Error(resp.mensaje || 'Error al cargar libros');
    } catch(err){
      console.error('❌ Error al cargar libros:', err);
      UIUtils.mostrarNotificacion('error', `Error al cargar libros: ${err.message}`);
      UIEditarLibros.mostrarMensajeSinLibros(this.refs);
    } finally {
      UIEditarLibros.mostrarLoading(this.refs, false);
    }
  }
  wireBotonAgregarDesdeBusqueda(){
    if(!this.refs.agregarDesdeBusquedaBtn) return;
    this.refs.agregarDesdeBusquedaBtn.addEventListener('click', e=>{
      e.preventDefault();
      const tituloRaw = (this.refs.buscarInput.value || '').trim();
      if(!tituloRaw) return;
      const qp = new URLSearchParams({ titulo: tituloRaw });
      window.location.href = `agregar.html?${qp.toString()}`;
    });
  }
  wireAccionesCRUD(){
    document.getElementById('guardar-cambios-btn').addEventListener('click', ()=> this.guardarCambios());
    document.getElementById('confirmar-eliminar-btn').addEventListener('click', ()=> this.eliminarLibro());
  }
  async guardarCambios(){
    try {
      const libroId = document.getElementById('edit-libro-id').value;
      const portadaFile = document.getElementById('edit-portada').files[0];
      const archivoFile = document.getElementById('edit-archivo') ? document.getElementById('edit-archivo').files[0] : null;
      const eliminarArchivo = document.getElementById('eliminar-archivo-checkbox')?.checked || false;
      let añoRaw = document.getElementById('edit-año').value.trim();
      if (añoRaw && !/^[0-9]{1,4}$/.test(añoRaw)) añoRaw='';
      const datosActualizados = {
        titulo: document.getElementById('edit-titulo').value.trim(),
        autor: document.getElementById('edit-autor').value.trim(),
        genero: (()=>{ const sel=document.getElementById('edit-genero-select'); const libre=document.getElementById('edit-genero-input'); if(sel && sel.value && sel.value!=='Seleccionar género...') return sel.value.trim(); if(libre && libre.value.trim()) return libre.value.trim(); return ''; })(),
        editorial: document.getElementById('edit-editorial').value.trim(),
        año_publicacion: añoRaw ? parseInt(añoRaw,10) : null,
        descripcion: document.getElementById('edit-descripcion').value.trim()
      };
      if(!datosActualizados.titulo || !datosActualizados.autor || !datosActualizados.genero){
        UIUtils.mostrarNotificacion('error','Título, autor y género son campos obligatorios'); return; }
      const guardarBtn = document.getElementById('guardar-cambios-btn');
      UIUtils.mostrarLoading(guardarBtn,'Guardando...');
      let formData;
      if(portadaFile || archivoFile || eliminarArchivo){
        formData = new FormData();
        Object.keys(datosActualizados).forEach(k=>{ const v = datosActualizados[k] !== null ? datosActualizados[k] : ''; formData.append(k,v); if(k==='año_publicacion' && v!==''){ formData.append('anio_publicacion', v.toString()); }});
        if(portadaFile) formData.append('portada', portadaFile);
        if(archivoFile) formData.append('archivo', archivoFile);
        if(eliminarArchivo) formData.append('removeArchivo','true');
      } else if(datosActualizados.año_publicacion !== null){
        datosActualizados.anio_publicacion = datosActualizados.año_publicacion;
      }
      const resp = await LibroService.actualizar(libroId, formData || datosActualizados);
      if(resp.success){
        UIUtils.mostrarNotificacion('success','Libro actualizado correctamente');
        UIUtils.mostrarToast('Libro actualizado correctamente','success');
        this.modals.editar.hide();
        await this.cargarLibros();
      } else throw new Error(resp.mensaje || 'Error al actualizar libro');
    } catch(err){
      console.error('❌ Error al actualizar libro:', err);
      UIUtils.mostrarNotificacion('error', `Error al actualizar libro: ${err.message}`);
    } finally { UIUtils.ocultarLoading(document.getElementById('guardar-cambios-btn')); }
  }
  async eliminarLibro(){
    try {
      if(!this.state.libroSeleccionadoParaEliminar) return;
      const confirmarBtn = document.getElementById('confirmar-eliminar-btn');
      UIUtils.mostrarLoading(confirmarBtn,'Eliminando...');
      const resp = await LibroService.eliminar(this.state.libroSeleccionadoParaEliminar.id);
      if(resp.success){
        UIUtils.mostrarNotificacion('success','Libro eliminado correctamente');
        this.modals.eliminar.hide();
        await this.cargarLibros();
      } else throw new Error(resp.mensaje || 'Error al eliminar libro');
    } catch(err){
      console.error('❌ Error al eliminar libro:', err);
      UIUtils.mostrarNotificacion('error', `Error al eliminar libro: ${err.message}`);
    } finally { UIUtils.ocultarLoading(document.getElementById('confirmar-eliminar-btn')); this.state.libroSeleccionadoParaEliminar=null; }
  }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', ()=>{
  const page = new EditarLibrosPage();
  page.init();
});
