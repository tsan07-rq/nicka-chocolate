// Envía el formulario de contacto a Web3Forms sin recargar la página.
// Si JavaScript no está disponible, el formulario se envía de la forma normal.

const formulario = document.querySelector('[data-formulario-contacto]');

if (formulario) {
  const estado = formulario.querySelector('[data-estado]');
  const boton = formulario.querySelector('button[type="submit"]');

  const mostrar = (mensaje, tipo) => {
    estado.textContent = mensaje;
    estado.classList.remove('contacto__estado--ok', 'contacto__estado--error');
    if (tipo) estado.classList.add(`contacto__estado--${tipo}`);
  };

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    boton.disabled = true;
    mostrar('Enviando…');

    try {
      const respuesta = await fetch(formulario.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(formulario),
      });
      const datos = await respuesta.json();

      if (!respuesta.ok || !datos.success) throw new Error(datos.message || 'Error al enviar');

      formulario.reset();
      mostrar('Mensaje enviado. Te respondemos pronto.', 'ok');
    } catch {
      mostrar('No se pudo enviar el mensaje. Inténtalo de nuevo o escríbenos por WhatsApp.', 'error');
    } finally {
      boton.disabled = false;
    }
  });
}
