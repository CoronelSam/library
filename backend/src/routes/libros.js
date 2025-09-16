const express = require('express');
const router = express.Router();
const libroController = require('../controllers/libro.controller');
const { 
    uploadLibroFiles, 
    handleMulterError, 
    cleanupTempFiles, 
    validateUploadedFiles 
} = require('../middleware/upload');

// Rutas sin archivos
router.get('/', libroController.obtenerTodos);
router.get('/buscar', libroController.buscar);
router.get('/autocompletar', libroController.autocompletar);
router.get('/busqueda', libroController.busquedaOptimizada);
router.get('/estadisticas', libroController.obtenerEstadisticas);
router.get('/recorridos', libroController.obtenerRecorrido);
router.get('/:id', libroController.obtenerPorId);

// Rutas para PDFs
router.get('/:id/pdf', libroController.obtenerPDF);
router.get('/:id/download', libroController.descargarPDF);

// Rutas con manejo de archivos
router.post('/', 
    cleanupTempFiles,           
    uploadLibroFiles,          
    handleMulterError,          
    validateUploadedFiles,      
    libroController.crear  
);

router.put('/:id', 
    cleanupTempFiles,
    uploadLibroFiles,
    handleMulterError,
    validateUploadedFiles,
    libroController.actualizar
);

router.delete('/:id', libroController.eliminar);

module.exports = router;