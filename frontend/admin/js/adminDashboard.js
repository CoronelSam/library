(function(){
  const elTotalLibros = document.getElementById('stat-total-libros');
  const elLibrosDescargados = document.getElementById('stat-libros-descargados');
  const elGeneroPopular = document.getElementById('stat-genero-popular');
  const elGeneroPopularCount = document.getElementById('stat-genero-popular-count');
  const elUsuarios = document.getElementById('stat-usuarios-registrados');

  if(!elTotalLibros) return;

  function setValue(el, value){
    if(el) el.textContent = value;
  }

  function setLoading(){
    [elTotalLibros, elLibrosDescargados, elGeneroPopular, elGeneroPopularCount, elUsuarios].forEach(el => { if(el) el.textContent = '...'; });
  }

  function setError(){
    [elTotalLibros, elLibrosDescargados, elGeneroPopular, elGeneroPopularCount, elUsuarios].forEach(el => { if(el) el.textContent = 'N/D'; });
  }

  async function cargarEstadisticasLibros(){
    try {
      if(!window.API_CONFIG || !window.API_CONFIG.FULL_ENDPOINTS){
        throw new Error('API_CONFIG no definido');
      }
      const resp = await fetch(window.API_CONFIG.FULL_ENDPOINTS.ESTADISTICAS);
      const data = await resp.json();
      if(!resp.ok || !data.success) throw new Error(data.mensaje || 'Error');
      const stats = data.data || {};
      setValue(elTotalLibros, stats.totalLibros != null ? stats.totalLibros : 0);
      setValue(elLibrosDescargados, stats.librosDescargados != null ? stats.librosDescargados : 0);
      if (stats.topGenero && stats.topGenero.genero) {
        setValue(elGeneroPopular, stats.topGenero.genero);
        setValue(elGeneroPopularCount, stats.topGenero.cantidad);
      } else {
        setValue(elGeneroPopular, 'N/D');
        setValue(elGeneroPopularCount, '0');
      }

    } catch(err){
      console.error('Error estadísticas libros:', err);
      setError();
      if(window.UIUtils){
        UIUtils.mostrarToast('No se pudieron cargar estadísticas de libros','warning');
      }
    }
  }

  async function cargarEstadisticasUsuarios(){
    try {
      if(!window.API_CONFIG || !window.API_CONFIG.FULL_ENDPOINTS){
        throw new Error('API_CONFIG no definido');
      }
      const token = localStorage.getItem('token');
      if(!token){
        setValue(elUsuarios, 'N/D');
        return;
      }
      const resp = await fetch(window.API_CONFIG.FULL_ENDPOINTS.ADMIN_ESTADISTICAS, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      if(!resp.ok || !data.success) throw new Error(data.message || 'Error');
      const stats = data.data || {};
      setValue(elUsuarios, stats.totalUsuarios != null ? stats.totalUsuarios : 0);
    } catch(err){
      console.error('Error estadísticas usuarios:', err);
      setValue(elUsuarios, 'N/D');
      if(window.UIUtils){
        UIUtils.mostrarToast('No se pudieron cargar estadísticas de usuarios','warning');
      }
    }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    setLoading();
    cargarEstadisticasLibros();
    cargarEstadisticasUsuarios();
  });
})();
