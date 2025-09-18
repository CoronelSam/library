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
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';

    const nuevoUsuario = document.getElementById('nuevoUsuario').value.trim();
    const nuevoEmail = document.getElementById('nuevoEmail').value.trim();
    const claveActual = document.getElementById('claveActual').value;
    const nuevaClave = document.getElementById('nuevaClave').value;
    const confirmarClave = document.getElementById('confirmarClave').value;

    const payload = {};

    if (nuevoUsuario) {
      const rUser = UserAccountValidation.validarUsuario(nuevoUsuario);
      if (!rUser.valido) { mostrarError(rUser.error); return; }
      payload.usuario = nuevoUsuario;
    }

    if (nuevoEmail) {
      const rEmail = UserAccountValidation.validarEmail(nuevoEmail);
      if (!rEmail.valido) { mostrarError(rEmail.error); return; }
      payload.email = nuevoEmail;
    }

    // Validación de cambio de contraseña
    if (nuevaClave || confirmarClave || claveActual) {
      if (!claveActual) { mostrarError('Debes ingresar tu contraseña actual para cambiarla.'); return; }
      const rPass = UserAccountValidation.validarClave(nuevaClave);
      if (!rPass.valido) { mostrarError(rPass.error); return; }
      const rConfirm = UserAccountValidation.validarConfirmacion(confirmarClave, nuevaClave);
      if (!rConfirm.valido) { mostrarError(rConfirm.error); return; }
      payload.claveActual = claveActual;
      payload.clave = nuevaClave;
    }

    if (Object.keys(payload).length === 0) {
      mostrarError('No hay cambios para guardar.');
      return;
    }

    try {
      mensajeEstado.textContent = 'Guardando...';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
      }

  const resp = await authService.actualizarPerfil(payload);
      if (resp.success) {
        const user = authService.getCurrentUser();
        document.getElementById('usuarioActual').value = user.usuario;
        document.getElementById('emailActual').value = user.email;
        form.reset();
        mensajeEstado.textContent = '';
        safeToast('Perfil actualizado correctamente', 'success');
        // Redirección/ cierre
        setTimeout(() => {
          try {
            if (window.opener) {
              window.close();
            } else {
              window.location.href = 'dashboard.html';
            }
          } catch (redirErr) {
            console.warn('Redirección fallida, fallback manual:', redirErr);
            window.location.assign('dashboard.html');
          }
        }, 1500);
      } else {
        mostrarError(resp.message || 'Error al actualizar.');
      }
    } catch (err) {
      console.error('[EditarCuenta] Error inesperado:', err);
      mostrarError('Error de red o inesperado.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
      }
    }
  });

  function mostrarError(msg) {
    mensajeEstado.textContent = msg;
    mensajeEstado.classList.add('text-danger');
  }

  function safeToast(msg, tipo='info', duracion=3000) {
    if (window.UIUtils && typeof UIUtils.mostrarToast === 'function') {
      UIUtils.mostrarToast(msg, tipo, duracion);
    } else if (typeof window.mostrarToast === 'function') {
      window.mostrarToast(msg, tipo, duracion);
    } else {
      alert(msg);
    }
  }

  // Logout link
  document.getElementById('logout-btn').addEventListener('click', (ev) => {
    ev.preventDefault();
    authService.logout();
  });
});
