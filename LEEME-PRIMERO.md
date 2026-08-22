# Rimaturismo Perú — instalación de la etapa 2 y del panel

Esta guía está escrita para realizar la instalación una sola vez. No necesitas saber programación.

## Qué queda listo

- Página adaptable a computadora, tableta y celular, sin desplazamiento lateral blanco.
- 18 experiencias con páginas individuales, fotografías, horarios y contenido actual.
- Semana Santa en Chacas y Fiesta Patronal Mamá Ashu sin precio visible.
- Botones con el logotipo oficial de WhatsApp.
- Panel privado para una sola persona.
- Agregar y eliminar tours.
- Cambiar nombres, descripciones, horarios, tarifas, contenido y orden de fotografías.
- Subir hasta 8 fotografías por tour; el panel las reduce automáticamente.
- Cambiar el número y enlace de WhatsApp y el correo de toda la web.
- Publicación automática después de guardar.
- SEO técnico inicial: títulos, descripciones, enlaces canónicos, datos estructurados, sitemap y robots.

## Antes de comenzar

Necesitarás tener abiertas estas dos cuentas:

1. La cuenta de GitHub `rimaturismoperu`.
2. Una cuenta gratuita de Cloudflare. Créala en <https://dash.cloudflare.com/sign-up> y elige siempre el plan **Free**.

No envíes por WhatsApp ni por este chat la contraseña del panel, el código secreto ni el token de GitHub.

---

## Paso 1 — reemplazar los archivos en GitHub

**No borres el repositorio.** Tampoco borres archivo por archivo.

1. Descarga y extrae el archivo ZIP recibido.
2. Entra a la carpeta extraída `rimaturismo-etapa-2-panel`.
3. Abre en GitHub el repositorio `rimaturismoperu.github.io`.
4. Pulsa **Add file** → **Upload files**.
5. Selecciona **todo lo que está dentro de la carpeta extraída** y arrástralo a GitHub. Debes seleccionar archivos y carpetas como `admin`, `assets`, `data`, `lib`, `scripts`, `setup`, `tours`, `worker`, `index.html` y los demás. No subas la carpeta exterior como una sola carpeta.
6. Espera a que termine de cargar.
7. En el primer recuadro de **Confirm changes** escribe:

   `Etapa 2 y panel administrativo`

8. El segundo recuadro grande es opcional: **déjalo vacío**.
9. Deja marcada la opción de confirmar directamente en la rama `main`.
10. Pulsa **Confirm changes**.

No continúes hasta ver las carpetas `admin`, `data`, `lib`, `setup`, `tours` y `worker` en la portada del repositorio.

---

## Paso 2 — publicar la web comercial gratis en Cloudflare Pages

GitHub seguirá guardando los archivos. Cloudflare Pages mostrará la página al público y volverá a publicarla automáticamente cuando el panel guarde un cambio.

1. En Cloudflare abre **Workers & Pages**.
2. Pulsa **Create application** o **Create**.
3. Elige **Pages** → **Import an existing Git repository** o **Connect to Git**.
4. Conecta la cuenta de GitHub y selecciona solamente `rimaturismoperu/rimaturismoperu.github.io`.
5. Usa esta configuración:

   - Nombre del proyecto: `rimaturismoperu`
   - Rama de producción: `main`
   - Framework preset: `None`
   - Build command: `exit 0`
   - Build output directory: `.`
   - Root directory: déjala vacía

6. Pulsa **Save and Deploy**.
7. Al terminar, Cloudflare mostrará una dirección parecida a:

   `https://rimaturismoperu.pages.dev`

8. Copia esa dirección exacta. Si Cloudflare agregó números o palabras al nombre, usa la dirección que realmente te mostró.

Por ahora **no desactives GitHub Pages**. Primero terminaremos y comprobaremos el panel.

---

## Paso 3 — crear las credenciales privadas

1. Abre en el navegador:

   `DIRECCION-DE-CLOUDFLARE/setup/generador-credenciales.html`

   Ejemplo: `https://rimaturismoperu.pages.dev/setup/generador-credenciales.html`

2. Escribe el único correo administrador.
3. Crea una contraseña de al menos 16 caracteres. Guárdala en un gestor de contraseñas o en un lugar físico seguro.
4. Pulsa **Generar credenciales**.
5. Guarda los tres valores que aparecerán:

   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD_HASH`
   - `SESSION_SECRET`

La contraseña no se puede recuperar automáticamente. Si se pierde, el propietario deberá cambiarla manualmente en Cloudflare.

---

## Paso 4 — crear el permiso limitado de GitHub

Este permiso permite que el panel cambie solamente los archivos de esta página.

1. En GitHub abre tu foto de perfil → **Settings**.
2. Entra a **Developer settings** → **Personal access tokens** → **Fine-grained tokens**.
3. Pulsa **Generate new token**.
4. Configúralo así:

   - Token name: `Panel Rimaturismo`
   - Resource owner: `rimaturismoperu`
   - Repository access: **Only select repositories**
   - Repositorio elegido: `rimaturismoperu.github.io`
   - Repository permissions → Contents: **Read and write**
   - No habilites otros permisos.

5. Para evitar mantenimiento periódico, elige **No expiration** si GitHub lo permite. Esta opción exige cuidar muy bien la cuenta y mantener activada la verificación en dos pasos.
6. Genera el token y cópialo en ese momento. GitHub no volverá a mostrarlo completo.

Ese valor será `GITHUB_TOKEN`. No lo pegues en un archivo público ni lo envíes por chat.

---

## Paso 5 — crear el servicio privado del panel

1. En Cloudflare abre **Workers & Pages**.
2. Pulsa **Create** → **Worker**.
3. Nombre: `rimaturismo-panel-api`.
4. Pulsa **Deploy**.
5. Entra al Worker y abre **Edit code**.
6. Borra el ejemplo que aparece.
7. En tu computadora abre con Bloc de notas este archivo de la carpeta extraída:

   `worker/worker-standalone.js`

8. Copia todo su contenido, pégalo en el editor de Cloudflare y pulsa **Save and Deploy**.
9. Copia la dirección del Worker. Será parecida a:

   `https://rimaturismo-panel-api.tu-cuenta.workers.dev`

---

## Paso 6 — colocar las variables y secretos

Dentro del Worker abre **Settings** → **Variables and Secrets**.

### Variables normales

Agrega estas cinco. Respeta exactamente las mayúsculas y no uses comillas:

| Nombre | Valor |
|---|---|
| `REPO_OWNER` | `rimaturismoperu` |
| `REPO_NAME` | `rimaturismoperu.github.io` |
| `BRANCH` | `main` |
| `ALLOWED_ORIGIN` | La dirección exacta de Cloudflare Pages, sin `/` al final |
| `PUBLIC_SITE_URL` | La misma dirección exacta de Cloudflare Pages, sin `/` al final |

Si la pantalla muestra un campo adicional de tipo, elige **Text** o **Variable**.

### Secretos

Agrega estos cuatro como **Secret** o **Encrypt**:

| Nombre | Valor |
|---|---|
| `ADMIN_EMAIL` | El valor generado en el paso 3 |
| `ADMIN_PASSWORD_HASH` | El valor generado en el paso 3 |
| `SESSION_SECRET` | El valor generado en el paso 3 |
| `GITHUB_TOKEN` | El token generado en el paso 4 |

Guarda y vuelve a desplegar el Worker si Cloudflare muestra ese botón.

Para comprobarlo, abre:

`DIRECCION-DEL-WORKER/api/health`

Debe aparecer: `{"ok":true}`

---

## Paso 7 — conectar la pantalla del panel con el Worker

1. En GitHub abre el repositorio.
2. Entra a `admin` → `config.js`.
3. Pulsa el lápiz para editar.
4. Verás esta línea:

   `window.RIMA_ADMIN_API = "PEGA_AQUI_LA_DIRECCION_DEL_WORKER";`

5. Reemplaza solamente el texto entre comillas por la dirección exacta del Worker, sin `/` al final. Ejemplo:

   `window.RIMA_ADMIN_API = "https://rimaturismo-panel-api.tu-cuenta.workers.dev";`

6. Pulsa **Commit changes**.
7. En el primer recuadro escribe `Conectar panel administrativo`.
8. El segundo recuadro grande se deja vacío.
9. Confirma directamente en `main`.
10. Espera entre 1 y 5 minutos.

---

## Paso 8 — prueba final

1. Abre `DIRECCION-DE-CLOUDFLARE/admin/`.
2. Ingresa con el correo y contraseña creados en el paso 3.
3. Abre **Contacto**, comprueba WhatsApp y correo, y pulsa **Guardar y publicar** una vez. Esto termina de actualizar las direcciones de SEO.
4. Espera de 1 a 5 minutos y abre la página pública.
5. Comprueba en computadora y celular:

   - inicio;
   - una página de tour;
   - botón y logotipo de WhatsApp;
   - que Semana Santa y Mamá Ashu no muestren precio;
   - que la pantalla no se mueva lateralmente hacia un espacio blanco.

Si todo está correcto, en GitHub abre **Settings** → **Pages** → **Unpublish site**. Esto apaga solamente la copia pública de GitHub Pages. **No elimines el repositorio**, porque el panel lo necesita.

---

## Uso diario del panel

- Entra siempre por `DIRECCION-DE-CLOUDFLARE/admin/`.
- Elige un tour, modifica lo necesario y pulsa **Guardar y publicar**.
- Para una fiesta sin precio, apaga **Mostrar precio o tarifa**.
- Para cambiar la portada de un tour, mueve la fotografía elegida hasta la primera posición.
- Cuando subas fotos, espera a que cada una termine. Después pulsa **Guardar y publicar**.
- Los cambios normalmente se ven entre 1 y 5 minutos después.
- El panel cierra la sesión a las 8 horas.

## Límites elegidos para conservar el plan gratuito

- Máximo 28 tours.
- Máximo 8 fotografías por tour.
- Las nuevas fotografías se convierten a WebP y se reducen aproximadamente a 600 KB.
- No hay recuperación automática de contraseña, varias cuentas, historial dentro del panel ni papelera.
- Eliminar retira el tour y sus imágenes administradas de la página actual. GitHub conserva un historial técnico de confirmaciones; no se muestra en el panel y no genera por sí mismo un cobro mensual.
- Conserva una copia de las fotografías originales fuera de la web.

Cloudflare Pages Free permite actualmente hasta 500 compilaciones al mes, y Workers Free hasta 100 000 solicitudes diarias. Esta web está diseñada para trabajar muy por debajo de esos límites. No elijas un plan pagado. Si en el futuro el negocio crece y supera los límites, se evaluará una ampliación antes de contratarla.

## Si el panel deja de guardar

Revisa en este orden:

1. Que la página pública siga abriendo.
2. Que `DIRECCION-DEL-WORKER/api/health` muestre `{"ok":true}`.
3. Que el token de GitHub no haya sido eliminado o vencido.
4. Que las variables `ALLOWED_ORIGIN` y `PUBLIC_SITE_URL` sean exactamente la dirección pública, sin `/` final.
5. Que en GitHub no se haya borrado el repositorio ni cambiado la rama `main`.
