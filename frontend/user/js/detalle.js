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

        // Novedad: Llamar a la función que construye y muestra la galería
        this.configurarGaleria(libro);

        // Actualizar información básica
        this.actualizarElemento('detalleTitulo', libro.titulo || 'Título no disponible');
        this.actualizarElemento('detalleAutor', libro.autor || 'Autor desconocido');
        this.actualizarElemento('detalleGenero', libro.genero || 'Género no especificado');
        this.actualizarElemento('detalleAnio', libro.año_publicacion || 'No especificado');
        this.actualizarElemento('detalleEditorial', libro.editorial || 'No especificada');

        // Novedad: Mostrar el ISBN si existe
        this.mostrarISBN(libro.isbn);
        
        // Mostrar contador de descargas
        this.mostrarDescargas(libro.descargas || 0);

        // Mostrar descripción si existe
        this.mostrarDescripcion(libro.descripcion);

        // Mostrar fechas del sistema
        this.mostrarFechas(libro.createdAt, libro.updatedAt);

        // Configurar botones de PDF
        this.configurarBotonesPDF(libro);
    }

    configurarGaleria(libro) {
        const indicatorsContainer = document.getElementById('galeria-indicators');
        const innerContainer = document.getElementById('galeria-inner');
        const carouselElement = document.getElementById('libroGaleria');

        if (!indicatorsContainer || !innerContainer || !carouselElement) {
            console.error('Elementos de la galería no encontrados en el DOM.');
            return;
        }

        // Creamos un array con todas las imágenes: primero la portada, luego las adicionales.
        // El .filter(Boolean) elimina cualquier entrada nula o vacía.
        const imagenes = [libro.portada, ...(libro.imagenes_adicionales || [])].filter(Boolean);

        // Si después de filtrar no hay imágenes, ponemos una por defecto.
        if (imagenes.length === 0) {
            imagenes.push('https://via.placeholder.com/400x600.png/E9ECEF/343A40?text=Sin+Portada');
        }

        let indicatorsHtml = '';
        let innerHtml = '';

        // Construimos el HTML para cada imagen en la galería
        imagenes.forEach((url, index) => {
            const esActiva = index === 0 ? 'active' : '';
            indicatorsHtml += `<button type="button" data-bs-target="#libroGaleria" data-bs-slide-to="${index}" class="${esActiva}" aria-current="true"></button>`;
            innerHtml += `
                <div class="carousel-item ${esActiva}">
                    <img src="${url}" class="d-block w-100 portada" alt="Imagen ${index + 1} de ${libro.titulo}">
                </div>
            `;
        });
        
        indicatorsContainer.innerHTML = indicatorsHtml;
        innerContainer.innerHTML = innerHtml;

        // Novedad CLAVE: Ocultar las flechas y los indicadores si solo hay 1 imagen
        const controls = carouselElement.querySelectorAll('.carousel-control-prev, .carousel-control-next, .carousel-indicators');
        controls.forEach(control => {
            control.style.display = imagenes.length > 1 ? '' : 'none'; // Si hay más de 1 imagen, se muestran. Si no, se ocultan.
        });
    }

    mostrarISBN(isbn) {
        const container = document.getElementById('detalleISBN-container');
        const element = document.getElementById('detalleISBN');
        if (container && element && isbn) {
            element.textContent = isbn;
            container.style.display = 'list-item'; // Hacemos visible toda la fila del ISBN
        } else if (container) {
            container.style.display = 'none'; // Mantenemos oculta la fila si no hay ISBN
        }
    }

    mostrarDescargas(descargas) {
        const element = document.getElementById('detalleDescargas');
        if (element) {
            // Formatear el número con separadores de miles si es necesario
            const descargasFormateadas = new Intl.NumberFormat('es-ES').format(descargas);
            element.textContent = descargasFormateadas;
        }
    }

    configurarBotonesPDF(libro) {
        const botonesPDF = document.getElementById('botonesPDF');
        const mensajeNoPDF = document.getElementById('mensajeNoPDF');
        const btnVerPDF = document.getElementById('btnVerPDF');
        const btnDescargarPDF = document.getElementById('btnDescargarPDF');

        if (libro.archivo && libro.archivo.trim() !== '') {
            if (botonesPDF) botonesPDF.style.display = 'block';
            if (mensajeNoPDF) mensajeNoPDF.style.display = 'none';

            if (btnVerPDF) {
                btnVerPDF.onclick = (e) => { e.preventDefault(); (window.LibroService?.abrirPDF || (() => window.open(`${this.apiUrl}/${libro.id}/pdf`, '_blank')))(libro.id); };
            }
            if (btnDescargarPDF) {
                btnDescargarPDF.onclick = (e) => { 
                    e.preventDefault(); 
                    // Ejecutar descarga
                    (window.LibroService?.descargarPDFProxy || (() => window.open(`${this.apiUrl}/${libro.id}/download/proxy`, '_blank')))(libro.id);
                    // Actualizar contador después de un pequeño delay
                    setTimeout(() => this.actualizarContadorDescargas(), 1000);
                };
            }
        } else {
            if (botonesPDF) botonesPDF.style.display = 'none';
            if (mensajeNoPDF) mensajeNoPDF.style.display = 'block';
        }
    }

    async initFavorito(){
        this.btnFavorito = document.getElementById('btnFavorito');
        this.iconFavorito = document.getElementById('iconFavorito');
        if(!this.btnFavorito || !window.FavoritoService || !authService?.isAuthenticated()) return;
        try {
            const estado = await FavoritoService.esFavorito(this.libroId);
            this.actualizarUIFavorito(!!estado.favorito);
        } catch(err){ console.warn('No se pudo obtener estado favorito inicial', err); }
        this.btnFavorito.addEventListener('click', async ()=>{
            if(!authService.isAuthenticated()) return;
            this.btnFavorito.disabled = true;
            try {
                const resp = await FavoritoService.toggle(this.libroId);
                this.actualizarUIFavorito(!!resp.favorito);
            } catch(err){ console.error('Error toggle favorito:', err); } finally { this.btnFavorito.disabled = false; }
        });
    }

    actualizarUIFavorito(esFavorito){
        if(!this.iconFavorito || !this.btnFavorito) return;
        if(esFavorito){
            this.iconFavorito.className = 'bi bi-heart-fill fs-4';
            this.btnFavorito.classList.remove('btn-outline-danger');
            this.btnFavorito.classList.add('btn-danger');
            this.btnFavorito.title = 'Quitar de favoritos';
        } else {
            this.iconFavorito.className = 'bi bi-heart fs-4';
            this.btnFavorito.classList.add('btn-outline-danger');
            this.btnFavorito.classList.remove('btn-danger');
            this.btnFavorito.title = 'Agregar a favoritos';
        }
    }

    async actualizarContadorDescargas() {
        try {
            const response = await fetch(`${this.apiUrl}/${this.libroId}/estadisticas-descarga`);
            const data = await response.json();
            
            if (data.success && data.data) {
                this.mostrarDescargas(data.data.descargas);
            }
        } catch (error) {
            console.error('Error al actualizar contador de descargas:', error);
            // No mostrar error al usuario, es solo una actualización de estadísticas
        }
    }

    actualizarElemento(id, contenido) {
        const elemento = document.getElementById(id);
        if (elemento) elemento.textContent = contenido;
    }

    mostrarError(mensaje) {
        const mainContent = document.querySelector('.container.py-5');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="row justify-content-center">
                    <div class="col-md-6 text-center">
                        <div class="alert alert-danger">
                            <i class="bi bi-exclamation-triangle-fill fs-1 d-block mb-3"></i>
                            <h4>Error</h4>
                            <p>${mensaje}</p>
                            <a href="dashboard.html" class="btn btn-primary mt-3"><i class="bi bi-arrow-left-circle me-2"></i>Volver al Inicio</a>
                        </div>
                    </div>
                </div>`;
        }
    }

    mostrarDescripcion(descripcion) {
        const descripcionSection = document.getElementById('descripcionSection');
        const detalleDescripcion = document.getElementById('detalleDescripcion');
        if (descripcion && descripcion.trim()) {
            if (descripcionSection) descripcionSection.style.display = 'block';
            if (detalleDescripcion) detalleDescripcion.textContent = descripcion;
        } else {
            if (descripcionSection) descripcionSection.style.display = 'none';
        }
    }

    mostrarFechas(fechaCreacion, fechaActualizacion) {
        this.actualizarElemento('detalleFechaCreacion', fechaCreacion ? this.formatearFecha(fechaCreacion) : 'No disponible');
        this.actualizarElemento('detalleFechaActualizacion', fechaActualizacion ? this.formatearFecha(fechaActualizacion) : 'No disponible');
    }

    formatearFecha(fecha) {
        try {
            return new Date(fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            console.error('Error al formatear fecha:', error);
            return 'Fecha inválida';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DetalleLibro();
});