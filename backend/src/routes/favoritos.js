const express = require('express');
const router = express.Router();
const favoritoController = require('../controllers/favorito.controller');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', favoritoController.listar); // GET /favoritos
router.get('/libro/:libroId', favoritoController.esFavorito); // GET estado
router.post('/libro/:libroId', favoritoController.agregar); // POST agrega
router.delete('/libro/:libroId', favoritoController.eliminar); // DELETE quita
router.post('/libro/:libroId/toggle', favoritoController.toggle); // POST toggle

module.exports = router;
