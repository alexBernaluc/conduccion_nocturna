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

La lomada e inclinación, así como la integración final y ajustes de rendimiento, siguen pendientes. La numeración del plan original se actualizó: V4 corresponde a conducción mejorada, no a la lomada. Las futuras etapas deberán definirse antes de registrarlas como implementadas.

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

## V3 — Iluminación dinámica y controles interactivos

- **Estado:** cerrada oficialmente el 13/11/2026 tras la confirmación del autor de que fue probada y funciona correctamente.
- **Respaldo independiente:** [versiones/V3_Iluminacion_Dinamica/index.html](versiones/V3_Iluminacion_Dinamica/index.html), copia completa de `desarrollo/` con código, biblioteca Three.js local, estilos internos del HTML, documentación y pruebas del autor.
- **Panel:** ocho deslizadores con valores visibles para intensidad independiente de cada faro, alumbrado público, luz hemisférica ambiental, luna direccional, emisión de ventanas, alcance y semiángulo de ambos faros. Los eventos `input` aplican cambios inmediatamente a los objetos existentes.
- **Grupos y restablecimiento:** interruptores para faros, alumbrado, ambiental, luna y emisión de ventanas; apagar conserva los valores seleccionados. El botón restaura predeterminados y enciende los grupos sin reiniciar auto ni cámara.
- **Materiales:** ventanas encendidas con `MeshStandardMaterial`, `emissive` y `emissiveIntensity`. Su brillo propio no ilumina otros objetos. Los faroles visibles se oscurecen al apagar sus fuentes.
- **Sombras:** solo los dos `SpotLight` proyectan sombras; se conserva la resolución 512×512 y se ajusta la profundidad de su cámara de sombra al alcance. No se agregan fuentes de luz ni sombras en postes o luna.
- **Conducción:** mantiene el movimiento y la cámara de V2. WASD permite conducir mientras se usa el panel; las flechas editan el control cuando tiene foco. Faros y objetivos conservan su relación con el auto.
- **Archivos de implementación respecto de V2:** `index.html`, `src/escena.js` y adaptación de `pruebas/movimiento.test.cjs`; se agregan `pruebas/iluminacion.test.cjs`, la explicación técnica y la guía V3.
- **Documentación:** [explicación técnica V3](versiones/V3_Iluminacion_Dinamica/docs/EXPLICACION_TECNICA_V3.md) y [guía práctica V3](versiones/V3_Iluminacion_Dinamica/docs/GUIA_VERSION_3.md); incluye también todos los documentos anteriores.
- **Limitaciones conservadas:** sin colisiones, lomada, velocidad crucero ni aceleración progresiva; los edificios pueden ocultar auto/cámara. Sin iluminación global ni propagación de luz desde materiales emisivos.
- **Continuidad:** `desarrollo/` permanece activo. No se modifica el código durante el cierre; el HTML conserva la indicación «en desarrollo» de la implementación probada y el cierre oficial queda registrado aquí.

### Verificación del cierre de V3

- No existía un respaldo V3 previo; se crea una carpeta nueva sin sobrescribir versiones.
- Sintaxis del JavaScript respaldado y pruebas lógicas V2/V3 aprobadas con Three.js local, DOM y renderizador simulados. La validación personal del funcionamiento fue comunicada por el autor; no se presenta la simulación como una nueva prueba visual WebGL.
- Los 15 archivos del respaldo se comparan con `desarrollo/` mediante SHA-256 y coinciden. Se verifica que las rutas locales del HTML se resuelvan dentro de la propia copia y que los estilos estén incluidos en el HTML.
- Respaldos V1/V2 y código activo comparados antes y después: intactos. La aplicación no depende de otras versiones ni de `desarrollo/` para ejecutarse.
- La comparación de biblioteca contra V1 pertenece solo al script de pruebas del autor, pensado para ejecutarse desde `desarrollo`; no es una dependencia del HTML.
- No se realizan commits, push ni etiquetas automáticamente.

## V4 — Conducción mejorada

- **Estado:** cerrada oficialmente el 24/11/2026, tras la confirmación personal del autor de que todas las funcionalidades de conducción mejorada funcionan correctamente.
- **Respaldo independiente:** [versiones/V4_Conduccion_Mejorada/index.html](versiones/V4_Conduccion_Mejorada/index.html), copia completa de `desarrollo/` con HTML, CSS interno, JavaScript, biblioteca Three.js local, documentación y pruebas del autor.
- **Velocidad y aceleración:** `velocidadActual` con signo, aceleración progresiva de 0.8 a 4 u/s² durante 3 s, máximos estrictos de 12 u/s adelante y 5 u/s en reversa. Integración por `deltaTime` y desplazamiento con velocidad media.
- **Desaceleración y frenado:** desaceleración natural de 2 u/s² al soltar, frenado de 8 u/s² con pedal opuesto o ambos pedales. Se llega a cero antes de acelerar en el sentido contrario. W/↑ y S/↓ controlan ambos sentidos.
- **Crucero:** C fija la velocidad actual desde 3 u/s hacia adelante. La mantiene sin acelerar hasta el máximo y permite girar. Se cancela con otra C, una nueva pulsación de W/S o sus flechas, pérdida de foco/visibilidad o límite exterior. La repetición de teclado no alterna reiteradamente el estado.
- **Giro y límites:** el signo de velocidad determina el giro, incluso al frenar, circular por inercia o usar crucero. La frontera X ±51/Z ±40 detiene velocidad y cancela crucero; no agrega colisiones con edificios.
- **Indicadores:** velocidad con signo en unidades del escenario por segundo, máximos avance/reversa y estado/velocidad fijada de crucero. Sin conversión a km/h.
- **Conservado:** cámara seguidora, jerarquía del auto/faros/objetivos y todos los controles, materiales y sombras de iluminación V3. Solo los dos faros proyectan sombras.
- **Cambios de implementación respecto de V3:** `src/escena.js`, `index.html` y adaptación de las pruebas de movimiento e iluminación. Nuevos documentos de explicación técnica y guía V4.
- **Documentación:** [explicación técnica V4](versiones/V4_Conduccion_Mejorada/docs/EXPLICACION_TECNICA_V4.md) y [guía práctica V4](versiones/V4_Conduccion_Mejorada/docs/GUIA_VERSION_4.md). Se incluyen todos los documentos anteriores.
- **Limitaciones:** sin lomada, colisiones con edificios, suspensión ni física realista. El tiempo por frame se limita a 0.05 s y el movimiento se aproxima numéricamente. Perder foco detiene el auto inmediatamente por seguridad.
- **Continuidad:** `desarrollo/` sigue activo. No se modifica código funcional durante el cierre. El HTML mantiene su texto «en desarrollo» y el estado oficial se registra en documentación e historial.

### Verificación del cierre de V4

- No existía respaldo V4: se crea una carpeta nueva sin sobrescribir versiones.
- Sintaxis del JavaScript respaldado y pruebas lógicas de conducción/iluminación aprobadas con Three.js local y DOM/renderizador simulados. La prueba personal fue confirmada por el autor; no se presenta la simulación como una nueva prueba visual WebGL.
- Los 17 archivos de V4 coinciden con `desarrollo/` mediante SHA-256. Rutas de scripts verificadas dentro de la copia y estilos incluidos en el HTML. La biblioteca local permite abrir directamente el HTML sin servidor ni conexión.
- Los 34 archivos de los respaldos V1–V3 y los archivos funcionales de desarrollo se comparan antes y después: permanecen intactos.
- La referencia a V1 usada para comparar la biblioteca pertenece únicamente al script de pruebas del autor, ejecutado desde `desarrollo`; no se utiliza al abrir el HTML.
- Se actualiza el README general para señalar V4 y la estructura vigente. No se realizan commits, push ni etiquetas automáticamente.

## V5 — Ciudad, estructuras y colisiones

- **Estado:** cerrada oficialmente el 25/11/2026 tras la confirmación del autor de que fue implementada y probada.
- **Respaldo independiente:** [versiones/V5_Ciudad_Colisiones/index.html](versiones/V5_Ciudad_Colisiones/index.html), copia completa de `desarrollo/` con HTML/CSS interno, ambos scripts propios, Three.js local, documentación y pruebas del autor.
- **Ciudad:** conserva cinco manzanas y siete calzadas de ancho 8. Incluye cinco casas, tres comercios, dos edificios medianos, diez árboles, siete postes, veredas y cinco muros. Construcciones retiradas de las calles y ventanas integradas al control emisivo V3.
- **Colisiones:** 32 sólidos registrados automáticamente al crearlos. Rectángulo orientado del auto (semiancho 1.34, semilargo 2.47) contra cajas XZ mediante SAT; frontera exterior considerando el volumen completo (53.8/42.8).
- **Movimiento:** validación previa de giro y desplazamiento en subpasos de recorrido combinado máximo 0.08, deslizamiento limitado por componentes y giro en reposo cuando hay espacio. Un bloqueo detiene velocidad, reinicia aceleración y cancela crucero; se permite retroceder para alejarse.
- **Visibilidad:** seguimiento de cámara conservado; edificios y árboles interpuestos en el rayo hacia el centro del auto se atenúan temporalmente, sin eliminar su colisión.
- **Conservado:** aceleración/frenado/crucero V4 e iluminación interactiva V3; once luces, únicamente dos faros con mapas de sombras. No se agregan motores de física ni dependencias.
- **Reserva V6:** calle X=39, Z de -34 a 34, plana y libre para futura lomada. Todavía no se implementa el desnivel.
- **Archivos de implementación:** cambios en `index.html`, `src/escena.js`, `pruebas/movimiento.test.cjs`; nuevos `src/colisiones.js`, `pruebas/colisiones.test.cjs`, explicación y guía V5.
- **Documentación:** [explicación técnica V5](versiones/V5_Ciudad_Colisiones/docs/EXPLICACION_TECNICA_V5.md), ampliada con «Modificaciones prácticas para la defensa», y [guía V5](versiones/V5_Ciudad_Colisiones/docs/GUIA_VERSION_5.md). Los ejercicios indican archivos, funciones, parámetros, consecuencias y errores comunes; no se aplican al código cerrado.
- **Limitaciones:** colisiones estáticas 2D por aproximaciones, sin física avanzada ni desniveles; transparencia de cámara basada en un rayo al centro, con posibles oclusiones parciales y artefactos visuales.
- **Continuidad:** `desarrollo/` sigue activo. Código funcional intacto durante el cierre; el HTML conserva su texto «en desarrollo» y el cierre se registra en documentación e historial.

### Verificación del cierre de V5

- No existía un respaldo V5 previo; se crea una carpeta nueva sin sobrescritura.
- Sintaxis de ambos scripts y suites de colisiones, conducción e iluminación aprobadas con Three.js local y DOM/renderizador simulados. La prueba personal fue confirmada por el autor; no se presenta la simulación como una nueva prueba visual.
- Copia de 21 archivos comparada con `desarrollo/` mediante SHA-256. Rutas locales y orden de carga Three.js → colisiones → escena verificados; CSS incluido en el HTML.
- Los 51 archivos de V1–V4 se comparan antes y después y permanecen intactos, al igual que los archivos funcionales de desarrollo.
- La aplicación se ejecuta abriendo su HTML propio sin otras versiones. La comparación contra V1 pertenece únicamente a los scripts de prueba del autor, ejecutados desde `desarrollo`.
- README general actualizado a V5; README de la aplicación incorpora orientación actual conservando el texto original V1 como antecedente. No se realizan commits, push ni etiquetas.
