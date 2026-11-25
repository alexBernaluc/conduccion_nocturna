# Conducción Nocturna — Informática 3

Proyecto final de gráficos 3D con Three.js. **Última versión cerrada: V5 — Ciudad y colisiones, 25/11/2026**, implementada y probada por el autor. Incluye cinco manzanas con construcciones variadas, colisiones, conducción progresiva, frenado, reversa, crucero, cámara en tercera persona e iluminación interactiva.

## Cómo abrir (sin instalar ni ejecutar servidor)

1. Para ejecutar la versión cerrada, abrir [versiones/V5_Ciudad_Colisiones/index.html](versiones/V5_Ciudad_Colisiones/index.html) con doble clic o Abrir con > Navegador.
2. Para continuar trabajando, usar [desarrollo/index.html](desarrollo/index.html) y editar únicamente `desarrollo/`.
3. Al trasladar o entregar una versión, copiar su carpeta completa, incluyendo `src/` y `vendor/`. Los estilos están dentro del HTML.

Cada copia ya incluye `vendor/three.min.js` y funciona sin Internet ni servidor. No es necesario ejecutar `PREPARAR_OFFLINE.bat`: es la herramienta original para recuperar la biblioteca si faltara. El HTML conserva un fallback CDN que solo se intenta si no se cargó Three.js local; una entrega offline debe incluir siempre la biblioteca.

El `index.html` de la raíz es el original V1 conservado; no abre la versión actual. El respaldo V5 mantiene el texto «en desarrollo» del HTML probado, sin cambios funcionales; el cierre oficial se registra en su documentación y en el historial.

Si una computadora no tiene WebGL habilitado o el navegador lo bloquea, será necesario usar un navegador compatible; no se requiere instalar Three.js.

## Estructura

```text
conduccion_nocturna/
├── desarrollo/                  # Única carpeta activa para próximos cambios
│   ├── index.html               # HTML y estilos internos
│   ├── src/escena.js            # Código propio
│   ├── src/colisiones.js        # Geometría de colisiones XZ
│   ├── vendor/three.min.js      # Biblioteca local
│   ├── docs/                   # Guías y explicaciones V1–V5
│   └── pruebas/                # Pruebas del autor; no necesarias para ejecutar
├── versiones/
│   ├── V1_Escenario_Fijo/
│   ├── V2_Movimiento/
│   ├── V3_Iluminacion_Dinamica/
│   ├── V4_Conduccion_Mejorada/
│   └── V5_Ciudad_Colisiones/
├── HISTORIAL_VERSIONES.md
├── ORGANIZACION_PROYECTO.md
├── docs/                        # Documentación original y ampliación V1
└── index.html, src/, vendor/…    # Originales V1 conservados
```

## Versiones del proyecto

- **V1 cerrada:** escenario fijo, cinco manzanas, vehículo, luces y sombras.
- **V2 cerrada:** avance, retroceso, rotación y cámara seguidora.
- **V3 cerrada:** intensidades, emisión de ventanas, alcance/apertura de faros, grupos de luces y restablecimiento.
- **V4 cerrada:** aceleración progresiva, máximos de velocidad, desaceleración, frenado, reversa y crucero con indicadores.
- **V5 cerrada:** casas, comercios, edificios medianos, veredas y muros; colisiones de rectángulo orientado contra cajas, subpasos, deslizamiento limitado y cancelación de crucero ante bloqueo. Transparencia temporal para mejorar visibilidad del auto.

La lomada queda pendiente para V6 en la calle X=39, Z entre -34 y 34, todavía plana. La numeración del plan original cambió. Consultar [HISTORIAL_VERSIONES.md](HISTORIAL_VERSIONES.md) para los cierres reales. Mantener intactos todos los respaldos y continuar únicamente en `desarrollo/`.

## Controles V5 y documentación

- **W/↑:** acelerar hacia adelante; frena primero si se retrocede.
- **S/↓:** frenar y, manteniendo después de detenerse, retroceder.
- **A/← y D/→:** dirigir, también en reposo si la huella del auto tiene espacio libre.
- **C:** fijar/cancelar crucero desde 3 unidades/s hacia adelante. Una nueva pulsación de W/S también cancela.
- Soltar el pedal desacelera gradualmente. Máximos: 12 unidades/s adelante y 5 en reversa.
- Con foco en el panel, las flechas editan controles; WASD y C siguen disponibles para conducir. Perder foco detiene el auto y cancela crucero.
- Un bloqueo por obstáculo detiene velocidad y cancela crucero; retroceder permite alejarse. No hay rebotes, daños ni física avanzada.

Ver la [guía práctica V5](versiones/V5_Ciudad_Colisiones/docs/GUIA_VERSION_5.md) y la [explicación técnica V5](versiones/V5_Ciudad_Colisiones/docs/EXPLICACION_TECNICA_V5.md). Incluyen fórmulas, flujo exacto, contratos de funciones y «Modificaciones prácticas para la defensa»: ejercicios con ubicación precisa, consecuencias y errores comunes. Los ejercicios son explicativos y no se aplicaron al código respaldado.

## Verificación

El autor confirmó que V5 fue implementada y probada. Se verificaron rutas locales, igualdad de la copia y preservación de respaldos mediante SHA-256, sintaxis y pruebas lógicas con renderizador simulado.

Para repetir las pruebas del autor desde la raíz: `node desarrollo/pruebas/colisiones.test.cjs` y `node desarrollo/pruebas/iluminacion.test.cjs`. Reutilizan pruebas de conducción y utilizan V1 para comparar la biblioteca. Node solo se necesita para estas pruebas, nunca para abrir la aplicación. La simulación no sustituye la revisión visual WebGL en otros equipos.

## Licencias

Three.js (https://threejs.org/), licencia MIT. La versión CDN referenciada es 0.158.0. Ver https://github.com/mrdoob/three.js/blob/r158/LICENSE
