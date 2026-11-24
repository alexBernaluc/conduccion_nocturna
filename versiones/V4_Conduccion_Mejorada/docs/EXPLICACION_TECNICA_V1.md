# Explicación técnica de V1 — Conducción Nocturna

Informática 3. Documento basado en el código conservado el 13/11/2026. La V1 es un escenario fijo: no hay conducción, entrada de teclado, controles de luces, colisiones ni lomada. Los ejemplos de cambios de este documento son ejercicios propuestos para `desarrollo`; no están implementados.

## 1. Archivos, dependencias y organización

La aplicación de cada copia tiene esta estructura:

```text
index.html
src/escena.js
vendor/three.min.js
vendor/LEEME.txt
PREPARAR_OFFLINE.bat
README.md
docs/GUIA_VERSION_1.md
```

- `index.html`: entrada. Define el HTML, el CSS interno, el contenedor `#app`, los textos superpuestos y los elementos `#error` y `#mensaje-error`. Carga la biblioteca y luego el programa.
- `src/escena.js`: todo el código propio de construcción, iluminación, cámara y renderizado. Necesita el objeto global `THREE` y los elementos HTML anteriores.
- `vendor/three.min.js`: biblioteca externa Three.js r158 (0.158.0), minificada. Proporciona clases como `Scene`, `Mesh` y `SpotLight`. No es código propio ni debe editarse para modificar el escenario.
- `vendor/LEEME.txt`: instrucciones originales para preparar la biblioteca local. El archivo de la biblioteca ya está incluido.
- `PREPARAR_OFFLINE.bat`: ayuda de preparación para el autor. Se sitúa en su propia carpeta con `cd /d "%~dp0"`; si existe la biblioteca termina sin descargarla. Si falta, intenta descargarla desde cdnjs. No forma parte de la ejecución normal del juego.
- `README.md`: presentación, apertura, estructura original, licencias y propuesta de etapas. V2–V5 son planes, no funcionalidades terminadas.
- `docs/GUIA_VERSION_1.md`: guía original breve, conservada sin cambios.
- `docs/EXPLICACION_TECNICA_V1.md`: esta explicación ampliada, complementaria a la guía.

En la carpeta organizadora, `versiones/V1_Escenario_Fijo` conserva una copia completa de los archivos originales, sin agregarle esta documentación posterior. `desarrollo` contiene otra copia independiente y es el único lugar donde se modificará la aplicación. Los archivos originales de la raíz también se conservaron. El historial está en `HISTORIAL_VERSIONES.md`; las instrucciones de trabajo, en `ORGANIZACION_PROYECTO.md`.

HTML define la página; JavaScript construye los objetos; Three.js convierte esa descripción en trabajo de WebGL para dibujar en un `canvas`. No hay modelos, texturas, mapas ni hojas CSS externos: las formas se generan mediante primitivas. No hay `import`, `export`, `fetch` ni compilación.

## 2. Orden exacto desde la apertura hasta el primer fotograma

1. El navegador lee `index.html`, interpreta los metadatos y el CSS y crea los elementos del `body`, incluido `#app`. Los scripts están después de esos elementos, por lo que ya pueden encontrarlos.
2. Ejecuta el script clásico `./vendor/three.min.js`. No usa `async` ni `defer`: el orden de estos scripts se conserva. La biblioteca publica `window.THREE`.
3. El script en línea comprueba `typeof window.THREE === 'undefined'`. Solo si falta, usa `document.write` para insertar la versión 0.158.0 de cdnjs. Con la biblioteca local válida no necesita esa conexión. El fallback no hace que una copia sin biblioteca funcione offline.
4. Carga y ejecuta `./src/escena.js`. La expresión `(function () { ... })();` invoca inmediatamente una función anónima. `'use strict'` activa el modo estricto y el ámbito de la función evita exponer `escena`, `auto`, etc. como variables globales.
5. Comprueba `typeof THREE`. Si no existe, llama a `mostrarError(mensaje)` y hace `return`; no llega a crear el renderizador. **No existe una función `verificarBiblioteca()`**: ese nombre solo aparece en el comentario inicial.
6. Crea el objeto constante `AJUSTES`, las referencias `escena`, `camara`, `renderer`, `auto`, y los arrays vacíos `faros` y `lamparas`. Declarar las funciones no construye todavía sus objetos.
7. La llamada final `iniciar()` entra en un `try` y ejecuta `inicializarRenderer()`: obtiene `#app`, crea primero el `WebGLRenderer`, configura tamaño, sombras y color, y agrega su `canvas` al HTML.
8. `crearEscena()` crea `escena`, su fondo, `Fog`, `HemisphereLight` y `DirectionalLight`. Por tanto, las luces ambientales se crean antes del terreno y del vehículo.
9. `crearTerreno()` agrega suelo y cuatro bordes usando `caja()`.
10. `crearCalles()` agrega cuatro calzadas paralelas a Z, tres paralelas a X y sus marcas discontinuas.
11. `crearManzanas()` recorre cinco posiciones. En cada iteración crea una acera, llama dos veces a `crearEdificio()` y dos a `crearArbol()`: resultan diez edificios y diez árboles.
12. `crearAlumbrado()` recorre siete posiciones y llama siete veces a `crearPoste()`. Cada poste tiene geometría visible y una `PointLight`, guardada también en `lamparas`.
13. `crearVehiculo()` asigna un `THREE.Group` a `auto`, crea la carrocería y accesorios, llama cuatro veces a `agregarVentanaAuto()`, crea cuatro ruedas con cuatro tapacubos y dos faroles delanteros visibles. Finalmente sitúa el grupo en `(-13, 0.04, 11)` y lo agrega a `escena`.
14. `crearFaros()` crea dos luces reales `SpotLight` y dos objetivos. Los agrega a `auto` y guarda las luces en `faros`. Necesita que `auto` ya exista.
15. `configurarCamara()` crea `camara`, transforma dos posiciones locales del auto a coordenadas mundiales, coloca la cámara y ejecuta `lookAt`.
16. `iniciar()` registra `alCambiarTamano` para el evento `resize`. Registrar un callback no lo ejecuta en ese instante.
17. Llama a `animar()`. Esta primera invocación solicita la próxima llamada mediante `requestAnimationFrame(animar)` y dibuja inmediatamente con `renderer.render(escena, camara)`.
18. En cada callback posterior vuelve a programar otro y vuelve a dibujar. No reconstruye edificios ni actualiza posiciones. Al redimensionar se ejecuta además el callback de tamaño.

```js
function animar() {
  requestAnimationFrame(animar);
  renderer.render(escena, camara);
}
```

`requestAnimationFrame` programa una llamada futura; no es una recursión síncrona que acumule llamadas sin fin. Su frecuencia depende del navegador y de la pantalla, no de un valor fijo de FPS en el programa. El primer inicio queda protegido por el `try/catch`; los callbacks posteriores no quedan dentro de ese mismo manejo de errores.

## 3. Estado y relación entre funciones

Todas las funciones propias están en `src/escena.js`, dentro de la función autoejecutable. Salvo `caja`, no devuelven un resultado explícito: su valor de retorno normal es `undefined`. Trabajan principalmente agregando objetos al grafo de escena. Los parámetros omitidos abajo se indican como «ninguno».

`AJUSTES` contiene valores iniciales; `const` impide reasignar la referencia, pero no congela sus propiedades. Los objetos ya construidos no se vuelven a configurar automáticamente al cambiar ese objeto. `escena`, `camara`, `renderer` y `auto` se asignan durante el inicio. `faros` y `lamparas` guardan referencias a las luces; no existe todavía un control que recorra esos arrays para alterar intensidades.

### `mostrarError(mensaje)`

La llaman la comprobación inicial de `THREE` y el `catch` de `iniciar()`. Recibe un texto, lo asigna con `textContent` a `#mensaje-error` y cambia `#error.style.display` a `grid`. Modifica el DOM, no la escena. Necesita esos dos elementos HTML; quitarlos rompe la presentación del error. El `catch` además escribe el detalle real en `console.error`.

### `inicializarRenderer()`

Sin parámetros; `iniciar()` la ejecuta una vez y asigna `renderer`. Crea `WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })`; la preferencia de energía es una sugerencia al navegador. Limita la relación de píxeles a 2 para evitar un costo excesivo en pantallas densas. Usa el ancho y alto de la ventana, habilita `shadowMap`, selecciona `PCFShadowMap`, salida `SRGBColorSpace`, `ACESFilmicToneMapping` y exposición 1.35. Agrega `renderer.domElement` al contenedor. Sin ella no existe ni superficie de dibujo ni renderizador para `animar()`.

### `caja(ancho, alto, largo, color, x, y, z, proyectaSombra, recibeSombra)`

La usan terreno, calles, edificios, árboles, postes, manzanas, vehículo y `agregarVentanaAuto`. Se ejecuta muchas veces durante la construcción. Recibe dimensiones X/Y/Z, color, centro local y dos indicadores de sombras.

```js
const geometria = new THREE.BoxGeometry(ancho, alto, largo);
const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.84 });
const malla = new THREE.Mesh(geometria, material);
malla.position.set(x, y, z);
malla.castShadow = Boolean(proyectaSombra);
malla.receiveShadow = Boolean(recibeSombra);
return malla;
```

Devuelve la malla pero **no la agrega** a la escena: lo hace quien la llama con `escena.add` o `grupo.add`. `Boolean` convierte cada indicador a verdadero/falso. Modificar esta utilidad afecta gran parte de los objetos del proyecto; eliminarla impide construirlos. Cada llamada crea su propia geometría y material.

### `crearEscena()`

Sin parámetros; la llama `iniciar()` una vez después del renderizador. Asigna `escena = new THREE.Scene()`, crea fondo y niebla del color `AJUSTES.colorCielo`, y agrega las luces base. `Fog(color, 55, 130)` mezcla gradualmente el color de los objetos con el de la niebla según la profundidad; no crea humo volumétrico. La luz hemisférica usa colores superior `0x9cb8e4` e inferior `0x344126`; la direccional `luna` usa `0x8ba5df`, intensidad 0.37 y posición `(-24,35,14)`. Sin esta función, las siguientes llamadas a `escena.add` fallan.

### `crearTerreno()`

Sin parámetros; llamada una vez por `iniciar()`. Depende de `escena` y `caja`. Agrega suelo de 110 × 0.3 × 88, con centro `(0,-0.17,0)`, y cuatro bordes. El suelo llega hasta Y = -0.02, porque la caja se extiende la mitad de su altura por encima del centro. No guarda una variable de terreno reutilizable fuera de su función. Al quitarla desaparecen base y límites visibles, pero no las calles. Esos bordes no implementan colisiones.

### `crearCalles()`

Sin parámetros; llamada una vez por `iniciar()`. Usa `AJUSTES.anchoCalle`, `escena` y `caja`. `verticales = [-39,-13,13,39]` fija las posiciones X; `horizontales = [-26,0,26]` fija las posiciones Z. «Vertical» describe el plano del mapa, no el eje Y. Los callbacks `forEach` agregan las calzadas y los `for` agregan nueve marcas por vía paralela a Z y doce por vía paralela a X: 72 marcas en total. Las pequeñas diferencias de altura separan asfalto y pintura para reducir superposición visual. Quitarlas deja el resto del escenario, sin calzadas ni señalización. No hay red vial ni lógica de tránsito.

### `crearEdificio(posX, posZ, ancho, largo, alto, color, indice)`

La llama `crearManzanas()` diez veces. Los parámetros definen posición horizontal, dimensiones, color y patrón de ventanas. Crea `grupo` en `(posX,0.2,posZ)`, agrega cuerpo con centro Y = `alto/2` y techo en `alto+0.12`, ambos mediante `caja`. Así el cuerpo arranca en la base local y termina a la altura solicitada.

```js
const filas = Math.max(1, Math.floor((alto - 1) / 2.7));
// Dentro de los bucles de filas f y columnas c:
ventana.position.set(c * ancho * 0.22, 1.58 + f * 2.45, -largo / 2 - 0.028);
```

`Math.floor` determina una cantidad entera de filas y `Math.max` exige al menos una. `c` toma -1 y 1: dos columnas. El resto `(indice + f + c + 10) % 3` selecciona entre materiales apagado y prendido; es determinista, no aleatorio ni animado. Ventanas y puerta quedan delante de la cara local -Z para evitar quedar ocultas en el cuerpo. Agrega el grupo directamente a `escena`; no lo devuelve. Depende de `caja` y Three.js. Quitarla elimina edificios; cambiar alturas modifica además filas y sombras. Las ventanas brillantes no iluminan otros objetos.

### `crearArbol(posX, posZ)`

La llama `crearManzanas()` diez veces. Crea un grupo en `(posX,0,posZ)` y agrega dos cajas: tronco de 0.45 × 1.75 × 0.45 a Y = 1.1 y copa de 2.1 × 2.25 × 2.1 a Y = 2.6. Ambas proyectan y reciben sombras. Depende de `caja` y agrega el grupo a `escena`. Quitarla elimina los árboles y su posible oclusión de los faros.

### `crearManzanas()`

Sin parámetros; la llama `iniciar()`. Recorre `posiciones = [[-26,-13],[0,-13],[26,-13],[-26,13],[0,13]]`. Cada `pos` da `x` y `z`, e `i` identifica la manzana. Crea una acera de lado `AJUSTES.anchoManzana`, dos edificios y dos árboles con desplazamientos respecto de ese centro. Los edificios usan alturas `6.5 + (i % 3)*2.0` y `5.6 + ((i+1) % 3)*2.4`; el módulo repite tres variantes. Selecciona colores desde `colores`. Depende de `caja`, `crearEdificio` y `crearArbol`; no crea un grupo único por manzana. Quitarla elimina aceras, edificios y árboles. Cambiar un centro mueve esos elementos asociados, pero no calles ni postes.

### `crearPoste(x, z)` y `crearAlumbrado()`

`crearAlumbrado`, sin parámetros, es llamada una vez por `iniciar`. Su callback llama a `crearPoste(p[0],p[1])` para siete pares: `(-17.6,-3.9)`, `(9.5,-3.9)`, `(35.4,-3.9)`, `(-17.6,22.1)`, `(9.5,22.1)`, `(-35.4,-22.1)` y `(35.4,22.1)`.

`crearPoste` recibe la posición del grupo `poste`. Usa `caja` para soporte y brazo, `SphereGeometry(0.25,12,8)` con `MeshBasicMaterial` para el foco visible, y `PointLight(0xffd6a1, AJUSTES.intensidadAlumbrado, 18, 2)` para iluminar. El foco está en `(1.1,5.95,0)` local y la luz en `(1.1,5.85,0)`. Guarda `luz` en `lamparas` y agrega `poste` a `escena`. Eliminar `crearAlumbrado` quita todo el alumbrado público; quitar solo la `PointLight` deja un foco visible que no ilumina el suelo. Ninguna de estas luces tiene sombras activadas.

### `agregarVentanaAuto(grupo, ancho, alto, profundo, x, y, z)`

La llama cuatro veces `crearVehiculo`. Recibe el grupo destino y las dimensiones/posición locales del vidrio. Llama a `caja` con color `0x6388a0` y sombras desactivadas y agrega el resultado al grupo. No utiliza transparencia: es una superficie opaca de color azulado y material estándar. Quitarla elimina parabrisas, luneta y dos ventanas laterales.

### `crearVehiculo()`

Sin parámetros; llamada una vez por `iniciar`. Asigna `auto = new THREE.Group()` y `auto.name = 'autoRetro'`. Depende de `caja` y `agregarVentanaAuto`. Agrega cuerpo, cabina y dos paragolpes, cuatro ventanas, cuatro ruedas y sus tapas, dos faroles visuales y dos piezas traseras rojas. Los bucles anidados combinan X = ±1.17 y Z = ±1.45 para ubicar las cuatro ruedas.

```js
const rueda = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.25, 16), goma);
rueda.rotation.z = Math.PI / 2;
rueda.position.set(x, 0.47, z);
rueda.castShadow = true;
```

Un cilindro se crea con eje longitudinal Y; rotarlo 90° sobre Z alinea el eje con X. No es una animación de rodadura. `goma` y `tapacubo` se comparten entre ruedas y tapas respectivamente. Los faroles visibles comparten `vidrioFaro`, un material básico. La función coloca todo el auto en `(-13,0.04,11)`, deja `rotation.y = 0` y lo agrega a `escena`. El frente es -Z local. Si se elimina, fallan después `crearFaros` y `configurarCamara`, que necesitan `auto`.

### `crearFaros()`

Sin parámetros; llamada una vez por `iniciar`, después del vehículo. Recorre X = -0.77 y 0.77, crea cada `luz`, configura sus sombras y agrega tanto la luz como `luz.target` a `auto`. Finalmente hace `faros.push(luz)`. No usa los faroles visibles como fuente luminosa: estos y las luces son objetos distintos. Sin esta función quedan las piezas amarillas delanteras, pero desaparece su iluminación real y las sombras de los focos. La sección 5 detalla sus valores y dirección.

### `configurarCamara()`

Sin parámetros; llamada una vez por `iniciar`. Asigna una cámara de perspectiva, usa `auto.localToWorld` para convertir `detras` y `frente`, copia la posición y orienta con `lookAt`. No agrega la cámara a `auto` y no se ejecuta en cada fotograma: la cámara de V1 queda fija. Quitarla deja `camara` sin asignar y no se puede renderizar correctamente. Sus cálculos se explican en la sección 4.

### `animar()`, `alCambiarTamano()` e `iniciar()`

Las tres carecen de parámetros. `animar` usa `renderer`, `escena` y `camara`; la llama primero `iniciar` y luego el navegador. No cambia ninguna transformación. Si se elimina su llamada inicial no se dibuja; si se elimina solo `requestAnimationFrame`, se dibuja una única vez.

`alCambiarTamano` es el callback del evento `resize`. Si faltan `renderer` o `camara`, retorna. Actualiza `camara.aspect`, llama a `camara.updateProjectionMatrix()` y a `renderer.setSize`. No vuelve a calcular la posición de la cámara ni la relación de píxeles. Sin la matriz actualizada, la proyección conservaría la proporción anterior; sin el manejador la imagen no se adaptaría correctamente a la ventana.

`iniciar` es el coordinador llamado al final de la función autoejecutable. Invoca las funciones en el orden de la sección 2 y maneja errores síncronos con `try/catch`, `console.error` y `mostrarError`. No debe llamarse repetidamente para actualizar parámetros: construiría otra vez objetos y renderizadores y arrancaría otros bucles. No existe una rutina de limpieza o reinicio.

## 4. Conceptos 3D aplicados

### Scene, Mesh, geometría y material

`escena` es la raíz del grafo que contiene mallas, grupos y luces. Una geometría describe la forma; un material determina su apariencia; `Mesh` los combina. `caja` usa `BoxGeometry`; las ruedas, `CylinderGeometry`; los focos de postes, `SphereGeometry`. No son modelos importados.

`MeshStandardMaterial` responde a las luces; `roughness` controla la rugosidad y `metalness` el carácter metálico. En las tapas, `metalness: 0.2` y `roughness: 0.5` dan una respuesta diferente de la goma, cuya rugosidad es 1. `MeshBasicMaterial` no necesita luces para mostrar su color; no emite iluminación física hacia objetos vecinos. No hay bloom que cree resplandor alrededor de estas piezas.

### Coordenadas y transformaciones

X representa el ancho horizontal del mapa, Y la altura y Z la profundidad. Las unidades son unidades de escena: el código no define una conversión formal a metros. `position` sitúa el centro de una geometría con respecto a su padre. `rotation` usa radianes; π/2 equivale a 90°. `scale` conserva su valor predeterminado `(1,1,1)` en todos los objetos: no se modifica explícitamente en V1. Las dimensiones se definen en los constructores de geometrías.

Los grupos `auto`, `poste` y los grupos de árboles/edificios permiten que los hijos hereden la transformación del padre. La transformación local se combina con la de sus antecesores para obtener coordenadas mundiales. Sin rotación ni escala, la posición mundial es una suma: la luz de un poste situado en `(x,0,z)` termina en `(x+1.1,5.85,z)`.

### Cámara y perspectiva

```js
camara = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 200);
const detras = auto.localToWorld(new THREE.Vector3(6.1, 8.8, 14.0));
const frente = auto.localToWorld(new THREE.Vector3(0, 1.0, -5.0));
camara.position.copy(detras);
camara.lookAt(frente);
```

Los argumentos son campo visual vertical en grados, proporción ancho/alto y planos de recorte cercano/lejano. Con el auto actual sin rotación, `detras` se convierte en `(-6.9,8.84,25)` y `frente` en `(-13,1.04,6)`. La cámara está detrás porque el auto mira hacia -Z; se desplaza también a un lado con X local = 6.1. `lookAt` calcula su orientación hacia el punto `frente`, no hacia el centro del auto.

`localToWorld` transforma el vector suministrado usando la transformación mundial del auto. Esto permitiría calcular el encuadre para otra orientación inicial, pero no implementa seguimiento continuo. El renderizador toma la escena y esa cámara, calcula la proyección en perspectiva y dibuja en el canvas; no mueve el auto por sí mismo.

## 5. Iluminación, faros y sombras

### Fuentes reales y objetos que solo parecen luminosos

| Fuente | Cantidad | Configuración actual | Efecto |
| --- | ---: | --- | --- |
| `HemisphereLight` | 1 | Colores superior/inferior, intensidad 0.50 | Luz base según orientación de las superficies; no proyecta sombras |
| `DirectionalLight` (`luna`) | 1 | Intensidad 0.37, posición (-24,35,14) | Luz direccional sin atenuación por distancia; dirección hacia su objetivo predeterminado en el origen; no se activa `castShadow` |
| `PointLight` en `lamparas` | 7 | Color cálido, intensidad 23, distancia 18, decaimiento 2 | Irradia alrededor del poste; sombras desactivadas |
| `SpotLight` en `faros` | 2 | Intensidad 85, distancia 34, ángulo π/7, penumbra 0.52, decaimiento 1.7 | Conos delanteros con sombras activadas |

No existe `AmbientLight`: `intensidadAmbiente` configura una luz hemisférica. Las luces afectan las superficies con material estándar que alcanzan según su tipo, orientación y distancia; no se selecciona una lista de edificios a iluminar. Ventanas encendidas, esferas de postes y faroles delanteros usan material básico y se ven coloreados independientemente de esas luces.

### Dirección de los faros

```js
const luz = new THREE.SpotLight(0xffefd3, AJUSTES.intensidadFaros, 34,
  Math.PI / 7, 0.52, 1.7);
luz.position.set(x, 1.0, -2.38);
luz.target.position.set(x, 0.20, -20);
auto.add(luz);
auto.add(luz.target);
```

La dirección se determina restando posición de la luz a posición del objetivo, no por la rotación de la pieza visible. En coordenadas locales ese vector es `(0,-0.80,-17.62)`: apunta hacia delante y ligeramente hacia abajo. El centro del cono tiene una inclinación aproximada de `atan(0.8/17.62) ≈ 2.6°` bajo la horizontal; es una deducción de las posiciones, no una variable del programa.

Las posiciones mundiales iniciales de las luces son `(-13±0.77,1.04,8.62)` y sus objetivos `(-13±0.77,0.24,-9)`. El objetivo fija una dirección: no es el punto donde termina obligatoriamente la luz. El alcance lo controla `distance = 34`. El ángulo π/7 es el semiángulo del cono, aproximadamente 25.7°; el cono completo abarca unos 51.4°. `penumbra` suaviza su borde y `decay` determina cómo disminuye su intensidad con la distancia.

Agregar fuente y objetivo al mismo auto hace que ambos hereden sus transformaciones. Si se moviera solo la fuente y se dejara el objetivo fijo en el mundo, la dirección relativa al vehículo cambiaría. V1 prepara esta jerarquía pero no ejecuta movimientos. Tampoco dibuja un haz volumétrico en el aire: se observa la iluminación sobre superficies.

### Cómo aparecen las sombras

Se necesitan tres niveles simultáneos: `renderer.shadowMap.enabled = true`; una luz con `castShadow = true`; y mallas con `castShadow` y/o `receiveShadow` según su papel. El renderizador construye mapas de profundidad desde las luces que proyectan sombras y compara las superficies visibles contra ellos. `PCFShadowMap` filtra esas comparaciones para suavizar los bordes.

En V1 solo los dos focos delanteros generan mapas de sombras. Cada uno usa 512 × 512, cámara de sombras con `near = 0.5`, `far = 35` y `bias = -0.0002`. El intervalo de la cámara de sombras no es el intervalo de recorte de `camara`, ni sustituye al alcance luminoso de 34.

| Objetos | `castShadow` | `receiveShadow` |
| --- | --- | --- |
| Suelo, calzadas y aceras | false | true |
| Bordes, cuerpo/techo de edificios, troncos/copas, soportes/brazos de postes | true | true |
| Cuerpo, cabina y paragolpes del auto | true | true |
| Ruedas | true | false (predeterminado) |
| Marcas viales, puertas, ventanas del auto y piezas traseras rojas | false | false |
| Ventanas de edificios, esferas de focos, faroles delanteros y tapacubos | false (predeterminado) | false (predeterminado) |

Un edificio con `castShadow = true` solo proyecta sombra mediante un faro si está dentro de la región relevante de esa luz. La bandera no garantiza una sombra visible en cualquier ubicación. El alumbrado y la luna no producen sombras: pueden iluminar superficies detrás de obstáculos porque no realizan esa comprobación de oclusión. La luz hemisférica mantiene una iluminación base incluso en zonas sombreadas por faros.

Subir `mapSize` mejora potencialmente el detalle pero consume más memoria y trabajo de GPU. Ajustar `bias` puede reducir puntos o líneas de autosombra; un valor inadecuado puede separar visualmente la sombra de su objeto o generar otros artefactos. Las sombras de 512 pueden mostrar bordes poco detallados. No hay iluminación global, reflejos calculados entre objetos, sombras de contacto dedicadas ni oclusión ambiental. El aspecto final también depende de exposición y mapeo de tonos, no solo de intensidad.

## 6. Parámetros: valores actuales y efectos de los cambios

Los siguientes cambios se harían en `desarrollo/src/escena.js` y se observarían recargando `desarrollo/index.html`. Son valores de construcción; editarlos después de crear los objetos no reconstruye la escena automáticamente.

| Parámetro / ubicación | Valor actual | Al aumentar / disminuir | Relación con otros componentes |
| --- | --- | --- | --- |
| `AJUSTES.anchoManzana` | 18 | Acera más ancha / estrecha | No desplaza edificios, árboles ni calles; puede invadir calzadas o dejar elementos fuera |
| `AJUSTES.separacionEntreManzanas` | 8 | Ningún efecto en V1 | Está declarado pero nunca se lee; los centros están escritos explícitamente |
| `AJUSTES.anchoCalle` | 8 | Calzada más ancha / estrecha | No cambia centros, marcas, postes ni manzanas; puede generar solapamientos |
| `AJUSTES.intensidadAmbiente` | 0.50 | Más / menos iluminación base | Cambia contraste con los faros; no crea sombras |
| `AJUSTES.intensidadAlumbrado` | 23 | Postes más / menos luminosos | No cambia el radio 18 ni activa sombras |
| `AJUSTES.intensidadFaros` | 85 | Faros más / menos luminosos | No cambia cono ni distancia; exposición puede comprimir las altas luces |
| `AJUSTES.colorCielo` | `0x0a1020` | Elegir otro color cambia fondo y niebla | No es una magnitud para «subir/bajar»: sus bytes codifican RGB; no cambia el color de las luces |
| `renderer.toneMappingExposure` | 1.35 | Imagen global más clara / oscura | Afecta la presentación, no las posiciones ni los alcances |
| Límite de `setPixelRatio` | 2 | Más / menos resolución en pantallas densas | Aumenta / reduce costo; no cambia geometría |
| `Fog` near / far | 55 / 130 | Alejar near retrasa niebla; alejar far prolonga transición | Acercarlos invierte esos efectos; mantener far mayor que near |
| Suelo: ancho / largo | 110 / 88 | Base mayor / menor | Bordes, calles y centros tienen medidas independientes |
| `luna.intensity` (constructor) | 0.37 | Más / menos luz direccional | No genera sombras aunque se aumente |
| `PointLight.distance` / `decay` | 18 / 2 | Mayor distancia amplía alcance; mayor decay atenúa más rápidamente a distancias habituales mayores que una unidad | Al reducir ocurre lo contrario; distancia 0 elimina el corte de alcance, no apaga la luz |
| `SpotLight.distance` | 34 | Cono llega más lejos / menos lejos | Coordinar con `shadow.camera.far = 35` si se extiende |
| `SpotLight.angle` | π/7 | Cono más ancho / estrecho | Cambia zona iluminada y distribución del mapa de sombras |
| `SpotLight.penumbra` | 0.52 | Borde más gradual / más definido | Rango 0–1; no mueve el objetivo |
| `SpotLight.decay` | 1.7 | Mayor / menor atenuación a distancias habituales mayores que una unidad | No sustituye al alcance máximo |
| Y local del objetivo de faros | 0.20 | Apunta más arriba / abajo | Con la fuente fija en Y = 1 cambia dónde incide sobre el suelo |
| Z local del objetivo de faros | -20 | Subir hacia -10 acorta separación horizontal y aumenta inclinación hacia abajo; bajar hacia -30 la suaviza | No cambia por sí solo `distance` |
| `shadow.mapSize` | 512 × 512 | Más / menos detalle potencial | Más / menos memoria y costo de renderizado |
| `shadow.camera.near` / `far` | 0.5 / 35 | Subir near excluye obstáculos cercanos; subir far incluye más distancia | Reducir invierte esos efectos; mantener un intervalo válido |
| `shadow.bias` | -0.0002 | Más positivo / más negativo altera comparación de profundidad | No hay mejora monotónica: observar autosombra y separación |
| Cámara: FOV | 58° | Vista más amplia / más cerrada | Cambia perspectiva y tamaño aparente, sin mover objetos |
| Cámara: near / far | 0.1 / 200 | Subir near recorta más cerca; subir far permite ver más lejos | Reducir hace lo contrario; niebla puede ocultar objetos antes del recorte |
| `detras` local | (6.1,8.8,14) | Subir Y eleva cámara; subir Z la aleja por detrás; subir X la desplaza al lado positivo | Disminuir invierte desplazamientos; `lookAt(frente)` modifica orientación |
| `auto.position` / `rotation.y` | (-13,0.04,11) / 0 | Coordenadas desplazan por sus ejes; ángulo mayor/menor gira en sentidos opuestos | Hijos y objetivos acompañan al grupo; no hay colisiones ni seguimiento en el bucle |
| `caja`: `roughness` | 0.84 | Más rugoso / más liso dentro de 0–1 | Afecta respuesta a luz de todas las cajas, no su geometría |

Para tamaños de edificios, aumentar `ancho` o `largo` agranda el volumen y desplaza las ventanas con fórmulas relativas; aumentar `alto` eleva techo y puede añadir filas. Disminuirlos hace lo contrario, pero dimensiones demasiado pequeñas dejan puertas o ventanas desproporcionadas: no hay validación automática. Los radios 0.46 de ruedas y 0.22 de tapas se pueden aumentar o disminuir, pero sus centros Y = 0.47 no se ajustan automáticamente y podrían penetrar el suelo.

### Ejercicios concretos, sin aplicar a V1

1. **Aumentar faros:** cambiar `intensidadFaros: 85` a `120`, guardar y recargar. La luz delantera será más intensa sin cambiar dirección ni cono. Probar luego 40 para comparar. Si se modificara en tiempo de ejecución, habría que asignar `intensity` a cada luz de `faros`; cambiar solo `AJUSTES` no alcanza.
2. **Mover un edificio:** en la primera llamada a `crearEdificio` de `crearManzanas`, cambiar `x - 4.25` a `x - 3.25`. Desplaza ese edificio una unidad hacia +X **en cada manzana**, porque la llamada está dentro del recorrido. Para mover solo uno, un ejercicio posible sería condicionar el desplazamiento a `i === 0`. No existe actualmente ese caso especial.
3. **Elevar la cámara:** cambiar `new THREE.Vector3(6.1, 8.8, 14.0)` por `new THREE.Vector3(6.1, 12.0, 14.0)`. Aumenta la altura local 3.2 unidades y, al seguir mirando a `frente`, hace la vista más inclinada hacia el suelo.
4. **Agrandar el terreno:** cambiar la caja del suelo de 110 × 88 a 130 × 108 solo agranda la base. Para llevar también sus límites al borde, los centros de los bordes pasarían aproximadamente de ±54.5 a ±64.5 en X y de ±43.5 a ±53.5 en Z; además habría que ampliar sus longitudes de 110/88 a 130/108. Calles y manzanas seguirían en sus posiciones actuales. No hay un parámetro que escale automáticamente todo el mapa.
5. **Cambiar alcance público:** pasar `18` a `24` en el constructor de `PointLight` permite afectar superficies más lejanas, pero mantiene el decaimiento 2 y no añade sombras. Una mayor distancia no equivale a iluminación uniforme.

## 7. Preguntas para la defensa

**¿Cómo se inicia el programa?** Se abre `index.html`. Sus scripts cargan primero Three.js, luego `src/escena.js`. La función autoejecutable comprueba la biblioteca y llama a `iniciar`, que construye los objetos antes de ejecutar `animar`.

**¿Por qué se utiliza Three.js?** Proporciona escena, geometrías, materiales, luces, cámara y renderizador. El código propio puede expresar `new THREE.Mesh(geometria, material)` sin programar directamente todos los buffers y shaders de WebGL. Sigue siendo el navegador quien renderiza mediante WebGL.

**¿Cómo se crea un objeto 3D?** `caja` crea geometría y material, los combina en un `Mesh`, coloca su centro y configura sombras. El llamador lo agrega al padre. Crear una malla sin agregarla al grafo visible no la hace aparecer.

**¿Qué diferencia hay entre el farol visible y el faro real?** `crearVehiculo` crea piezas con `MeshBasicMaterial`; `crearFaros` crea `SpotLight`. Una pieza parece encendida, la otra ilumina superficies.

**¿Cómo apuntan los faros?** La fuente y su `target` se agregan a `auto`. Sus posiciones locales definen un vector hacia -Z con una pequeña componente negativa en Y. El ángulo define la apertura y la distancia el alcance.

**¿Cómo se generan las sombras?** El renderizador habilita mapas de sombras, los dos `SpotLight` los generan, las mallas marcadas con `castShadow` pueden obstruir la luz y las marcadas con `receiveShadow` muestran la sombra. Los postes y la luna no tienen activada la proyección de sombras.

**¿Por qué funciona sin Internet?** Cada copia incluye su propio `vendor/three.min.js` y `src/escena.js` con rutas relativas al HTML. El programa usa scripts clásicos y geometrías generadas localmente. Con la biblioteca válida no se ejecuta el fallback CDN. El navegador aún necesita soporte WebGL.

**¿Qué función cumple el renderizador?** `renderer.render(escena, camara)` toma los objetos y la vista, calcula el dibujo y lo presenta en el canvas agregado a `#app`. Activar un renderizador no construye automáticamente el escenario: eso lo hacen las funciones propias.

**¿Por qué hay un bucle si nada se mueve?** `animar` vuelve a dibujar continuamente, aunque el estado permanezca igual. El código deja un lugar para futuras actualizaciones, pero V1 no contiene ninguna actualización de movimiento ni cálculo de delta de tiempo.

**¿La cámara sigue al auto?** No. Se calcula una vez con `localToWorld` y `lookAt`. No se agrega como hija del auto ni se recalcula en `animar`.

**¿Qué ocurre al cambiar `separacionEntreManzanas`?** Nada, porque ninguna función lee esa propiedad. El espaciado real depende de los arrays de posiciones y las medidas explícitas.

**¿Qué ocurre al duplicar la intensidad de los faros?** Se aumenta la intensidad de la luz al construirla, pero no su apertura ni alcance. El brillo percibido no tiene por qué duplicarse por la atenuación, materiales y mapeo de tonos.

**¿Las ventanas encendidas iluminan la calle?** No. Son mallas de material básico, sin fuentes de luz asociadas. Tampoco el vidrio azulado del auto es transparente.

**¿Cuándo se usa trigonometría?** V1 usa π para ángulos de ruedas y conos; Three.js resuelve transformaciones y perspectiva internamente. No hay un algoritmo propio de movimiento con seno o coseno. El cálculo de inclinación explicado arriba se deduce para estudiar el foco, no es una función implementada.

**¿Qué pasa al redimensionar?** `alCambiarTamano` actualiza la proporción de cámara, su matriz de proyección y el tamaño del renderizador. No reconstruye el escenario.

**¿Cuáles son las limitaciones actuales?** Escena y cámara fijas; sin controles, física, colisiones ni lomada; solo dos fuentes con sombras; distribución del mapa por coordenadas explícitas; sin limpieza/reinicio de recursos ni adaptación dinámica de calidad. La existencia de grupos y arrays prepara posibles cambios, pero no demuestra funcionalidades futuras.

## 8. Documentación y cierre de próximas versiones

V1 se conserva intacta en `versiones/V1_Escenario_Fijo`. Para V2 y posteriores, trabajar únicamente en `desarrollo` y usar `desarrollo/docs/PLANTILLA_EXPLICACION_TECNICA.md` para crear `EXPLICACION_TECNICA_V2.md`, etc. No marcar una versión como terminada antes de completar su implementación y verificación.

Cada explicación debe contener alcance realmente implementado, archivos modificados, funciones y variables nuevas con sus contratos, flujo completo de inicio y de cada fotograma, conceptos matemáticos/gráficos aplicados, relación con lo anterior y ejemplos de cambios. Debe permitir estudiar esa versión por sí misma; las referencias a V1 complementan la explicación, no reemplazan su flujo de ejecución.

Al terminar una versión, copiar el contenido completo de `desarrollo` a una carpeta nueva dentro de `versiones`, incluir la biblioteca local y su documentación, verificar sus rutas y abrir su propio `index.html` sin conexión. Registrar los resultados y las limitaciones en el historial. No sobrescribir una carpeta de versión ya cerrada.
