const { libroService } = require('../services/LibroService');
const { cloudinaryAdapter } = require('../adapters/cloudinaryAdapter');
const { cleanupFiles } = require('../middleware/upload');
const Libro = require('../models/Libro');
const { Op } = require('sequelize');

// Esta función sigue siendo útil para la CREACIÓN de libros.
function normalizarDatosLibro(datos) {
    return {
        ...datos,
        año_publicacion: datos.año_publicacion && datos.año_publicacion.toString().trim() !== '' 
            ? parseInt(datos.año_publicacion) 
            : null,
        editorial: datos.editorial && datos.editorial.trim() !== '' ? datos.editorial.trim() : null,
        descripcion: datos.descripcion && datos.descripcion.trim() !== '' ? datos.descripcion.trim() : null
    };
}

async function subirImagenesAdicionales(archivos, libroId) {
    if (!archivos || !archivos.imagenes_adicionales) return [];
    
    const imagenesUrls = [];
    for (let i = 0; i < archivos.imagenes_adicionales.length; i++) {
        try {
            const file = archivos.imagenes_adicionales[i];
            const resultado = await cloudinaryAdapter.subirImagenAdicional(file, libroId, i);
            imagenesUrls.push(resultado.url);
        } catch (error) {
            console.error('Error al subir imagen adicional:', error);
        }
    }
    return imagenesUrls;
}


class LibroController {
    // Los métodos obtenerTodos, obtenerPorId, y crear no necesitan cambios.
    async obtenerTodos(req, res) {
        try {
            const { ordenar = 'titulo' } = req.query;
            let libros = (ordenar === 'titulo')
                ? libroService.obtenerTodosLosLibros()
                : await Libro.findAll({ order: [[ordenar, 'ASC']] });

            res.json({ success: true, data: libros, total: libros.length, mensaje: 'Libros obtenidos correctamente' });
        } catch (error) {
            console.error('Error al obtener libros:', error);
            res.status(500).json({ success: false, error: error.message, mensaje: 'Error al obtener los libros' });
        }
    }

    async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            let libro = libroService.buscarPorId(parseInt(id)) || await Libro.findByPk(id);

            if (!libro) {
                return res.status(404).json({ success: false, mensaje: 'Libro no encontrado' });
            }
            res.json({ success: true, data: libro, mensaje: 'Libro encontrado' });
        } catch (error) {
            console.error('Error al obtener libro por ID:', error);
            res.status(500).json({ success: false, error: error.message, mensaje: 'Error al obtener el libro' });
        }
    }

    async crear(req, res) {
        try {
            const datosLibro = req.body;
            const archivos = req.files;

            if (datosLibro.anio_publicacion && !datosLibro.año_publicacion) {
                datosLibro.año_publicacion = datosLibro.anio_publicacion;
            }
            delete datosLibro.anio_publicacion;

            if (!datosLibro.titulo || !datosLibro.autor || !datosLibro.genero) {
                if (archivos) cleanupFiles(archivos);
                return res.status(400).json({ success: false, mensaje: 'Título, autor y género son campos obligatorios' });
            }

            const libroExistente = await Libro.findOne({ where: { titulo: datosLibro.titulo, autor: datosLibro.autor } });
            if (libroExistente) {
                if (archivos) cleanupFiles(archivos);
                return res.status(409).json({ success: false, mensaje: 'Ya existe un libro con el mismo título y autor' });
            }

            if (datosLibro.isbn && datosLibro.isbn.trim() !== '') {
                const libroConISBN = await Libro.findOne({ where: { isbn: datosLibro.isbn.trim() } });
                if (libroConISBN) {
                    if (archivos) cleanupFiles(archivos);
                    return res.status(409).json({ success: false, mensaje: 'Ya existe un libro con el mismo ISBN' });
                }
            }

            const datosNormalizados = normalizarDatosLibro(datosLibro);
            const nuevoLibro = await libroService.agregarLibroConArchivos(datosNormalizados, archivos);

            if (archivos && archivos.imagenes_adicionales) {
                const imagenesUrls = await subirImagenesAdicionales(archivos, nuevoLibro.id);
                if (imagenesUrls.length > 0) {
                    await nuevoLibro.update({ imagenes_adicionales: imagenesUrls });
                    nuevoLibro.imagenes_adicionales = imagenesUrls;
                    await libroService.inicializarArbol();
                }
            }
            res.status(201).json({ success: true, data: nuevoLibro, mensaje: 'Libro creado correctamente' });
        } catch (error) {
            console.error('Error al crear libro:', error);
            if (req.files) cleanupFiles(req.files);
            res.status(500).json({ success: false, error: error.message, mensaje: 'Error al crear el libro' });
        }
    }
    
    // EN EL ARCHIVO libro.controller.js QUE ME DISTE

// REEMPLAZA TU FUNCIÓN ACTUAL CON ESTA VERSIÓN MÁS LIMPIA:
// REEMPLAZA TU FUNCIÓN "actualizar" COMPLETA CON ESTA.
async actualizar(req, res) {
    try {
        const { id } = req.params;
        const archivos = req.files;

        // ================================================================
        // ¡¡¡AQUÍ ESTÁ LA LÍNEA QUE ARREGLA TODO!!!
        // Convertimos el objeto especial de multer (req.body) en un objeto
        // de JavaScript normal y corriente usando el spread operator (`...`).
        const datosActualizados = { ...req.body };
        // ================================================================
        if (datosActualizados.hasOwnProperty('anio_publicacion')) {
        // Crea la clave correcta que el modelo espera.
        datosActualizados.año_publicacion = datosActualizados.anio_publicacion;
        // Elimina la clave temporal que usamos para el transporte.
        delete datosActualizados.anio_publicacion;
    }
        // A partir de aquí, `datosActualizados` es un objeto normal y todo funcionará.

        const libro = await Libro.findByPk(id);
        if (!libro) {
            if (archivos) cleanupFiles(archivos);
            return res.status(404).json({ success: false, mensaje: 'Libro no encontrado' });
        }

        if (!datosActualizados.titulo || !datosActualizados.autor || !datosActualizados.genero) {
            return res.status(400).json({ success: false, mensaje: 'Título, autor y género son campos obligatorios' });
        }
        const existeTitulo = await Libro.findOne({ where: { titulo: datosActualizados.titulo, autor: datosActualizados.autor, id: { [Op.ne]: id } } });
        if (existeTitulo) return res.status(409).json({ success: false, mensaje: 'Ya existe otro libro con el mismo título y autor' });

        if (datosActualizados.isbn && datosActualizados.isbn.trim() !== '') {
            const existeISBN = await Libro.findOne({ where: { isbn: datosActualizados.isbn.trim(), id: { [Op.ne]: id } } });
            if (existeISBN) return res.status(409).json({ success: false, mensaje: 'Ese ISBN ya está asignado a otro libro' });
        }
        
        let imagenesFinales = libro.imagenes_adicionales || [];
        if (datosActualizados.imagenes_adicionales && typeof datosActualizados.imagenes_adicionales === 'string') {
            try { imagenesFinales = JSON.parse(datosActualizados.imagenes_adicionales); } catch (e) { /* Ignorar */ }
        }
        if (archivos && archivos.imagenes_adicionales) {
            const nuevasUrls = await subirImagenesAdicionales(archivos, id);
            imagenesFinales = [...imagenesFinales, ...nuevasUrls];
        }
        datosActualizados.imagenes_adicionales = imagenesFinales;

        // Llamamos al servicio con nuestro objeto ya normalizado.
        const libroActualizado = await libroService.actualizarLibroConArchivos(id, datosActualizados, archivos);
        
        res.json({ success: true, data: libroActualizado, mensaje: 'Libro actualizado correctamente' });

    } catch (error) {
        console.error('Error fatal capturado en el controlador:', error);
        if (req.files) cleanupFiles(req.files);
        res.status(500).json({ success: false, mensaje: 'Error interno al actualizar el libro', error: error.message });
    }
}
    


    // El resto de los métodos no necesitan cambios.
    async eliminar(req, res) {
        try {
            const { id } = req.params;
            const libro = await Libro.findByPk(id);
            if (!libro) {
                return res.status(404).json({ success: false, mensaje: 'Libro no encontrado' });
            }
            await libroService.eliminarLibro(id);
            res.json({ success: true, mensaje: 'Libro eliminado correctamente' });
        } catch (error) {
            console.error('Error al eliminar libro:', error);
            res.status(500).json({ success: false, error: error.message, mensaje: 'Error al eliminar el libro' });
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
                return res.status(404).json({ success: false, mensaje: 'Libro no encontrado' });
            }
            if (!libro.archivo) {
                return res.status(404).json({ success: false, mensaje: 'Este libro no tiene archivo PDF disponible' });
            }
            const nombreArchivo = `${libro.titulo.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_${libro.autor.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}.pdf`;
            const urlDescarga = cloudinaryAdapter.generarURLDescarga(libro.archivo, nombreArchivo);
            return res.redirect(urlDescarga);
        } catch (error) {
            console.error('❌ Error al descargar PDF:', error);
            return res.status(500).json({ success: false, error: error.message, mensaje: 'Error al descargar el archivo PDF' });
        }
    }

    // Descargar PDF forzando descarga
    async descargarPDFProxy(req, res) {
        try {
            const { id } = req.params;
            const libro = await Libro.findByPk(id);
            if (!libro) {
                return res.status(404).json({ success: false, mensaje: 'Libro no encontrado' });
            }
            if (!libro.archivo) {
                return res.status(404).json({ success: false, mensaje: 'Este libro no tiene archivo PDF disponible' });
            }
            const nombreArchivo = `${libro.titulo.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_${libro.autor.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}.pdf`;

            const respuesta = await fetch(libro.archivo);
            if (!respuesta.ok) {
                return res.status(502).json({ success: false, mensaje: 'No se pudo obtener el archivo remoto', status: respuesta.status });
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(nombreArchivo)}"`);
            res.setHeader('Cache-Control', 'private, max-age=0, no-cache');

            if (respuesta.body.pipe) {
                respuesta.body.pipe(res);
            } else {
                const nodeStream = require('stream');
                const readable = nodeStream.Readable.fromWeb(respuesta.body);
                readable.pipe(res);
            }
        } catch (error) {
            console.error('❌ Error en proxy de descarga:', error);
            return res.status(500).json({ success: false, mensaje: 'Error interno en proxy de descarga', error: error.message });
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
                    resultados = libroService.buscarPorTitulo(termino) ? [libroService.buscarPorTitulo(termino)] : [];
                    break;
                case 'autor':
                    resultados = libroService.buscarPorAutor(termino);
                    break;
                case 'genero':
                    resultados = libroService.buscarPorGenero(termino);
                    break;
                default:
                    resultados = libroService.buscarGeneral(termino);
                    break;
            }

            let sugerencias = [];
            if (resultados.length === 0) {
                sugerencias = libroService.obtenerSugerencias(termino);
            }

            res.json({
                success: true,
                data: resultados,
                sugerencias,
                total: resultados.length,
                termino,
                tipo,
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
                data: sugerencias.slice(0, 10),
                prefijo,
                campo
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

    // Nueva búsqueda optimizada
    async busquedaOptimizada(req, res) {
        try {
            const { q = '', limite = '100', prefijo = 'true', genero, autor } = req.query;
            const term = q.trim();
            const max = Math.min(parseInt(limite) || 100, 300);

            if (!term) {
                return res.status(400).json({ success: false, mensaje: 'Parámetro q requerido' });
            }

            let resultados = [];

            if (prefijo === 'true') {
                resultados = libroService.buscarPorPrefijo(term, 'titulo');
            }
            if (resultados.length === 0) {
                resultados = libroService.buscarGeneral(term);
            }

            if (genero) {
                resultados = resultados.filter(l => l.genero && l.genero.toLowerCase().includes(genero.toLowerCase()));
            }
            if (autor) {
                resultados = resultados.filter(l => l.autor && l.autor.toLowerCase().includes(autor.toLowerCase()));
            }

            const total = resultados.length;
            const sugerencias = total === 0 ? libroService.obtenerSugerencias(term).slice(0, 5) : [];

            return res.json({
                success: true,
                total,
                limite: max,
                data: resultados.slice(0, max),
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
                data: { ...estadisticas, consistencia },
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

    //obtener recorrido del árbol
    async obtenerRecorrido(req, res) {
        try {
            const { tipo = 'inorden', limite = '200', genero, autor, q } = req.query;
            const max = Math.min(parseInt(limite) || 200, 500);

            let lista = libroService.obtenerRecorrido(tipo);

            if (genero) {
                lista = lista.filter(l => l.genero && l.genero.toLowerCase().includes(genero.toLowerCase()));
            }
            if (autor) {
                lista = lista.filter(l => l.autor && l.autor.toLowerCase().includes(autor.toLowerCase()));
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