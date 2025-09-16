class FavoritosPage {
  constructor(){
    this.contenedor = document.getElementById('listaFavoritos');
    this.loading = document.getElementById('favoritosLoading');
    this.empty = document.getElementById('favoritosEmpty');
    this.errorBox = document.getElementById('favoritosError');
    this.errorMsg = document.getElementById('favoritosErrorMsg');
    this.btnReintentar = document.getElementById('btnReintentarFavoritos');
    this.init();
  }

  init(){
    if (!authService.isAuthenticated()) {
      window.location.href = '../login.html';
      return;
    }
    const userRole = authService.getUserRole();
    if (userRole === 'admin' || userRole === 'mod') {
      window.location.href = '../admin/admin.html';
      return;
    }
    this.configurarCerrarSesion();
    this.cargarFavoritos();
    this.btnReintentar?.addEventListener('click', ()=> this.cargarFavoritos());
  }

  mostrarEstado({loading=false, empty=false, error=false}){
    if(this.loading) this.loading.classList.toggle('d-none', !loading);
    if(this.empty) this.empty.classList.toggle('d-none', !empty);
    if(this.errorBox) this.errorBox.classList.toggle('d-none', !error);
    if(this.contenedor) this.contenedor.style.display = (loading||empty||error)?'none':'flex';
  }

  async cargarFavoritos(){
    this.mostrarEstado({loading:true});
    this.contenedor.innerHTML='';
    try {
      const resp = await FavoritoService.listar();
      const lista = resp.favoritos || resp.data || [];
      if(!Array.isArray(lista) || lista.length===0){
        this.mostrarEstado({empty:true});
        return;
      }
      const tarjetas = lista.map(f => this.generarTarjetaLibro(f.libro || f));
      this.contenedor.innerHTML = tarjetas.join('');
      this.mostrarEstado({});
    } catch(err){
      console.error('Error cargando favoritos:', err);
      if(this.errorMsg) this.errorMsg.textContent = err.message || 'No se pudieron obtener los favoritos.';
      this.mostrarEstado({error:true});
    }
  }

  generarTarjetaLibro(libro){
    if(!libro) return '';
    const portada = libro.portada || 'https://via.placeholder.com/150x220.png/E9ECEF/343A40?text=Sin+Portada';
    const titulo = libro.titulo || 'Título no disponible';
    const autor = libro.autor || 'Autor desconocido';
    const anioTexto = libro.año_publicacion ? `(${libro.año_publicacion})` : '';
    const tienePDF = libro.archivo && libro.archivo.trim() !== '';
    const botonesPDF = tienePDF ? `\n      <div class="btn-group d-flex mb-2" role="group">\n        <button class="btn btn-sm btn-success flex-fill" onclick=\"verPDF(${libro.id})\" title=\"Ver PDF\"><i class=\"bi bi-eye\"></i></button>\n        <button class="btn btn-sm btn-primary flex-fill" onclick=\"descargarPDF(${libro.id})\" title=\"Descargar PDF\"><i class=\"bi bi-download\"></i></button>\n      </div>`
      : `<div class=\"mb-2\"><small class=\"text-muted\"><i class=\"bi bi-file-earmark-x\"></i> Sin PDF</small></div>`;
    return `\n      <div class=\"col-md-4 col-lg-2 mb-4\">\n        <div class=\"book-card text-center\">\n          <img src=\"${portada}\" class=\"img-fluid mb-3 book-cover\" alt=\"${titulo}\" style=\"height:220px;object-fit:cover;cursor:pointer;\" onclick=\"irADetalle(${libro.id})\">\n          <h6 class=\"book-title mb-1\" style=\"height:40px;overflow:hidden;\">${titulo}</h6>\n          <p class=\"text-muted small mb-2\">${autor} ${anioTexto}</p>\n          ${botonesPDF}\n          <div class=\"d-grid gap-2\">\n            <button class=\"btn btn-sm btn-outline-primary\" onclick=\"irADetalle(${libro.id})\"><i class=\"bi bi-eye me-1\"></i>Ver Detalle</button>\n            <button class=\"btn btn-sm btn-outline-danger\" onclick=\"toggleFavorito(${libro.id}, this)\" title=\"Quitar de favoritos\"><i class=\"bi bi-heart-fill\"></i></button>\n          </div>\n        </div>\n      </div>`;
  }

  configurarCerrarSesion(){
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
          authService.logout();
        }
      });
    }
  }
}

function irADetalle(id){ window.location.href = `detalle.html?id=${id}`; }
function verPDF(id){
  try {
    if (window.LibroService?.abrirPDF) return window.LibroService.abrirPDF(id);
    const base = API_CONFIG?.FULL_ENDPOINTS?.LIBROS || (API_CONFIG?.API_URL + '/libros');
    window.open(`${base}/${id}/pdf`, '_blank');
  } catch(e){ console.error(e); }
}
function descargarPDF(id){
  try {
    if (window.LibroService?.descargarPDFProxy) return window.LibroService.descargarPDFProxy(id);
    if (window.LibroService?.descargarPDF) return window.LibroService.descargarPDF(id);
    const base = API_CONFIG?.FULL_ENDPOINTS?.LIBROS || (API_CONFIG?.API_URL + '/libros');
    window.open(`${base}/${id}/download/proxy`, '_blank');
  } catch(e){ console.error(e); }
}

async function toggleFavorito(libroId, btn){
  if(!window.FavoritoService) return;
  btn.disabled = true;
  try {
    const resp = await FavoritoService.toggle(libroId);
    if(!resp.favorito){
      const col = btn.closest('.col-md-4') || btn.closest('.col-lg-2') || btn.closest('.mb-4') || btn.closest('[class*="col-"]');
      if(col) col.remove();
      const cont = document.getElementById('listaFavoritos');
      if(cont && cont.children.length===0){
        document.getElementById('favoritosEmpty')?.classList.remove('d-none');
      }
    } else {
      btn.innerHTML = '<i class="bi bi-heart-fill"></i>';
    }
  } catch(err){
    console.error('Error toggle favorito:', err);
    alert('No se pudo actualizar favorito.');
  } finally {
    btn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', ()=> new FavoritosPage());
