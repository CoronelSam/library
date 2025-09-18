const { Favorito, Libro } = require('../models');

class FavoritoController {
  async listar(req, res){
    try {
      const usuarioId = req.usuario.id;
      const favoritos = await Favorito.findAll({
        where: { usuario_id: usuarioId },
        include: [{ model: Libro, as: 'libro' }]
      });
      return res.json({ success: true, total: favoritos.length, data: favoritos });
    } catch (err){
      console.error('Error listar favoritos:', err);
      return res.status(500).json({ success:false, mensaje:'Error al listar favoritos', error: err.message });
    }
  }

  // Verificar si un libro es favorito
  async esFavorito(req, res){
    try {
      const usuarioId = req.usuario.id;
      const { libroId } = req.params;
      const fav = await Favorito.findOne({ where: { usuario_id: usuarioId, libro_id: libroId } });
      return res.json({ success: true, favorito: !!fav });
    } catch (err){
      console.error('Error esFavorito:', err);
      return res.status(500).json({ success:false, mensaje:'Error al verificar favorito', error: err.message });
    }
  }

  // Agregar a favoritos
  async agregar(req, res){
    try {
      const usuarioId = req.usuario.id;
      const { libroId } = req.params;
      // Evitar duplicados (por índice único basta con try/catch)
      const existente = await Favorito.findOne({ where: { usuario_id: usuarioId, libro_id: libroId } });
      if(existente){
        return res.status(200).json({ success:true, mensaje:'Ya estaba en favoritos', repetido: true });
      }
      const nuevo = await Favorito.create({ usuario_id: usuarioId, libro_id: libroId });
      return res.status(201).json({ success:true, data: nuevo, mensaje:'Agregado a favoritos' });
    } catch (err){
      console.error('Error agregar favorito:', err);
      return res.status(500).json({ success:false, mensaje:'Error al agregar favorito', error: err.message });
    }
  }

  // Eliminar de favoritos
  async eliminar(req, res){
    try {
      const usuarioId = req.usuario.id;
      const { libroId } = req.params;
      const eliminado = await Favorito.destroy({ where: { usuario_id: usuarioId, libro_id: libroId } });
      return res.json({ success:true, eliminado: eliminado>0, mensaje: eliminado? 'Eliminado de favoritos':'No existía en favoritos' });
    } catch (err){
      console.error('Error eliminar favorito:', err);
      return res.status(500).json({ success:false, mensaje:'Error al eliminar favorito', error: err.message });
    }
  }

  // Toggle favorito (atajo)
  async toggle(req, res){
    try {
      const usuarioId = req.usuario.id;
      const { libroId } = req.params;
      const existente = await Favorito.findOne({ where: { usuario_id: usuarioId, libro_id: libroId } });
      if(existente){
        await existente.destroy();
        return res.json({ success:true, favorito:false, mensaje:'Quitado de favoritos' });
      } else {
        const nuevo = await Favorito.create({ usuario_id: usuarioId, libro_id: libroId });
        return res.json({ success:true, favorito:true, data: nuevo, mensaje:'Agregado a favoritos' });
      }
    } catch (err){
      console.error('Error toggle favorito:', err);
      return res.status(500).json({ success:false, mensaje:'Error al alternar favorito', error: err.message });
    }
  }
}

module.exports = new FavoritoController();
