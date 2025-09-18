class GaleriaImagenes {
    constructor(containerId, imagenes) {
        this.container = document.getElementById(containerId);
        this.imagenes = imagenes;
        this.imagenActual = 0;
        this.modal = null;
    }

    inicializar() {
        if (!this.container || this.imagenes.length === 0) return;

        this.imagenes.forEach((imagen, index) => {
            const miniatura = document.createElement('div');
            miniatura.className = 'col-md-3 mb-3';
            miniatura.innerHTML = `
                <img src="${imagen}" alt="Imagen ${index + 1}" 
                     class="img-thumbnail cursor-pointer" 
                     style="height: 100px; object-fit: cover;"
                     onclick="galeria.mostrarImagen(${index})">
            `;
            this.container.appendChild(miniatura);
        });

        this.crearModal();
    }

    crearModal() {
        const modalHTML = `
            <div class="modal fade" id="galeriaModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Galería de Imágenes</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body text-center">
                            <img id="imagen-modal" src="" class="img-fluid" style="max-height: 70vh;">
                        </div>
                        <div class="modal-footer justify-content-between">
                            <button class="btn btn-outline-primary" onclick="galeria.imagenAnterior()">
                                <i class="bi bi-arrow-left"></i> Anterior
                            </button>
                            <span id="contador-imagen">1 / ${this.imagenes.length}</span>
                            <button class="btn btn-outline-primary" onclick="galeria.imagenSiguiente()">
                                Siguiente <i class="bi bi-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = new bootstrap.Modal(document.getElementById('galeriaModal'));
    }

    mostrarImagen(index) {
        this.imagenActual = index;
        document.getElementById('imagen-modal').src = this.imagenes[index];
        document.getElementById('contador-imagen').textContent = `${index + 1} / ${this.imagenes.length}`;
        this.modal.show();
    }

    imagenSiguiente() {
        this.imagenActual = (this.imagenActual + 1) % this.imagenes.length;
        this.mostrarImagen(this.imagenActual);
    }

    imagenAnterior() {
        this.imagenActual = (this.imagenActual - 1 + this.imagenes.length) % this.imagenes.length;
        this.mostrarImagen(this.imagenActual);
    }
}

window.galeria = null;

function inicializarGaleria(containerId, imagenes) {
    window.galeria = new GaleriaImagenes(containerId, imagenes);
    window.galeria.inicializar();
}