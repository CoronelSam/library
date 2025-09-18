class Nodo {
    constructor(libro) {
        this.libro = libro;
        this.izquierdo = null;
        this.derecho = null;
    }
}

class ArbolLibros {
    constructor() {
        this.raiz = null;
    }

    ingresarLibro(libro) {
        const nuevoNodo = new Nodo(libro);
        if (this.raiz === null) {
            this.raiz = nuevoNodo;
        } else {
            this.#insertarRecursivo(this.raiz, nuevoNodo);
        }
    }

    #insertarRecursivo(nodoActual, nuevoNodo) {
        const tituloNuevo = nuevoNodo.libro.titulo.toLowerCase();
        const tituloActual = nodoActual.libro.titulo.toLowerCase();
        
        if (tituloNuevo < tituloActual) {
            if (nodoActual.izquierdo === null) {
                nodoActual.izquierdo = nuevoNodo;
            } else {
                this.#insertarRecursivo(nodoActual.izquierdo, nuevoNodo);
            }
        } else {
            if (nodoActual.derecho === null) {
                nodoActual.derecho = nuevoNodo;
            } else {
                this.#insertarRecursivo(nodoActual.derecho, nuevoNodo);
            }
        }
    }

    // Recorridos
    preOrden() {
        const resultado = [];
        this.#preOrdenRecursivo(this.raiz, resultado);
        return resultado;
    }

    #preOrdenRecursivo(nodo, resultado) {
        if (nodo !== null) {
            resultado.push(nodo.libro);
            this.#preOrdenRecursivo(nodo.izquierdo, resultado);
            this.#preOrdenRecursivo(nodo.derecho, resultado);
        }
    }

    inOrden() {
        const resultado = [];
        this.#inOrdenRecursivo(this.raiz, resultado);
        return resultado;
    }

    #inOrdenRecursivo(nodo, resultado) {
        if (nodo !== null) {
            this.#inOrdenRecursivo(nodo.izquierdo, resultado);
            resultado.push(nodo.libro);
            this.#inOrdenRecursivo(nodo.derecho, resultado);
        }
    }

    postOrden() {
        const resultado = [];
        this.#postOrdenRecursivo(this.raiz, resultado);
        return resultado;
    }

    #postOrdenRecursivo(nodo, resultado) {
        if (nodo !== null) {
            this.#postOrdenRecursivo(nodo.izquierdo, resultado);
            this.#postOrdenRecursivo(nodo.derecho, resultado);
            resultado.push(nodo.libro);
        }
    }

    // Búsqueda eficiente por título
    buscarPorTitulo(titulo) {
        return this.#buscarTituloRecursivo(this.raiz, titulo.toLowerCase());
    }

    #buscarTituloRecursivo(nodoActual, tituloBuscado) {
        if (nodoActual === null) return null;
        
        const tituloActual = nodoActual.libro.titulo.toLowerCase();
        
        if (tituloActual === tituloBuscado) {
            return nodoActual.libro;
        } else if (tituloBuscado < tituloActual) {
            return this.#buscarTituloRecursivo(nodoActual.izquierdo, tituloBuscado);
        } else {
            return this.#buscarTituloRecursivo(nodoActual.derecho, tituloBuscado);
        }
    }

    // Búsqueda por autor (recorrido inorden)
    buscarPorAutor(autor) {
        const resultados = [];
        this.#buscarAutorRecursivo(this.raiz, autor.toLowerCase(), resultados);
        return resultados;
    }

    #buscarAutorRecursivo(nodo, autorBuscado, resultados) {
        if (nodo !== null) {
            this.#buscarAutorRecursivo(nodo.izquierdo, autorBuscado, resultados);
            
            if (nodo.libro.autor.toLowerCase().includes(autorBuscado)) {
                resultados.push(nodo.libro);
            }
            
            this.#buscarAutorRecursivo(nodo.derecho, autorBuscado, resultados);
        }
    }

    // Búsqueda por género (recorrido inorden)
    buscarPorGenero(genero) {
        const resultados = [];
        this.#buscarGeneroRecursivo(this.raiz, genero.toLowerCase(), resultados);
        return resultados;
    }

    #buscarGeneroRecursivo(nodo, generoBuscado, resultados) {
        if (nodo !== null) {
            this.#buscarGeneroRecursivo(nodo.izquierdo, generoBuscado, resultados);
            
            if (nodo.libro.genero.toLowerCase().includes(generoBuscado)) {
                resultados.push(nodo.libro);
            }
            
            this.#buscarGeneroRecursivo(nodo.derecho, generoBuscado, resultados);
        }
    }

    // Búsqueda general (por cualquier campo)
    buscarGeneral(termino) {
        const resultados = [];
        const terminoBuscado = termino.toLowerCase();
        this.#buscarGeneralRecursivo(this.raiz, terminoBuscado, resultados);
        return resultados;
    }

    #buscarGeneralRecursivo(nodo, termino, resultados) {
    if (nodo !== null) {
        this.#buscarGeneralRecursivo(nodo.izquierdo, termino, resultados);
        
        const libro = nodo.libro;
        if (libro.titulo.toLowerCase().includes(termino) ||
            libro.autor.toLowerCase().includes(termino) ||
            libro.genero.toLowerCase().includes(termino) ||
            (libro.isbn && libro.isbn.toLowerCase().includes(termino)) || // Búsqueda por ISBN
            (libro.editorial && libro.editorial.toLowerCase().includes(termino))) {
            resultados.push(libro);
        }
        
        this.#buscarGeneralRecursivo(nodo.derecho, termino, resultados);
    }
}

    // Altura del árbol
    altura() {
        return this.#alturaRecursiva(this.raiz);
    }

    #alturaRecursiva(nodo) {
        if (nodo === null) return 0;
        const alturaIzquierda = this.#alturaRecursiva(nodo.izquierdo);
        const alturaDerecha = this.#alturaRecursiva(nodo.derecho);
        return Math.max(alturaIzquierda, alturaDerecha) + 1;
    }

    #distanciaLevenshtein(str1, str2) {
        const matriz = [];
        const n = str1.length;
        const m = str2.length;

        for (let i = 0; i <= n; i++) {
            matriz[i] = [i];
        }

        for (let j = 0; j <= m; j++) {
            matriz[0][j] = j;
        }

        for (let i = 1; i <= n; i++) {
            for (let j = 1; j <= m; j++) {
                if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
                    matriz[i][j] = matriz[i - 1][j - 1];
                } else {
                    matriz[i][j] = Math.min(
                        matriz[i - 1][j - 1] + 1,
                        matriz[i][j - 1] + 1,
                        matriz[i - 1][j] + 1
                    );
                }
            }
        }

        return matriz[n][m];
    }

    obtenerSugerencias(termino, maxSugerencias = 5, umbralDistancia = 3) {
        const sugerencias = [];
        const terminoBuscado = termino.toLowerCase();
        
        this.#recopilarSugerencias(this.raiz, terminoBuscado, sugerencias, umbralDistancia);
        
        sugerencias.sort((a, b) => a.distancia - b.distancia);
        
        return sugerencias.slice(0, maxSugerencias).map(item => item.libro);
    }

    #recopilarSugerencias(nodo, termino, sugerencias, umbral) {
        if (nodo !== null) {
            const libro = nodo.libro;
            const titulo = libro.titulo.toLowerCase();
            const autor = libro.autor.toLowerCase();
            
            const distanciaTitulo = this.#distanciaLevenshtein(termino, titulo);
            const distanciaAutor = this.#distanciaLevenshtein(termino, autor);
            
            const distanciaMinima = Math.min(distanciaTitulo, distanciaAutor);
            
            if (distanciaMinima <= umbral) {
                sugerencias.push({
                    libro: libro,
                    distancia: distanciaMinima
                });
            }
            
            this.#recopilarSugerencias(nodo.izquierdo, termino, sugerencias, umbral);
            this.#recopilarSugerencias(nodo.derecho, termino, sugerencias, umbral);
        }
    }

    buscarPorPrefijo(prefijo, campo = 'titulo') {
        const resultados = [];
        const prefijoLower = prefijo.toLowerCase();
        this.#buscarPrefijoRecursivo(this.raiz, prefijoLower, campo, resultados);
        return resultados;
    }

    #buscarPrefijoRecursivo(nodo, prefijo, campo, resultados) {
        if (nodo !== null) {
            this.#buscarPrefijoRecursivo(nodo.izquierdo, prefijo, campo, resultados);
            
            const valorCampo = nodo.libro[campo].toLowerCase();
            if (valorCampo.startsWith(prefijo)) {
                resultados.push(nodo.libro);
            }
            
            this.#buscarPrefijoRecursivo(nodo.derecho, prefijo, campo, resultados);
        }
    }

    obtenerHijos(titulo) {
        const nodo = this.#buscarNodoPorTitulo(this.raiz, titulo.toLowerCase());
        if (nodo) {
            return {
                izquierdo: nodo.izquierdo ? nodo.izquierdo.libro : null,
                derecho: nodo.derecho ? nodo.derecho.libro : null
            };
        } else {
            return null;
        }
    }

    #buscarNodoPorTitulo(nodoActual, titulo) {
        if (nodoActual === null) return null;
        const tituloActual = nodoActual.libro.titulo.toLowerCase();
        
        if (tituloActual === titulo) return nodoActual;
        return titulo < tituloActual 
            ? this.#buscarNodoPorTitulo(nodoActual.izquierdo, titulo) 
            : this.#buscarNodoPorTitulo(nodoActual.derecho, titulo);
    }

    obtenerPadre(titulo) {
        const padre = this.#buscarPadre(this.raiz, titulo.toLowerCase(), null);
        return padre ? padre.libro : null;
    }

    #buscarPadre(nodoActual, tituloBuscado, padre) {
        if (nodoActual === null) return null;
        if (nodoActual.libro.titulo.toLowerCase() === tituloBuscado) return padre;
        
        const padreIzquierdo = this.#buscarPadre(nodoActual.izquierdo, tituloBuscado, nodoActual);
        if (padreIzquierdo !== null) return padreIzquierdo;
        
        return this.#buscarPadre(nodoActual.derecho, tituloBuscado, nodoActual);
    }

    ancho() {
        if (this.raiz === null) return 0;
        
        let maxAncho = 0;
        let cola = [this.raiz];
        
        while (cola.length > 0) {
            const nivelSize = cola.length;
            maxAncho = Math.max(maxAncho, nivelSize);
            
            for (let i = 0; i < nivelSize; i++) {
                const nodo = cola.shift();
                if (nodo.izquierdo) cola.push(nodo.izquierdo);
                if (nodo.derecho) cola.push(nodo.derecho);
            }
        }
        
        return maxAncho;
    }

    obtenerTodosLosLibros() {
        return this.inOrden();
    }

    contarLibros() {
        return this.#contarNodos(this.raiz);
    }

    #contarNodos(nodo) {
        if (nodo === null) return 0;
        return 1 + this.#contarNodos(nodo.izquierdo) + this.#contarNodos(nodo.derecho);
    }

    estaVacio() {
        return this.raiz === null;
    }

    buscarPorId(id) {
        return this.#buscarIdRecursivo(this.raiz, id);
    }

    #buscarIdRecursivo(nodo, id) {
        if (nodo === null) return null;
        
        if (nodo.libro.id === id) {
            return nodo.libro;
        }
        
        const izquierdo = this.#buscarIdRecursivo(nodo.izquierdo, id);
        if (izquierdo) return izquierdo;
        
        return this.#buscarIdRecursivo(nodo.derecho, id);
    }

    obtenerEstadisticas() {
        return {
            totalLibros: this.contarLibros(),
            altura: this.altura(),
            ancho: this.ancho(),
            estaVacio: this.estaVacio()
        };
    }

    limpiar() {
        this.raiz = null;
    }

    cargarLibros(libros) {
        this.limpiar();
        libros.forEach(libro => this.ingresarLibro(libro));
    }
}

const arbolLibros = new ArbolLibros();

module.exports = {
    ArbolLibros,
    arbolLibros
};