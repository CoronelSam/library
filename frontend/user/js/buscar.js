(function(){
  const inputBusqueda = document.getElementById('inputBusqueda');
  const selectRecorrido = document.getElementById('selectRecorrido');
  const inputGenero = document.getElementById('inputGenero');
  const inputAutor = document.getElementById('inputAutor');
  const btnRefrescar = document.getElementById('btnRefrescar');
  const tbody = document.getElementById('tbodyResultados');
  const estado = document.getElementById('estadoBusqueda');
  const placeholder = document.getElementById('filaPlaceholder');

  const MIN_QUERY = 2;
  let cacheRecorrido = { tipo: null, data: [] };
  let debounceTimer = null;

  function setEstado(msg){
    if (estado) estado.textContent = msg || '';
  }

  function limpiarTabla(){
    tbody.innerHTML = '';
  }

  function renderLibros(libros){
    limpiarTabla();
    if(!libros || libros.length === 0){
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Sin resultados</td></tr>';
      return;
    }
    const frag = document.createDocumentFragment();
    libros.forEach(l => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(l.titulo)}</td>
        <td>${escapeHtml(l.autor || '')}</td>
        <td>${escapeHtml(l.genero || '')}</td>
        <td>${l.año_publicacion || ''}</td>
        <td class="text-center">
          <a href="detalle.html?id=${l.id}" class="btn btn-sm btn-primary"><i class="bi bi-eye-fill me-1"></i>Ver</a>
        </td>`;
      frag.appendChild(tr);
    });
    tbody.appendChild(frag);
  }

  function escapeHtml(str){
    if(str === null || str === undefined) return '';
    return str.toString().replace(/[&<>"']/g, function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]);
    });
  }

  async function cargarRecorrido(force=false){
    const tipo = selectRecorrido.value;
    const genero = inputGenero.value.trim();
    const autor = inputAutor.value.trim();

    if(!force && cacheRecorrido.tipo === tipo && !genero && !autor && !inputBusqueda.value.trim()){
      renderLibros(cacheRecorrido.data);
      return;
    }

    try {
      setEstado('Cargando recorrido...');
      const resp = await LibroService.obtenerRecorrido({ tipo, genero, autor, limite: 300 });
      if(resp.success){
        if(!genero && !autor && !inputBusqueda.value.trim()){
            cacheRecorrido = { tipo, data: resp.data };
        }
        renderLibros(resp.data);
        setEstado(`Recorrido ${tipo} (${resp.total} libros)`);
      } else {
        renderLibros([]);
        setEstado('Error al cargar recorrido');
      }
    } catch (err){
      console.error('Error cargarRecorrido:', err);
      renderLibros([]);
      setEstado('Error de conexión');
    }
  }

  async function ejecutarBusqueda(){
    const q = inputBusqueda.value.trim();
    const genero = inputGenero.value.trim();
    const autor = inputAutor.value.trim();

    if(q.length < MIN_QUERY){
      await cargarRecorrido();
      return;
    }

    try {
      setEstado('Buscando...');
      // reusa el endpoint optimizado para mejor relevancia
      const resp = await LibroService.busquedaOptimizada(q, { limite: 200, genero, autor, prefijo: true });
      if(resp.success){
        renderLibros(resp.data);
        if(resp.total === 0 && resp.sugerencias && resp.sugerencias.length){
          // muestra sugerencias como resultados alternos
          const sugerencias = resp.sugerencias.map(s => ({...s, _sugerencia: true}));
          renderLibros(sugerencias);
          setEstado('Sin coincidencias. Mostrando sugerencias similares.');
        } else {
          setEstado(`Encontrados ${resp.total} resultados`);
        }
      } else {
        renderLibros([]);
        setEstado('Error en búsqueda');
      }
    } catch (err){
      console.error('Error ejecutarBusqueda:', err);
      renderLibros([]);
      setEstado('Error de conexión');
    }
  }

  function onInputBusqueda(){
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(ejecutarBusqueda, APP_CONSTANTS.UI_CONFIG.DEBOUNCE_DELAY || 300);
  }

  function initEventos(){
    inputBusqueda.addEventListener('input', onInputBusqueda);
    selectRecorrido.addEventListener('change', () => cargarRecorrido(true));
    inputGenero.addEventListener('input', () => {
      // Si hay término activo, buscar; si no, recargar recorrido filtrado
      if(inputBusqueda.value.trim().length >= MIN_QUERY){
        onInputBusqueda();
      } else {
        cargarRecorrido(true);
      }
    });
    inputAutor.addEventListener('input', () => {
      if(inputBusqueda.value.trim().length >= MIN_QUERY){
        onInputBusqueda();
      } else {
        cargarRecorrido(true);
      }
    });
    if(btnRefrescar){
      btnRefrescar.addEventListener('click', (e)=>{ e.preventDefault(); cargarRecorrido(true); });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Cargar recorrido inicial
    cargarRecorrido(true);
    initEventos();
  });
})();
