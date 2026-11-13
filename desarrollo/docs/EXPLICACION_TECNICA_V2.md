# Explicación técnica — V2: movimiento y cámara en tercera persona

**Estado:** V2 cerrada el 13/11/2026, después de la confirmación personal del autor de que el movimiento y la cámara funcionan correctamente. Respaldo completo en `versiones/V2_Movimiento/`; `desarrollo/` continúa como carpeta activa. V1 se conserva intacta.

Las rutas con prefijo `desarrollo/` identifican los archivos de trabajo. Dentro del respaldo, los mismos archivos se encuentran relativos a `versiones/V2_Movimiento/`: por ejemplo, `src/escena.js` y este documento en `docs/EXPLICACION_TECNICA_V2.md`. Para ejecutar la copia basta abrir su propio `index.html` y conservar su `src/` y `vendor/`.

## 1. Qué cambió y qué se conserva

### Archivos

- `desarrollo/src/escena.js`: incorpora estado de teclado, movimiento por tiempo, límites y seguimiento de cámara. Reutiliza la construcción de V1.
- `desarrollo/index.html`: cambia título e indicaciones visibles para mostrar V2 y los controles. Mantiene estilos, contenedores y orden de scripts.
- `desarrollo/docs/EXPLICACION_TECNICA_V2.md`: esta explicación.
- `desarrollo/docs/GUIA_VERSION_2.md`: instrucciones breves y comprobaciones manuales.
- `desarrollo/pruebas/movimiento.test.cjs`: prueba lógica para el autor, con módulos incorporados de Node; no es un script cargado por el HTML ni una dependencia de ejecución del proyecto.

No se modifica la biblioteca, la documentación de V1, el código original de la raíz ni `versiones/V1_Escenario_Fijo`. El README original describe V1 y permanece como documento anterior; para ejecutar V2 corresponde la guía nueva.

Las funciones nuevas son `actualizarCamara`, `alPresionarTecla`, `alSoltarTecla`, `reiniciarEntrada`, `configurarControles` y `actualizarMovimiento`. Cambian `configurarCamara`, `animar` e `iniciar`. Se conserva `alCambiarTamano` sin cambios.

Permanecen iguales `mostrarError`, `inicializarRenderer`, `caja`, `crearEscena`, `crearTerreno`, `crearCalles`, `crearEdificio`, `crearArbol`, `crearManzanas`, `crearPoste`, `crearAlumbrado`, `agregarVentanaAuto`, `crearVehiculo` y `crearFaros`. El auto sigue siendo el mismo grupo de mallas. La diferencia es que ahora su posición y rotación se actualizan después de construirlo.

Se mantienen cinco manzanas, diez edificios, diez árboles, calles, terreno, bordes, niebla, siete luces puntuales, iluminación hemisférica y direccional, dos focos delanteros, materiales, intensidades y parámetros de sombras. No se añade aceleración, física, colisiones, lomada ni animación de ruedas.

### Estado nuevo en `src/escena.js`

| Nombre | Valor inicial | Función |
| --- | --- | --- |
| `CONDUCCION.velocidad` | 12 | Unidades de escena por segundo, tanto adelante como atrás |
| `CONDUCCION.velocidadGiro` | 1.6 | Radianes por segundo mientras hay orden de desplazamiento |
| `CONDUCCION.limiteX` | 51 | Límite simétrico del centro en X |
| `CONDUCCION.limiteZ` | 40 | Límite simétrico del centro en Z |
| `CAMARA.altura` | 8.8 | Altura local deseada respecto del grupo auto |
| `CAMARA.distancia` | 14 | Distancia local detrás del auto, en +Z |
| `CAMARA.suavidad` | 8 | Rapidez de respuesta exponencial del seguimiento, en 1/segundo |
| `teclas` | `new Set()` | Conjunto de códigos actualmente presionados |
| `teclasConduccion` | Ocho códigos | Lista de entradas aceptadas: cuatro letras y cuatro flechas |
| `tiempoAnterior` | `null` | Marca temporal del último fotograma, en milisegundos |
| `direccionFrontal` | `new THREE.Vector3()` | Vector reutilizado para mover el auto |
| `posicionCamaraDeseada` | `new THREE.Vector3()` | Destino mundial de la cámara en cada actualización |
| `objetivoCamara` | `new THREE.Vector3()` | Punto mundial al que mira la cámara |

Se conservan `AJUSTES`, `escena`, `camara`, `renderer`, `auto`, `faros` y `lamparas`. Los nuevos objetos se declaran dentro de la misma función autoejecutable, no como variables públicas de `window`. Los `const` impiden reasignar la referencia; sus propiedades y el contenido de los conjuntos/vectores sí pueden cambiar.

## 2. Ejecución desde el HTML hasta conducir

1. El navegador interpreta el HTML y CSS y crea `#app`, las indicaciones y los elementos para mostrar errores.
2. Carga `./vendor/three.min.js` como script clásico. Expone el objeto `THREE` con las clases de gráficos. Se conserva el fallback CDN original: solo se intenta si falta `THREE`; con la biblioteca local válida no se necesita Internet. Una entrega sin el archivo local no sería una entrega offline completa.
3. Carga `./src/escena.js`. Se ejecuta la función anónima autoejecutable y comprueba la existencia de `THREE`; si falta muestra el error y termina.
4. Inicializa parámetros, referencias, conjuntos y vectores auxiliares. Define las funciones. Estas definiciones no empiezan a mover el auto.
5. La llamada final `iniciar()` ejecuta `inicializarRenderer()`: crea WebGL, configura canvas, sombras y salida de color.
6. `crearEscena()` crea la escena, niebla y luces base. `crearTerreno()` y `crearCalles()` agregan el suelo, los bordes y las vías.
7. `crearManzanas()` llama a `crearEdificio()` y `crearArbol()` para construir las manzanas. `crearAlumbrado()` llama siete veces a `crearPoste()`.
8. `crearVehiculo()` crea `auto`, lo sitúa inicialmente en `(-13,0.04,11)` y lo agrega a la escena. `crearFaros()` agrega dos `SpotLight` y sus objetivos como hijos del mismo grupo.
9. `configurarCamara()` crea la cámara y llama a `actualizarCamara(0, true)` para ubicarla inmediatamente detrás del auto. Esto evita interpolar al inicio desde el origen del mundo.
10. `configurarControles()` registra callbacks para `keydown`, `keyup`, `blur` y `visibilitychange`. Registrar no significa ejecutarlos en ese instante.
11. `iniciar()` registra también `resize` con `alCambiarTamano` y solicita `requestAnimationFrame(animar)`.
12. El navegador llama a `animar(tiempoActual)`. El primer `deltaTime` es cero porque no hay fotograma anterior. Calcula movimiento, actualiza cámara, dibuja y solicita el siguiente fotograma.

### Mientras el usuario pulsa una tecla

El navegador entrega un evento a `alPresionarTecla(evento)`. Si su `code` está permitido, evita la acción predeterminada y lo agrega a `teclas`. Este callback **no mueve el auto**. Por ejemplo, W+A deja `KeyW` y `KeyA` en el conjunto. El bucle de dibujo lee ese estado repetidamente y aplica desplazamiento y giro mientras permanezca activo.

Al mantener una tecla, el sistema operativo puede repetir eventos `keydown`. Un `Set` no guarda duplicados, así que la repetición no acelera el auto. `alSoltarTecla` elimina solo el código liberado; si se suelta W pero sigue presionada ↑, el avance continúa porque el otro alias sigue activo.

`evento.code` identifica la tecla física: `KeyW`, `KeyA`, `KeyS`, `KeyD`, o `ArrowUp`, etc. En un teclado con otra distribución las letras impresas pueden diferir; las flechas son una alternativa. No depende de que el texto de la tecla esté en mayúscula o minúscula.

Al perder el foco (`blur`) o cambiar la visibilidad del documento (`visibilitychange`), `reiniciarEntrada()` borra las teclas y la marca temporal. Así no se depende de recibir un `keyup` que pudo ocurrir fuera de la ventana. Al regresar hay que volver a pulsar.

### Cada fotograma

```js
const deltaTime = tiempoAnterior === null ? 0 : Math.min((tiempoActual - tiempoAnterior) / 1000, 0.05);
tiempoAnterior = tiempoActual;
actualizarMovimiento(deltaTime);
actualizarCamara(deltaTime, false);
renderer.render(escena, camara);
requestAnimationFrame(animar);
```

Es el cuerpo real de `animar(tiempoActual)`. El orden importa: la cámara debe utilizar la transformación nueva, y el render debe ocurrir después de actualizar ambos. El siguiente callback se solicita al final. No se reconstruye el escenario por fotograma.

La construcción está en el `try/catch` de `iniciar`. Los callbacks de animación y eventos se ejecutan después, fuera de ese `try`; los errores de esas llamadas no son capturados por el bloque inicial. No se agregó un sistema nuevo de recuperación de errores.

## 3. Matemática del movimiento

### Ejes y dirección frontal

X es el eje horizontal del ancho del mapa, Y es la altura y Z es la profundidad. El frente de la geometría del auto está en su **-Z local**, donde se ubican los faroles delanteros. Su vector frontal local es `(0,0,-1)`. El giro se aplica con `auto.rotation.y`, en radianes, conservando Y = 0.04 para la posición del grupo.

Para un ángulo θ alrededor de Y, la rotación transforma un vector local mediante:

```text
x mundial = cos(θ) · x local + sin(θ) · z local
y mundial = y local
z mundial = -sin(θ) · x local + cos(θ) · z local
```

Aplicada a `(0,0,-1)`, resulta `(-sin(θ), 0, -cos(θ))`. Esa es exactamente la instrucción:

```js
const angulo = auto.rotation.y;
direccionFrontal.set(-Math.sin(angulo), 0, -Math.cos(angulo));
```

Estas fórmulas transforman una **dirección**, por eso no suman la posición del vehículo. Para convertir un **punto** local a mundial hay que aplicar además la traslación del auto; eso es lo que hace `localToWorld` con las posiciones de cámara y objetivo en la sección 4. Trasladar el auto cambia dónde está, pero no hacia dónde apunta; rotarlo cambia ambas direcciones relativas, la del avance y la de sus faros.

La longitud del vector es 1 porque `sin²(θ)+cos²(θ)=1`. No hay que normalizarlo. El cálculo supone la implementación actual: auto sin un padre rotado, sin inclinación X/Z y sin escala. Si más adelante se agregaran inclinaciones o transformaciones de un padre, habría que revisar esta fórmula o transformar un vector local usando la orientación completa.

| Ángulo | Frente mundial | Resultado al avanzar |
| --- | --- | --- |
| 0 | (0,0,-1) | Disminuye Z |
| π/2 | (-1,0,0) | Disminuye X |
| π | (0,0,1) | Aumenta Z |
| -π/2 | (1,0,0) | Aumenta X |

### Convertir teclas a órdenes

```js
const avance = Number(teclas.has('KeyW') || teclas.has('ArrowUp')) -
  Number(teclas.has('KeyS') || teclas.has('ArrowDown'));
const giro = Number(teclas.has('KeyA') || teclas.has('ArrowLeft')) -
  Number(teclas.has('KeyD') || teclas.has('ArrowRight'));
```

`has` devuelve un booleano; `||` acepta cualquiera de dos alias y `Number` convierte verdadero a 1 y falso a 0. `avance` vale +1, 0 o -1; `giro` vale +1 para izquierda, -1 para derecha y 0 para ninguna o ambas. Dos alias de la misma acción no suman dos unidades. Las órdenes opuestas se cancelan.

### Rotación y marcha atrás

```js
auto.rotation.y += giro * avance * CONDUCCION.velocidadGiro * deltaTime;
```

La fórmula es `θ nueva = θ anterior + g · a · ω · Δt`. Donde g es dirección, a es marcha, ω es velocidad angular y Δt son segundos. Con W+A, a=1 y g=1: aumenta θ, el frente gira hacia -X desde la orientación inicial. Con S+A, a=-1: disminuye θ. Esto representa de forma sencilla la inversión del giro de la carrocería al retroceder con la misma dirección.

Si solo se pulsa A o D, a=0 y no se gira en el lugar. Tampoco gira si W y S se cancelan. No se calculan ángulos de las ruedas, radio de un modelo de bicicleta ni dinámica real. Al tocar el borde, la orden de marcha aún puede generar giro aunque la restricción impida trasladarse más en ese eje.

### Traslación

```js
auto.position.addScaledVector(direccionFrontal, avance * CONDUCCION.velocidad * deltaTime);
```

Equivale a `p nueva = p anterior + d · a · v · Δt`, con d el frente unitario. Se calcula **después del giro** para que el desplazamiento use la nueva orientación. Con θ=0, v=12 y Δt=1/60, W desplaza -0.2 en Z por fotograma; 60 fotogramas suman -12. S usa a=-1 y desplaza +0.2. El componente Y de d es cero y por eso no altera la altura.

El auto se mueve hacia donde apunta porque geometría y vector frontal usan el mismo ángulo y la misma convención -Z. Para marcha atrás el vector sigue indicando el frente, pero la distancia multiplicadora es negativa.

### Tiempo y límites de precisión

`requestAnimationFrame` entrega una marca temporal en milisegundos. Se resta la anterior y se divide por 1000. A 30 FPS, Δt≈0.0333 y se recorren 0.4 unidades por fotograma; a 120 FPS, Δt≈0.00833 y se recorren 0.1. En ambos casos son 12 unidades por segundo en línea recta.

Se limita Δt a 0.05 segundos para que una pausa grande no cause un salto. Esto implica una decisión consciente: por debajo de 20 FPS o con pausas largas se simula menos tiempo que el real. No se recupera el tiempo perdido con pasos adicionales. En los giros, la integración discreta también produce pequeñas diferencias de trayectoria según FPS, aunque la velocidad angular por segundo y el avance nominal sean constantes. No es una solución analítica de una curva continua.

### Restricción exterior

```js
auto.position.x = THREE.MathUtils.clamp(auto.position.x, -CONDUCCION.limiteX, CONDUCCION.limiteX);
auto.position.z = THREE.MathUtils.clamp(auto.position.z, -CONDUCCION.limiteZ, CONDUCCION.limiteZ);
```

`clamp(valor,min,max)` devuelve el valor si está dentro y el extremo más cercano si sale. Con límites 51 y 40 se deja margen dentro del terreno 110 × 88 y sus bordes. La carrocería tiene una extensión horizontal máxima aproximada inferior a 2.8 desde su centro al rotar. Los límites elegidos dejan ese margen respecto de los bordes interiores del escenario.

Esto no detecta choques: no rebota, no frena mediante física ni examina edificios. En diagonal puede deslizarse por el límite porque cada componente se restringe por separado. La cámara puede quedar fuera del terreno; la restricción solo corresponde al auto.

## 4. Cámara seguidora

`configurarCamara()` conserva `PerspectiveCamera(58, aspect, 0.1, 200)`: campo visual vertical de 58°, proporción de ventana y planos de recorte. Ya no queda fija ni usa el desplazamiento lateral 6.1 de V1; se centra detrás del vehículo.

```js
auto.updateMatrixWorld(true);
posicionCamaraDeseada.set(0, CAMARA.altura, CAMARA.distancia);
auto.localToWorld(posicionCamaraDeseada);
objetivoCamara.set(0, 1, 0);
auto.localToWorld(objetivoCamara);
```

`position` y `rotation` son propiedades de transformación. Para usarlas en conversiones mundiales se actualiza explícitamente `matrixWorld`; así el cálculo no depende de que un render anterior la haya actualizado. El argumento `true` fuerza la actualización también hacia descendientes, incluidos los faros.

Los vectores se restablecen primero en coordenadas locales y luego `localToWorld` modifica cada uno convirtiéndolo a coordenadas mundiales. Si no se restablecieran, se volvería a transformar un resultado ya mundial y se acumularían desplazamientos incorrectos.

La cámara desea estar en `(0,8.8,14)` respecto del auto. +Z local es detrás porque el frente es -Z. Al girar el vehículo, el desplazamiento se gira con él. Inicialmente la cámara queda en `(-13,8.84,25)`. El objetivo `(0,1,0)` es un punto cerca del centro del vehículo; inicialmente `(-13,1.04,11)`.

### Interpolación suave

```js
const factor = 1 - Math.exp(-CAMARA.suavidad * deltaTime);
if (inmediata) camara.position.copy(posicionCamaraDeseada);
else camara.position.lerp(posicionCamaraDeseada, factor);
camara.lookAt(objetivoCamara);
```

`lerp` modifica la posición siguiendo `c nueva = c anterior + α · (destino - c anterior)`. α=0 conserva la posición; α=1 llega directamente al destino. Aquí α depende del tiempo: `1-e^(-8Δt)`. A 60 FPS vale aproximadamente 0.125; a 30 FPS, 0.234. Para un destino inmóvil, el error restante tras un tiempo t es proporcional a `e^(-8t)`, independientemente de cómo se divida ese tiempo en fotogramas sin recorte. Un α constante por fotograma haría el seguimiento más rápido en pantallas con más FPS.

La posición se suaviza; `lookAt` orienta directamente hacia el objetivo actual, que se mueve de forma continua. No se interpola por separado la rotación de la cámara. Esto mantiene el auto cerca del centro de la imagen mientras la cámara alcanza su ubicación posterior. La cámara no es hija del auto: se conserva independiente para poder interpolar su posición mundial.

La altura, distancia y campo visual dejan espacio para el vehículo completo con los valores predeterminados. Al girar rápidamente, la cámara tarda un poco en colocarse exactamente detrás; esa demora es el suavizado. No hay garantía de visibilidad a través de obstáculos: edificios, árboles o paredes pueden taparlo, porque no se implementaron colisiones ni correcciones por oclusión de cámara. Tampoco se garantiza el encuadre con parámetros arbitrarios o proporciones de ventana extremas; se incluye una revisión manual de tamaños de ventana.

## 5. Contrato de cada función nueva o modificada

Todas se ubican en `desarrollo/src/escena.js` y no retornan un resultado explícito: producen efectos sobre el estado o registran callbacks.

### `configurarCamara()` — modificada

La llama `iniciar()` una sola vez después de crear el auto y sus faros. No recibe parámetros. Asigna `camara` con la perspectiva y llama a `actualizarCamara(0,true)`. El resultado es una cámara ya situada y orientada antes del primer render. Si se omitiera, el seguimiento no tendría una cámara válida.

### `actualizarCamara(deltaTime, inmediata)` — nueva

La llama `configurarCamara` con colocación inmediata y `animar` cada fotograma con `false`. `deltaTime` son segundos; `inmediata` decide entre copiar el destino o interpolar. Usa `auto`, `camara`, `CAMARA` y los dos vectores auxiliares. Actualiza matrices, calcula destino y objetivo mundiales, modifica posición y orientación de la cámara. Depende de la existencia del auto y la cámara. Si se elimina del bucle, queda una vista fija aunque el vehículo continúe moviéndose.

### `alPresionarTecla(evento)` — nueva

La llama el navegador por `keydown`, una vez registrada. Recibe un `KeyboardEvent`. Consulta `teclasConduccion`; si no reconoce `evento.code`, retorna sin impedir el comportamiento de esa tecla. Si lo reconoce, llama a `preventDefault()` y `teclas.add`. No calcula desplazamientos: cambia el estado que leerá `actualizarMovimiento`. Sin ella no se activan órdenes de conducción.

### `alSoltarTecla(evento)` — nueva

La llama el navegador por `keyup`. Filtra el mismo conjunto de códigos, previene su acción predeterminada y ejecuta `teclas.delete(evento.code)`. Si se quitara, una tecla podría quedar activa indefinidamente hasta perder foco. Eliminar una tecla no borra otras, por lo que admite combinaciones.

### `reiniciarEntrada()` — nueva

Sin parámetros utilizados. La invocan `blur` de ventana y `visibilitychange` del documento. Ejecuta `teclas.clear()` y asigna `tiempoAnterior = null`. No cambia posición, rotación ni cámara. El primer fotograma posterior usa tiempo cero y no recupera la pausa. Se ejecuta en ambos cambios de visibilidad, sin una condición `document.hidden`, para reiniciar el estado al salir y volver.

### `configurarControles()` — nueva

Sin parámetros. `iniciar()` la llama una vez luego de configurar la cámara. Registra los cuatro manejadores usando `addEventListener`. Separa conexión de eventos y lógica de respuesta. No crea otro bucle ni necesita controles visuales. Sin esta llamada las funciones estarían definidas pero no recibirían eventos del navegador.

### `actualizarMovimiento(deltaTime)` — nueva

La llama `animar` antes de la cámara. Recibe segundos; lee `teclas` y `CONDUCCION`, calcula `avance`, `giro` y `angulo`, modifica `auto.rotation.y`, actualiza `direccionFrontal`, modifica `auto.position` y restringe X/Z. No toca faros, ruedas individuales ni escenario. La herencia del grupo mueve esas piezas junto al vehículo. Sin esta función el teclado actualizaría el conjunto, pero el auto quedaría inmóvil.

### `animar(tiempoActual)` — modificada

La invoca el navegador mediante `requestAnimationFrame`; recibe su marca temporal en milisegundos. Usa y actualiza `tiempoAnterior`, calcula la variable local `deltaTime`, llama a movimiento, cámara, render y finalmente solicita otro callback. El primer frame también se solicita por RAF; no se llama `animar()` sin argumento desde `iniciar`, porque faltaría una marca temporal válida. Quitar la nueva solicitud produce un único fotograma; quitar el render actualiza el estado sin mostrarlo.

### `iniciar()` — modificada

Sin parámetros. La llama la expresión final de la función autoejecutable. Conserva todas las funciones constructoras en su orden anterior; añade `configurarControles()` y reemplaza la llamada directa a `animar()` por `requestAnimationFrame(animar)`. Mantiene el registro de `resize` y el manejo de errores de inicio. No debe invocarse varias veces: no existe una limpieza previa para reconstruir renderizadores y escenas ni detener bucles anteriores.

## 6. Faros, alumbrado y sombras durante el movimiento

`crearFaros()` se conserva literalmente. Cada luz se agrega mediante `auto.add(luz)` y cada objetivo mediante `auto.add(luz.target)`. Por eso ambos reciben la misma transformación del vehículo. La dirección mundial es la diferencia entre objetivo y fuente mundiales, y gira con el auto sin asignaciones nuevas por foco.

En coordenadas locales, la fuente está en `(±0.77,1,-2.38)` y el objetivo en `(±0.77,0.2,-20)`: dirección `(0,-0.8,-17.62)`. Al girar, esa dirección se rota junto con el grupo; al trasladar, ambas posiciones suman la misma traslación, que se cancela al restarlas. Esto explica por qué la luz siempre apunta hacia el frente del auto con la inclinación original.

Se mantiene `luz.castShadow = true`, mapa 512×512, `near = 0.5`, `far = 35` y `bias = -0.0002`. El renderizador conserva sombras activadas con `PCFShadowMap`. Las mallas que proyectaban o recibían sombras siguen con sus mismas banderas; el render actualiza las sombras a partir de las transformaciones actuales. Las pruebas lógicas comprueban configuración y dirección, no la imagen final de la sombra.

Las siete `PointLight` públicas no son hijas del auto: permanecen en sus postes, intensidad 23, alcance 18 y decaimiento 2. No se habilitan sombras públicas ni se alteran las intensidades 85 de los faros, 0.50 de la hemisférica o 0.37 de la luna. Las piezas visuales brillantes siguen siendo distintas de las fuentes luminosas.

## 7. Ejemplos de modificaciones y consecuencias

| Cambio en el código | Resultado y relación con lo demás |
| --- | --- |
| `CONDUCCION.velocidad: 12` → `18` | Recorre 18 unidades por segundo; no cambia velocidad angular. Para el mismo giro por segundo describe una curva más amplia y exige más respuesta de cámara |
| Velocidad 12 → 6 | Recorre la mitad; giro angular igual, curva más cerrada |
| `velocidadGiro: 1.6` → `2.4` | Cambia orientación más rápido; curva más cerrada a igual velocidad y mayor retraso aparente de cámara |
| Velocidad de giro → 0.8 | Giros más lentos y amplios; tarda más en completar media vuelta |
| `CAMARA.distancia: 14` → `20` | Destino más alejado detrás; auto más pequeño y más escenario visible; mayor probabilidad de interponer edificios |
| Distancia → 8 | Vista más cercana; menor margen para ver el auto completo, especialmente al girar |
| `CAMARA.altura: 8.8` → `12` | Vista más elevada e inclinada hacia abajo porque mira al mismo centro |
| `CAMARA.suavidad: 8` → `12` | Sigue más rápidamente: el nombre indica suavizado, pero un número mayor reduce la demora |
| Suavidad → 3 | Mayor demora y sensación flotante; puede perder el encuadre si además se aumenta mucho la velocidad |
| Suavidad → 0 | Factor cero: la posición queda fija después del inicio, aunque `lookAt` siga apuntando al auto |
| Límites 51/40 mayores | El centro puede acercarse demasiado a los bordes o salir del terreno; revisar tamaño del vehículo |

**Cambiar el frente del automóvil:** sustituir el vector por `(sinθ,0,cosθ)` corresponde a +Z local. Si solo se cambia la fórmula, W moverá el modelo hacia su parte trasera. Para cambiar la convención completa habría que revisar geometría/faroles, objetivos y posición local posterior de cámara. No es una preferencia aislada de una línea.

**Eliminar `deltaTime`:** si se usa solo `avance * velocidad`, se avanzan 12 unidades por fotograma, no por segundo: a 60 FPS serían 720 por segundo antes de limitar posición. Quitar Δt solo del giro crea una velocidad angular dependiente de FPS aunque la traslación esté bien. Las unidades físicas sirven para detectar ese error.

**Dejar de actualizar la cámara:** si se elimina `actualizarCamara` de `animar`, conserva posición y orientación iniciales y el auto termina saliendo de la vista. Si se deja únicamente `lookAt`, lo sigue con la mirada pero no con la distancia.

**Quitar `updateMatrixWorld(true)`:** se perdería la actualización explícita antes de las conversiones. La implementación de Three.js puede actualizar matrices en ciertas operaciones, pero no conviene basar la coherencia del código en una actualización incidental; la llamada expresa la dependencia después del movimiento y mantiene también actualizados los descendientes.

**Mover directamente el auto grandes distancias:** la cámara interpolará desde su ubicación anterior. V2 no incluye teletransporte ni reinicio interactivo; si se añadieran, se debería decidir si llamar a `actualizarCamara(0,true)` para recolocarla sin atravesar el mapa lentamente.

## 8. Preguntas para defensa oral

**¿Por qué no se mueve dentro de `keydown`?** La frecuencia de esos eventos depende de la repetición del teclado. Guardar estado permite usar el tiempo real entre fotogramas y combinar varias teclas sin depender de esa repetición.

**¿Qué hace W+A durante un segundo?** Los eventos agregan ambos códigos. Cada frame `avance=1`, `giro=1`, incrementa el ángulo en `1.6Δt`, calcula el nuevo frente, recorre `12Δt`, limita posición y actualiza la cámara antes del render. La suma nominal del giro es 1.6 radianes en ese segundo.

**¿Por qué S+A gira la carrocería en sentido contrario?** El factor `avance=-1` invierte el cambio angular. La misma orden de dirección produce la respuesta opuesta al circular marcha atrás. Es una regla simple, no una simulación completa de neumáticos.

**¿Puede girar quieto?** No con solo A/D. La fórmula multiplica por `avance`. Es una decisión de control documentada; para permitir giro independiente se podría quitar ese factor, pero entonces habría que decidir cómo representar la dirección al retroceder.

**¿Cómo se impide que una tecla quede pegada?** `keyup` elimina su código. Además, `blur` y `visibilitychange` limpian el conjunto y reinician el reloj en caso de que se pierda el evento al cambiar de ventana.

**¿Por qué los signos negativos en seno y coseno?** Porque el frente local es -Z. Rotar `(0,0,-1)` alrededor de Y produce `(-sinθ,0,-cosθ)`. Con θ=0, el avance debe disminuir Z, donde están los faros delanteros.

**¿Por qué delta se divide por 1000?** RAF entrega milisegundos y las velocidades están en unidades o radianes por segundo. Dividir convierte el intervalo a segundos y hace coherente el producto velocidad por tiempo.

**¿Es totalmente independiente de FPS?** En condiciones normales, avance recto y cambio angular usan tiempo. Los giros se integran por pasos y pueden variar ligeramente; además, el recorte de 0.05 prioriza evitar saltos sobre recuperar todo el tiempo después de una pausa.

**¿Por qué la cámara usa coordenadas locales?** «Detrás del auto» depende de su orientación. Un desplazamiento fijo mundial no giraría con él. `localToWorld` convierte el desplazamiento relativo al vehículo en un destino mundial coherente.

**¿Qué aporta `lerp`?** Recorre una fracción de la distancia restante a la posición deseada. Con factor exponencial basado en tiempo se obtiene un seguimiento gradual cuya rapidez no depende directamente del número de frames.

**¿Cómo se mantiene el vehículo encuadrado?** La cámara conserva una distancia y altura relativas adecuadas y mira al centro actual. Su posición se suaviza sin retrasar también el objetivo. Eso cuida el encuadre, pero no resuelve obstáculos opacos entre ambos.

**¿Se actualiza cada faro con una fórmula independiente?** No. Fuente y objetivo son hijos del auto y heredan su transformación. Mantener ambos en el mismo grupo conserva dirección relativa y posición al trasladar o girar.

**¿Por qué no hay que ejecutar un servidor?** Se siguen cargando scripts clásicos mediante rutas relativas, sin import/export, fetch ni recursos de modelos externos. La biblioteca necesaria está dentro de `vendor`. Node solo sirve para las pruebas del autor.

**¿Qué diferencia hay entre clamp y colisión?** Clamp limita coordenadas a un intervalo numérico. No conoce las formas de edificios, no calcula contactos ni impulsos y no impide atravesar objetos dentro del rectángulo.

## 9. Validación y alcance de las pruebas

Ejecutar desde la raíz organizadora:

```text
node --check desarrollo/src/escena.js
node desarrollo/pruebas/movimiento.test.cjs
```

La prueba carga la biblioteca local real en un contexto aislado, reemplaza DOM y `WebGLRenderer` por simulaciones, entrega eventos y marcas temporales y observa los objetos creados por el programa sin exponer variables privadas de producción.

Comprueba avance a 30/60/120 FPS, detenerse al soltar, giros izquierda/derecha en ambas marchas, ausencia de giro quieto, alias, repetición de tecla, órdenes opuestas, prevención de comportamiento predeterminado, limpieza por foco/visibilidad, pausas largas, cuatro límites, encuadre de las esquinas de la carrocería en un giro continuo, convergencia de cámara, proporción al redimensionar, orientación de los dos faros y configuración del alumbrado público. También comprueba rutas locales y biblioteca idéntica a V1.

Resultado de la ejecución durante la implementación: sintaxis correcta y prueba lógica aprobada. Los siete archivos del respaldo V1 se compararon mediante SHA-256 antes y después, sin diferencias. La revisión de cambios Git se hace solo en lectura; no se crean commits, push ni etiquetas.

**Validación personal para el cierre:** el autor confirmó que el movimiento del vehículo y la cámara en tercera persona funcionan correctamente. Esta confirmación habilita el cierre de V2; no se atribuyen al autor comprobaciones específicas adicionales que no haya comunicado. La lista de la guía práctica queda disponible para repetir la revisión en otros equipos.

**Verificación del respaldo:** se comparan todos sus archivos con `desarrollo` mediante SHA-256 y se comprueba que los scripts relativos del HTML apunten a archivos dentro de la propia copia. No se cambia el código ni la configuración visual durante el cierre. El HTML conserva el texto «en desarrollo» de la implementación probada; el estado oficial de cierre se registra aquí y en el historial, sin alterar esa copia del HTML.

Las pruebas lógicas no prueban píxeles, rendimiento de GPU ni oclusión por edificios. El script de pruebas está pensado para ejecutarse desde `desarrollo` dentro del repositorio: su comparación de biblioteca utiliza también la ruta del respaldo V1. Esa referencia pertenece únicamente a la prueba del autor, no al HTML ni a la aplicación; no es necesaria para abrir el respaldo V2 de forma independiente. El README y los documentos V1 se conservan como antecedentes; para el uso actual corresponde `GUIA_VERSION_2.md`.
