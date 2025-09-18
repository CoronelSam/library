(function(){
  const inputBusqueda = document.getElementById('inputBusqueda');
  const buscarBtn = document.getElementById('buscar-btn');
  const limpiarBtn = document.getElementById('limpiar-btn');
  const selectRecorrido = document.getElementById('selectRecorrido');
  const inputGenero = document.getElementById('inputGenero');
  const inputAutor = document.getElementById('inputAutor');
  const btnRefrescar = document.getElementById('btnRefrescar');
  const tbody = document.getElementById('tbodyResultados');
  const estado = document.getElementById('estadoBusqueda');
  const filaPlaceholder = document.getElementById('filaPlaceholder');

  const MIN_QUERY = 2;

  function setEstado(msg){ if (estado) estado.textContent = msg || ''; }
  function limpiarTabla(){ if(tbody) tbody.innerHTML = ''; }
  function escapeHtml(str){ if(str==null) return ''; return str.toString().replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])); }
  
  function renderLibros(libros){
    limpiarTabla();
    if(!libros || libros.length === 0){
      if(tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Sin resultados</td></tr>';
      return;
    }
    const frag = document.createDocumentFragment();
    libros.forEach(l => {
      const tr = document.createElement('tr');
      
      const portada = l.portada 
        ? `<img src="${l.portada}" alt="Portada" class="img-thumbnail" style="width: 50px; height: 70px; object-fit: cover;">`
        : `<div class="bg-light d-flex align-items-center justify-content-center" style="width: 50px; height: 70px; border-radius: 4px;"><i class="bi bi-book text-muted"></i></div>`;
      
      tr.innerHTML = `
        <td>${portada}</td>
        <td>${escapeHtml(l.titulo)}</td>
        <td>${escapeHtml(l.autor || '')}</td>
        <td><span class="badge bg-primary rounded-pill">${escapeHtml(l.genero || '')}</span></td>
        <td>${escapeHtml(l.isbn) || '<em class="text-muted">N/A</em>'}</td>
        <td class="text-center"><a href="detalle.html?id=${l.id}" class="btn btn-sm btn-primary"><i class="bi bi-eye-fill me-1"></i>Ver</a></td>`;
      
      frag.appendChild(tr);
    });
    if(tbody) tbody.appendChild(frag);
  }

  const buscador = BuscadorLibros.crear({
    obtenerRecorrido: (params) => LibroService.obtenerRecorrido(params),
    busquedaOptimizada: (q, opts) => LibroService.busquedaOptimizada(q, opts),
    minQuery: MIN_QUERY,
    limiteRecorrido: 300,
    limiteBusqueda: 200
  });

  buscador.onResultados = (lista, meta) => { renderLibros(lista); };
  buscador.onEstado = msg => setEstado(msg);
  buscador.onError = (msg, err) => {
    console.error('[BuscarUsuario]', msg, err);
    if(tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4">Error al cargar los libros</td></tr>';
  };

  function cargarRecorridoInicial(force = false){
    if(filaPlaceholder) filaPlaceholder.style.display = '';
    const tipo = selectRecorrido.value;
    const genero = inputGenero.value.trim();
    const autor = inputAutor.value.trim();
    buscador.cargarRecorrido({ tipo, genero, autor, force, qActual: inputBusqueda.value.trim() });
  }

  function ejecutarBusqueda(){
    const q = inputBusqueda.value.trim();
    const genero = inputGenero.value.trim();
    const autor = inputAutor.value.trim();
    buscador.buscar({ q, genero, autor, prefijo: true });
  }

  function debounceBusqueda(){
    const q = inputBusqueda.value.trim();
    const genero = inputGenero.value.trim();
    const autor = inputAutor.value.trim();
    const debounceDelay = APP_CONSTANTS.UI_CONFIG?.DEBOUNCE_DELAY || 300;
    buscador.debounceBuscar({ q, genero, autor, prefijo: true }, debounceDelay);
  }

  function limpiarBusqueda(){
    if(inputBusqueda) inputBusqueda.value = '';
    if(inputGenero) inputGenero.value = '';
    if(inputAutor) inputAutor.value = '';
    cargarRecorridoInicial(true);
  }

  function onInputBusqueda(){
    const q = inputBusqueda.value.trim();
    if (q.length >= MIN_QUERY) {
      debounceBusqueda();
    } else if (q.length === 0) {
      cargarRecorridoInicial();
    }
  }

  function initEventos(){
    if(inputBusqueda){
      inputBusqueda.addEventListener('input', onInputBusqueda);
    }
    
    if(buscarBtn){
      buscarBtn.addEventListener('click', () => {
        if(inputBusqueda.value.trim().length >= MIN_QUERY){
          ejecutarBusqueda();
        } else {
          cargarRecorridoInicial(true);
        }
      });
    }
    
    if(limpiarBtn){
      limpiarBtn.addEventListener('click', () => {
        limpiarBusqueda();
      });
    }
    
    if(selectRecorrido){
      selectRecorrido.addEventListener('change', ()=> cargarRecorridoInicial(true));
    }
    
    if(inputGenero){
      inputGenero.addEventListener('input', () => {
        if(inputBusqueda.value.trim().length >= MIN_QUERY){
          debounceBusqueda();
        } else {
          cargarRecorridoInicial();
        }
      });
    }
    
    if(inputAutor){
      inputAutor.addEventListener('input', () => {
        if(inputBusqueda.value.trim().length >= MIN_QUERY){
          debounceBusqueda();
        } else {
          cargarRecorridoInicial();
        }
      });
    }
    
    if(btnRefrescar){ 
      btnRefrescar.addEventListener('click', e => { 
        e.preventDefault(); 
        cargarRecorridoInicial(true); 
      }); 
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    cargarRecorridoInicial();
    initEventos();
  });
})();