(function(global){
  const UserAccountValidation = {
    validarUsuario(value){
      const regex = /^[a-zA-Z0-9]+$/;
      const valido = typeof value === 'string' && value.length >= 5 && value.length <= 50 && regex.test(value);
      return { valido, error: valido ? null : 'Usuario inválido (5-50, solo letras y números)' };
    },
    validarEmail(value){
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const valido = typeof value === 'string' && regex.test(value);
      return { valido, error: valido ? null : 'Email inválido' };
    },
    validarClave(value){
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      const valido = typeof value === 'string' && regex.test(value);
      return { valido, error: valido ? null : 'Contraseña insegura (8+, mayúscula, minúscula, número y símbolo)' };
    },
    validarConfirmacion(confirmacion, clave){
      const valido = confirmacion === clave && !!clave;
      return { valido, error: valido ? null : 'Las contraseñas no coinciden' };
    },
    // Aplica clases Bootstrap a un input según resultado
    marcarInput(inputEl, resultado){
      if(!inputEl) return;
      inputEl.classList.toggle('is-invalid', !resultado.valido);
      inputEl.classList.toggle('is-valid', resultado.valido);
    },
    mostrarToast(mensaje, tipo='info', duracion=4000){
      if (typeof mostrarToast === 'function') { // reutilizar global si existe
        return mostrarToast(mensaje, tipo, duracion);
      }
      alert(mensaje);
    }
  };
  global.UserAccountValidation = UserAccountValidation;
})(window);
