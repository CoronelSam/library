class ArbolGeneros {
    constructor() {
        this.librosInorden = [];
        this.categorias = [];
        this.init();
    }

    async init() {
        try {
            await this.cargarDatosArboles();
            this.prepararEventListeners();
            await this.renderizarTodosLosArboles();
        } catch (err) {
            console.error('Error inicializando árboles por género:', err);
            this.setEstadoGeneral('No se pudieron cargar los árboles.');
        }
    }

    prepararEventListeners() {
        const btnRecargar = document.getElementById('recargarArboles');
        if (btnRecargar) {
            btnRecargar.addEventListener('click', async () => {
                this.setEstadoGeneral('Recargando árboles…');
                await this.cargarDatosArboles(true);
                await this.renderizarTodosLosArboles();
            });
        }
    }

    setEstadoGeneral(texto) {
        const el = document.getElementById('estadoGeneral');
        if (!el) return;
        
        if (!texto) {
            el.style.display = 'none';
            const btnRecargar = document.getElementById('recargarArboles');
            if (btnRecargar) btnRecargar.style.display = 'block';
            return;
        }
        
        el.style.display = 'block';
        el.innerHTML = texto.includes('…') 
            ? `<div class="spinner-border text-secondary spinner-border-sm me-2" role="status"></div>${texto}`
            : texto;
    }

    async cargarDatosArboles(force = false) {
        try {
            // Obtener recorrido inorden desde backend
            const resp = await window.LibroService.obtenerRecorrido({ 
                tipo: 'inorden', 
                limite: 1000 
            });
            
            this.librosInorden = Array.isArray(resp?.data) ? resp.data : [];
            
            const setGen = new Set();
            for (const libro of this.librosInorden) {
                const genero = (libro.genero && libro.genero.trim()) 
                    ? libro.genero.trim() 
                    : 'Sin género';
                setGen.add(genero);
            }
            
            this.categorias = Array.from(setGen).sort((a, b) => 
                a.localeCompare(b, 'es', { sensitivity: 'base' })
            );
            
            this.setEstadoGeneral('');
        } catch (err) {
            console.error('Error cargando datos de los árboles:', err);
            this.setEstadoGeneral('Error al cargar los datos.');
            throw err;
        }
    }

    async renderizarTodosLosArboles() {
        const container = document.getElementById('arbolesContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.categorias.length === 0) {
            this.setEstadoGeneral('No hay géneros para mostrar.');
            return;
        }
        
        for (const genero of this.categorias) {
            const librosGenero = this.librosInorden.filter(libro => {
                const libroGenero = (libro.genero && libro.genero.trim()) 
                    ? libro.genero.trim() 
                    : 'Sin género';
                return libroGenero === genero;
            });
            
            if (librosGenero.length > 0) {
                const tarjetaArbol = this.crearTarjetaArbol(genero, librosGenero);
                container.appendChild(tarjetaArbol);
            }
        }
        
        this.setEstadoGeneral('');
    }

    crearTarjetaArbol(genero, libros) {
        const colDiv = document.createElement('div');
        colDiv.className = 'col-lg-6 col-xl-4';
        
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card border-0 shadow-sm h-100';
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'card-header bg-primary text-white fw-bold d-flex align-items-center justify-content-between';
        headerDiv.innerHTML = `
            <span>
                <i class="bi bi-diagram-3 me-2"></i>${this.escapeHtml(genero)}
            </span>
            <span class="badge bg-light text-primary">${libros.length}</span>
        `;
        
        const bodyDiv = document.createElement('div');
        bodyDiv.className = 'card-body p-3';
        
        const treeContainer = document.createElement('div');
        treeContainer.className = 'tree-container';
        
        const treeDiv = document.createElement('div');
        treeDiv.className = 'tree';
  
        const librosOrdenados = [...libros].sort((a, b) => 
            (a.titulo || '').localeCompare(b.titulo || '', 'es', { sensitivity: 'base' })
        );
        
        const raiz = this.construirBSTBalanceado(librosOrdenados);
        
        if (raiz) {
            const treeUl = document.createElement('ul');
            treeUl.appendChild(this.renderNodo(raiz, genero));
            treeDiv.appendChild(treeUl);
        } else {
            treeDiv.innerHTML = '<p class="text-muted text-center">No hay libros en este género</p>';
        }
        
        treeContainer.appendChild(treeDiv);
        bodyDiv.appendChild(treeContainer);
        cardDiv.appendChild(headerDiv);
        cardDiv.appendChild(bodyDiv);
        colDiv.appendChild(cardDiv);
        
        return colDiv;
    }

    construirBSTBalanceado(arr) {
        if (!arr || arr.length === 0) return null;
        
        const mid = Math.floor(arr.length / 2);
        const nodo = { 
            libro: arr[mid], 
            izquierdo: null, 
            derecho: null 
        };
        
        nodo.izquierdo = this.construirBSTBalanceado(arr.slice(0, mid));
        nodo.derecho = this.construirBSTBalanceado(arr.slice(mid + 1));
        
        return nodo;
    }

    renderNodo(nodo, genero) {
        const li = document.createElement('li');
        
        if (!nodo) {
            li.innerHTML = `<span class="node muted">∅</span>`;
            return li;
        }
        
        const libro = nodo.libro;
        const titulo = this.escapeHtml(libro.titulo || 'Sin título');
        const autor = this.escapeHtml(libro.autor || 'Autor desconocido');
        const id = encodeURIComponent(libro.id);
        
        li.innerHTML = `
            <span class="node" title="${titulo}\n${autor}\n${this.escapeHtml(genero)}">
                <span class="title">${titulo}</span>
                <span class="muted">${autor}</span>
                <a class="btn btn-xs btn-link" href="detalle.html?id=${id}" aria-label="Ver detalle">
                    <i class="bi bi-box-arrow-up-right"></i>
                </a>
            </span>
        `;
        
        if (nodo.izquierdo || nodo.derecho) {
            const ul = document.createElement('ul');
            if (nodo.izquierdo) ul.appendChild(this.renderNodo(nodo.izquierdo, genero));
            if (nodo.derecho) ul.appendChild(this.renderNodo(nodo.derecho, genero));
            li.appendChild(ul);
        }
        
        return li;
    }

    escapeHtml(str) {
        return String(str)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación y rol (lógica existente se mantiene en HTML)
    if (!authService.isAuthenticated()) {
        window.location.href = '../login.html';
        return;
    }
    
    const userRole = authService.getUserRole();
    if (userRole === 'admin' || userRole === 'mod') {
        window.location.href = '../admin/admin.html';
        return;
    }
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                authService.logout();
            }
        });
    }

    // Inicializar árboles por género
    new ArbolGeneros();
});