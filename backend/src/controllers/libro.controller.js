const { libroService } = require('../services/LibroService');
const { cloudinaryAdapter } = require('../adapters/cloudinaryAdapter');
const { cleanupFiles } = require('../middleware/upload');
const Libro = require('../models/Libro');

function normalizarDatosLibro(datos) {
    return {
        ...datos,
        // Convertir cadenas vacías a null para campos numéricos
        año_publicacion: datos.año_publicacion && datos.año_publicacion.toString().trim() !== '' 
            ? parseInt(datos.año_publicacion) 
            : null,
        // Asegurar que campos de texto vacíos sean null en lugar de cadenas vacías
        editorial: datos.editorial && datos.editorial.trim() !== '' ? datos.editorial.trim() : null,
        descripcion: datos.descripcion && datos.descripcion.trim() !== '' ? datos.descripcion.trim() : null
    };
}

class LibroController {
    // Obtener todos los libros
    async obtenerTodos(req, res) {
        try {
            const { ordenar = 'titulo' } = req.query;
            
            let libros;
            if (ordenar === 'titulo') {
                // Aprovechar el arbol binario para orden por título
                libros = libroService.obtenerTodosLosLibros();
            } else {
                // Para otros ordenamientos, usar la base de datos
                libros = await Libro.findAll({
                    order: [[ordenar, 'ASC']]
                });
            }

            res.json({
                success: true,
                data: libros,
                total: libros.length,
                mensaje: 'Libros obtenidos correctamente'
            });
        } catch (error) {
            console.error('Error al obtener libros:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                mensaje: 'Error al obtener los libros'
            });
        }
    }

    async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            
            // Primero intentar desde el árbol (más rápido)
            let libro = libroService.buscarPorId(parseInt(id));
            
            // Si no se encuentra en el árbol, buscar en BD
            if (!libro) {
                libro = await Libro.findByPk(id);
            }

            if (!libro) {
                return res.status(404).json({
                    success: false,
                    mensaje: 'Libro no encontrado'
                });
            }

            res.json({
                success: true,
                data: libro,
                mensaje: 'Libro encontrado'
            });
        } catch (error) {
            console.error('Error al obtener libro por ID:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                mensaje: 'Error al obtener el libro'
            });
        }
    }

    // Crear un nuevo libro
    async crear(req, res) {
        try {
            const datosLibro = req.body;
            const archivos = req.files;

            console.log(`[LibroController] Crear libro: ${datosLibro.titulo}`);

            // Soporte alias sin tilde (por formularios o navegadores que quiten tildes)
            if (!datosLibro.año_publicacion && datosLibro.anio_publicacion) {
                datosLibro.año_publicacion = datosLibro.anio_publicacion;
            }

            // Validaciones básicas
            if (!datosLibro.titulo || !datosLibro.autor || !datosLibro.genero) {
                // Limpiar archivos temporales si hay error
                if (archivos) cleanupFiles(archivos);
                
                return res.status(400).json({
                    success: false,
                    mensaje: 'Título, autor y género son campos obligatorios'
                });
            }

            // Verificar si ya existe un libro con el mismo título y autor
            const libroExistente = await Libro.findOne({
                where: {
                    titulo: datosLibro.titulo,
                    autor: datosLibro.autor
                }
            });

            if (libroExistente) {
                // Limpiar archivos temporales si hay error
                if (archivos) cleanupFiles(archivos);
                
                return res.status(409).json({
                    success: false,
                    mensaje: 'Ya existe un libro con el mismo título y autor'
                });
            }

            // Normalizar datos antes de crear
            const datosNormalizados = normalizarDatosLibro(datosLibro);

            // Crear el libro usando el servicio (actualiza BD y árbol)
            const nuevoLibro = await libroService.agregarLibroConArchivos(datosNormalizados, archivos);

            res.status(201).json({
                success: true,
                data: nuevoLibro,
                mensaje: 'Libro creado correctamente'
            });
        } catch (error) {
            console.error('Error al crear libro:', error);
            
            // Limpiar archivos temporales en caso de error
            if (req.files) cleanupFiles(req.files);
            
            res.status(500).json({
                success: false,
                error: error.message,
                mensaje: 'Error al crear el libro'
            });
        }
    }

    // Actualizar un libro
    async actualizar(req, res) {
        try {
            const { id } = req.params;
            const datosActualizados = req.body;
            const archivos = req.files;

            console.log(`[LibroController] Actualizar libro ID: ${id}`);

            if (!datosActualizados.año_publicacion && datosActualizados.anio_publicacion) {
                datosActualizados.año_publicacion = datosActualizados.anio_publicacion;
            }

            // Verificar que el libro existe
            const libro = await Libro.findByPk(id);
            if (!libro) {
                // Limpiar archivos temporales si hay error
                if (archivos) cleanupFiles(archivos);
                
                return res.status(404).json({
                    success: false,
                    mensaje: 'Libro no encontrado'
                });
            }

            // Validaciones básicas
            if (!datosActualizados.titulo || !datosActualizados.autor || !datosActualizados.genero) {
                // Limpiar archivos temporales si hay error
                if (archivos) cleanupFiles(archivos);
                
                return res.status(400).json({
                    success: false,
                    mensaje: 'Título, autor y género son campos obligatorios'
                });
            }

            // Verificar si hay otro libro con el mismo título y autor (excluyendo el actual)
            const libroExistente = await Libro.findOne({
                where: {
                    titulo: datosActualizados.titulo,
                    autor: datosActualizados.autor,
                    id: { [require('sequelize').Op.ne]: id } // Excluir el libro actual
                }
            });

            if (libroExistente) {
                // Limpiar archivos temporales si hay error
                if (archivos) cleanupFiles(archivos);
                
                return res.status(409).json({
                    success: false,
                    mensaje: 'Ya existe otro libro con el mismo título y autor'
                });
            }

            // Normalizar datos antes de actualizar
            const datosNormalizados = normalizarDatosLibro(datosActualizados);

            // Verificar si realmente hay archivos válidos para procesar
            const tienePortadaNueva = archivos && archivos.portada && archivos.portada[0] && archivos.portada[0].size > 0;
            const tieneArchivoNuevo = archivos && archivos.archivo && archivos.archivo[0] && archivos.archivo[0].size > 0;
            

            // Actualizar usando el servicio apropiado
            let libroActualizado;
            if (tienePortadaNueva || tieneArchivoNuevo) {
                // Crear objeto de archivos solo con los que realmente existen
                const archivosValidos = {};
                if (tienePortadaNueva) archivosValidos.portada = archivos.portada;
                if (tieneArchivoNuevo) archivosValidos.archivo = archivos.archivo;
                
                libroActualizado = await libroService.actualizarLibroConArchivos(id, datosNormalizados, archivosValidos);
            } else {
                libroActualizado = await libroService.actualizarLibro(id, datosNormalizados);
                
                // Limpiar archivos temporales que no se usaron
                if (archivos) {
                    cleanupFiles(archivos);
                }
            }

            res.json({
                success: true,
                data: libroActualizado,
                mensaje: 'Libro actualizado correctamente'
            });
        } catch (error) {
            console.error('Error al actualizar libro:', error);
            
            // Limpiar archivos temporales en caso de error
            if (req.files) cleanupFiles(req.files);
            
            res.status(500).json({
                success: false,
                error: error.message,
                mensaje: 'Error al actualizar el libro'
            });
        }
    }

    // Eliminar un libro
    async eliminar(req, res) {
        try {
            const { id } = req.params;

            // Verificar que el libro existe
            const libro = await Libro.findByPk(id);
            if (!libro) {
                return res.status(404).json({
                    success: false,
                    mensaje: 'Libro no encontrado'
                });
            }

            // Eliminar usando el servicio
            await libroService.eliminarLibro(id);

            res.json({
                success: true,
                mensaje: 'Libro eliminado correctamente'
            });
        } catch (error) {
            console.error('Error al eliminar libro:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                mensaje: 'Error al eliminar el libro'
            });
        }
    }

    // Obtener PDF para visualización
    async obtenerPDF(req, res) {
        try {
            const { id } = req.params;
            
            const libro = await Libro.findByPk(id);
            if (!libro) {
                return res.status(404).json({
                    success: false,
                    mensaje: 'Libro no encontrado'
                });
            }

            if (!libro.archivo) {
                return res.status(404).json({
                    success: false,
                    mensaje: 'Este libro no tiene archivo PDF disponible'
                });
            }

            // Redirigir directamente a la URL de Cloudinary
            res.redirect(libro.archivo);
        } catch (error) {
            console.error('❌ Error al obtener PDF:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                mensaje: 'Error al obtener el archivo PDF'
            });
        }
    }

    // Descargar PDF con nombre apropiado
    async descargarPDF(req, res) {
        try {
            const { id } = req.params;
            
            const libro = await Libro.findByPk(id);
            if (!libro) {
                return res.status(404).json({
                    success: false,
                    mensaje: 'Libro no encontrado'
                });
            }

            if (!libro.archivo) {
                return res.status(404).json({
                    success: false,
                    mensaje: 'Este libro no tiene archivo PDF disponible'
                });
            }

            // Crear nombre de archivo sanitizado
            const nombreArchivo = `${libro.titulo.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_${libro.autor.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}.pdf`;
            
            // Obtener URL de descarga desde Cloudinary
            const urlDescarga = cloudinaryAdapter.generarURLDescarga(libro.archivo, nombreArchivo);
            
            res.redirect(urlDescarga);
        } catch (error) {
            console.error('❌ Error al descargar PDF:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                mensaje: 'Error al descargar el archivo PDF'
            });
        }
    }

    // Buscar libros
    async buscar(req, res) {
        try {
            const { q: termino, tipo = 'general' } = req.query;

            if (!termino) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'El término de búsqueda es obligatorio'
                });
            }

            let resultados = [];

            switch (tipo) {
                case 'titulo':
                    const libroTitulo = libroService.buscarPorTitulo(termino);
                    resultados = libroTitulo ? [libroTitulo] : [];
                    break;
                
                case 'autor':
                    resultados = libroService.buscarPorAutor(termino);
                    break;
                
                case 'genero':
                    resultados = libroService.buscarPorGenero(termino);
                    break;
                
                case 'general':
                default:
                    resultados = libroService.buscarGeneral(termino);
                    break;
            }

            // Si no hay resultados, obtener sugerencias
            let sugerencias = [];
            if (resultados.length === 0) {
                sugerencias = libroService.obtenerSugerencias(termino);
            }

            res.json({
                success: true,
                data: resultados,
                sugerencias: sugerencias,
                total: resultados.length,
                termino: termino,
                tipo: tipo,
                mensaje: resultados.length > 0 ? 'Búsqueda completada' : 'No se encontraron resultados'
            });
        } catch (error) {
            console.error('Error en búsqueda:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                mensaje: 'Error al realizar la búsqueda'
            });
        }
    }

    // Autocompletado
    async autocompletar(req, res) {
        try {
            const { q: prefijo, campo = 'titulo' } = req.query;

            if (!prefijo || prefijo.length < 2) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'El prefijo debe tener al menos 2 caracteres'
                });
            }

            const sugerencias = libroService.buscarPorPrefijo(prefijo, campo);

            res.json({
                success: true,
                data: sugerencias.slice(0, 10), // Limitar a 10 sugerencias
                prefijo: prefijo,
                campo: campo
            });
        } catch (error) {
            console.error('Error en autocompletado:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                mensaje: 'Error en el autocompletado'
            });
        }
    }

    // Nueva búsqueda optimizada (para UI de edición) usando árbol con prefijo / general
    async busquedaOptimizada(req, res) {
        try {
            const { q = '', tipo = 'auto', limite = '100', prefijo = 'true', genero, autor } = req.query;
            const term = q.trim();
            const max = Math.min(parseInt(limite) || 100, 300);

            if (!term) {
                return res.status(400).json({ success: false, mensaje: 'Parámetro q requerido' });
            }

            let resultados = [];

            // Estrategia:
            // 1. Si tipo=tituloExacto intentar coincidencia exacta primero.
            // 2. Si prefijo=true intentar buscarPorPrefijo.
            // 3. Fallback -> buscarGeneral.
            // 4. Si sigue vacío -> sugerencias difusas.

            if (tipo === 'tituloExacto') {
                const exacto = libroService.buscarPorTitulo(term);
                if (exacto) resultados = [exacto];
            }

            if (resultados.length === 0 && prefijo === 'true') {
                resultados = libroService.buscarPorPrefijo(term, 'titulo');
            }

            if (resultados.length === 0) {
                resultados = libroService.buscarGeneral(term);
            }

            // Filtros secundarios (en memoria)
            if (genero) {
                const gLower = genero.toLowerCase();
                resultados = resultados.filter(l => l.genero && l.genero.toLowerCase().includes(gLower));
            }
            if (autor) {
                const aLower = autor.toLowerCase();
                resultados = resultados.filter(l => l.autor && l.autor.toLowerCase().includes(aLower));
            }

            const total = resultados.length;
            resultados = resultados.slice(0, max);

            let sugerencias = [];
            if (total === 0) {
                sugerencias = libroService.obtenerSugerencias(term).slice(0, 5);
            }

            return res.json({
                success: true,
                total,
                limite: max,
                data: resultados,
                sugerencias,
                termino: term,
                mensaje: total > 0 ? 'Resultados obtenidos' : 'Sin coincidencias'
            });
        } catch (error) {
            console.error('Error en busqueda optimizada:', error);
            return res.status(500).json({ success: false, mensaje: 'Error en busqueda optimizada', error: error.message });
        }
    }

    // Obtener estadísticas
    async obtenerEstadisticas(req, res) {
        try {
            const estadisticas = libroService.obtenerEstadisticas();
            const consistencia = await libroService.verificarConsistencia();

            res.json({
                success: true,
                data: {
                    ...estadisticas,
                    consistencia: consistencia
                },
                mensaje: 'Estadísticas obtenidas correctamente'
            });
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                mensaje: 'Error al obtener estadísticas'
            });
        }
    }

    //obtener recorrido del árbol con filtros ligeros
    async obtenerRecorrido(req, res) {
        try {
            const { tipo = 'inorden', limite = '200', genero, autor, q } = req.query;
            const max = Math.min(parseInt(limite) || 200, 500);

            // Obtener recorrido base
            let lista = libroService.obtenerRecorrido(tipo);

            // Filtros opcionales en memoria
            if (genero) {
                const g = genero.toLowerCase();
                lista = lista.filter(l => l.genero && l.genero.toLowerCase().includes(g));
            }
            if (autor) {
                const a = autor.toLowerCase();
                lista = lista.filter(l => l.autor && l.autor.toLowerCase().includes(a));
            }
            if (q) {
                const term = q.toLowerCase();
                lista = lista.filter(l => (
                    (l.titulo && l.titulo.toLowerCase().includes(term)) ||
                    (l.autor && l.autor.toLowerCase().includes(term)) ||
                    (l.genero && l.genero.toLowerCase().includes(term))
                ));
            }

            const total = lista.length;
            const data = lista.slice(0, max);

            return res.json({
                success: true,
                tipo,
                total,
                limite: max,
                data,
                mensaje: 'Recorrido obtenido'
            });
        } catch (error) {
            console.error('Error al obtener recorrido:', error);
            return res.status(500).json({ success: false, mensaje: 'Error al obtener recorrido', error: error.message });
        }
    }
}

module.exports = new LibroController();