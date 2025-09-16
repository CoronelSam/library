class Dashboard {
    constructor() {
        this.libros = [];
        this.apiUrl = API_CONFIG.API_URL + '/libros';
        this.init();
    }

    async init() {
        // Verificar autenticación
        if (!authService.isAuthenticated()) {
            window.location.href = '../login.html';
            return;
        }

        const userRole = authService.getUserRole();
        if (userRole === 'admin' || userRole === 'mod') {
            // Redirigir al panel de administración
            window.location.href = '../admin/admin.html';
            return;
        }

        try {
            await this.cargarLibros();
            this.mostrarLibrosDestacados();
            this.configurarCerrarSesion();
        } catch (error) {
            console.error('Error al inicializar dashboard:', error);
            this.mostrarError();
        }
    }

    async cargarLibros() {
        try {
            // Incluir token en la petición
            const token = authService.getToken();
            const response = await fetch(this.apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.data) {
                this.libros = data.data;
            } else {
                throw new Error('No se pudieron cargar los libros');
            }
        } catch (error) {
            console.error('Error al cargar libros:', error);
            throw error;
        }
    }

    configurarCerrarSesion() {
        const botonCerrarSesion = document.getElementById('logout-btn');
        if (botonCerrarSesion) {
            botonCerrarSesion.addEventListener('click', (e) => {
                e.preventDefault();
                // Mostrar confirmación antes de cerrar sesión
                if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                    authService.logout();
                }
            });
        }
    }

    mostrarLibrosDestacados() {
        const contenedor = document.getElementById('libros-destacados');
        if (!contenedor) return;

        // Obtener los últimos 6 libros agregados
        const librosRecientes = this.libros
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 6);

        if (librosRecientes.length === 0) {
            contenedor.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        No hay libros disponibles en la biblioteca.
                    </div>
                </div>
            `;
            return;
        }

        contenedor.innerHTML = librosRecientes.map(libro => this.generarTarjetaLibro(libro)).join('');
    }

    generarTarjetaLibro(libro) {
        const portada = libro.portada || 'https://via.placeholder.com/150x220.png/E9ECEF/343A40?text=Sin+Portada';
        const titulo = libro.titulo || 'Título no disponible';
        const autor = libro.autor || 'Autor desconocido';
        const añoTexto = libro.año_publicacion ? `(${libro.año_publicacion})` : '';
        const tienePDF = libro.archivo && libro.archivo.trim() !== '';

        // Botones PDF si están disponibles
        const botonesPDF = tienePDF ? `
            <div class="btn-group d-flex mb-2" role="group">
                <button class="btn btn-sm btn-success flex-fill" onclick="verPDF(${libro.id})" title="Ver PDF">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-primary flex-fill" onclick="descargarPDF(${libro.id})" title="Descargar PDF">
                    <i class="bi bi-download"></i>
                </button>
            </div>
        ` : `
            <div class="mb-2">
                <small class="text-muted"><i class="bi bi-file-earmark-x"></i> Sin PDF</small>
            </div>
        `;

        return `
            <div class="col-md-4 col-lg-2 mb-4">
                <div class="book-card text-center">
                    <img src="${portada}" 
                         class="img-fluid mb-3 book-cover" 
                         alt="${titulo}"
                         style="height: 220px; object-fit: cover; cursor: pointer;"
                         onclick="irADetalle(${libro.id})">
                    <h6 class="book-title mb-1" style="height: 40px; overflow: hidden;">${titulo}</h6>
                    <p class="text-muted small mb-2">${autor} ${añoTexto}</p>
                    ${botonesPDF}
                    <button class="btn btn-sm btn-outline-primary d-block w-100" onclick="irADetalle(${libro.id})">
                        <i class="bi bi-eye me-1"></i>Ver Detalle
                    </button>
                </div>
            </div>
        `;
    }

    mostrarError() {
        const contenedor = document.getElementById('libros-destacados');
        if (!contenedor) return;

        contenedor.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Error al cargar los libros. Por favor, intenta más tarde.
                </div>
            </div>
        `;
    }
}

// Función global para navegar al detalle
function irADetalle(libroId) {
    window.location.href = `detalle.html?id=${libroId}`;
}

// Funciones globales para manejar PDFs
function verPDF(libroId) {
    try {
        // Priorizar LibroService helpers centralizados
        if (window.LibroService && window.LibroService.abrirPDF) {
            return window.LibroService.abrirPDF(libroId);
        }
        // Fallback a util previo si existe
        if (window.librosDownload && window.librosDownload.verPDF) {
            return window.librosDownload.verPDF(libroId);
        }
        // Fallback final directo
        const base = API_CONFIG?.FULL_ENDPOINTS?.LIBROS || (API_CONFIG?.API_URL + '/libros');
        window.open(`${base}/${libroId}/pdf`, '_blank');
    } catch (error) {
        console.error('Error al abrir PDF:', error);
        alert('Error al abrir el archivo PDF');
    }
}

function descargarPDF(libroId) {
    try {
        if (window.LibroService && window.LibroService.descargarPDFProxy) {
            return window.LibroService.descargarPDFProxy(libroId);
        }
        if (window.LibroService && window.LibroService.descargarPDF) {
            return window.LibroService.descargarPDF(libroId);
        }
        if (window.librosDownload && window.librosDownload.descargarPDF) {
            return window.librosDownload.descargarPDF(libroId, { proxy: true, fallback: true });
        }
        const base = API_CONFIG?.FULL_ENDPOINTS?.LIBROS || (API_CONFIG?.API_URL + '/libros');
        window.open(`${base}/${libroId}/download/proxy`, '_blank');
    } catch (error) {
        console.error('Error al iniciar descarga (proxy):', error);
        if (window.LibroService && window.LibroService.descargarPDF) {
            return window.LibroService.descargarPDF(libroId);
        }
        if (window.librosDownload && window.librosDownload.descargarPDF) {
            return window.librosDownload.descargarPDF(libroId, { proxy: false });
        }
        const base = API_CONFIG?.FULL_ENDPOINTS?.LIBROS || (API_CONFIG?.API_URL + '/libros');
        window.open(`${base}/${libroId}/download`, '_blank');
    }
}

// Inicializar dashboard cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});
