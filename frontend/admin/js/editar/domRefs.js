// Referencias a elementos del DOM para la página de edición
export function obtenerReferenciasDOM(){
  return {
    buscarInput: document.getElementById('buscar-input'),
    buscarBtn: document.getElementById('buscar-btn'),
    limpiarBtn: document.getElementById('limpiar-btn'),
    selectRecorrido: document.getElementById('selectRecorrido'),
    inputGenero: document.getElementById('inputGenero'),
    inputAutor: document.getElementById('inputAutor'),
    btnRefrescar: document.getElementById('btnRefrescar'),
    estadoBusqueda: document.getElementById('estadoBusqueda'),
    librosTabla: document.getElementById('libros-tbody'),
    loadingContainer: document.getElementById('loading-container'),
    noLibrosMessage: document.getElementById('no-libros-message'),
    paginationContainer: document.getElementById('pagination-container'),
    paginationList: document.getElementById('pagination-list'),
    // Modal edición
    editGeneroInput: document.getElementById('edit-genero-input'),
    editGeneroSelect: document.getElementById('edit-genero-select'),
    editGeneroSuggestions: document.getElementById('edit-genre-suggestions'),
    // Botón agregar desde búsqueda
    agregarDesdeBusquedaContainer: document.getElementById('agregar-desde-busqueda-container'),
    agregarDesdeBusquedaBtn: document.getElementById('agregar-desde-busqueda-btn'),
    agregarDesdeBusquedaTitulo: document.getElementById('agregar-desde-busqueda-titulo')
  };
}
