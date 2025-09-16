(function(global){
  function crearBuscadorLibros(config){
    const {
      obtenerRecorrido,
      busquedaOptimizada,
      minQuery = 2,
      limiteRecorrido = 300,
      limiteBusqueda = 300
    } = config;

    if(typeof obtenerRecorrido !== 'function' || typeof busquedaOptimizada !== 'function'){
      throw new Error('crearBuscadorLibros: faltan funciones requeridas');
    }

    const state = {
      cacheRecorrido: { tipo: null, data: [] },
      debounce: null,
      ultimoTipo: null
    };

    const api = {
      onResultados: null,
      onEstado: null,
      onError: null,

      async cargarRecorrido(params){
        const { tipo, genero = '', autor = '', force = false, qActual = '' } = params;
        if(!force && state.cacheRecorrido.tipo === tipo && !genero && !autor && !qActual){
          api._emitResultados(state.cacheRecorrido.data, { modo: 'cache', tipo });
          return;
        }
        try {
          api._emitEstado(`Cargando recorrido...`);
          const resp = await obtenerRecorrido({ tipo, genero, autor, limite: limiteRecorrido });
          if(resp.success){
            if(!genero && !autor && !qActual){
              state.cacheRecorrido = { tipo, data: resp.data };
            }
            api._emitResultados(resp.data, { modo: 'recorrido', tipo, total: resp.total });
            api._emitEstado(`Recorrido ${tipo} (${resp.total} libros)`);
          } else {
            api._emitResultados([], { modo: 'recorrido-error', tipo });
            api._emitEstado('Error al cargar recorrido');
          }
        } catch (err){
          api._emitResultados([], { modo: 'recorrido-error', tipo });
          api._emitEstado('Error de conexión');
          api._emitError('Error cargarRecorrido', err);
        }
      },

      async buscar(params){
        const { q, genero = '', autor = '', prefijo = true } = params;
        if(!q || q.trim().length < minQuery){
          // fallback a recorrido actual
            await api.cargarRecorrido({ tipo: state.cacheRecorrido.tipo || 'inorden', genero, autor, qActual: '' });
            return;
        }
        const query = q.trim();
        try {
          api._emitEstado('Buscando...');
          const resp = await busquedaOptimizada(query, { limite: limiteBusqueda, genero, autor, prefijo });
          if(resp.success){
            if(resp.total === 0 && resp.sugerencias && resp.sugerencias.length){
              const sugerencias = resp.sugerencias.map(s => ({...s, _sugerencia: true}));
              api._emitResultados(sugerencias, { modo: 'sugerencias', total: 0, sugerencias: resp.sugerencias.length });
              api._emitEstado('Sin coincidencias. Mostrando sugerencias similares.');
            } else {
              api._emitResultados(resp.data, { modo: 'busqueda', total: resp.total });
              api._emitEstado(`Encontrados ${resp.total} resultados`);
            }
          } else {
            api._emitResultados([], { modo: 'busqueda-error' });
            api._emitEstado('Error en búsqueda');
          }
        } catch (err){
          api._emitResultados([], { modo: 'busqueda-error' });
          api._emitEstado('Error de conexión');
          api._emitError('Error ejecutarBusqueda', err);
        }
      },

      debounceBuscar(params, delay = 300){
        clearTimeout(state.debounce);
        state.debounce = setTimeout(()=> api.buscar(params), delay);
      },

      _emitResultados(lista, meta){
        if(typeof api.onResultados === 'function') api.onResultados(lista, meta || {});
      },
      _emitEstado(msg){
        if(typeof api.onEstado === 'function') api.onEstado(msg);
      },
      _emitError(msg, err){
        if(typeof api.onError === 'function') api.onError(msg, err);
        else console.error('[BuscadorLibros]', msg, err);
      }
    };

    return api;
  }

  // Exponer
  global.BuscadorLibros = { crear: crearBuscadorLibros };
})(window);
