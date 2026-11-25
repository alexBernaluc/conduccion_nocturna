# Conducción Nocturna — V5: ciudad y colisiones

V5 cerrada el 25/11/2026 tras la prueba comunicada por el autor. Esta carpeta contiene una aplicación independiente: abrir su propio `index.html` con doble clic, conservando `src/colisiones.js`, `src/escena.js` y `vendor/three.min.js`. Los estilos CSS están en el HTML. No requiere Internet, servidor ni instalaciones; el texto «en desarrollo» del HTML se conserva sin modificar el código probado.

Consultar la [guía V5](docs/GUIA_VERSION_5.md) y la [explicación técnica V5](docs/EXPLICACION_TECNICA_V5.md), incluida la sección «Modificaciones prácticas para la defensa». Los controles de conducción, crucero e iluminación se mantienen; V5 añade ciudad variada, colisiones y giro en reposo con espacio libre. La lomada todavía no existe: se reserva para V6 la calle X=39, Z de -34 a 34.

En el repositorio se continúa únicamente en `desarrollo/`; las copias bajo `versiones/` quedan cerradas. Los scripts de pruebas son herramientas del autor y no forman parte de la carga del HTML.

---

## README original de V1 — conservado como antecedente

El contenido siguiente describe la primera versión y su plan original, no el estado actual ni la numeración definitiva de las etapas.

### Conducción Nocturna — Informática 3 (Versión 1)

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
