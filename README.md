# Rimaturismo Perú

Sitio estático, catálogo turístico y panel privado de la etapa 2.

## Archivos principales

- `index.html`: página principal.
- `tours/`: páginas individuales generadas.
- `data/content.json`: contenido que administra el panel.
- `admin/`: panel privado.
- `setup/`: generador local de credenciales.
- `worker/worker-standalone.js`: código listo para pegar en Cloudflare Worker.
- `LEEME-PRIMERO.md`: instalación explicada paso a paso.
- `ETAPA-3-DATOS-DEL-CLIENTE.md`: lista para cerrar la etapa final.

## Desarrollo y verificación

Requiere Node.js 20 o superior.

```bash
npm run generate
npm run build:worker
npm run check
```

No se guarda ninguna contraseña ni token dentro del repositorio. Las credenciales se configuran como secretos del Worker.
