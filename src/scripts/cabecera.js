// Comportamiento de la barra de navegación: compactarse al hacer scroll y menú móvil.

const cabecera = document.querySelector('[data-cabecera]');
const centinela = document.querySelector('[data-centinela]');
const boton = document.querySelector('[data-boton-menu]');

// Compactar: la barra se compacta cuando el centinela (lo alto de la página) sale de pantalla.
if (cabecera && centinela) {
  const observador = new IntersectionObserver(
    ([entrada]) => {
      cabecera.classList.toggle('es-compacta', !entrada.isIntersecting);
    },
    { threshold: 0 }
  );
  observador.observe(centinela);
}

// Menú móvil
if (cabecera && boton) {
  const etiqueta = boton.querySelector('.solo-lectores');

  const alternar = (abierto) => {
    cabecera.toggleAttribute('data-abierto', abierto);
    boton.setAttribute('aria-expanded', String(abierto));
    if (etiqueta) etiqueta.textContent = abierto ? 'Cerrar navegación' : 'Abrir navegación';
  };

  boton.addEventListener('click', () => {
    alternar(!cabecera.hasAttribute('data-abierto'));
  });

  cabecera.addEventListener('click', (evento) => {
    if (evento.target.closest('.cabecera__enlace')) alternar(false);
  });

  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && cabecera.hasAttribute('data-abierto')) {
      alternar(false);
      boton.focus();
    }
  });

  // Si se ensancha la ventana con el menú abierto, se cierra.
  window.matchMedia('(min-width: 52rem)').addEventListener('change', (evento) => {
    if (evento.matches) alternar(false);
  });
}
