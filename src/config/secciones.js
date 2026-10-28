// Secciones de la página, en el orden en que aparecen. Solo la toca el desarrollador.
//
// - activa: false apaga la sección para un cliente que no la contrató.
// - enNav:  true la muestra como enlace en la barra de navegación.
// - El id debe coincidir con el id del componente de esa sección.
//
// Además, una sección activa se oculta sola si no tiene contenido
// (por ejemplo, sin promociones activas no aparece ni en la página ni en el menú).
export const secciones = [
  { id: 'inicio', etiqueta: 'Inicio', activa: true, enNav: true },
  { id: 'menu', etiqueta: 'Menú', activa: true, enNav: true },
  { id: 'promociones', etiqueta: 'Promociones', activa: true, enNav: false },
  { id: 'historia', etiqueta: 'Nosotros', activa: true, enNav: true },
  { id: 'galeria', etiqueta: 'Galería', activa: true, enNav: true },
  { id: 'testimonios', etiqueta: 'Testimonios', activa: true, enNav: false },
  { id: 'ubicacion', etiqueta: 'Visítanos', activa: true, enNav: true },
  { id: 'contacto', etiqueta: 'Contacto', activa: true, enNav: true },
];
