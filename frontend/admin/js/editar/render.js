import { UIEditarLibros } from './uiLogic.js';

export function crearFilaLibro(libro){
  const portada = libro.portada 
    ? `<img src="${libro.portada}" alt="Portada" class="img-thumbnail" style="width: 50px; height: 70px; object-fit: cover;">`
    : `<div class="bg-light d-flex align-items-center justify-content-center" style="width: 50px; height: 70px; border-radius: 4px;">
         <i class="bi bi-book text-muted"></i>
       </div>`;

  return `
    <tr>
      <th scope="row">${libro.id}</th>
      <td>${portada}</td>
      <td class="fw-bold">${libro.titulo}</td>
      <td>${libro.autor}</td>
      <td><span class="badge bg-primary rounded-pill">${libro.genero}</span></td>
      <td>${libro.editorial || '<em class="text-muted">No especificada</em>'}</td>
      <td>${libro.año_publicacion || '<em class="text-muted">N/A</em>'}</td>
      <td>
        <button class="btn btn-sm btn-outline-warning me-2 editar-btn" data-libro-id="${libro.id}">
          <i class="bi bi-pencil"></i> Editar
        </button>
        <button class="btn btn-sm btn-outline-danger eliminar-btn" data-libro-id="${libro.id}">
          <i class="bi bi-trash"></i> Eliminar
        </button>
      </td>
    </tr>`;
}

export function renderizarLibros(context){
  const { state, refs } = context;
  if(state.librosFiltrados.length === 0){
    UIEditarLibros.mostrarMensajeSinLibros(refs);
    UIEditarLibros.actualizarBotonAgregar(context);
    return;
  }
  UIEditarLibros.mostrarTabla(refs, true);

  const totalPaginas = Math.max(1, Math.ceil(state.librosFiltrados.length / state.librosPorPagina));
  if(state.paginaActual > totalPaginas) state.paginaActual = 1;
  const inicio = (state.paginaActual - 1) * state.librosPorPagina;
  const fin = inicio + state.librosPorPagina;
  const librosParaMostrar = state.librosFiltrados.slice(inicio, fin);

  refs.librosTabla.innerHTML = librosParaMostrar.map(crearFilaLibro).join('');
  renderizarPaginacion(context, totalPaginas);
  agregarEventListenersBotones(context);
  UIEditarLibros.actualizarBotonAgregar(context);
}

export function renderizarPaginacion(context, totalPaginas){
  const { state, refs } = context;
  if(totalPaginas <= 1){
    refs.paginationContainer.style.display = 'none';
    refs.paginationList.innerHTML = '';
    return;
  }
  refs.paginationContainer.style.display = 'block';
  let html = '';
  html += `<li class="page-item ${state.paginaActual===1?'disabled':''}"><a class="page-link" href="#" data-pagina="${state.paginaActual-1}">Anterior</a></li>`;
  for(let i=1;i<=totalPaginas;i++){
    if(i===1 || i===totalPaginas || (i >= state.paginaActual - 2 && i <= state.paginaActual +2)){
      html += `<li class="page-item ${i===state.paginaActual?'active':''}"><a class="page-link" href="#" data-pagina="${i}">${i}</a></li>`;
    } else if(i===state.paginaActual-3 || i===state.paginaActual+3){
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }
  html += `<li class="page-item ${state.paginaActual===totalPaginas?'disabled':''}"><a class="page-link" href="#" data-pagina="${state.paginaActual+1}">Siguiente</a></li>`;
  refs.paginationList.innerHTML = html;
  refs.paginationList.querySelectorAll('a.page-link').forEach(a=>{
    a.addEventListener('click', e=>{
      e.preventDefault();
      const p = parseInt(a.dataset.pagina);
      if(p && p !== state.paginaActual){
        state.paginaActual = p;
        renderizarLibros(context);
      }
    });
  });
}

export function agregarEventListenersBotones(context){
  const { state } = context;
  document.querySelectorAll('.editar-btn').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const id = parseInt(e.currentTarget.dataset.libroId);
      UIEditarLibros.abrirModalEditar(context, id);
    });
  });
  document.querySelectorAll('.eliminar-btn').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const id = parseInt(e.currentTarget.dataset.libroId);
      UIEditarLibros.abrirModalEliminar(context, id);
    });
  });
}
