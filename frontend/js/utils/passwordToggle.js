(function () {
  function enhanceInput(input) {
    if (!input || input.dataset.hasToggle === 'true') return;
    input.dataset.hasToggle = 'true';

    const currentParent = input.parentElement;
    if (!currentParent) return;

    // Creamos un wrapper relativo alrededor del input para alinear el botón con el campo
    let wrapper;
    if (
      currentParent.classList.contains('password-toggle-wrapper') ||
      currentParent.classList.contains('input-group')
    ) {
      wrapper = currentParent;
    } else {
      wrapper = document.createElement('div');
      wrapper.className = 'position-relative password-toggle-wrapper';
      // Inserta el wrapper antes del input y mueve el input dentro
      currentParent.insertBefore(wrapper, input);
      wrapper.appendChild(input);
    }

    // Asegura espacio para el botón
    input.classList.add('pe-5');

    // Crea el botón toggle
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-outline-secondary btn-sm position-absolute top-50 end-0 translate-middle-y me-2 password-toggle-btn';
    btn.setAttribute('aria-label', 'Mostrar contraseña');
    btn.title = 'Mostrar contraseña';
    btn.innerHTML = '<i class="bi bi-eye"></i>';

    btn.addEventListener('click', function () {
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.innerHTML = showing ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
      const label = showing ? 'Mostrar contraseña' : 'Ocultar contraseña';
      btn.setAttribute('aria-label', label);
      btn.title = label;
      // Mantén foco en el input
      input.focus();
    });

    wrapper.appendChild(btn);
  }

  function init() {
    // Inicial para inputs existentes
    document.querySelectorAll('input[type="password"]').forEach(enhanceInput);

    // Observa dinámicamente por si se agregan más inputs password
    const observer = new MutationObserver(function (mutations) {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType !== 1) continue; // no ELEMENT_NODE
          if (node.matches && node.matches('input[type="password"]')) enhanceInput(node);
          if (node.querySelectorAll) node.querySelectorAll('input[type="password"]').forEach(enhanceInput);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
