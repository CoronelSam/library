(function(){
  const inputBusqueda = document.getElementById('inputBusqueda');
  const selectRecorrido = document.getElementById('selectRecorrido');
  const inputGenero = document.getElementById('inputGenero');
  const inputAutor = document.getElementById('inputAutor');
  const btnRefrescar = document.getElementById('btnRefrescar');
  const tbody = document.getElementById('tbodyResultados');
  const estado = document.getElementById('estadoBusqueda');

  const MIN_QUERY = 2;

  function setEstado(msg){ if (estado) estado.textContent = msg || ''; }
  function limpiarTabla(){ tbody.innerHTML = ''; }
  function escapeHtml(str){ if(str==null) return ''; return str.toString().replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])); }
  function renderLibros(libros){
    limpiarTabla();
    if(!libros || libros.length===0){
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Sin resultados</td></tr>';
      return;
    }
    const frag = document.createDocumentFragment();
    libros.forEach(l => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(l.titulo)}</td>
        <td>${escapeHtml(l.autor||'')}</td>
        <td>${escapeHtml(l.genero||'')}</td>
        <td>${l.año_publicacion||''}</td>
        <td class="text-center"><a href="detalle.html?id=${l.id}" class="btn btn-sm btn-primary"><i class="bi bi-eye-fill me-1"></i>Ver</a></td>`;
      frag.appendChild(tr);
    });
    tbody.appendChild(frag);
  }

  // Crear instancia del buscador compartido
  const buscador = BuscadorLibros.crear({
    obtenerRecorrido: (params) => LibroService.obtenerRecorrido(params),
    busquedaOptimizada: (q, opts) => LibroService.busquedaOptimizada(q, opts),
    minQuery: MIN_QUERY,
    limiteRecorrido: 300,
    limiteBusqueda: 200
  });

  buscador.onResultados = (lista, meta) => { renderLibros(lista); };
  buscador.onEstado = msg => setEstado(msg);
  buscador.onError = (msg, err) => console.error('[BuscarUsuario]', msg, err);

  function cargarRecorridoInicial(){
    const tipo = selectRecorrido.value;
    buscador.cargarRecorrido({ tipo, genero: inputGenero.value.trim(), autor: inputAutor.value.trim(), force: true });
  }

  function ejecutarBusqueda(){
    buscador.buscar({ q: inputBusqueda.value.trim(), genero: inputGenero.value.trim(), autor: inputAutor.value.trim(), prefijo: true });
  }

  function onInputBusqueda(){
    buscador.debounceBuscar({ q: inputBusqueda.value.trim(), genero: inputGenero.value.trim(), autor: inputAutor.value.trim(), prefijo: true }, APP_CONSTANTS.UI_CONFIG.DEBOUNCE_DELAY || 300);
  }

  function initEventos(){
    inputBusqueda.addEventListener('input', onInputBusqueda);
    selectRecorrido.addEventListener('change', ()=> cargarRecorridoInicial());
    inputGenero.addEventListener('input', ()=> {
      if(inputBusqueda.value.trim().length >= MIN_QUERY) onInputBusqueda(); else cargarRecorridoInicial();
    });
    inputAutor.addEventListener('input', ()=> {
      if(inputBusqueda.value.trim().length >= MIN_QUERY) onInputBusqueda(); else cargarRecorridoInicial();
    });
    if(btnRefrescar){ btnRefrescar.addEventListener('click', e=>{ e.preventDefault(); cargarRecorridoInicial(); }); }
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Asegurar que siempre se cargue un recorrido inicial completo
    cargarRecorridoInicial();
    initEventos();
  });
})();
