(function(){
  function setup(opts){
    if(!opts || !opts.input || !opts.suggestionsContainer){
      console.warn('[GeneroAutocomplete] Parámetros insuficientes');
      return;
    }
    const input = opts.input;
    const select = opts.select || null;
    const cont = opts.suggestionsContainer;
    const generos = (opts.generos && Array.isArray(opts.generos) ? opts.generos : (window.APP_CONSTANTS?.GENEROS || [])).slice();
    const max = opts.max || window.APP_CONSTANTS?.UI_CONFIG?.MAX_SUGGESTIONS || 8;

    let visible = false;

    function limpiarSugerencias(){
      cont.innerHTML='';
      cont.style.display='none';
      visible=false;
    }

    function render(lista){
      if(!lista.length){
        limpiarSugerencias();
        return;
      }
      cont.innerHTML = lista.slice(0,max).map(g=>`<div class="genre-suggestion" data-genre="${g}">${g}</div>`).join('');
      cont.style.display='block';
      visible=true;
    }

    function filtrar(valor){
      const t = valor.trim().toLowerCase();
      if(!t){
        limpiarSugerencias();
        return;
      }
      const lista = generos.filter(g=>g.toLowerCase().includes(t));
      render(lista);
    }

    input.addEventListener('input', (e)=>{
      filtrar(e.target.value);
      if(select && select.selectedIndex>0){
        select.selectedIndex = 0;
      }
    });

    cont.addEventListener('click', (e)=>{
      if(e.target.classList.contains('genre-suggestion')){
        input.value = e.target.getAttribute('data-genre');
        limpiarSugerencias();
      }
    });

    if(select){
      select.addEventListener('change', (e)=>{
        if(e.target.value && e.target.selectedIndex>0){
          input.value = e.target.value;
          limpiarSugerencias();
        }
      });
    }

    document.addEventListener('click', (e)=>{
      if(!input.contains(e.target) && !cont.contains(e.target)){
        limpiarSugerencias();
      }
    });

    input.addEventListener('keydown', (e)=>{
      if(!visible) return;
      const suggestions = cont.querySelectorAll('.genre-suggestion');
      if(!suggestions.length) return;
      let selected = cont.querySelector('.genre-suggestion.selected');
      switch(e.key){
        case 'ArrowDown':
          e.preventDefault();
          if(!selected){
            suggestions[0].classList.add('selected');
          } else {
            selected.classList.remove('selected');
            (selected.nextElementSibling || suggestions[0]).classList.add('selected');
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if(!selected){
            suggestions[suggestions.length-1].classList.add('selected');
          } else {
            selected.classList.remove('selected');
            (selected.previousElementSibling || suggestions[suggestions.length-1]).classList.add('selected');
          }
          break;
        case 'Enter':
          if(selected){
            e.preventDefault();
            input.value = selected.getAttribute('data-genre');
            limpiarSugerencias();
          }
          break;
        case 'Escape':
          limpiarSugerencias();
          break;
      }
    });

    return { limpiar: limpiarSugerencias, filtrar };
  }

  window.GeneroAutocomplete = { setup };
})();
