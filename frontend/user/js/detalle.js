// JavaScript para la página de detalle del libro
class DetalleLibro {
    constructor() {
        this.libroId = null;
        this.apiUrl = API_CONFIG?.FULL_ENDPOINTS?.LIBROS || 'http://localhost:3001/api/libros';
        this.btnFavorito = null;
        this.iconFavorito = null;
        this.init();
    }

    async init() {
        try {
            this.obtenerIdDeURL();
            if (this.libroId) {
                await this.cargarDetalleLibro();
            } else {
                this.mostrarError('No se especificó un libro válido');
            }
        } catch (error) {
            console.error('Error al inicializar detalle:', error);
            this.mostrarError('Error al cargar el detalle del libro');
        }
    }

    obtenerIdDeURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.libroId = urlParams.get('id');
    }

    async cargarDetalleLibro() {
        try {
            const response = await fetch(`${this.apiUrl}/${this.libroId}`);
            const data = await response.json();
            
            if (data.success && data.data) {
                this.mostrarDetalleLibro(data.data);
                await this.initFavorito();
            } else {
                throw new Error('Libro no encontrado');
            }
        } catch (error) {
            console.error('Error al cargar detalle del libro:', error);
            this.mostrarError('No se pudo cargar la información del libro');
        }
    }

    mostrarDetalleLibro(libro) {
        // Actualizar título de la página
        document.title = `${libro.titulo} - Biblioteca`;

        // Actualizar portada
        const portadaElement = document.getElementById('detallePortada');
        if (portadaElement) {
            portadaElement.src = libro.portada || 'https://via.placeholder.com/400x600.png/E9ECEF/343A40?text=Sin+Portada';
            portadaElement.alt = `Portada de ${libro.titulo}`;
        }

        // Actualizar información básica
        this.actualizarElemento('detalleTitulo', libro.titulo || 'Título no disponible');
        this.actualizarElemento('detalleAutor', libro.autor || 'Autor desconocido');
        this.actualizarElemento('detalleGenero', libro.genero || 'Género no especificado');
        this.actualizarElemento('detalleAnio', libro.año_publicacion || 'No especificado');
        this.actualizarElemento('detalleEditorial', libro.editorial || 'No especificada');
        this.actualizarElemento('detalleCodigo', libro.id || 'No disponible');

        // Mostrar descripción si existe
        this.mostrarDescripcion(libro.descripcion);

        // Mostrar fechas del sistema
        this.mostrarFechas(libro.createdAt, libro.updatedAt);

        // Configurar botones de PDF
        this.configurarBotonesPDF(libro);
    }

    configurarBotonesPDF(libro) {
        const botonesPDF = document.getElementById('botonesPDF');
        const mensajeNoPDF = document.getElementById('mensajeNoPDF');
        const btnVerPDF = document.getElementById('btnVerPDF');
        const btnDescargarPDF = document.getElementById('btnDescargarPDF');

        if (libro.archivo && libro.archivo.trim() !== '') {
            // Mostrar botones PDF
            if (botonesPDF) botonesPDF.style.display = 'block';
            if (mensajeNoPDF) mensajeNoPDF.style.display = 'none';

            // Configurar eventos reutilizando LibroService
            if (btnVerPDF) {
                btnVerPDF.onclick = (e) => {
                    e.preventDefault();
                    if (window.LibroService && window.LibroService.abrirPDF) {
                        window.LibroService.abrirPDF(libro.id);
                    } else {
                        window.open(`${this.apiUrl}/${libro.id}/pdf`, '_blank');
                    }
                };
            }
            if (btnDescargarPDF) {
                btnDescargarPDF.onclick = (e) => {
                    e.preventDefault();
                    if (window.LibroService && window.LibroService.descargarPDFProxy) {
                        window.LibroService.descargarPDFProxy(libro.id);
                    } else if (window.LibroService && window.LibroService.descargarPDF) {
                        window.LibroService.descargarPDF(libro.id);
                    } else {
                        // Fallback directo
                        window.open(`${this.apiUrl}/${libro.id}/download/proxy`, '_blank');
                    }
                };
            }
        } else {
            // Mostrar mensaje de no disponible
            if (botonesPDF) botonesPDF.style.display = 'none';
            if (mensajeNoPDF) mensajeNoPDF.style.display = 'block';
        }
    }

    async initFavorito(){
        // Referencias
        this.btnFavorito = document.getElementById('btnFavorito');
        this.iconFavorito = document.getElementById('iconFavorito');
        if(!this.btnFavorito || !window.FavoritoService || !authService?.isAuthenticated()) return;
        try {
            const estado = await FavoritoService.esFavorito(this.libroId);
            const esFav = !!estado.favorito;
            this.actualizarUIFavorito(esFav);
        } catch(err){ console.warn('No se pudo obtener estado favorito inicial', err); }
        this.btnFavorito.addEventListener('click', async ()=>{
            if(!authService.isAuthenticated()) return;
            this.btnFavorito.disabled = true;
            try {
                const resp = await FavoritoService.toggle(this.libroId);
                this.actualizarUIFavorito(!!resp.favorito);
            } catch(err){
                console.error('Error toggle favorito:', err);
            } finally {
                this.btnFavorito.disabled = false;
            }
        });
    }

    actualizarUIFavorito(esFavorito){
        if(!this.iconFavorito) return;
        if(esFavorito){
            this.iconFavorito.classList.remove('bi-heart');
            this.iconFavorito.classList.add('bi-heart-fill');
            this.btnFavorito?.classList.remove('btn-outline-danger');
            this.btnFavorito?.classList.add('btn-danger');
            this.btnFavorito.title = 'Quitar de favoritos';
        } else {
            this.iconFavorito.classList.add('bi-heart');
            this.iconFavorito.classList.remove('bi-heart-fill');
            this.btnFavorito?.classList.add('btn-outline-danger');
            this.btnFavorito?.classList.remove('btn-danger');
            this.btnFavorito.title = 'Agregar a favoritos';
        }
    }

    actualizarElemento(id, contenido) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = contenido;
        }
    }

    mostrarError(mensaje) {
        // Crear mensaje de error
        const errorHTML = `
            <div class="container py-5">
                <div class="row justify-content-center">
                    <div class="col-md-6 text-center">
                        <div class="alert alert-danger">
                            <i class="bi bi-exclamation-triangle-fill fs-1 d-block mb-3"></i>
                            <h4>Error</h4>
                            <p>${mensaje}</p>
                            <a href="index.html" class="btn btn-primary mt-3">
                                <i class="bi bi-arrow-left-circle me-2"></i>Volver al Inicio
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Reemplazar contenido principal
        const mainContent = document.querySelector('.container.py-5');
        if (mainContent) {
            mainContent.innerHTML = errorHTML;
        }
    }

    mostrarDescripcion(descripcion) {
        const descripcionSection = document.getElementById('descripcionSection');
        const detalleDescripcion = document.getElementById('detalleDescripcion');

        if (descripcion && descripcion.trim() !== '') {
            if (descripcionSection) descripcionSection.style.display = 'block';
            if (detalleDescripcion) detalleDescripcion.textContent = descripcion;
        } else {
            if (descripcionSection) descripcionSection.style.display = 'none';
        }
    }

    mostrarFechas(fechaCreacion, fechaActualizacion) {
        // Formatear fecha de creación
        if (fechaCreacion) {
            const fechaCreacionFormateada = this.formatearFecha(fechaCreacion);
            this.actualizarElemento('detalleFechaCreacion', fechaCreacionFormateada);
        } else {
            this.actualizarElemento('detalleFechaCreacion', 'No disponible');
        }

        // Formatear fecha de actualización
        if (fechaActualizacion) {
            const fechaActualizacionFormateada = this.formatearFecha(fechaActualizacion);
            this.actualizarElemento('detalleFechaActualizacion', fechaActualizacionFormateada);
        } else {
            this.actualizarElemento('detalleFechaActualizacion', 'No disponible');
        }
    }

    formatearFecha(fecha) {
        try {
            const fechaObj = new Date(fecha);
            return fechaObj.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error al formatear fecha:', error);
            return 'Fecha inválida';
        }
    }
}

// Función para volver a la búsqueda
function volverABusqueda() {
    window.location.href = 'buscar.html';
}

// Función para volver al dashboard
function volverAInicio() {
    window.location.href = 'dashboard.html';
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new DetalleLibro();
});