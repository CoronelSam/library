(function(global){
  const BASE_LIBROS = (window.API_CONFIG && window.API_CONFIG.FULL_ENDPOINTS && window.API_CONFIG.FULL_ENDPOINTS.LIBROS)
    ? window.API_CONFIG.FULL_ENDPOINTS.LIBROS
    : 'http://localhost:3001/api/libros';

  function buildViewURL(id) {
    return `${BASE_LIBROS}/${id}/pdf`;
  }

  function buildDownloadURL(id) {
    return `${BASE_LIBROS}/${id}/download`;
  }

  function buildProxyDownloadURL(id) {
    return `${BASE_LIBROS}/${id}/download/proxy`;
  }

  function openInNewTab(url) {
    try { window.open(url, '_blank'); } catch(e){ console.error('[librosDownload] No se pudo abrir URL:', url, e); }
  }

  function verPDF(id) { openInNewTab(buildViewURL(id)); }
  function descargarPDF(id, opciones = { proxy: true, fallback: true }) {
    const primary = opciones.proxy ? buildProxyDownloadURL(id) : buildDownloadURL(id);
    openInNewTab(primary);
    if (opciones.proxy && opciones.fallback === true) {
      // se podria intentar un chequeo posterior, pero window.open no da feedback.
      // mantener un placeholder para ampliar (beacon, health ping, etc.).
    }
  }

  global.librosDownload = {
    buildViewURL,
    buildDownloadURL,
    buildProxyDownloadURL,
    verPDF,
    descargarPDF
  };
})(window);
