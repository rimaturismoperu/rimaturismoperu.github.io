# Rimaturismo Perú — entrega final

Sitio web turístico, catálogo de 18 experiencias y panel administrativo privado.

## Dirección pública

<https://rimaturismoperu.pages.dev/>

## Archivos principales

- `index.html`: página de inicio.
- `tours/`: páginas individuales de las experiencias.
- `politica-de-privacidad.html`: Política de Privacidad.
- `terminos-y-condiciones.html`: Términos y Condiciones.
- `politicas-de-reserva.html`: políticas de reserva, cancelación y reprogramación.
- `data/content.json`: contenido administrado desde el panel.
- `admin/`: panel privado.
- `worker/worker-standalone.js`: servicio privado del panel.
- `ENTREGA-ETAPA-3.md`: publicación, comprobación e indexación en Google.

## Verificación técnica

Requiere Node.js 20 o superior únicamente para desarrollo:

```bash
node scripts/generate-site.mjs
node scripts/build-worker.mjs
node scripts/check-site.mjs
node scripts/check-worker.mjs
```

Las contraseñas y el token de GitHub no se guardan en este repositorio. Permanecen como secretos cifrados del Worker de Cloudflare.
