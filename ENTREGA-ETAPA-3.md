# Entrega final de Rimaturismo Perú — pasos sencillos

## 1. Subir la etapa 3 a GitHub

No borres el repositorio y no vuelvas a configurar Cloudflare.

1. Descarga y extrae el ZIP final.
2. Abre la carpeta extraída.
3. En GitHub entra al repositorio `rimaturismoperu/rimaturismoperu.github.io`.
4. Pulsa **Add file** → **Upload files**.
5. Selecciona **todo lo que está dentro** de la carpeta extraída y arrástralo a GitHub. Debes ver elementos como `admin`, `assets`, `data`, `lib`, `scripts`, `tours`, `worker`, `index.html` y las tres páginas legales. No arrastres solamente la carpeta exterior.
6. Espera hasta que termine la carga completa.
7. En el primer recuadro de **Confirm changes** escribe: `Entrega final etapa 3`.
8. El recuadro grande de descripción se deja vacío.
9. Deja marcada la opción de confirmar directamente en `main`.
10. Pulsa **Confirm changes** una sola vez.

Cloudflare Pages detectará el cambio y publicará la nueva versión normalmente en 1 a 5 minutos.

## 2. Comprobar la publicación

1. Espera cinco minutos.
2. Abre <https://rimaturismoperu.pages.dev/>.
3. Presiona `Ctrl + F5` en computadora o abre una pestaña privada en el celular.
4. Comprueba:
   - la portada nueva de Chacas;
   - la fotografía del Museo Casa La Torre Jara;
   - que ya no aparezcan las dos tarjetas provisionales de ESNNA y registro MINCETUR;
   - los enlaces de Privacidad, Términos, Políticas de reserva y Libro de Reclamaciones;
   - Facebook, TikTok y el botón con el logotipo de WhatsApp;
   - una página de tour en computadora y celular.
5. Abre <https://rimaturismoperu.pages.dev/admin/> e inicia sesión con las credenciales ya creadas.
6. Entra a un tour y pulsa **Guardar y publicar** sin cambiarlo. Espera de 1 a 5 minutos y confirma que la página continúa funcionando.

Si el panel no abre, primero revisa que <https://rimaturismo-panel-api.web-rimaturismoperu.workers.dev/api/health> muestre `{"ok":true}`. No vuelvas a crear el Worker.

## 3. Aprobación final del cliente

Antes de entregar las credenciales, pide que el cliente revise y apruebe:

- <https://rimaturismoperu.pages.dev/politica-de-privacidad.html>
- <https://rimaturismoperu.pages.dev/terminos-y-condiciones.html>
- <https://rimaturismoperu.pages.dev/politicas-de-reserva.html>

Los textos fueron redactados con sus respuestas. Si su forma de cobrar, cancelar, reprogramar, tratar datos o atender menores cambia, debe actualizar esos documentos antes de aplicar la nueva condición.

## 4. Hacer que Google conozca la página

La configuración SEO ya está dentro del sitio. Falta comunicar la dirección a Google:

1. Entra con el correo de la empresa a <https://search.google.com/search-console/>.
2. Pulsa **Añadir propiedad** y elige **Prefijo de URL**.
3. Escribe exactamente `https://rimaturismoperu.pages.dev/`.
4. En los métodos de verificación elige **Archivo HTML**.
5. Descarga el pequeño archivo que entrega Google. No le cambies el nombre ni el contenido.
6. Súbelo a la raíz del repositorio, junto a `index.html`, mediante **Add file** → **Upload files** y confirma directamente en `main`.
7. Espera de 1 a 5 minutos y vuelve a Search Console para pulsar **Verificar**.
8. En el menú **Sitemaps**, escribe `sitemap.xml` y pulsa **Enviar**.
9. En **Inspección de URLs**, solicita la indexación de estas direcciones, una por una:
   - `https://rimaturismoperu.pages.dev/`
   - `https://rimaturismoperu.pages.dev/tours/punta-olimpica-y-chacas.html`
   - `https://rimaturismoperu.pages.dev/tours/chavin-de-huantar.html`
   - `https://rimaturismoperu.pages.dev/tours/laguna-paron.html`
   - `https://rimaturismoperu.pages.dev/tours/semana-santa-en-chacas.html`

No retires después el archivo de verificación de Google. La indexación y las posiciones no son inmediatas ni se pueden garantizar; dependen de Google, de la competencia, de la antigüedad del sitio y de la utilidad del contenido.

## 5. Para mejorar la aparición con el tiempo

- Compartir siempre `https://rimaturismoperu.pages.dev/` en WhatsApp Business, Facebook y TikTok.
- Crear o completar el Perfil de Empresa de Google con nombre, teléfono, categoría, horario y la misma dirección web.
- Conseguir reseñas reales y responderlas.
- Mantener nombres y descripciones claras en el panel.
- Publicar contenido propio y actualizado; evitar copiar textos de otras agencias.
- Cuando compre un dominio propio, conectarlo a Cloudflare y luego registrar ese dominio en Search Console.

## 6. Qué no debes hacer

- No publiques nuevamente GitHub Pages; la web pública es la de `pages.dev`.
- No borres el repositorio, la rama `main`, el proyecto de Cloudflare Pages ni el Worker.
- No pegues el token de GitHub, la contraseña, el hash o el secreto de sesión en archivos de GitHub.
- No cambies `admin/config.js` salvo que en el futuro cambie la dirección del Worker.
- No afirmes “agencia autorizada por MINCETUR” ni uses un distintivo sin el documento oficial correspondiente.
