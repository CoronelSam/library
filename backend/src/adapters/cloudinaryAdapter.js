const { cloudinary } = require('../config/config');
const fs = require('fs').promises;
const path = require('path');

class CloudinaryAdapter {
    constructor() {
        this.cloudinary = cloudinary;
    }

    /**
     * Subir portada de libro a Cloudinary
     * @param {Object} archivo - Archivo de imagen
     * @param {Number} libroId - ID del libro
     * @returns {Object} - URL y datos de la imagen subida
     */
    async subirPortada(archivo, libroId) {
        try {
            if (!archivo) {
                throw new Error('No se proporcionó ningún archivo');
            }

            if (!this.esImagenValida(archivo.mimetype)) {
                throw new Error('El archivo debe ser una imagen (JPG, PNG, WebP)');
            }

            const options = {
                folder: 'biblioteca/portadas',
                public_id: `libro_${libroId}`,
                format: 'jpg',
                quality: 'auto:good',
                width: 400,
                height: 600,
                crop: 'fill',
                gravity: 'center',
                overwrite: true,
                invalidate: true
            };

            const resultado = await this.cloudinary.uploader.upload(archivo.path, options);

            await this.limpiarArchivoTemporal(archivo.path);

            return {
                url: resultado.secure_url,
                publicId: resultado.public_id,
                width: resultado.width,
                height: resultado.height,
                format: resultado.format,
                bytes: resultado.bytes
            };

        } catch (error) {
            if (archivo && archivo.path) {
                await this.limpiarArchivoTemporal(archivo.path);
            }
            throw new Error(`Error al subir imagen: ${error.message}`);
        }
    }

    /**
 * Subir imagen adicional a Cloudinary
 * @param {Object} archivo - Archivo de imagen
 * @param {Number} libroId - ID del libro
 * @param {Number} index - Índice de la imagen
 * @returns {Object} - URL y datos de la imagen subida
 */
async subirImagenAdicional(archivo, libroId, index) {
    try {
        if (!archivo) {
            throw new Error('No se proporcionó ningún archivo');
        }

        if (!this.esImagenValida(archivo.mimetype)) {
            throw new Error('El archivo debe ser una imagen (JPG, PNG, WebP)');
        }

        const options = {
            folder: 'biblioteca/imagenes_adicionales',
            public_id: `libro_${libroId}_extra_${index}_${Date.now()}`,
            format: 'jpg',
            quality: 'auto:good',
            width: 800,
            height: 1200,
            crop: 'fill',
            gravity: 'center',
            overwrite: false, // No sobrescribir para mantener histórico
            invalidate: true
        };

        const resultado = await this.cloudinary.uploader.upload(archivo.path, options);
        await this.limpiarArchivoTemporal(archivo.path);

        return {
            url: resultado.secure_url,
            publicId: resultado.public_id,
            width: resultado.width,
            height: resultado.height,
            format: resultado.format,
            bytes: resultado.bytes
        };

    } catch (error) {
        if (archivo && archivo.path) {
            await this.limpiarArchivoTemporal(archivo.path);
        }
        throw new Error(`Error al subir imagen adicional: ${error.message}`);
    }
}

    /**
     * Subir archivo PDF del libro
     * @param {Object} archivo - Archivo PDF
     * @param {Number} libroId - ID del libro
     * @returns {Object} - URL y datos del PDF subido
     */
    async subirPDF(archivo, libroId) {
        try {
            if (!archivo) {
                throw new Error('No se proporcionó ningún archivo PDF');
            }

            if (archivo.mimetype !== 'application/pdf') {
                throw new Error('El archivo debe ser un PDF');
            }

            const options = {
                folder: 'biblioteca/libros',
                public_id: `libro_pdf_${libroId}`,
                resource_type: 'raw',
                overwrite: true,
                invalidate: true
            };

            // Subir archivo a Cloudinary
            const resultado = await this.cloudinary.uploader.upload(archivo.path, options);

            // Limpiar archivo temporal
            await this.limpiarArchivoTemporal(archivo.path);

            return {
                url: resultado.secure_url,
                publicId: resultado.public_id,
                format: resultado.format,
                bytes: resultado.bytes
            };

        } catch (error) {
            // Limpiar archivo temporal en caso de error
            if (archivo && archivo.path) {
                await this.limpiarArchivoTemporal(archivo.path);
            }
            throw new Error(`Error al subir PDF: ${error.message}`);
        }
    }

    /**
     * Eliminar imagen de Cloudinary
     * @param {String} publicId 
     * @returns {Object}
     */
    async eliminarImagen(publicId) {
        try {
            const resultado = await this.cloudinary.uploader.destroy(publicId);
            return resultado;
        } catch (error) {
            throw new Error(`Error al eliminar imagen: ${error.message}`);
        }
    }

    /**
     * Eliminar archivo (PDF) de Cloudinary
     * @param {String} publicId
     * @returns {Object} 
     */
    async eliminarArchivo(publicId) {
        try {
            const resultado = await this.cloudinary.uploader.destroy(publicId, {
                resource_type: 'raw'
            });
            return resultado;
        } catch (error) {
            throw new Error(`Error al eliminar archivo: ${error.message}`);
        }
    }

    /**
     * Obtener información de una imagen
     * @param {String} publicId - ID público de la imagen
     * @returns {Object} - Información de la imagen
     */
    async obtenerInfoImagen(publicId) {
        try {
            const resultado = await this.cloudinary.api.resource(publicId);
            return {
                url: resultado.secure_url,
                width: resultado.width,
                height: resultado.height,
                format: resultado.format,
                bytes: resultado.bytes,
                createdAt: resultado.created_at
            };
        } catch (error) {
            throw new Error(`Error al obtener información de imagen: ${error.message}`);
        }
    }

    /**
     * Validar si el archivo es una imagen válida
     * @param {String} mimetype - Tipo MIME del archivo
     * @returns {Boolean} - True si es válido
     */
    esImagenValida(mimetype) {
        const tiposPermitidos = [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/webp'
        ];
        return tiposPermitidos.includes(mimetype);
    }

    /**
     * Limpiar archivo temporal del servidor
     * @param {String} rutaArchivo - Ruta del archivo temporal
     */
    async limpiarArchivoTemporal(rutaArchivo) {
        try {
            await fs.unlink(rutaArchivo);
            // Archivo temporal eliminado (log removido para producción)
        } catch (error) {
            console.warn(`⚠️ No se pudo eliminar archivo temporal: ${rutaArchivo}`);
        }
    }

    /**
     * Generar transformaciones de imagen
     * @param {String} url - URL de la imagen original
     * @param {Object} opciones - Opciones de transformación
     * @returns {String} - URL con transformaciones
     */
    generarTransformacion(url, opciones = {}) {
        const {
            width = 200,
            height = 300,
            quality = 'auto:good',
            format = 'jpg'
        } = opciones;

        // Extraer public_id de la URL
        const matches = url.match(/\/v\d+\/(.+)\./);
        if (!matches) return url;

        const publicId = matches[1];

        return this.cloudinary.url(publicId, {
            width,
            height,
            crop: 'fill',
            gravity: 'center',
            quality,
            format
        });
    }

    /**
     * Obtener URL de thumbnail
     * @param {String} url - URL de la imagen original
     * @returns {String} - URL del thumbnail
     */
    obtenerThumbnail(url) {
        return this.generarTransformacion(url, {
            width: 150,
            height: 200,
            quality: 'auto:low'
        });
    }

    /**
     * Generar URL de descarga para PDFs con nombre personalizado
     * @param {String} url - URL del PDF en Cloudinary
     * @param {String} nombreArchivo - Nombre personalizado para el archivo
     * @returns {String} - URL con parámetros de descarga
     */
    generarURLDescarga(url, nombreArchivo) {
        try {
            // Strategy simplificada: usar la secure_url original y añadir fl_attachment
            let nombreLimpio = nombreArchivo || 'archivo.pdf';
            if (!/\.pdf$/i.test(nombreLimpio)) {
                nombreLimpio = nombreLimpio.replace(/\.+$/, '');
                nombreLimpio += '.pdf';
            }
            const separador = url.includes('?') ? '&' : '?';
            return `${url}${separador}fl_attachment=${encodeURIComponent(nombreLimpio)}`;

        } catch (error) {
            console.error('❌ Error al generar URL de descarga:', error);
            return url; // Fallback a la URL original
        }
    }

    extraerPublicId(url) {
        try {
            // Patrones para diferentes formatos de URL de Cloudinary
            const patrones = [
                // Formato estándar: https://res.cloudinary.com/cloud/resource_type/upload/v123/folder/file.ext
                /\/upload\/v\d+\/(.+?)(?:\.[^.]+)?$/,
                // Formato sin versión: https://res.cloudinary.com/cloud/resource_type/upload/folder/file.ext
                /\/upload\/(.+?)(?:\.[^.]+)?$/,
                // Formato con transformaciones: https://res.cloudinary.com/cloud/image/upload/w_500,h_300/v123/folder/file.ext
                /\/upload\/[^/]*\/v\d+\/(.+?)(?:\.[^.]+)?$/,
                // Formato raw: https://res.cloudinary.com/cloud/raw/upload/v123/folder/file.ext
                /\/raw\/upload\/v\d+\/(.+?)(?:\.[^.]+)?$/
            ];

            for (const patron of patrones) {
                const match = url.match(patron);
                if (match && match[1]) {
                    return match[1];
                }
            }

            console.warn('⚠️ No se pudo extraer public_id con ningún patrón');
            return null;
        } catch (error) {
            console.error('❌ Error al extraer public_id:', error);
            return null;
        }
    }

    /**
     * Verificar si un PDF existe en Cloudinary
     * @param {String} publicId - ID público del PDF
     * @returns {Boolean} - True si existe
     */
    async verificarPDFExiste(publicId) {
        try {
            await this.cloudinary.api.resource(publicId, {
                resource_type: 'raw'
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Obtener información de un PDF
     * @param {String} publicId - ID público del PDF
     * @returns {Object} - Información del PDF
     */
    async obtenerInfoPDF(publicId) {
        try {
            const resultado = await this.cloudinary.api.resource(publicId, {
                resource_type: 'raw'
            });
            return {
                url: resultado.secure_url,
                format: resultado.format,
                bytes: resultado.bytes,
                createdAt: resultado.created_at,
                publicId: resultado.public_id
            };
        } catch (error) {
            throw new Error(`Error al obtener información de PDF: ${error.message}`);
        }
    }
}

const cloudinaryAdapter = new CloudinaryAdapter();

module.exports = {
    CloudinaryAdapter,
    cloudinaryAdapter
};