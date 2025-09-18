const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { appConfig } = require('../config/config');
let sizeOf;
try {
    sizeOf = require('image-size');
} catch (e) {
    console.warn("No se pudo cargar 'image-size'. Orientación no se validará estrictamente.");
}

const uploadsDir = appConfig.uploads.uploadPath;
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

const fileFilter = (req, file, cb) => {
    try {
        if (file.fieldname === 'portada' || file.fieldname === 'imagenes_adicionales') {
            if (appConfig.uploads.allowedImageTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error(`Tipo de imagen no permitido. Solo se permiten: ${appConfig.uploads.allowedImageTypes.join(', ')}`), false);
            }
        } else if (file.fieldname === 'archivo') {
            // Validar PDFs para archivo del libro
            if (appConfig.uploads.allowedDocumentTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error(`Tipo de documento no permitido. Solo se permiten: ${appConfig.uploads.allowedDocumentTypes.join(', ')}`), false);
            }
        } else {
            cb(new Error('Campo de archivo no reconocido'), false);
        }
    } catch (error) {
        console.error('❌ Error en fileFilter:', error);
        cb(error, false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 10// Maximo 10 archivos (portada + PDF + 8 imagenes adicionales)
    }
});

const uploadLibroFiles = upload.fields([
    { name: 'portada', maxCount: 1 },
    { name: 'imagenes_adicionales', maxCount: 8 }, // Hasta 8 imágenes adicionales
    { name: 'archivo', maxCount: 1 }
]);

const verificarOrientacionImagen = async (filePath) => {
    try {
        if (!sizeOf) return true;
        const dimensions = sizeOf(filePath);
        return dimensions.height >= dimensions.width;
    } catch (error) {
        console.warn('No se pudo verificar orientación de imagen:', error);
        return true;
    }
};

const validarOrientacionImagenes = async (req, res, next) => {
    try {
        if (req.aborted) {
            if (req.files) cleanupFiles(req.files);
            return res.status(499).json({ success: false, mensaje: 'Cliente canceló la solicitud' });
        }

        if (req.files && req.files.portada) {
            for (const file of req.files.portada) {
                const esVertical = await verificarOrientacionImagen(file.path);
                if (!esVertical) {
                    cleanupFiles(req.files);
                    return res.status(400).json({
                        success: false,
                        mensaje: 'La imagen de portada debe ser vertical',
                        error: 'IMAGE_NOT_VERTICAL'
                    });
                }
            }
        }
        
        if (req.files && req.files.imagenes_adicionales) {
            for (const file of req.files.imagenes_adicionales) {
                const esVertical = await verificarOrientacionImagen(file.path);
                if (!esVertical) {
                    cleanupFiles(req.files);
                    return res.status(400).json({
                        success: false,
                        mensaje: 'Todas las imágenes adicionales deben ser verticales',
                        error: 'IMAGE_NOT_VERTICAL'
                    });
                }
            }
        }
        
        next();
    } catch (error) {
        console.error('Error al validar orientación de imágenes:', error);
        if (req.files) cleanupFiles(req.files);
        res.status(500).json({
            success: false,
            mensaje: 'Error al validar imágenes',
            error: 'ORIENTATION_VALIDATION_ERROR'
        });
    }
};

const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        console.error('❌ Error de Multer:', error);
        
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    success: false,
                    mensaje: 'El archivo es demasiado grande. Máximo 50MB permitido.',
                    error: 'FILE_TOO_LARGE'
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    success: false,
                    mensaje: 'Demasiados archivos. Máximo 10 archivos permitidos.',
                    error: 'TOO_MANY_FILES'
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    success: false,
                    mensaje: 'Campo de archivo inesperado. Solo se permiten "portada", "archivo" y "imagenes_adicionales".',
                    error: 'UNEXPECTED_FIELD'
                });
            default:
                return res.status(400).json({
                    success: false,
                    mensaje: 'Error al procesar archivos.',
                    error: error.code
                });
        }
    } else if (error) {
        console.error('❌ Error personalizado:', error);
        return res.status(400).json({
            success: false,
            mensaje: error.message,
            error: 'CUSTOM_ERROR'
        });
    }
    
    next();
};

const cleanupTempFiles = (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
        if (res.statusCode >= 400 && req.files) {
            cleanupFiles(req.files);
        }
        originalSend.call(this, data);
    };
    
    next();
};

const cleanupFiles = (files) => {
    try {
        Object.keys(files).forEach(fieldName => {
            files[fieldName].forEach(file => {
                fs.unlink(file.path, (err) => {
                    if (err) console.warn(`⚠️ No se pudo eliminar archivo temporal: ${file.path}`);
                });
            });
        });
    } catch (error) {
        console.warn('⚠️ Error al limpiar archivos temporales:', error);
    }
};

const validateUploadedFiles = (req, res, next) => {
    try {
        if (req.files) {
            // Validar portada si existe
            if (req.files.portada && req.files.portada[0]) {
                const portada = req.files.portada[0];
                // Validación adicional de tamaño para imágenes
                if (portada.size > 10 * 1024 * 1024) { // 10MB para imágenes
                    cleanupFiles(req.files);
                    return res.status(400).json({
                        success: false,
                        mensaje: 'La imagen es demasiado grande. Máximo 10MB para portadas.',
                        error: 'IMAGE_TOO_LARGE'
                    });
                }
            }
            
            if (req.files.archivo && req.files.archivo[0]) {
                const archivo = req.files.archivo[0];
            }
        }
        
        next();
    } catch (error) {
        console.error('❌ Error en validación de archivos:', error);
        if (req.files) cleanupFiles(req.files);
        
        res.status(500).json({
            success: false,
            mensaje: 'Error interno al validar archivos',
            error: 'VALIDATION_ERROR'
        });
    }
};

module.exports = {
    upload,
    uploadLibroFiles,
    handleMulterError,
    cleanupTempFiles,
    validateUploadedFiles,
    cleanupFiles,
    validarOrientacionImagenes
};