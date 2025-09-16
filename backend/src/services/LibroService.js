const { arbolLibros } = require('../arbol');
const { cloudinaryAdapter } = require('../adapters/cloudinaryAdapter');
const Libro = require('../models/Libro');

class LibroService {
    constructor() {
        this.arbol = arbolLibros;
    }

    async inicializarArbol() {
        try {
            
            const libros = await Libro.findAll({
                order: [['titulo', 'ASC']]
            });

            this.arbol.limpiar();

            libros.forEach(libro => {
                const libroData = libro.toJSON();
                this.arbol.ingresarLibro(libroData);
            });

            console.log(`[LibroService] Árbol inicializado con ${libros.length} libros`);
            return libros.length;
        } catch (error) {
            console.error('Error al inicializar el árbol:', error.message);
            throw error;
        }
    }

    async agregarLibroConArchivos(datosLibro, archivos = null) {
        try {
            
            // Primero crear el libro en la BD para obtener el ID
            const nuevoLibro = await Libro.create(datosLibro);

            let urlPortada = null;
            let urlArchivo = null;

            // Procesar archivos si existen
            if (archivos) {
                // Subir portada si existe
                if (archivos.portada && archivos.portada[0]) {
                    const resultadoPortada = await cloudinaryAdapter.subirPortada(
                        archivos.portada[0], 
                        nuevoLibro.id
                    );
                    urlPortada = resultadoPortada.url;
                }

                // Subir archivo PDF si existe
                if (archivos.archivo && archivos.archivo[0]) {
                    const resultadoArchivo = await cloudinaryAdapter.subirPDF(
                        archivos.archivo[0], 
                        nuevoLibro.id
                    );
                    urlArchivo = resultadoArchivo.url;
                }

                // Actualizar el libro con las URLs si se subieron archivos
                if (urlPortada || urlArchivo) {
                    const datosActualizacion = {};
                    if (urlPortada) datosActualizacion.portada = urlPortada;
                    if (urlArchivo) datosActualizacion.archivo = urlArchivo;

                    await nuevoLibro.update(datosActualizacion);
                }
            }

            // Agregar al árbol binario
            const libroData = nuevoLibro.toJSON();
            this.arbol.ingresarLibro(libroData);

            console.log(`[LibroService] Libro creado: ${nuevoLibro.titulo}`);
            return nuevoLibro;

        } catch (error) {
            console.error('❌ Error al agregar libro con archivos:', error.message);
            throw error;
        }
    }

    async agregarLibro(datosLibro) {
        try {
            const nuevoLibro = await Libro.create(datosLibro);
            
            const libroData = nuevoLibro.toJSON();
            this.arbol.ingresarLibro(libroData);

            console.log(`[LibroService] Libro creado: ${nuevoLibro.titulo}`);
            return nuevoLibro;
        } catch (error) {
            console.error('❌ Error al agregar libro:', error.message);
            throw error;
        }
    }

    async actualizarLibro(id, datosActualizados) {
        try {
            const libro = await Libro.findByPk(id);
            if (!libro) {
                throw new Error('Libro no encontrado');
            }

            await libro.update(datosActualizados);
            await this.inicializarArbol();

            console.log(`[LibroService] Libro actualizado: ${libro.titulo}`);
            return libro;
        } catch (error) {
            console.error('❌ Error al actualizar libro:', error.message);
            throw error;
        }
    }

    async actualizarLibroConArchivos(id, datosActualizados, archivos = null) {
        try {
            
            const libro = await Libro.findByPk(id);
            if (!libro) {
                throw new Error('Libro no encontrado');
            }

            // Actualizar datos básicos primero
            await libro.update(datosActualizados);

            let urlPortada = libro.portada; // Mantener portada actual por defecto
            let urlArchivo = libro.archivo; // Mantener archivo actual por defecto

            // Procesar archivos si existen
            if (archivos) {
                // Subir nueva portada si existe
                if (archivos.portada && archivos.portada[0]) {
                    
                    // Eliminar portada anterior si existe
                    if (libro.portada) {
                        try {
                            const publicIdAnterior = cloudinaryAdapter.extraerPublicId(libro.portada);
                            if (publicIdAnterior) {
                                await cloudinaryAdapter.eliminarImagen(publicIdAnterior);
                            }
                        } catch (error) {
                            console.warn('⚠️ No se pudo eliminar la portada anterior:', error.message);
                        }
                    }

                    const resultadoPortada = await cloudinaryAdapter.subirPortada(
                        archivos.portada[0], 
                        libro.id
                    );
                    urlPortada = resultadoPortada.url;
                }

                // Subir nuevo archivo PDF si existe
                if (archivos.archivo && archivos.archivo[0]) {
                    
                    // Eliminar archivo anterior si existe
                    if (libro.archivo) {
                        try {
                            const publicIdAnterior = cloudinaryAdapter.extraerPublicId(libro.archivo);
                            if (publicIdAnterior) {
                                await cloudinaryAdapter.eliminarArchivo(publicIdAnterior);
                            }
                        } catch (error) {
                            console.warn('⚠️ No se pudo eliminar el archivo anterior:', error.message);
                        }
                    }

                    const resultadoArchivo = await cloudinaryAdapter.subirPDF(
                        archivos.archivo[0], 
                        libro.id
                    );
                    urlArchivo = resultadoArchivo.url;
                }

                // Actualizar el libro con las nuevas URLs si se subieron archivos
                if (archivos.portada || archivos.archivo) {
                    const datosActualizacion = {};
                    if (archivos.portada) datosActualizacion.portada = urlPortada;
                    if (archivos.archivo) datosActualizacion.archivo = urlArchivo;

                    await libro.update(datosActualizacion);
                }
            }

            // Actualizar el árbol binario
            await this.inicializarArbol();

            // Obtener el libro actualizado
            const libroActualizado = await Libro.findByPk(id);

            console.log(`[LibroService] Libro actualizado (archivos): ${libroActualizado.titulo}`);
            return libroActualizado;

        } catch (error) {
            console.error('❌ Error al actualizar libro con archivos:', error.message);
            throw error;
        }
    }

    async eliminarLibro(id) {
        try {
            const libro = await Libro.findByPk(id);
            if (!libro) {
                throw new Error('Libro no encontrado');
            }

            const titulo = libro.titulo;
            
            await libro.destroy();
            
            await this.inicializarArbol();

            console.log(`[LibroService] Libro eliminado: ${titulo}`);
            return true;
        } catch (error) {
            console.error('❌ Error al eliminar libro:', error.message);
            throw error;
        }
    }

    buscarPorTitulo(titulo) {
        return this.arbol.buscarPorTitulo(titulo);
    }

    buscarPorAutor(autor) {
        return this.arbol.buscarPorAutor(autor);
    }

    buscarPorGenero(genero) {
        return this.arbol.buscarPorGenero(genero);
    }

    buscarGeneral(termino) {
        return this.arbol.buscarGeneral(termino);
    }

    obtenerSugerencias(termino) {
        return this.arbol.obtenerSugerencias(termino);
    }

    buscarPorPrefijo(prefijo, campo = 'titulo') {
        return this.arbol.buscarPorPrefijo(prefijo, campo);
    }

    obtenerTodosLosLibros() {
        return this.arbol.obtenerTodosLosLibros();
    }

    buscarPorId(id) {
        return this.arbol.buscarPorId(id);
    }

    obtenerEstadisticas() {
        const base = this.arbol.obtenerEstadisticas();
        // Calcular género con mayor cantidad
        try {
            const todos = this.arbol.obtenerTodosLosLibros();
            const conteo = {};
            todos.forEach(l => {
                if (l.genero) {
                    const g = l.genero.trim();
                    conteo[g] = (conteo[g] || 0) + 1;
                }
            });
            let topGenero = null;
            for (const g in conteo) {
                if (!topGenero || conteo[g] > topGenero.cantidad) {
                    topGenero = { genero: g, cantidad: conteo[g] };
                }
            }
            return { ...base, topGenero };
        } catch (e) {
            return { ...base, topGenero: null };
        }
    }

    // Obtener recorrido del árbol (preorden, inorden, postorden)
    obtenerRecorrido(tipo = 'inorden') {
        const t = (tipo || '').toLowerCase();
        switch (t) {
            case 'preorden':
            case 'pre':
                return this.arbol.preOrden();
            case 'postorden':
            case 'post':
                return this.arbol.postOrden();
            case 'inorden':
            case 'in':
            default:
                return this.arbol.inOrden();
        }
    }

    async sincronizarArbol() {
        try {
            await this.inicializarArbol();
            console.log('[LibroService] Árbol sincronizado');
            return true;
        } catch (error) {
            console.error('❌ Error al sincronizar:', error.message);
            throw error;
        }
    }

    async verificarConsistencia() {
        try {
            const librosBD = await Libro.count();
            const librosArbol = this.arbol.contarLibros();
            
            const consistente = librosBD === librosArbol;
            
            return {
                consistente,
                librosBD,
                librosArbol,
                diferencia: Math.abs(librosBD - librosArbol)
            };
        } catch (error) {
            console.error('❌ Error al verificar consistencia:', error.message);
            throw error;
        }
    }
}

const libroService = new LibroService();

module.exports = {
    LibroService,
    libroService
};