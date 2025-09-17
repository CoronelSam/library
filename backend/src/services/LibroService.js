const { arbolLibros } = require("../arbol");
const { cloudinaryAdapter } = require("../adapters/cloudinaryAdapter");
const Libro = require("../models/Libro");

class LibroService {
  constructor() {
    this.arbol = arbolLibros;
  }

  async inicializarArbol() {
    try {
      const libros = await Libro.findAll({ order: [["titulo", "ASC"]] });
      this.arbol.limpiar();
      libros.forEach((libro) => {
        const libroData = libro.toJSON();
        this.arbol.ingresarLibro(libroData);
      });
      console.log(
        `[LibroService] Árbol inicializado con ${libros.length} libros`
      );
      return libros.length;
    } catch (error) {
      console.error("Error al inicializar el árbol:", error.message);
      throw error;
    }
  }

  async agregarLibroConArchivos(datosLibro, archivos = null) {
    try {
      const nuevoLibro = await Libro.create(datosLibro);
      let urlPortada = null;
      let urlArchivo = null;

      if (archivos) {
        if (archivos.portada && archivos.portada[0]) {
          const resultadoPortada = await cloudinaryAdapter.subirPortada(
            archivos.portada[0],
            nuevoLibro.id
          );
          urlPortada = resultadoPortada.url;
        }
        if (archivos.archivo && archivos.archivo[0]) {
          const resultadoArchivo = await cloudinaryAdapter.subirPDF(
            archivos.archivo[0],
            nuevoLibro.id
          );
          urlArchivo = resultadoArchivo.url;
        }
        if (urlPortada || urlArchivo) {
          const datosActualizacion = {};
          if (urlPortada) datosActualizacion.portada = urlPortada;
          if (urlArchivo) datosActualizacion.archivo = urlArchivo;
          await nuevoLibro.update(datosActualizacion);
        }
      }

      const libroData = nuevoLibro.toJSON();
      this.arbol.ingresarLibro(libroData);
      console.log(`[LibroService] Libro creado: ${nuevoLibro.titulo}`);
      return nuevoLibro;
    } catch (error) {
      console.error("❌ Error al agregar libro con archivos:", error.message);
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
      console.error("❌ Error al agregar libro:", error.message);
      throw error;
    }
  }

  // REEMPLAZA LA FUNCIÓN COMPLETA EN TU LibroService.js CON ESTA:
// REEMPLAZA TU FUNCIÓN ACTUAL CON ESTA:
async actualizarLibroConArchivos(id, datosActualizados, archivos = null) {
    try {
        const libro = await Libro.findByPk(id);
        if (!libro) throw new Error('Libro no encontrado');

        // Limpieza de datos
        if (datosActualizados.hasOwnProperty('año_publicacion')) {
            const año = datosActualizados.año_publicacion;
            datosActualizados.año_publicacion = (año === '' || año === 'null' || año === null || año === undefined) ? null : parseInt(año, 10);
        }
        if (datosActualizados.isbn === '') datosActualizados.isbn = null;
        if (datosActualizados.editorial === '') datosActualizados.editorial = null;
        if (datosActualizados.descripcion === '') datosActualizados.descripcion = null;

        // El resto de tu lógica de archivos...
        const eliminarArchivoPDF = datosActualizados.removeArchivo === 'true';

        if (archivos && archivos.portada && archivos.portada[0]) {
            if (libro.portada) { try { const pid = cloudinaryAdapter.extraerPublicId(libro.portada); if (pid) await cloudinaryAdapter.eliminarImagen(pid); } catch (e) { console.warn(e.message); } }
            const res = await cloudinaryAdapter.subirPortada(archivos.portada[0], libro.id);
            datosActualizados.portada = res.url;
        }
        if (archivos && archivos.archivo && archivos.archivo[0]) {
            if (libro.archivo) { try { const pid = cloudinaryAdapter.extraerPublicId(libro.archivo); if (pid) await cloudinaryAdapter.eliminarArchivo(pid); } catch (e) { console.warn(e.message); } }
            const res = await cloudinaryAdapter.subirPDF(archivos.archivo[0], libro.id);
            datosActualizados.archivo = res.url;
        } else if (eliminarArchivoPDF && libro.archivo) {
            try { const pid = cloudinaryAdapter.extraerPublicId(libro.archivo); if (pid) await cloudinaryAdapter.eliminarArchivo(pid); } catch (e) { console.warn(e.message); }
            datosActualizados.archivo = null;
        }

        await libro.update(datosActualizados);
        await this.inicializarArbol();
        console.log(`[LibroService] Libro actualizado: ${libro.titulo}`);
        return await Libro.findByPk(id);
    } catch (error) {
        console.error('❌ Error en servicio al actualizar libro:', error);
        throw error;
    }
}

  async eliminarLibro(id) {
    try {
      const libro = await Libro.findByPk(id);
      if (!libro) {
        throw new Error("Libro no encontrado");
      }
      const titulo = libro.titulo;
      await libro.destroy();
      await this.inicializarArbol();
      console.log(`[LibroService] Libro eliminado: ${titulo}`);
      return true;
    } catch (error) {
      console.error("❌ Error al eliminar libro:", error.message);
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

  buscarPorPrefijo(prefijo, campo = "titulo") {
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
      todos.forEach((l) => {
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
  obtenerRecorrido(tipo = "inorden") {
    const t = (tipo || "").toLowerCase();
    switch (t) {
      case "preorden":
      case "pre":
        return this.arbol.preOrden();
      case "postorden":
      case "post":
        return this.arbol.postOrden();
      case "inorden":
      case "in":
      default:
        return this.arbol.inOrden();
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
        diferencia: Math.abs(librosBD - librosArbol),
      };
    } catch (error) {
      console.error("❌ Error al verificar consistencia:", error.message);
      throw error;
    }
  }
}

const libroService = new LibroService();

module.exports = {
  LibroService,
  libroService,
};
