class LibroService {

    static async crear(datosLibro) {
        try {
            const options = {
                method: 'POST'
            };

            // Si es FormData (tiene archivos), no agregar Content-Type
            if (datosLibro instanceof FormData) {
                // Incluir headers como Authorization pero omitir Content-Type para que el navegador establezca el boundary
                if (API_CONFIG?.REQUEST_CONFIG?.headers) {
                    const headers = { ...API_CONFIG.REQUEST_CONFIG.headers };
                    delete headers['Content-Type'];
                    delete headers['content-type'];
                    // Solo añadir si queda al menos algún header (ej. Authorization)
                    if (Object.keys(headers).length > 0) {
                        options.headers = headers;
                    }
                }
                options.body = datosLibro;
            } else {
                // Si es JSON normal
                options.headers = API_CONFIG.REQUEST_CONFIG.headers;
                options.body = JSON.stringify(datosLibro);
            }

            const response = await fetch(API_CONFIG.FULL_ENDPOINTS.LIBROS, options);
            let resultado;
            const contentType = response.headers.get('content-type') || '';
            try {
                if (contentType.includes('application/json')) {
                    resultado = await response.json();
                } else {
                    const texto = await response.text();
                    console.warn('[LibroService.crear] Respuesta no JSON, texto bruto:', texto);
                    resultado = { success: response.ok, mensaje: 'Respuesta no JSON', raw: texto };
                }
            } catch (parseErr) {
                console.error('[LibroService.crear] Error parseando JSON:', parseErr);
                resultado = { success: false, mensaje: 'Error parseando respuesta', error: parseErr.message };
            }

            if (!response.ok || !resultado.success) {
                throw new Error(resultado.mensaje || 'Error al crear el libro');
            }

            return resultado;
        } catch (error) {
            console.error('Error en LibroService.crear:', error);
            throw error;
        }
    }

    static async obtenerTodos(ordenar = 'titulo') {
        try {
            const url = `${API_CONFIG.FULL_ENDPOINTS.LIBROS}?ordenar=${ordenar}`;
            const response = await fetch(url);

            const resultado = await response.json();

            if (!response.ok) {
                throw new Error(resultado.mensaje || 'Error al obtener los libros');
            }

            return resultado;
        } catch (error) {
            console.error('Error en LibroService.obtenerTodos:', error);
            throw error;
        }
    }

    /**
     * Abrir PDF en nueva pestaña para visualización
     * @param {number} libroId - ID del libro
     */
    static abrirPDF(libroId) {
        const url = `${API_CONFIG.FULL_ENDPOINTS.LIBROS}/${libroId}/pdf`;
        window.open(url, '_blank');
    }

    /**
     * Descargar PDF del libro
     * @param {number} libroId - ID del libro
     */
    static descargarPDF(libroId) {
        const url = `${API_CONFIG.FULL_ENDPOINTS.LIBROS}/${libroId}/download`;
        window.open(url, '_blank');
    }

    /**
     * Verificar si un libro tiene PDF disponible
     * @param {Object} libro - Objeto libro
     * @returns {boolean} - True si tiene PDF
     */
    static tienePDF(libro) {
        return libro && libro.archivo && libro.archivo.trim() !== '';
    }

    // Obtener un libro por ID
    static async obtenerPorId(id) {
        try {
            const response = await fetch(`${API_CONFIG.FULL_ENDPOINTS.LIBROS}/${id}`);

            const resultado = await response.json();

            if (!response.ok) {
                throw new Error(resultado.mensaje || 'Error al obtener el libro');
            }

            return resultado;
        } catch (error) {
            console.error('Error en LibroService.obtenerPorId:', error);
            throw error;
        }
    }

    static async actualizar(id, datosLibro) {
        try {
            const options = {
                method: 'PUT'
            };

            // Si es FormData (tiene archivos), no agregar Content-Type
            if (datosLibro instanceof FormData) {
                if (API_CONFIG?.REQUEST_CONFIG?.headers) {
                    const headers = { ...API_CONFIG.REQUEST_CONFIG.headers };
                    delete headers['Content-Type'];
                    delete headers['content-type'];
                    if (Object.keys(headers).length > 0) {
                        options.headers = headers;
                    }
                }
                options.body = datosLibro;
            } else {
                // Si es JSON normal
                options.headers = API_CONFIG.REQUEST_CONFIG.headers;
                options.body = JSON.stringify(datosLibro);
            }

            const response = await fetch(`${API_CONFIG.FULL_ENDPOINTS.LIBROS}/${id}`, options);

            const resultado = await response.json();

            if (!response.ok) {
                throw new Error(resultado.mensaje || 'Error al actualizar el libro');
            }

            return resultado;
        } catch (error) {
            console.error('Error en LibroService.actualizar:', error);
            throw error;
        }
    }

    static async eliminar(id) {
        try {
            const response = await fetch(`${API_CONFIG.FULL_ENDPOINTS.LIBROS}/${id}`, {
                method: 'DELETE'
            });

            const resultado = await response.json();

            if (!response.ok) {
                throw new Error(resultado.mensaje || 'Error al eliminar el libro');
            }

            return resultado;
        } catch (error) {
            console.error('Error en LibroService.eliminar:', error);
            throw error;
        }
    }

    static async buscar(termino, tipo = APP_CONSTANTS.TIPOS_BUSQUEDA.GENERAL) {
        try {
            const url = `${API_CONFIG.FULL_ENDPOINTS.BUSCAR}?q=${encodeURIComponent(termino)}&tipo=${tipo}`;
            const response = await fetch(url);

            const resultado = await response.json();

            if (!response.ok) {
                throw new Error(resultado.mensaje || 'Error en la búsqueda');
            }

            return resultado;
        } catch (error) {
            console.error('Error en LibroService.buscar:', error);
            throw error;
        }
    }

    static async autocompletar(prefijo, campo = 'titulo') {
        try {
            const url = `${API_CONFIG.FULL_ENDPOINTS.AUTOCOMPLETAR}?q=${encodeURIComponent(prefijo)}&campo=${campo}`;
            const response = await fetch(url);

            const resultado = await response.json();

            if (!response.ok) {
                throw new Error(resultado.mensaje || 'Error en autocompletado');
            }

            return resultado;
        } catch (error) {
            console.error('Error en LibroService.autocompletar:', error);
            throw error;
        }
    }

    //búsqueda optimizada (usa árbol con prefijo/general)
    static async busquedaOptimizada(q, opciones = {}) {
        try {
            const params = new URLSearchParams();
            params.append('q', q);
            if (opciones.tipo) params.append('tipo', opciones.tipo);
            if (opciones.limite) params.append('limite', opciones.limite);
            if (opciones.prefijo !== undefined) params.append('prefijo', opciones.prefijo ? 'true' : 'false');
            if (opciones.genero) params.append('genero', opciones.genero);
            if (opciones.autor) params.append('autor', opciones.autor);

            const url = `${API_CONFIG.FULL_ENDPOINTS.LIBROS}/busqueda?${params.toString()}`;
            const response = await fetch(url);
            const resultado = await response.json();

            if (!response.ok) {
                throw new Error(resultado.mensaje || 'Error en búsqueda optimizada');
            }
            return resultado;
        } catch (error) {
            console.error('Error en LibroService.busquedaOptimizada:', error);
            throw error;
        }
    }

    static async obtenerEstadisticas() {
        try {
            const response = await fetch(API_CONFIG.FULL_ENDPOINTS.ESTADISTICAS);

            const resultado = await response.json();

            if (!response.ok) {
                throw new Error(resultado.mensaje || 'Error al obtener estadísticas');
            }

            return resultado;
        } catch (error) {
            console.error('Error en LibroService.obtenerEstadisticas:', error);
            throw error;
        }
    }

    static async verificarSalud() {
        try {
            const response = await fetch(API_CONFIG.FULL_ENDPOINTS.HEALTH);

            const resultado = await response.json();

            if (!response.ok) {
                throw new Error('Servidor no disponible');
            }

            return resultado;
        } catch (error) {
            console.error('Error en LibroService.verificarSalud:', error);
            throw error;
        }
    }

    // Nuevo: obtener recorrido del árbol desde backend
    static async obtenerRecorrido(params = {}) {
        try {
            const urlParams = new URLSearchParams();
            if (params.tipo) urlParams.append('tipo', params.tipo);
            if (params.limite) urlParams.append('limite', params.limite);
            if (params.genero) urlParams.append('genero', params.genero);
            if (params.autor) urlParams.append('autor', params.autor);
            if (params.q) urlParams.append('q', params.q);

            const url = `${API_CONFIG.FULL_ENDPOINTS.RECORRIDOS}?${urlParams.toString()}`;
            const response = await fetch(url);
            const resultado = await response.json();
            if (!response.ok) {
                throw new Error(resultado.mensaje || 'Error al obtener recorrido');
            }
            return resultado;
        } catch (error) {
            console.error('Error en LibroService.obtenerRecorrido:', error);
            throw error;
        }
    }
}

// Exportar servicio
window.LibroService = LibroService;