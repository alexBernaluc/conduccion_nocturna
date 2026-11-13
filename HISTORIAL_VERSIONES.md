# Historial de versiones — Conducción Nocturna

## V1 — Escenario fijo

- **Estado:** versión existente respaldada; sin cambios funcionales.
- **Fecha de organización y respaldo:** 13/11/2026 (no implica fecha original de creación).
- **Respaldo independiente:** [versiones/V1_Escenario_Fijo/index.html](versiones/V1_Escenario_Fijo/index.html).
- **Contenido:** terreno y bordes, siete calzadas, cinco manzanas, diez edificios, diez árboles, siete postes con `PointLight`, vehículo estático, dos `SpotLight` con sombras, luz hemisférica y direccional, niebla y cámara fija en tercera persona.
- **Ejecución:** HTML directo con `vendor/three.min.js` local, sin servidor ni instalación.
- **Documentación original:** `README.md`, `docs/GUIA_VERSION_1.md` y `vendor/LEEME.txt`, conservados en cada copia.
- **Documentación añadida fuera del respaldo:** [explicación técnica V1](docs/EXPLICACION_TECNICA_V1.md), organización y plantilla para próximas explicaciones.
- **Desarrollo:** copia inicial idéntica en código y biblioteca, preparada para comenzar V2; no se agregaron funcionalidades.

### Verificación realizada el 13/11/2026

- Comparación SHA-256 de los siete archivos originales: idénticos en raíz, `desarrollo` y `versiones/V1_Escenario_Fijo`, incluida la guía y la biblioteca.
- Rutas locales de scripts del HTML resueltas dentro de cada copia; ninguna depende del código o la biblioteca de otra carpeta.
- Sintaxis de los tres `src/escena.js` comprobada con `node --check`.
- Construcción ejecutada en las tres copias con la biblioteca local real (revisión 158) y DOM/renderizador simulados: 224 mallas, 28 grupos, siete luces puntuales, dos focos, una luz hemisférica y una direccional. Objetivos de faros vinculados al auto y cámara en `(-6.9, 8.84, 25)`.
- Callback del bucle y redimensionamiento comprobados en esa simulación, sin acceso a Internet.
- **Límite de la comprobación:** no se realizó una prueba visual en navegador ni se ejercitó WebGL real. La apertura offline funcional original fue informada por el usuario; las copias conservan exactamente sus archivos. Para confirmar visualmente en el equipo de entrega, desconectar Internet, abrir el HTML propio de cada carpeta, revisar la escena y redimensionar la ventana.

## Versiones pendientes

Las etapas restantes del README original son propuestas: V3 (intensidades), V4 (lomada e inclinación) y V5 (integración y rendimiento). Ninguna de ellas se registra todavía como implementada ni tiene un respaldo terminado.

Para cada cierre futuro registrar: fecha, carpeta independiente, funcionalidades incorporadas, archivos cambiados, enlace a su explicación técnica, verificaciones efectivamente realizadas y limitaciones conocidas.

## V2 — Movimiento del vehículo y cámara en tercera persona

- **Estado:** cerrada oficialmente el 13/11/2026, tras la confirmación personal del autor de que movimiento y cámara funcionan correctamente.
- **Respaldo independiente:** [versiones/V2_Movimiento/index.html](versiones/V2_Movimiento/index.html). Copia completa de `desarrollo/`, incluidos código, biblioteca local, documentación y pruebas del autor.
- **Controles:** W/↑ avanza, S/↓ retrocede, A/← y D/→ dirigen mientras se conduce; el giro se invierte en reversa. Admite teclas simultáneas, cancela órdenes opuestas y limpia el estado al perder el foco o cambiar de visibilidad.
- **Movimiento:** traslación mediante el vector frontal local -Z rotado alrededor de Y, velocidad constante de 12 unidades por segundo y giro de 1.6 radianes por segundo. Usa `deltaTime` con máximo de 0.05 s; restringe el centro a X ±51 y Z ±40.
- **Cámara:** sigue al auto desde atrás y arriba, convierte posiciones locales a mundiales después de actualizar matrices, interpola con un factor exponencial basado en tiempo y mira hacia el centro del vehículo.
- **Conservado de V1:** escenario, vehículo, alumbrado y parámetros de iluminación/sombras. Faros y objetivos siguen como hijos del auto y acompañan su movimiento.
- **Cambios de implementación respecto de V1:** `src/escena.js` e indicaciones de `index.html`; documentación técnica y guía V2, y `pruebas/movimiento.test.cjs`.
- **Documentación del respaldo:** [explicación técnica V2](versiones/V2_Movimiento/docs/EXPLICACION_TECNICA_V2.md) y [guía práctica V2](versiones/V2_Movimiento/docs/GUIA_VERSION_2.md). Conserva también todos los documentos V1.
- **Trabajo posterior:** `desarrollo/` permanece activo. El cierre no modifica el HTML ni JavaScript probados; la indicación «en desarrollo» del HTML se conserva y el estado oficial se registra en la documentación.
- **Límites conocidos:** sin colisiones con edificios/obstáculos, física, lomada ni controles de intensidad; los edificios pueden ocultar el auto o la vista de cámara.

### Verificación del cierre

- Sintaxis y pruebas lógicas de movimiento, cámara y faros aprobadas con Three.js local y renderizador simulado. No equivalen a una nueva prueba visual WebGL.
- Validación visual de movimiento y cámara comunicada por el autor; no se atribuyen otras pruebas manuales específicas.
- Copia completa comparada archivo por archivo mediante SHA-256, rutas de scripts locales verificadas dentro de V2 y código activo sin cambios durante el cierre.
- Respaldo V1 comparado antes y después mediante SHA-256: intacto.
- La aplicación V2 no depende de V1 ni de `desarrollo`: basta su propio HTML, código y biblioteca. El script de pruebas del autor conserva una comparación contra V1 pensada para ejecutarse desde `desarrollo`; no participa en la ejecución del HTML.
- No se realizan commits, push ni etiquetas Git automáticamente.
