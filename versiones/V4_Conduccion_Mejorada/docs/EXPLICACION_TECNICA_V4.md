# Explicación técnica — V4: aceleración progresiva, frenado y crucero

Estado: V4 cerrada oficialmente el 24/11/2026 tras la confirmación personal del autor de que todas las funcionalidades de conducción mejorada funcionan correctamente. Respaldo completo en `versiones/V4_Conduccion_Mejorada/`. `desarrollo/` continúa como carpeta activa y los respaldos V1–V3 permanecen intactos. Esta V4 corresponde a conducción mejorada; la lomada de planes antiguos sigue pendiente.

Las rutas de aplicación de este documento son relativas a `desarrollo/` o a la carpeta del respaldo: cada una tiene su propio `index.html`, `src/escena.js`, `vendor/three.min.js` y `docs/`. Los estilos CSS están dentro del bloque `<style>` del HTML, sin hojas externas necesarias.

## 1. Archivos, funciones y estado

`src/escena.js` incorpora velocidad persistente, aceleración, frenado y crucero. `index.html` agrega indicadores dentro del título, actualiza instrucciones y desplaza el panel hacia abajo en pantallas estrechas. Las pruebas `pruebas/movimiento.test.cjs` y `pruebas/iluminacion.test.cjs` se adaptan a la inercia: soltar W ya no significa detenerse instantáneamente. Se agregan esta explicación y `GUIA_VERSION_4.md`.

Funciones nuevas: `desactivarCrucero`, `alternarCrucero`, `reducirVelocidad`, `actualizarVelocidad`, `actualizarIndicadores`. Modificadas: `alPresionarTecla`, `reiniciarEntrada`, `actualizarMovimiento`, `animar`, `iniciar`. Todas están en `src/escena.js`.

Se reutilizan sin cambiar sus operaciones la ciudad, `actualizarCamara`, `crearFaros`, los materiales y las funciones del panel V3. No se añade motor de física, biblioteca, colisiones ni nuevas luces. Los estilos siguen dentro del HTML. Los scripts siguen siendo clásicos, compatibles con apertura local.

### Constantes concentradas en `CONDUCCION`

| Propiedad | Valor | Unidad / propósito |
| --- | ---: | --- |
| `velocidadMaxima` | 12 | u/s, máximo adelante |
| `velocidadMaximaRetroceso` | 5 | u/s, magnitud máxima atrás |
| `aceleracionInicial` | 0.8 | u/s², arranque suave |
| `aceleracionMaxima` | 4 | u/s², máximo tras la progresión |
| `tiempoProgresion` | 3 | segundos de aceleración continua |
| `frenado` | 8 | u/s² con pedal opuesto o ambos |
| `desaceleracionNatural` | 2 | u/s² al soltar pedales |
| `minimoCrucero` | 3 | u/s hacia adelante para activarlo |
| `velocidadGiro` | 1.6 | rad/s, conservada |
| `limiteX`, `limiteZ` | 51, 40 | coordenadas máximas absolutas |

La antigua `CONDUCCION.velocidad` se reemplaza por máximos y estado. Las unidades son del escenario, sin conversión definida a metros o km/h. Se conserva `CAMARA` con altura 8.8, distancia 14 y suavidad 8.

### Variables nuevas

- `velocidadActual = 0`: velocidad longitudinal; positiva avanza hacia -Z local y negativa retrocede.
- `tiempoAcelerando = 0`: tiempo de la progresión actual, limitado a su duración.
- `marchaAcelerando = 0`: último sentido de aceleración (-1, 0, +1), para reiniciar al cambiar sentido.
- `cruceroActivo = false`: mantiene o no una velocidad fijada.
- `velocidadCrucero = 0`: valor capturado al activar; vuelve a cero al cancelar.

`teclasConduccion` añade `KeyC`. Se reutilizan `teclas`, `tiempoAnterior`, `direccionFrontal`, `auto`, `camara` y todos los estados de luces. Permanecen dentro de la función autoejecutable, no expuestos en `window`.

## 2. Flujo exacto

1. El navegador crea DOM y CSS, incluyendo `#app`, el panel y los spans `velocidad-actual`, `velocidad-maxima`, `estado-crucero`.
2. Carga `vendor/three.min.js` y luego `src/escena.js`. El fallback CDN anterior solo se intenta si falta `THREE`; con la biblioteca local válida no necesita Internet.
3. La función autoejecutable comprueba la biblioteca, inicializa estados y llama a `iniciar()`.
4. `iniciar` llama a `inicializarRenderer`, `crearEscena`, `crearTerreno`, `crearCalles`, `crearManzanas`, `crearAlumbrado`, `crearVehiculo`, `crearFaros`, en ese orden. Construye los objetos una vez.
5. `configurarCamara` coloca la vista. `configurarControles` registra teclado, foco y visibilidad. `configurarPanelLuces` construye controles V3 y aplica sus valores iniciales.
6. `actualizarIndicadores` muestra velocidad cero, máximos y crucero desactivado. Se registra `resize` y se solicita `requestAnimationFrame(animar)`.
7. En cada frame se actualizan velocidad y posición, cámara, indicador y render. No se reconstruye la ciudad.

### Eventos y pulsaciones

`alPresionarTecla(evento)` filtra códigos y deja las flechas al panel cuando corresponde. Llama a `preventDefault`; después ignora `evento.repeat` y códigos ya presentes en `teclas`. Una pulsación nueva se agrega al conjunto. C llama a `alternarCrucero`; W/S/↑/↓ cancelan crucero y actualizan indicador; A/D quedan registradas para el bucle.

Esto permite activar C mientras W ya está mantenida. Esa pulsación antigua no cancela crucero, ni lo hace soltarla. Una **nueva** W lo cancela. S también cancela; si ya estaba presionada al intentar C, se rechaza activación. `alSoltarTecla` sigue eliminando el código, sin poner velocidad a cero. No se usa la repetición del teclado como reloj de aceleración.

### Cada fotograma

```js
const deltaTime = tiempoAnterior === null ? 0 : Math.min((tiempoActual - tiempoAnterior) / 1000, 0.05);
tiempoAnterior = tiempoActual;
actualizarMovimiento(deltaTime);
actualizarCamara(deltaTime, false);
actualizarIndicadores();
renderer.render(escena, camara);
requestAnimationFrame(animar);
```

RAF entrega milisegundos, convertidos a segundos. El primer frame tiene Δt=0. El máximo 0.05 evita saltos; por debajo de 20 FPS o después de pausas simula menos tiempo que el transcurrido, sin recuperación con subpasos. Los callbacks posteriores no quedan protegidos por el `try/catch` inicial de `iniciar`.

`actualizarMovimiento` guarda la velocidad anterior, llama a `actualizarVelocidad`, calcula velocidad media, gira, transforma la dirección frontal, traslada y limita coordenadas. La cámara utiliza después la transformación nueva y el indicador muestra el estado final del frame.

## 3. Decisiones de conducción y crucero

| Situación | Resultado de `actualizarVelocidad` |
| --- | --- |
| Crucero activo | Asigna velocidad fijada y retorna |
| Ningún pedal | Reinicia progresión y desacelera naturalmente |
| Ambos pedales | Reinicia progresión y frena a cero, sin elegir marcha |
| Pedal opuesto al signo de velocidad | Frena hasta cero; no cambia de marcha en ese mismo frame |
| Un pedal desde reposo o en su mismo sentido | Acelera progresivamente y aplica máximos |

`adelante` y `atras` combinan letras/flechas mediante OR. `marcha = Number(adelante) - Number(atras)` vale -1, 0 o +1. Dos alias no duplican aceleración. Al llegar a cero frenando, retorna; si se mantiene el pedal, el siguiente frame comienza a acelerar en su sentido. Se descarta cualquier fracción sobrante de ese frame: es una simplificación de hasta un fotograma.

Crucero exige `velocidadActual >= CONDUCCION.minimoCrucero` y ausencia de S/↓. Captura el valor presente, no el máximo. La actualización usa:

```js
if (cruceroActivo) {
  velocidadActual = velocidadCrucero;
  return;
}
```

No acelera ni aplica desaceleración natural en esta rama. Es mantenimiento directo de velocidad, no un regulador PID. El giro se procesa después y funciona sin pedal. Cancelar C no cambia inmediatamente la velocidad: el siguiente frame aplica los pedales actuales. Sin pedal, desacelera; con W aún mantenida, acelera manualmente.

## 4. Matemáticas conectadas al código

### Aceleración y velocidad con signo

La relación básica es `Δv = a·Δt`. Aceleración está en u/s² y tiempo en segundos, por lo que el resultado tiene u/s. La marcha multiplica el incremento por +1 o -1. El límite estricto se aplica así:

```js
velocidadActual = THREE.MathUtils.clamp(velocidadActual + marcha * incremento,
  -CONDUCCION.velocidadMaximaRetroceso, CONDUCCION.velocidadMaxima);
```

Después de acelerar se cumple `-5 ≤ v ≤ 12`. Crucero captura una velocidad ya limitada. No hay formulario que permita inyectar una velocidad fijada externa.

### Rampa progresiva

Para tiempo sostenido t y duración T:

```text
p = min(t/T, 1)
a(t) = aInicial + (aMaxima - aInicial)·p
```

Empieza en 0.8 y llega a 4 en tres segundos. La aceleración inicial no es cero, de modo que comienza a moverse inmediatamente pero suavemente. Soltar, frenar o cambiar la marcha reinicia la progresión.

El código integra la rampa durante el frame:

```js
const duracion = Math.max(CONDUCCION.tiempoProgresion, 0.001);
const tramo = Math.min(deltaTime, Math.max(0, duracion - tiempoAcelerando));
const progresoMedio = Math.min(1, (tiempoAcelerando + tramo / 2) / duracion);
const aceleracionMedia = CONDUCCION.aceleracionInicial +
  (CONDUCCION.aceleracionMaxima - CONDUCCION.aceleracionInicial) * progresoMedio;
const incremento = aceleracionMedia * tramo + CONDUCCION.aceleracionMaxima * (deltaTime - tramo);
```

`tramo` es el tiempo del frame que queda dentro de la rampa. En una función lineal, el valor medio se obtiene en el punto medio del intervalo. Si cruza el final, el resto se integra con aceleración máxima. El mínimo 0.001 evita dividir por cero si se edita la duración a cero. `tiempoAcelerando` se incrementa y limita a `duracion`.

Desde reposo, sin frenar ni saturar y para t≤3, `v(t)=0.8t+(3.2/6)t²`. A un segundo vale 1.333 u/s; a dos, 3.733; a tres, 7.2. Después crece 4 u/s cada segundo y alcanza 12 aproximadamente a los 4.2 s. La reversa usa la misma rampa con signo negativo y llega antes al máximo de magnitud 5.

### Frenado y desaceleración

`reducirVelocidad` ejecuta:

```js
velocidadActual = Math.sign(velocidadActual) *
  Math.max(0, Math.abs(velocidadActual) - intensidad * deltaTime);
```

Se reduce la magnitud y se conserva el signo. `max(0,...)` evita atravesar cero por un paso grande. Desde +6 u/s, soltar medio segundo resta `2·0.5=1`: quedan +5. Frenar medio segundo resta `8·0.5=4`: quedan +2. Desde -4, W reduce la magnitud y se aproxima a cero antes de comenzar el avance.

Con W+S no se genera una oscilación de sentido: se aplica frenado hasta cero. Con ningún pedal se aplica la menor desaceleración natural. No se modela masa, fuerzas, resistencia aerodinámica ni rozamiento dependiente de velocidad.

### Distancia por velocidad media

```js
const velocidadAnterior = velocidadActual;
actualizarVelocidad(deltaTime);
const velocidadMedia = (velocidadAnterior + velocidadActual) / 2;
auto.position.addScaledVector(direccionFrontal, velocidadMedia * deltaTime);
```

Equivale a `Δs≈(vAnterior+vNueva)/2 · Δt`. Es exacto con velocidad constante y con aceleración constante sin alcanzar límites. Con rampa de aceleración la velocidad es cuadrática y la distancia se aproxima numéricamente. Los frames donde se alcanza cero o el máximo también son aproximaciones. Las trayectorias se prueban con tolerancia: no se promete igualdad exacta de toda la simulación a cualquier FPS.

A un segundo desde reposo, la distancia teórica en línea recta es `0.4+3.2/18≈0.578` unidades, frente a las 12 unidades instantáneas de V3. El incremento de velocidad usa tiempo, no cantidad de frames.

### Dirección y giro

```js
auto.rotation.y += giro * Math.sign(velocidadMedia) * CONDUCCION.velocidadGiro * deltaTime;
const angulo = auto.rotation.y;
direccionFrontal.set(-Math.sin(angulo), 0, -Math.cos(angulo));
```

El frente sigue siendo -Z local. Rotar `(0,0,-1)` alrededor de Y produce `(-sinθ,0,-cosθ)`, de longitud uno. La posición se traslada sobre ese vector; Y es cero y conserva altura.

Ahora el signo del giro depende de velocidad real, no del pedal: S mientras todavía avanza no invierte incorrectamente la rotación. En reversa se invierte; por inercia y crucero puede seguir girando. En reposo el signo es cero. A+D produce giro cero.

La magnitud de velocidad afecta el desplazamiento pero no multiplica la velocidad angular. Es conducción sencilla de 1.6 rad/s, incluso a baja velocidad; no representa neumáticos, derrapes ni un radio de dirección realista.

### Límite exterior

Después de trasladar se calcula `fuera` comprobando X/Z antes de aplicar clamp. Si supera ±51 o ±40, se limita posición, pone velocidad a cero, reinicia rampa y cancela crucero. Evita mantener un indicador de velocidad fijada con el auto retenido. Si se mantiene el pedal, intenta acelerar de nuevo en frames siguientes; puede girarse para salir o cambiar de marcha. No detecta edificios ni implementa colisiones de formas.

## 5. Funciones: llamadas, parámetros y resultados

Todas están en `src/escena.js` y producen efectos sobre estado o DOM, sin devolver valores explícitos.

| Función | Quién la llama y cuándo | Parámetros, operaciones y resultado |
| --- | --- | --- |
| `desactivarCrucero()` | Pedales nuevos, `alternarCrucero`, `reiniciarEntrada` y frontera exterior | Sin parámetros; pone flag falso y valor fijado cero. No cambia por sí sola velocidad actual |
| `alternarCrucero()` | `alPresionarTecla` en una nueva C | Sin parámetros; alterna o comprueba umbral y ausencia de freno; captura velocidad, reinicia rampa y actualiza indicador |
| `reducirVelocidad(intensidad, deltaTime)` | `actualizarVelocidad` al frenar o soltar | u/s² y segundos; reduce magnitud con signo hasta cero; no toca posición |
| `actualizarVelocidad(deltaTime)` | `actualizarMovimiento`, cada frame | Segundos; lee crucero/teclas, decide estado, integra rampa, limita velocidad; usa `tiempoAcelerando` y `marchaAcelerando` |
| `actualizarIndicadores()` | Inicio, cada frame, C, cancelación manual y pérdida de foco | Sin parámetros; escribe velocidad, máximos y crucero en tres spans. `toFixed(2)` solo redondea la presentación |
| `alPresionarTecla(evento)` | Navegador, keydown | Lee code/target/repeat; conserva filtro del panel, bloquea repetición y registra estado; ejecuta órdenes inmediatas de crucero |
| `reiniciarEntrada()` | Eventos blur y visibilitychange | Limpia teclas y crucero; pone velocidad/rampa a cero, reinicia reloj y muestra estado |
| `actualizarMovimiento(deltaTime)` | `animar`, cada frame | Guarda velocidad, llama a su actualización, calcula media, giro y dirección, traslada y restringe mapa; detiene estado si sale |
| `animar(tiempoActual)` | RAF | Milisegundos; calcula segundos, movimiento, cámara, indicadores y render; solicita próximo frame |
| `iniciar()` | Final de función autoejecutable | Construye en orden, registra callbacks, inicializa indicador y solicita RAF; conserva manejo de errores de inicio |

`actualizarVelocidad` no traslada: deja nueva velocidad para `actualizarMovimiento`. `reducirVelocidad` no reinicia rampa: lo hace su llamador. `desactivarCrucero` no frena instantáneamente; foco y borde lo hacen explícitamente. Esta separación permite cancelar normalmente sin saltos, y detener por seguridad al perder la ventana.

Eliminar actualización de velocidad dejaría el estado inmóvil o congelado. La protección de C tiene dos partes: `evento.repeat` y la comprobación `teclas.has(evento.code)`; quitar solo la primera mantiene la protección del conjunto mientras la tecla siga registrada. Quitar ambas permitiría alternar repetidamente al mantener C. Eliminar reinicio por foco podría dejar crucero conduciendo al volver. No se llama a `iniciar` para reiniciar valores porque reconstruiría objetos y bucles sin limpieza.

## 6. Cámara, iluminación y foco

`actualizarCamara` conserva `auto.updateMatrixWorld(true)` antes de `localToWorld`. Su destino relativo es `(0,8.8,14)`, mira a `(0,1,0)` local e interpola con `1-exp(-8Δt)`. Como utiliza la transformación nueva después de mover, acompaña aceleración/freno/crucero sin cambios adicionales.

Faros y targets siguen como hijos del auto; su dirección local `(0,-0.8,-17.62)` gira con el grupo. No cambian `crearFaros`, `aplicarIluminacion`, materiales ni controles V3. Los dos faros siguen siendo las únicas fuentes con sombras; renderizar actualiza mapas como antes.

El indicador ocupa el bloque del título, separado del panel derecho. Hasta 750 px de ancho el panel comienza a 200 px de altura para dejar espacio; sigue plegable y con scroll interno. La disposición en cada pantalla requiere revisión visual.

WASD y C funcionan dentro del panel. Las flechas editan los controles y `focusin` sigue borrando órdenes de flechas anteriores, pero no elimina la inercia ni cancela crucero: permite conducir mientras se cambian luces.

En cambio, `reiniciarEntrada` ante pérdida de foco/visibilidad detiene inmediatamente el auto, cancela crucero, limpia rampa/teclas y pone `tiempoAnterior=null`. Es una pausa segura, distinta del frenado gradual normal. El primer frame al volver tiene Δt=0; no acumula tiempo fuera de la ventana.

## 7. Ejemplos y parámetros

| Parámetro | Aumentar | Disminuir |
| --- | --- | --- |
| Máximo de avance | Permite más rapidez y exige más seguimiento de cámara; tarda más en alcanzar el nuevo tope | Llega antes al tope y recorre menos por segundo |
| Máximo de reversa | Marcha atrás más rápida; mantener inferior al avance | Reversa más limitada |
| Aceleración inicial | Arranque más inmediato y menos suave | Arranque más lento |
| Aceleración máxima | Al final de la rampa gana velocidad más rápido | Tarda más en alcanzar máximo |
| Tiempo de progresión | Conserva más tiempo aceleración baja | Llega antes a máxima aceleración |
| Frenado | Se detiene y cambia de marcha antes | Recorre más antes de detenerse |
| Desaceleración natural | Menos inercia al soltar | Más recorrido; con cero conserva velocidad al soltar |
| Umbral de crucero | Exige mayor velocidad para activar | Permite fijar velocidades más bajas |

Mantener máximos positivos, aceleraciones no negativas, máxima al menos igual a inicial y umbral positivo no mayor que el máximo de avance. Son constantes de desarrollo, no una configuración externa validada.

Ejemplo: desde 12 u/s, frenado 8 requiere idealmente 1.5 s hasta cero, frente a 6 s con desaceleración natural 2. Las distancias ideales son 9 y 36 unidades, si no se llega antes a un borde; los extremos se aproximan por frames.

Ejemplo: umbral 5 rechaza C a 4 u/s, mientras umbral 2 lo permite. Una vez fijada 4, mantiene 4: no intenta alcanzar 12. Si C cancela mientras W seguía mantenida, vuelve a acelerar manualmente desde la velocidad actual con una nueva rampa.

## 8. Defensa oral

**¿Qué cambió respecto de V3?** Antes se multiplicaba una orden por velocidad constante. Ahora la velocidad persiste entre frames y cambia por aceleración o frenado, por lo que hay movimiento al soltar.

**¿Por qué deltaTime?** `Δv=aΔt` y `Δs=vMediaΔt` permiten tasas por segundo. Sin tiempo, más FPS darían más aceleración y recorrido.

**¿Por qué promedio de aceleración?** La rampa es lineal: su valor medio integra correctamente el cambio de velocidad en cada tramo; el sobrante posterior usa aceleración máxima.

**¿Es idéntico a cualquier FPS?** La rampa integra velocidad por tiempo; distancia, giros y frames de cambio de marcha son aproximaciones. Además el tiempo se recorta a 0.05 s. No es física exacta.

**¿Cómo frena sin invertir instantáneamente?** Reduce magnitud con mínimo cero y retorna. Un frame posterior con pedal mantenido inicia la marcha contraria.

**¿Por qué gira bien al frenar o en crucero?** Usa el signo de velocidad media. No tener W no implica estar detenido, ni presionar S implica ir ya hacia atrás.

**¿Por qué crucero no acelera hasta el máximo?** Captura una velocidad y la reasigna en una rama que retorna antes de la integración manual.

**¿Qué evita repeticiones de C?** `evento.repeat` y la presencia en el Set. Keyup libera el código para una nueva pulsación.

**¿Puedo activar con W sostenida?** Sí. Una pulsación ya registrada no cancela; soltar y volver a presionar W sí devuelve control manual.

**¿Qué hace W+S?** Frena sin seleccionar marcha. S también impide activar crucero y una nueva pulsación de pedal lo cancela.

**¿Por qué detener al perder foco?** Evita que quede acelerando o conduciendo en crucero sin control al cambiar de ventana. El reloj también se reinicia.

**¿Son km/h?** No: unidades del escenario por segundo con signo. No existe conversión a escala real.

**¿Se modifican luces para adaptarlas a la velocidad?** No. Su jerarquía conserva dirección y posición; el panel V3 opera independientemente del cálculo de velocidad.

## 9. Verificación

Desde la raíz: `node --check desarrollo/src/escena.js` y `node desarrollo/pruebas/iluminacion.test.cjs`. La segunda ejecuta movimiento y luces con Three.js local real y DOM/WebGLRenderer simulados.

Se comprueba rampa y distancia a 30/60/120 FPS, máximos, desaceleración, cambio de marcha en ambos sentidos, crucero fijo, repetición de C, cancelación por pedales y foco, teclas simultáneas, recorte de pausas, frontera, giro, encuadre durante curvas y dirección de faros. Se conservan pruebas V3 de intensidades, grupos, emisión y panel, adaptadas a que soltar produce inercia.

Resultado: pruebas lógicas aprobadas. No equivalen a prueba visual WebGL, sensación de conducción, teclado nativo ni presentación del indicador. Para el cierre, el autor confirmó personalmente el funcionamiento correcto de todas las funcionalidades de conducción mejorada. La guía conserva comprobaciones para repetir en otros equipos. No se requiere Node al abrir el HTML. La comparación de biblioteca contra V1 pertenece solo al script de pruebas dentro del repositorio, pensado para ejecutarse desde `desarrollo`, no a la aplicación.

### Verificación del cierre

Se crea una copia completa en `versiones/V4_Conduccion_Mejorada/`, con biblioteca local, estilos internos, pruebas y toda la documentación. Se comparan sus archivos con `desarrollo` mediante SHA-256 y se comprueba que las rutas locales de scripts se resuelvan dentro del respaldo. No se cambia HTML, JavaScript ni biblioteca durante el cierre; los respaldos anteriores se comparan antes y después para confirmar su integridad.

Para usar V4 independientemente, trasladar la carpeta completa y abrir su propio `index.html` con un navegador compatible con WebGL. No necesita acceder a V1–V3 ni a `desarrollo`. Los scripts de prueba del autor no se cargan desde el HTML.

El HTML conserva la indicación «Versión 4 en desarrollo» de la implementación probada. El cierre oficial se registra en esta documentación y el historial sin editar ese HTML. Los README y documentos anteriores incluidos en la copia son antecedentes; para esta versión corresponde `GUIA_VERSION_4.md`. No se realizan commits, etiquetas ni push.
