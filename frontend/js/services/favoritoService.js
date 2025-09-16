class FavoritoService {
  static base(){ return API_CONFIG.FULL_ENDPOINTS.FAVORITOS || '/api/favoritos'; }

  static async _fetch(url, options = {}){
    const headers = { ...(API_CONFIG?.REQUEST_CONFIG?.headers||{}) };

    // Inyectar token si existe
    const token = window.authService?.getToken?.();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Evitar forzar Content-Type cuando se envía FormData (el navegador maneja el boundary)
    if(!(options.body instanceof FormData)) {
      // Solo establecer si no existe ya (por seguridad)
      if(!headers['Content-Type']) headers['Content-Type'] = 'application/json';
    } else {
      delete headers['Content-Type'];
      delete headers['content-type'];
    }

    const resp = await fetch(url, { ...options, headers });
    // Manejo básico de 401: si el token expiró, intentar cerrar sesión para forzar re-login
    if (resp.status === 401) {
      console.warn('[FavoritoService] 401 Unauthorized - posible token inválido/expirado');
      try { window.authService?.logout?.(); } catch(_) {}
    }
    return resp;
  }

  static async listar(){
    const res = await this._fetch(`${this.base()}`);
    return res.json();
  }

  static async esFavorito(libroId){
    const res = await this._fetch(`${this.base()}/libro/${libroId}`);
    return res.json();
  }

  static async agregar(libroId){
    const res = await this._fetch(`${this.base()}/libro/${libroId}`, { method: 'POST' });
    return res.json();
  }

  static async eliminar(libroId){
    const res = await this._fetch(`${this.base()}/libro/${libroId}`, { method: 'DELETE' });
    return res.json();
  }

  static async toggle(libroId){
    const res = await this._fetch(`${this.base()}/libro/${libroId}/toggle`, { method: 'POST' });
    return res.json();
  }
}
window.FavoritoService = FavoritoService;
