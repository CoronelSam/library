// Manejo de eventos y acciones de búsqueda
import { EDITAR_CONFIG } from './constants.js';
import { renderizarLibros } from './render.js';
import { UIEditarLibros } from './uiLogic.js';

export function configurarBuscador(context){
  if(!window.BuscadorLibros){
    console.warn('[EditarLibros] BuscadorLibros util no cargado');
    return;
  }
  const { refs, state } = context;
  context.buscador = BuscadorLibros.crear({
    obtenerRecorrido: (params)=> LibroService.obtenerRecorrido(params),
    busquedaOptimizada: (q, opts)=> LibroService.busquedaOptimizada(q, opts),
    minQuery: EDITAR_CONFIG.MIN_QUERY,
    limiteRecorrido: 500,
    limiteBusqueda: 300
  });
  context.buscador.onResultados = (lista, meta) => {
    if(Array.isArray(lista)){
      state.librosFiltrados = lista;
      state.paginaActual = 1;
      renderizarLibros(context);
    }
    UIEditarLibros.actualizarBotonAgregar(context);
  };
  context.buscador.onEstado = (msg)=> { if(refs.estadoBusqueda) refs.estadoBusqueda.textContent = msg || ''; };
  context.buscador.onError = (m,e)=> console.error('[EditarLibros][Buscador]', m, e);
  const tipoInicial = refs.selectRecorrido ? refs.selectRecorrido.value : EDITAR_CONFIG.DEFAULT_RECORRIDO;
  context.buscador.cargarRecorrido({ tipo: tipoInicial, genero: refs.inputGenero?.value.trim() || '', autor: refs.inputAutor?.value.trim() || '', force: true });
}

export function wireEventosBusqueda(context){
  const { refs, buscador } = context;
  const MIN_QUERY = EDITAR_CONFIG.MIN_QUERY;
  const debounceDelay = APP_CONSTANTS.UI_CONFIG?.DEBOUNCE_DELAY || 300;
  const getParams = ()=> ({
    q: refs.buscarInput.value.trim(),
    genero: refs.inputGenero.value.trim(),
    autor: refs.inputAutor.value.trim(),
    prefijo: true
  });
  const cargarRecorrido = (force=false)=>{
    const tipo = refs.selectRecorrido.value;
    const genero = refs.inputGenero.value.trim();
    const autor = refs.inputAutor.value.trim();
    buscador?.cargarRecorrido({ tipo, genero, autor, force, qActual: refs.buscarInput.value.trim() });
  };
  if(refs.buscarInput){
    refs.buscarInput.addEventListener('input', ()=>{
      if(refs.buscarInput.value.trim().length >= MIN_QUERY){
        buscador.debounceBuscar(getParams(), debounceDelay);
      } else {
        cargarRecorrido();
      }
    });
  }
  if(refs.buscarBtn){
    refs.buscarBtn.addEventListener('click', ()=>{
      if(refs.buscarInput.value.trim().length >= MIN_QUERY){
        buscador.buscar(getParams());
      } else {
        cargarRecorrido(true);
      }
    });
  }
  if(refs.limpiarBtn){
    refs.limpiarBtn.addEventListener('click', ()=>{
      refs.buscarInput.value='';
      refs.inputGenero.value='';
      refs.inputAutor.value='';
      context.state.librosFiltrados = [...context.state.libros];
      context.state.paginaActual = 1;
      renderizarLibros(context);
      if(refs.estadoBusqueda) refs.estadoBusqueda.textContent='';
      cargarRecorrido(true);
    });
  }
  if(refs.selectRecorrido){
    refs.selectRecorrido.addEventListener('change', ()=> cargarRecorrido(true));
  }
  if(refs.inputGenero){
    refs.inputGenero.addEventListener('input', ()=>{
      if(refs.buscarInput.value.trim().length >= MIN_QUERY){ buscador.debounceBuscar(getParams(), debounceDelay); } else { cargarRecorrido(); }
    });
  }
  if(refs.inputAutor){
    refs.inputAutor.addEventListener('input', ()=>{
      if(refs.buscarInput.value.trim().length >= MIN_QUERY){ buscador.debounceBuscar(getParams(), debounceDelay); } else { cargarRecorrido(); }
    });
  }
  if(refs.btnRefrescar){
    refs.btnRefrescar.addEventListener('click', e=>{ e.preventDefault(); cargarRecorrido(true); });
  }
}
