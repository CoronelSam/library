document.addEventListener('DOMContentLoaded', async () => {
  if (!authService.isAuthenticated()) {
    window.location.href = '../login.html';
    return;
  }

  const usuario = authService.getCurrentUser();
  document.getElementById('usuarioActual').value = usuario.usuario || '';
  document.getElementById('emailActual').value = usuario.email || '';

  await authService.getPerfil();
  const actualizado = authService.getCurrentUser();
  document.getElementById('usuarioActual').value = actualizado.usuario || '';
  document.getElementById('emailActual').value = actualizado.email || '';

  const form = document.getElementById('formEditarCuenta');
  const mensajeEstado = document.getElementById('mensajeEstado');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensajeEstado.className = 'mb-3 small';
    mensajeEstado.textContent = '';

    const nuevoUsuario = document.getElementById('nuevoUsuario').value.trim();
    const nuevoEmail = document.getElementById('nuevoEmail').value.trim();
    const nuevaClave = document.getElementById('nuevaClave').value;
    const confirmarClave = document.getElementById('confirmarClave').value;

    const payload = {};

    if (nuevoUsuario) {
      if (!/^[a-zA-Z0-9]{5,50}$/.test(nuevoUsuario)) {
        mostrarError('Usuario inválido: 5-50 caracteres alfanuméricos.');
        return;
      }
      payload.usuario = nuevoUsuario;
    }

    if (nuevoEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(nuevoEmail)) {
        mostrarError('Email inválido.');
        return;
      }
      payload.email = nuevoEmail;
    }

    if (nuevaClave || confirmarClave) {
      if (nuevaClave.length < 8) {
        mostrarError('La contraseña debe tener al menos 8 caracteres.');
        return;
      }
      if (nuevaClave !== confirmarClave) {
        mostrarError('Las contraseñas no coinciden.');
        return;
      }
      payload.clave = nuevaClave;
    }

    if (Object.keys(payload).length === 0) {
      mostrarError('No hay cambios para guardar.');
      return;
    }

    mensajeEstado.textContent = 'Guardando...';

    const resp = await authService.actualizarPerfil(payload);
    if (resp.success) {
      mensajeEstado.textContent = resp.message || 'Perfil actualizado.';
      mensajeEstado.classList.add('text-success');
      // Actualizar campos actuales si cambió usuario/email
      const user = authService.getCurrentUser();
      document.getElementById('usuarioActual').value = user.usuario;
      document.getElementById('emailActual').value = user.email;
      form.reset();
    } else {
      mostrarError(resp.message || 'Error al actualizar.');
    }
  });

  function mostrarError(msg) {
    mensajeEstado.textContent = msg;
    mensajeEstado.classList.add('text-danger');
  }

  // Logout link
  document.getElementById('logout-btn').addEventListener('click', (ev) => {
    ev.preventDefault();
    authService.logout();
  });
});
