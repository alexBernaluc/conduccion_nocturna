# Conducción Nocturna — Informática 3 (Versión 1)

Proyecto final de gráficos 3D con Three.js. La versión 1 muestra **cinco manzanas**, calles, edificios sencillos, postes de alumbrado, un auto retro **quieto**, dos faros `SpotLight`, sombras y cámara en tercera persona.

## Cómo abrir (sin instalar ni ejecutar servidor)

1. Descomprimir la carpeta completa.
2. Hacer **doble clic en `index.html`** o clic derecho > Abrir con > Navegador.
3. La primera versión solo muestra la escena. **Todavía no permite conducir ni cambiar intensidades.**

`index.html` funciona usando la biblioteca local cuando existe `vendor/three.min.js`. Si no existe ese archivo, intenta obtener Three.js desde Internet. **Para entregar y usar también sin Internet:** ejecutar **una sola vez `PREPARAR_OFFLINE.bat` EN TU COMPUTADORA** con conexión y luego incluir toda la carpeta, incluida `vendor/three.min.js`, al entregar. El profesor no tiene que ejecutar este .bat: solo abrir `index.html`.

Si una computadora no tiene WebGL habilitado o el navegador lo bloquea, será necesario usar un navegador compatible; no se requiere instalar Three.js.

## Estructura

```text
conduccion_nocturna/
├── index.html               # Se abre con doble clic
├── src/
│   └── escena.js            # Código fuente completo, comentado
├── vendor/
│   └── three.min.js         # Se prepara una vez para el uso offline
├── docs/
│   └── GUIA_VERSION_1.md    # Explicación y flujo de ejecución
├── PREPARAR_OFFLINE.bat     # Solo lo ejecuta el autor al preparar la entrega offline
└── README.md
```

## Versiones del proyecto

- **V1 (actual):** escena fija, cinco manzanas, auto quieto, luces y sombras, cámara en tercera persona.
- **V2:** movimiento: avance, retroceso, rotación y cámara seguidora.
- **V3:** controles de intensidad de faros y alumbrado público.
- **V4:** lomada y respuesta de las ruedas / inclinación de carrocería / faros.
- **V5:** integración final, pruebas y ajustes de rendimiento.

## Licencias

Three.js (https://threejs.org/), licencia MIT. La versión CDN referenciada es 0.158.0. Ver https://github.com/mrdoob/three.js/blob/r158/LICENSE
