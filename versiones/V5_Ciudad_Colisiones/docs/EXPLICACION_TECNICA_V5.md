# Explicación técnica — V5: entorno urbano y colisiones

Estado: V5 cerrada oficialmente el 25/11/2026 tras la confirmación del autor de que fue implementada y probada. Respaldo completo en `versiones/V5_Ciudad_Colisiones/`; `desarrollo/` continúa como carpeta activa. Las versiones V1–V4 y sus documentos se conservan intactos. Esta versión mantiene el plano horizontal: no implementa lomada, suspensión, daños ni física realista.

Los archivos citados se encuentran dentro de cada copia de la aplicación. Para estudiar y ensayar cambios, utilizar `desarrollo/`; para ejecutar el respaldo, abrir su propio `index.html`. El CSS está incluido en el HTML. Los ejercicios de este documento son propuestas para practicar, no modificaciones aplicadas al código de V5.

## A. Cambios y organización

### Archivos

- `index.html`: presenta V5, explica giro en reposo y colisiones, indica el tramo V6 y carga `src/colisiones.js` antes de `src/escena.js`. Conserva estilos internos, panel y biblioteca local.
- `src/escena.js`: reutiliza ciudad y conducción, incorpora variedad urbana, registro de sólidos, movimiento validado y transparencia temporal para visibilidad de cámara.
- `src/colisiones.js` (nuevo): funciones matemáticas puras para rectángulo orientado contra caja horizontal, límites exteriores y cantidad de subpasos. Expone el objeto léxico `ColisionesCiudad` para los scripts clásicos posteriores; no usa módulos ni librerías adicionales.
- `pruebas/movimiento.test.cjs`: carga el nuevo script y adapta recorridos que antes atravesaban edificios. Instrumenta únicamente el código ejecutado en memoria de pruebas para inspeccionar funciones privadas.
- `pruebas/colisiones.test.cjs` (nuevo): prueba geometría, ciudad transitable, impactos, maniobras, crucero y visibilidad. La prueba de iluminación existente sigue utilizándose sin cambios.
- `docs/EXPLICACION_TECNICA_V5.md` y `docs/GUIA_VERSION_5.md` (nuevos): explicación y guía práctica. Se conservan los documentos anteriores.

No se cambian las fórmulas de aceleración progresiva ni la lógica de C de V4, ni `aplicarIluminacion` de V3. Se mantienen once luces, dos mapas de sombras y diez materiales emisivos de construcciones.

### Variables nuevas

| Nombre | Contenido |
| --- | --- |
| `obstaculos` | Registros `{ caja, tipo }` de sólidos estáticos |
| `FORMA_AUTO` | `semiancho: 1.34`, `semilargo: 2.47`; huella del auto con margen |
| `LIMITES_SOLIDOS` | `x: 53.8`, `z: 42.8`; límites del volumen completo, ligeramente dentro de las caras interiores de los bordes |
| `PASO_COLISION` | 0.08 unidades de avance máximo combinado de traslación y esquina por subpaso |
| `oclusoresCamara` | Grupos de construcciones y árboles que pueden tapar al vehículo |
| `materialesAtenuados` | Set de materiales hechos transparentes temporalmente en el frame anterior |
| `rayoCamara` | Un `THREE.Raycaster` reutilizado para visibilidad |

Se eliminan `CONDUCCION.limiteX`/`limiteZ`, antes usados para limitar solo el centro. Ahora el rectángulo completo se comprueba contra `LIMITES_SOLIDOS`. Los parámetros de velocidad, aceleración y crucero se conservan: 12/5 u/s, aceleración 0.8→4 en 3 s, frenado 8, desaceleración 2 y umbral de crucero 3.

## B. Construcción de las cinco manzanas

`crearManzanas()` conserva exactamente cinco centros:

```js
const posiciones = [
  [-26, -13], [0, -13], [26, -13],
  [-26, 13], [0, 13]
];
```

No hay dos bucles de cinco por cinco. Cada posición produce una vereda, dos construcciones, dos árboles y un muro bajo. Queda libre el sector alrededor de `(26,13)`, sin una sexta manzana. Las calles paralelas a Z siguen en X = -39, -13, 13 y 39; las paralelas a X siguen en Z = -26, 0 y 26. Su ancho es 8 y los centros de manzanas se separan 26 unidades.

`crearVereda(x,z)` coloca una caja de 18×0.36×18, centrada en `(x,0.02,z)`. No es sólida para la colisión: se conserva conducción plana. La vereda delimita visualmente la parcela; las construcciones más pequeñas dejan un retiro respecto de sus bordes.

```js
crearCasa(x - 4.4, z - 1, 1 + i % 2, colores[i], i);
if (i % 2 === 0) crearComercio(x + 4.3, z + 0.8, i + 2);
else crearEdificio(x + 4.3, z + 0.8, 6.4, 7.8, 7.5 + i, colores[i], i + 2);
```

Resultan cinco casas (tres de un piso y dos de dos pisos), tres comercios y dos edificios medianos de 8.5 y 10.5 unidades de altura. Cada casa usa cuerpo 5.8×6.4, altura `pisos*2.7` y techo `ConeGeometry(4.7,1.5,4)` rotado π/4, con escala Z=1.1. El comercio usa 7.2×7.6×3.5 y un cartel de caja sin iluminación propia. El edificio residencial usa 6.4×7.8.

`crearEdificio` sigue siendo la base: crea Group en `(posX,0.2,posZ)`, cuerpo, techo plano, ventanas y puerta. Ahora conserva `cuerpo` en una variable, lo registra y devuelve `grupo`, permitiendo que casa y comercio añadan detalles. Los materiales estándar reciben luces; cuerpo y techos proyectan y reciben sombras. Ventanas encendidas conservan emisión V3 y se agregan a `materialesVentanas`.

X/Z indican ubicación horizontal; Y altura. Las dimensiones de `BoxGeometry` se miden desde su centro, mitad en cada dirección. Por ejemplo, un comercio centrado en X=4.3 con ancho 7.2 ocupa [0.7,7.9], dentro de la vereda [-9,9] de esa manzana. Una calzada vecina empieza en X=9, de modo que el cuerpo no la invade.

Los árboles mantienen tronco y copa de cajas. El tronco ahora mide 2.5 de alto con centro Y=1.45; la copa está a Y=3.5, por encima de la carrocería. Se registra solo el tronco de 0.45×0.45 en XZ. Los muros miden 4.8×0.9×0.35 y se ubican a Z local +7.7 dentro de la manzana.

Los siete postes conservan sus luces y geometría; se retiran ligeramente los soportes de calzadas. Sus coordenadas están en `crearAlumbrado`. Se registra únicamente el soporte de 0.22×0.22 en XZ, no el brazo elevado ni la esfera visual. No se crean luces nuevas para ventanas, casas o carteles.

### Qué se registra

`registrarObstaculo(malla,tipo)` actualiza matrices mundiales y calcula `new THREE.Box3().setFromObject(malla)`. La llamada ocurre después de agregar la malla a su grupo y el grupo a la escena. Así incluye la traslación de la manzana/edificio, no solo la posición local del cuerpo.

Los 32 registros son diez cuerpos de construcciones, diez troncos, siete soportes de postes y cinco muros. Los cuerpos de casas/comercios usan el tipo común `edificio`; el tipo es descriptivo, no una excepción de colisión. Suelo, calles, veredas, ventanas, puertas decorativas, carteles y luces no son registrados. La caja se conserva estática: si se moviera un edificio posteriormente habría que actualizar su registro; V5 no mueve estructuras.

## C. Flujo exacto de ejecución

1. `index.html` crea los contenedores y estilos. Carga Three.js local; conserva fallback CDN solo para biblioteca ausente.
2. Carga `src/colisiones.js`, que define `ColisionesCiudad`; no construye la ciudad.
3. Carga `src/escena.js`; su función autoejecutable inicializa arrays/estado y llama a `iniciar`.
4. `inicializarRenderer` y `crearEscena` preparan canvas, escena, niebla y luces base.
5. `crearTerreno` y `crearCalles` construyen el piso y siete calzadas.
6. `crearManzanas` llama a `crearVereda`, `crearCasa`, `crearComercio` o `crearEdificio`, `crearArbol` y `crearMuro`. Los sólidos se registran durante esas llamadas, mediante `registrarObstaculo`.
7. `crearAlumbrado` llama a `crearPoste`, que registra soportes y conserva las siete PointLight.
8. `crearVehiculo` crea el auto en `(-13,0.04,11)`. `iniciar` comprueba esa huella con `posicionAutoLibre`; si no es válida lanza un error de inicio en lugar de dejarlo dentro de un sólido.
9. `crearFaros` agrega luces y targets al grupo. `configurarCamara`, `configurarControles`, `configurarPanelLuces` y `actualizarIndicadores` completan el inicio; se registra resize y solicita RAF.
10. `keydown`/`keyup` mantienen el Set de teclas. C y pedales conservan reglas de V4; las flechas del panel conservan reglas de V3.
11. `animar` obtiene Δt, con máximo 0.05. `actualizarMovimiento` guarda velocidad anterior y llama a `actualizarVelocidad`, que aplica rampa, frenado o crucero de V4.
12. Calcula velocidad media, distancia del frame y giro. `aplicarMovimientoSeguro` los divide en subpasos y valida cada nueva orientación y posición antes de asignarlas al auto.
13. Si están libres, avanza. Si no, conserva el último estado válido, prueba componentes X/Z para deslizar y llama a `detenerPorColision`: velocidad cero, rampa reiniciada, crucero cancelado. Interrumpe los subpasos restantes.
14. `actualizarCamara` conserva el seguimiento y llama a `despejarVistaCamara` para atenuar oclusores. `actualizarIndicadores` refleja inmediatamente velocidad y crucero; `renderer.render` dibuja y se solicita el próximo frame.

Las colisiones no dependen de esperar al renderizador: las cajas estáticas se calcularon al construir, y la huella propuesta se calcula matemáticamente con X/Z/ángulo. No se mueve primero el auto para luego descubrir una penetración y expulsarlo.

## D. Matemáticas de colisiones

### Caja delimitadora y plano XZ

Una AABB (caja alineada con los ejes) contiene un objeto entre `min` y `max`. De una caja 3D se usan solo sus límites X/Z, porque todavía no hay desniveles. El centro y semidimensiones del obstáculo son:

```text
cx=(minX+maxX)/2; cz=(minZ+maxZ)/2
hx=(maxX-minX)/2; hz=(maxZ-minZ)/2
```

Por ejemplo, un soporte centrado en (8.5,-4.5) ocupa X=[8.39,8.61], Z=[-4.61,-4.39]. No basta comprobar si el centro del auto está en esa caja: una rueda o paragolpes podría penetrar antes.

### Huella orientada del auto

Se usa un rectángulo orientado (OBB) de 2.68×4.94, centrado en `auto.position`. Cubre ruedas y paragolpes con margen pequeño: la geometría llega aproximadamente a X=±1.30 y Z=±2.43. No incluye conos de luz ni targets, que no son parte del volumen físico del vehículo.

Para θ=`auto.rotation.y`, los ejes locales horizontales son:

```text
u=(cosθ,-sinθ)   // eje local +X
v=(sinθ, cosθ)   // eje local +Z
```

Los vértices son `centro ± semiancho*u ± semilargo*v`. La dirección frontal sigue siendo -v. Esto permite considerar orientación sin aproximar el auto como un círculo ni solo su punto central.

### SAT: separación de proyecciones

Dos rectángulos no se intersectan si existe un eje donde sus intervalos proyectados no se superponen. Para OBB contra AABB bastan cuatro ejes: X, Z, u y v. En `intersectaAuto` se calculan `dx=cx-x`, `dz=cz-z`, `c=cosθ`, `s=sinθ`, `ac=|c|`, `as=|s|`.

```js
if (Math.abs(dx) > hx + semiancho * ac + semilargo * as) return false;
if (Math.abs(dz) > hz + semiancho * as + semilargo * ac) return false;
if (Math.abs(dx * c - dz * s) > semiancho + hx * ac + hz * as) return false;
if (Math.abs(dx * s + dz * c) > semilargo + hx * as + hz * ac) return false;
return true;
```

Cada comparación contrasta distancia entre centros proyectados con suma de radios proyectados. Si cualquiera supera esa suma, hay un hueco y devuelve false. Si ninguna separa, devuelve true. El contacto exacto cuenta como colisión porque se compara con `>` y no `>=`; el margen de la huella evita contacto visible con la malla.

Ejemplo: obstáculo X=[2,3], Z=[-1,1] y auto centrado en (0,0). A θ=0, su semiancho 1.34 no llega a X=2: libre. A θ=π/2, su semilargo 2.47 queda sobre X y sí invade: bloqueado, aunque el centro nunca se movió.

### Límite exterior del volumen completo

Las extensiones mundiales son `ex=a|cosθ|+b|sinθ|` y `ez=a|sinθ|+b|cosθ|`. `posicionLibre` rechaza si `|x|+ex >= 53.8` o `|z|+ez >= 42.8`. Esto mantiene toda la huella dentro de los bordes, a cualquier orientación. No introduce barreras entre calles: solo representa el contorno exterior visible.

Luego recorre `obstaculos` y rechaza si alguno intersecta. La consulta es lineal en 32 obstáculos; no necesita una estructura espacial compleja para este escenario.

### Subpasos para velocidad y rotación

Comprobar solo el punto final podría permitir saltar un poste. También podría permitir girar atravesando una pared si solo se inspecciona el ángulo final. Se acota el movimiento de una esquina:

```js
const radio = Math.hypot(forma.semiancho, forma.semilargo);
return Math.max(1, Math.ceil((Math.abs(distancia) + radio * Math.abs(giro)) / pasoMaximo));
```

`radio≈2.81` es distancia del centro a una esquina. `radio*|giro|` aproxima conservadoramente la longitud de arco de la esquina. Se suma la traslación para fijar N, y se divide distancia y giro entre N.

A 12 u/s y Δt=0.05, la traslación máxima es 0.6. Con giro de 1.6 rad/s, Δθ=0.08; el límite combinado ronda 0.825, requiriendo 11 pasos con umbral 0.08. Es menor que el ancho del soporte más fino (0.22). No es una detección continua exacta, pero evita atravesar los objetos definidos a los parámetros actuales. Aumentar mucho velocidad o disminuir mucho el tamaño de obstáculos exige revisar costo y umbral. No se limita N artificialmente: aumentarlo conserva la subdivisión, con costo mayor.

### Validación, giro y deslizamiento

En cada paso se prueba primero `anguloPropuesto`, sin cambiar posición. Solo si esa huella está libre se asigna el ángulo. Después se calcula el frente con el ángulo aceptado y `dx`, `dz` del paso. Si `(x+dx,z+dz)` está libre se asigna; en otro caso se prueba `(x+dx,z)` y después `(xAceptado,z+dz)`.

Esa separación de componentes permite conservar una parte tangencial a paredes alineadas a X/Z. No usa normales de choque ni rebotes. El orden prioriza X, por lo que no es una respuesta física simétrica; es una aproximación sencilla. Cada componente se valida y no se aceptan penetraciones como parte de la corrección.

Cualquier bloqueo, incluido uno de giro, pone velocidad a cero y cancela crucero; el frame termina después de ese subpaso. El deslizamiento es limitado, no conserva toda la velocidad tangencial. Si se mantiene el pedal, el siguiente frame vuelve a intentar desde una velocidad pequeña: no acumula aceleración contra la pared ni aplica expulsiones que generen vibración. Si una dirección no cabe, debe retrocederse recto antes de insistir en el giro.

V5 permite giro en reposo usando `Math.sign(velocidadMedia) || 1`; en reversa utiliza -1. No se garantiza girar atravesando sólidos: conserva capacidad de maniobra solo cuando la huella propuesta está libre.

## E. Contratos de funciones

### `src/colisiones.js`

| Función | Parámetros y resultado | Llamador / operaciones |
| --- | --- | --- |
| `intersectaAuto(x,z,angulo,semiancho,semilargo,caja)` | Pose, semidimensiones y Box3; booleano | `posicionLibre`; aplica las cuatro separaciones SAT en XZ sin mutar nada |
| `posicionLibre(x,z,angulo,forma,obstaculos,limites)` | Pose y colecciones; booleano | `posicionAutoLibre`; comprueba extensiones exteriores y ausencia de intersecciones |
| `cantidadPasos(distancia,giro,forma,pasoMaximo)` | Distancia con signo, radianes y umbral; entero ≥1 | `aplicarMovimientoSeguro`; calcula radio y techo de la cota de recorrido |

Estas funciones no conocen teclado, DOM, velocidad ni renderer. Si se desactivara `intersectaAuto`, seguiría la frontera pero se atravesarían estructuras. Si se comprobara solo el centro, dejaría entrar carrocería y ruedas.

### Construcción y registro en `src/escena.js`

| Función | Quién la llama / momento | Parámetros, estado y resultado |
| --- | --- | --- |
| `registrarObstaculo(malla,tipo)` | Constructores, una vez por sólido | Actualiza matriz, obtiene Box3, marca `userData.tipoObstaculo`, agrega `{caja,tipo}`; no devuelve valor |
| `crearEdificio(posX,posZ,ancho,largo,alto,color,indice)` | Manzanas, casas y comercios, al inicio | Reutiliza cajas/ventanas; registra cuerpo, agrega grupo a oclusores y devuelve grupo para ampliar |
| `crearCasa(x,z,pisos,color,indice)` | Manzanas, cinco veces | Llama a edificio de dimensiones fijas y altura por pisos; agrega techo de cono y devuelve grupo |
| `crearComercio(x,z,indice)` | Manzanas, tres veces | Llama a edificio bajo, agrega cartel decorativo y devuelve grupo |
| `crearVereda(x,z)` | Manzanas, cinco veces | Agrega caja con nombre `vereda`, no registra sólido; sin retorno |
| `crearMuro(x,z)` | Manzanas, cinco veces | Crea caja baja, la agrega y registra como `muro`; sin retorno |
| `crearArbol(posX,posZ)` | Manzanas, diez veces | Crea tronco/copa elevados, registra solo tronco y añade grupo a oclusores; sin retorno |
| `crearPoste(x,z)` | Alumbrado, siete veces | Conserva fuente y esfera, guarda soporte para registrarlo después de agregar grupo; sin retorno |
| `crearManzanas()` | `iniciar`, una vez | Recorre cinco centros, elige tipos con índice par/impar y agrega veredas, árboles y muros |
| `crearAlumbrado()` | `iniciar`, una vez | Usa siete coordenadas ligeramente retiradas de las calzadas; mantiene cantidad/tipos de luz |

El registro es centralizado, no hay condiciones particulares del tipo «si cerca del edificio 3». Las estructuras derivadas aprovechan el registro del constructor base. Añadir un cuerpo mediante `crearEdificio` incorpora automáticamente ventanas emisivas, sombras, colisión y oclusión.

### Movimiento e integración en `src/escena.js`

| Función | Llamador / momento | Parámetros, estado y resultado |
| --- | --- | --- |
| `posicionAutoLibre(x,z,angulo)` | Inicio y cada candidato | Delega en `ColisionesCiudad.posicionLibre` con FORMA_AUTO, obstáculos y límites; devuelve booleano |
| `detenerPorColision()` | Movimiento seguro al bloquear | Pone velocidad/tiempo/marcha de aceleración a cero y llama a `desactivarCrucero`; sin retorno |
| `aplicarMovimientoSeguro(distancia,giroTotal)` | Cada `actualizarMovimiento` | Calcula subpasos, valida giro/posición, desliza y corta ante bloqueo; modifica solo estados válidos de auto y conducción |
| `actualizarMovimiento(deltaTime)` | Cada frame, desde `animar` | Conserva cálculo V4 de velocidad media; calcula sentido con alternativa +1 en reposo; delega desplazamiento/giro seguros |
| `actualizarCamara(deltaTime,inmediata)` | Inicio y cada frame | Conserva conversión local/mundial, lerp y lookAt; al final llama a `despejarVistaCamara` |
| `despejarVistaCamara()` | Después de colocar cámara | Restaura materiales del frame anterior; lanza rayo al objetivo y atenúa grupos interceptados; sin retorno |
| `iniciar()` | Punto de entrada | Conserva secuencia; comprueba pose inicial tras construir auto y antes de faros; lanza error si está ocupada |

## Cámara e iluminación

La cámara no se sustituye ni se añaden modos libres. Se conserva el seguimiento V4: destino local `(0,8.8,14)`, objetivo `(0,1,0)`, matrices actualizadas y factor `1-exp(-8Δt)`.

Para evitar que un edificio o árbol oculte el centro del auto, `despejarVistaCamara` restaura opacidad 1 de los materiales antes atenuados. Define un rayo desde cámara hacia `objetivoCamara`, con alcance igual a su distancia. Si `intersectObject(grupo,true)` encuentra geometría interpuesta, recorre sus mallas y aplica opacidad 0.18, `transparent=true`, `depthWrite=false`; las guarda en un Set para restaurar el próximo frame. Todos estos materiales son originalmente opacos, por lo que esa restauración corresponde a su estado real.

Esta operación no elimina sólidos ni cambia valores emisivos o intensidades. El edificio permanece registrado incluso cuando transparente. No es un sistema completo de cámara con colisiones: detecta la línea hacia el centro, no cada píxel de la carrocería; puede haber oclusiones parciales y artefactos de ordenación de transparencias. Debe revisarse visualmente. Las banderas de sombras se conservan; la representación final depende del render de Three.js.

Las ventanas de casas y comercios entran al mismo array `materialesVentanas`. Apagar el grupo continúa suprimiendo emisión, no la geometría. PointLight, HemisphereLight y DirectionalLight mantienen valores y controles; no hay luces nuevas. Solo los dos SpotLight del auto proyectan mapas de 512×512 y siguen orientados por targets hijos del vehículo.

## F. Ejemplos de cambios y consecuencias

- **Agrandar el auto:** aumentar geometrías requiere actualizar FORMA_AUTO para cubrir ruedas/paragolpes. Cambiar solo la malla permitiría penetraciones visuales; aumentar solo la huella haría contactos antes de tocar. Mayor radio también incrementa N en giros.
- **Cambiar dimensiones de un edificio:** `crearEdificio` usa el cuerpo real para Box3 al construir, por lo que el tamaño de colisión cambia automáticamente al recargar. Cambiar su transform después del registro exigiría recalcular la caja.
- **Agregar un edificio:** usar `crearEdificio` en un sitio libre lo incorpora al sistema existente. Agregar una caja directamente con `escena.add` no la vuelve sólida automáticamente: hay que llamar a `registrarObstaculo` si debe bloquear.
- **Eliminar un obstáculo:** quitar su llamada de construcción y recargar elimina visual y registro. Borrar solo su malla después de iniciar dejaría una caja invisible en `obstaculos`; borrar solo el registro permitiría atravesar la malla.
- **Subir mucho la velocidad:** aumenta distancia y N, por lo tanto el costo. La prueba incluye saltos propuestos de 30 unidades contra soportes delgados; esto no prueba velocidades ilimitadas ni detección continua exacta. Revisar el umbral si se agregan objetos más finos.
- **Desactivar comprobación:** asignar posición/rotación sin `posicionAutoLibre` permitiría atravesar sólidos y rompería el bloqueo de crucero; los materiales y sombras no impiden desplazamientos por sí mismos.
- **Modificar separación urbana:** los centros están en un array explícito; `AJUSTES.separacionEntreManzanas` sigue sin uso. Mover un centro mueve sus construcciones, árboles, muro y vereda, pero no las calles/postes, que tienen coordenadas propias. Hay que conservar anchos y retiros.
- **Reducir PASO_COLISION:** mejora resolución temporal de contacto con más consultas. Aumentarlo demasiado puede saltar sólidos o cortar esquinas durante un giro.

## Modificaciones prácticas para la defensa

### Método de trabajo para cada ejercicio

Trabajar solamente en `desarrollo`, guardar el archivo y recargar `desarrollo/index.html`. Recargar reconstruye geometrías, registra nuevamente las cajas y restablece luces/velocidad. Las funciones de escena están encerradas en una función autoejecutable: escribir `crearEdificio(...)` o `auto.position...` directamente en la consola del navegador no permite acceder a ellas como variables globales. Los cambios de este apartado se escriben en el archivo indicado, no se ejecutan como comandos de consola.

Antes del ejercicio, identificar si se cambiará **geometría**, **transformación**, **registro de colisión**, **material** o **luz**. Son responsabilidades distintas. Un edificio puede verse pero no bloquear si no fue registrado; puede bloquear aunque sea transparente; puede verse brillante sin iluminar a otros objetos. Hacer un cambio por vez, verificarlo y restaurarlo antes del siguiente ejercicio facilita explicar su causa.

Los fragmentos marcados como propuesta no están implementados. Los números y nombres de funciones que se sustituyen corresponden al código real. Usar búsqueda por nombre de función en el editor, en lugar de depender de números de línea que cambian al editar.

### 1. Cambiar dimensiones de un edificio residencial concreto

**Archivo:** `desarrollo/src/escena.js`. **Función:** `crearManzanas()`. En su rama `else` actual:

```js
else crearEdificio(x + 4.3, z + 0.8, 6.4, 7.8, 7.5 + i, colores[i], i + 2);
```

Los argumentos son, en orden, `posX`, `posZ`, `ancho`, `largo`, `alto`, `color`, `indice`. El orden no es ancho/alto/largo como en `caja`; confundirlos es un error frecuente.

**Propuesta:** estrechar solo el residencial de la manzana `i === 1` y subir su altura a 10.5:

```js
else crearEdificio(x + 4.3, z + 0.8,
  i === 1 ? 5.4 : 6.4, 7.8, i === 1 ? 10.5 : 7.5 + i, colores[i], i + 2);
```

Antes, ese cuerpo se ubica en `(4.3,0.2,-12.2)` y mide 6.4×7.8 de planta con alto 8.5. Después su ancho sería 5.4 y alto 10.5. Se modifica una construcción porque `i` identifica la iteración; cambiar `6.4` sin condición afectaría a los dos residenciales.

**Consecuencias:** cuerpo, techo plano y posición horizontal de ventanas utilizan `ancho`; altura modifica techo y posiblemente cantidad de filas. `registrarObstaculo(cuerpo,'edificio')` obtiene automáticamente la nueva caja al recargar. Cambiar solo altura no cambia colisiones XZ, pero sí la sombra, visibilidad y rayos de cámara. Revisar que puerta y ventanas sigan proporcionadas: sus dimensiones no se escalan automáticamente con el edificio.

**Comprobación:** aproximarse por ambos lados, observar retiro y sombra, y verificar que solo cambió la manzana elegida. Si el edificio invade una calle, reducir dimensiones o desplazar el centro; las calles no se reubican automáticamente.

### 2. Mover una construcción sin mover toda la manzana

**Archivo y función:** `desarrollo/src/escena.js`, `crearManzanas()`. En la misma llamada residencial, cambiar el primer argumento por `x + 4.3 - (i === 1 ? 0.5 : 0)` conserva el resto y desplaza solo ese edificio 0.5 hacia -X. La posición X pasa de 4.3 a 3.8; `z + 0.8` permanece igual.

Mover el grupo afecta cuerpo, techo, ventanas y puerta porque son hijos. Como la ubicación se pasa al constructor antes del registro, la caja sólida se obtiene en el sitio nuevo. No usar el grupo devuelto para moverlo **después** del registro sin recalcular su caja: quedaría colisión en el sitio anterior. La solución sencilla para esta defensa es editar los argumentos de construcción y recargar.

**Mover una manzana completa:** editar un par de `posiciones`, por ejemplo `[0,13]` a `[0,12.5]`, mueve su vereda, casas, edificios, árboles y muro mediante sus desplazamientos relativos. No mueve las calles ni postes. `AJUSTES.separacionEntreManzanas` no está utilizado; cambiarlo no produce efecto. Revisar las siete calzadas, cruces y reserva V6 antes de aceptar un cambio de distribución.

### 3. Crear otro obstáculo y retirarlo correctamente

**Archivo:** `desarrollo/src/escena.js`. **Función:** `crearManzanas()`. Como ejercicio, después de cerrar el `posiciones.forEach(...)` y antes de la llave final de la función, añadir:

```js
crearMuro(26, 13); // Propuesta de ejercicio, no incluida en V5.
```

El sector `(26,13)` no contiene la sexta manzana; el ejemplo crea un muro fuera de las calzadas y lejos de la reserva X=39. `crearMuro` ya llama a `caja`, `escena.add` y `registrarObstaculo`. No hay que programar una condición nueva en el movimiento. Si se insertara dentro del `forEach`, se construirían cinco muros superpuestos en la misma posición, gastando geometría y registros.

Para un bloque de otra forma, reutilizar dentro de esa misma función las operaciones existentes:

```js
const bloque = caja(2, 1.5, 2, 0x8d897f, 26, 0.75, 13, true, true);
escena.add(bloque);
registrarObstaculo(bloque, 'bloque');
```

`bloque` sería una variable local nueva del ejercicio, no una variable de la implementación cerrada. El texto `'bloque'` solo describe el tipo: SAT no tiene excepciones por nombre. Elegir uno de los dos ejemplos, no ambos a la vez.

**Retirar:** quitar la llamada o las tres instrucciones añadidas y recargar. Borrar solo el objeto visible en una ejecución ya iniciada dejaría el registro; quitar solo el registro permitiría atravesarlo. Agregar un muro cambia la cantidad esperada de obstáculos de 32 a 33 en la prueba: revisar esa expectativa conscientemente, sin eliminar pruebas de calles libres.

### 4. Ajustar dimensiones del muro o cambiar todos los de la ciudad

**Archivo:** `desarrollo/src/escena.js`. **Función:** `crearMuro(x,z)`. La llamada real es:

```js
const muro = caja(4.8, 0.9, 0.35, 0x8d897f, x, 0.65, z, true, true);
```

Aquí el orden sí es `ancho, alto, largo`: cambiar 4.8 a 3.8 reduce su longitud en X y cambia todos los muros creados por esta función. Cambiar 0.35 afecta su espesor Z y su colisión. Cambiar 0.9 solo altera altura visible/sombras, no la planta de colisión. Si se cambia altura, ajustar Y para apoyar el muro a la altura deseada; una caja se extiende a ambos lados de su centro.

No hacer obstáculos extremadamente finos sin revisar `PASO_COLISION`: un grosor menor exige ensayos de contacto, especialmente en esquinas. El registro se recalcula automáticamente al recargar porque usa la malla nueva.

### 5. Ajustar los límites exteriores sin crear barreras engañosas

**Archivo:** `desarrollo/src/escena.js`. **Constante:** `LIMITES_SOLIDOS = { x: 53.8, z: 42.8 }`. **Consulta:** `posicionLibre` en `desarrollo/src/colisiones.js`.

Reducir X a 53.3 detendría el auto medio punto antes en ambos lados del terreno. No es el máximo del centro: se exige `|x| + extensionX < limiteX`. A ángulo cero, con `semiancho=1.34`, el centro debe cumplir `|x| < 52.46` con el valor actual. A 90°, la extensión X es 2.47 y la cota del centro baja a 51.33.

**Consecuencia:** modificar límites no mueve los bordes visibles. Para aumentar el escenario de forma coherente hay que revisar `crearTerreno()` (suelo 110×88 y bordes centrados en ±54.5/±43.5), longitudes de `crearCalles()` y límites sólidos. No ampliar solo `LIMITES_SOLIDOS` por encima del borde visible: permitiría invadirlo o salir del suelo. Si se busca solamente más margen de seguridad, una reducción pequeña es un ejercicio válido, explicando su separación respecto del borde.

### 6. Aumentar el tamaño del auto manteniendo una huella coherente

**Archivo:** `desarrollo/src/escena.js`. **Función:** `crearVehiculo()`. **Constante relacionada:** `FORMA_AUTO`.

Para un ejercicio sencillo de escala horizontal uniforme del 10 %, añadir `auto.scale.set(1.1, 1, 1.1)` antes de `auto.position.set(-13, 0.04, 11)` y cambiar `FORMA_AUTO` a `{ semiancho: 1.474, semilargo: 2.717 }`, que resulta de multiplicar 1.34 y 2.47 por 1.1. Es un ejemplo propuesto, no aplicado.

**Consecuencias:** todas las mallas hijas se ensanchan y alargan; como el grupo también contiene luces y objetivos cuando termina el inicio, sus posiciones relativas horizontales se escalan. La distancia de iluminación `luz.distance` no se escala automáticamente. La cámara convierte su desplazamiento local mediante el mismo grupo, por lo que también queda horizontalmente más lejos. La velocidad sigue en u/s mundiales y no se multiplica por la escala del auto.

El SAT no lee `auto.scale`: usa `FORMA_AUTO`. Por eso hay que actualizar ambas cosas. El radio usado para los subpasos crece automáticamente al cambiar esa forma. La pose inicial se valida en `iniciar`; si el auto ya no cabe, no se debe quitar esa validación, sino ajustar tamaño o ubicarlo en un sitio libre.

Para cambiar solo una pieza, editar sus argumentos en `crearVehiculo`, por ejemplo la caja principal de 2.30×0.62×4.60. Eso no mueve ruedas, ventanas ni paragolpes. Revisar el contorno de **todas** las piezas antes de calcular nueva huella; modificar solo el cuerpo puede dejar accesorios separados o fuera del rectángulo. Las pruebas de encuadre tienen esquinas del vehículo original: adaptar esas dimensiones para evaluar correctamente una variante más grande.

### 7. Modificar intensidad, apertura o emisión durante la defensa

**Sin editar código:** usar el panel de `desarrollo/index.html` permite demostrar en vivo las propiedades existentes. W/A/S/D y C siguen disponibles; las flechas editan el control enfocado.

**Para cambiar el predeterminado:** en `desarrollo/src/escena.js`, buscar `controlesLuz`. En el registro de `clave: 'izquierdo'`, cambiar `valor: 85` por `valor: 120`. Al recargar, `configurarPanelLuces → restablecerIluminacion → aplicarIluminacion` asigna 120 a `faros[0].intensity`. Restablecer vuelve a 120, porque ahora ese es el predeterminado. Cambiar solo `AJUSTES.intensidadFaros` no basta: el panel lo sobrescribe al finalizar el inicio.

En el registro `clave: 'apertura'`, `valor` está en grados de **semiángulo**; `aplicarIluminacion` usa `degToRad`. Por ejemplo 30 produce un cono total de 60°. `clave: 'alcance'` modifica ambos `distance` y la profundidad de cámara de sombras; mantenerlo positivo. Los rangos `min`, `max` y `paso` controlan qué puede elegir el usuario: ampliar un máximo del slider no modifica por sí mismo el valor actual.

En `clave: 'ventanas'`, aumentar `valor` de 1 a 2 cambia `emissiveIntensity`, no crea luz sobre la calle. El color cálido de emisión está en `crearEdificio`, en `ventanaPrendida.emissive` del constructor, actualmente `0xf9d58d`. Cambiarlo modifica el brillo propio de todas las ventanas encendidas; la textura de la ciudad no existe como recurso externo.

**Color de un faro:** primer argumento de `new THREE.SpotLight(0xffefd3, ...)` en `crearFaros`. El panel no tiene selector ni sobrescribe el color de esa fuente. Los faroles visibles usan otro material y `aplicarIluminacion` fija su color por separado; una luz azul podría conservar una pieza amarilla si no se revisa también esa representación. No confundir intensidad de una luz con `renderer.toneMappingExposure`: esta última altera la presentación global, no solo un foco.

### 8. Cambiar sombras y verificar sus tres requisitos

**Archivos:** todo en `desarrollo/src/escena.js`. Las sombras necesitan simultáneamente:

1. `inicializarRenderer`: `renderer.shadowMap.enabled = true`.
2. `crearFaros`: cada `luz.castShadow = true`.
3. Mallas sólidas creadas con `caja(..., true, true)` para proyectar y recibir, según su papel.

Como ejercicio, poner el penúltimo argumento de la creación de `cuerpo` en `crearEdificio` en false impide que esos cuerpos proyecten sombras, pero no elimina sus colisiones. Dejar el último argumento true permite recibirlas. Techos y otras mallas conservan sus propias banderas, por lo que todavía podrían proyectar sombras: cambiar el cuerpo no desactiva todo el edificio.

Aumentar `luz.shadow.mapSize.set(512,512)` a `(1024,1024)` en `crearFaros` multiplica por cuatro los texeles de cada mapa; puede mejorar detalle y aumentar memoria/costo. No activar sombras de todas las PointLight para este ejercicio sin evaluar rendimiento. Aumentar luz ambiental puede hacer menos perceptible una sombra aunque sus tres requisitos estén activos.

### 9. Ajustar resolución de colisiones y velocidad

**Archivo:** `desarrollo/src/escena.js`, constantes `PASO_COLISION` y `CONDUCCION`. Cambiar 0.08 a 0.04 aumenta aproximadamente al doble los subpasos de un movimiento dado. Mantenerlo estrictamente positivo: cero o negativo no representa una tolerancia válida para `cantidadPasos` y puede producir resultados inválidos o bucles excesivos.

Cambiar `CONDUCCION.velocidadMaxima` de 12 a 16 permite llegar a un tope mayor, pero no aumenta aceleración. Crece la distancia por frame, `cantidadPasos` y el trabajo de consultas. Revisar frenado, cámara, giro en esquinas y rendimiento. No desactivar comprobación para recuperar velocidad de ejecución: el sistema dejaría de cumplir su objetivo.

`PASO_COLISION` es resolución del recorrido, no tamaño del auto ni distancia mínima al edificio. Si un contacto ocurre antes de tocar visualmente, revisar `FORMA_AUTO` y los límites Box3 en lugar de aumentar arbitrariamente el paso.

### 10. Ajustar la ayuda visual de cámara

**Archivo:** `desarrollo/src/escena.js`. **Función:** `despejarVistaCamara()`. Cambiar `objeto.material.opacity = 0.18` a 0.35 vuelve más visibles las estructuras interpuestas y puede dificultar ver el auto. No modifica colisión ni intensidad de luz. Al despejarse el rayo, la función restaura opacidad 1, transparencia false y escritura de profundidad true.

No usar ese mecanismo para materiales cuyo estado inicial deba ser transparente: la restauración actual supone materiales opacos. Si el profesor pregunta por un vidrio permanente, explicar que requeriría conservar/restaurar estados originales, lo cual no está implementado en V5. La ayuda prueba un rayo hacia el centro, no todos los píxeles; una esquina del auto puede seguir parcialmente oculta.

### Errores comunes, causas y solución

| Síntoma | Causa posible en el código real | Qué revisar o corregir |
| --- | --- | --- |
| `ColisionesCiudad is not defined` | `colisiones.js` no se cargó antes de `escena.js` | En `index.html`, conservar orden Three.js → colisiones → escena y rutas `./src/...` |
| Un valor cambia al inicio pero vuelve al anterior | Se editó solo AJUSTES o constructor y el panel aplica predeterminados | Editar el `valor` de la clave correcta en `controlesLuz` |
| Auto atraviesa el nuevo bloque | Se agregó malla sin registro | Agregarla al padre y llamar a `registrarObstaculo` antes de iniciar movimiento |
| Colisión invisible en la posición antigua | Se movió/eliminó una malla después del registro | Editar ubicación en su constructor y recargar; V5 no tiene actualización automática de obstáculos |
| Auto toca con una esquina pero el centro está libre | La huella orientada es mayor que el punto central | Comportamiento esperado; separar el auto antes de girar |
| Se ve carrocería penetrando | Geometría o escala creció sin actualizar FORMA_AUTO | Recalcular semiancho/semilargo incluyendo accesorios y margen |
| El auto no arranca tras editar ciudad | `iniciar` detecta pose inicial ocupada | Revisar `crearVehiculo` y ubicación de estructuras, no suprimir la validación |
| Aumentar altura no cambia el choque horizontal | Colisiones usan solo X/Z | Es correcto para V5; un desnivel necesita otro modelo y corresponde a V6 |
| Se perdió el patrón de ventanas | Se cambió `indice`, altura o condición módulo | Revisar `filas`, bucles f/c y expresión `% 3` en `crearEdificio` |
| Ventana muy brillante pero suelo oscuro | Emisión de material no es una fuente | Usar luces existentes para iluminar; no esperar rebote o iluminación global |
| Un edificio transparente continúa bloqueando | La transparencia es solo de cámara | Comportamiento esperado; no borrar el registro para hacerlo visible |
| Prueba exige 32 obstáculos y ahora hay 33 | El ejercicio agregó intencionalmente un sólido | Revisar expectativa de cantidad y mantener las pruebas de no penetración/calles libres |
| Se editaron cinco objetos cuando se quería uno | Cambio en constructor compartido o dentro de forEach | Condicionar por el índice de manzana o editar una llamada específica |
| Un cambio de distribución no produce efecto | Se modificó `separacionEntreManzanas`, sin uso | Modificar `posiciones` y revisar calles/postes por separado |

## Lectura de operaciones internas para explicar sin memorizar

`const` impide reasignar una referencia, no volver inmutable un objeto: `FORMA_AUTO.semiancho` es una propiedad, y `obstaculos.push(...)` agrega registros a un array constante. El programa actual usa esos parámetros como configuración de inicio; no proporciona interfaz para editarlos durante la conducción.

`forEach` ejecuta un callback por elemento; `i` es un índice empezando en cero. `i % 2` alterna tipos de construcciones; `Math.floor` convierte una cuenta de filas a entero inferior y `Math.max(1,...)` exige al menos una fila. `some` en `posicionLibre` deja de buscar al encontrar una colisión; `!` invierte el resultado para devolver «libre» en vez de «ocupado».

`Math.abs` usa magnitud sin signo, necesario para proyectar extensiones hacia ambos lados. `Math.sin`/`Math.cos` reciben radianes. `Math.ceil` redondea N hacia arriba para que el recorrido por paso no exceda el umbral. `Math.hypot(a,b)` calcula la diagonal mediante raíz de a²+b². `Math.sign` identifica avance/reversa; `|| 1` permite giro en reposo. `break` termina los subpasos después de un bloqueo, evitando consumir la distancia restante calculada con la velocidad anterior al impacto.

`updateWorldMatrix(true,true)` actualiza antecesores y descendientes antes de medir el sólido. `Box3.setFromObject` produce una caja mundial alineada a los ejes y no una referencia que siga automáticamente al objeto. Registrar antes de agregar al padre daría una caja en coordenadas equivocadas si el padre está desplazado. Rotar un edificio y volver a medirlo produciría una envolvente AABB mayor que la planta exacta; el SAT del auto sigue funcionando conservadoramente.

`Group` permite que las piezas compartan transformación. `Mesh` combina geometría y material; las luces son objetos distintos. `userData.tipoObstaculo` añade una etiqueta útil para inspección, pero no decide si se bloquea: lo decide la presencia en `obstaculos`. `materialesAtenuados` es Set para no restaurar varias veces el mismo material compartido entre ventanas; `oclusoresCamara` y `obstaculos` son colecciones independientes, visual una y geométrica la otra.

### Ejemplo de un frame completo con números

Supongamos auto a 12 u/s en crucero, ángulo 0, sin giro y Δt=1/60. `actualizarVelocidad` mantiene 12 y la velocidad media vale 12; distancia=0.2 y giroTotal=0. `cantidadPasos` devuelve `ceil(0.2/0.08)=3`; cada paso propone aproximadamente 0.0667 hacia -Z.

En cada paso `posicionAutoLibre` valida la orientación actual y luego la posición candidata. Si los dos primeros pasan y el tercero no, el auto ya conserva el avance válido de los dos primeros. La rama bloqueada puede aceptar una componente libre; no se revierte el frame entero. Después `detenerPorColision` pone `velocidadActual`, `tiempoAcelerando` y `marchaAcelerando` en cero; `desactivarCrucero` pone flag false y velocidad fijada cero. `break` evita más pasos. La cámara sigue la última posición válida y el indicador muestra cero/desactivado antes de renderizar.

Si lo que falla es un giro, se conserva el ángulo anterior; todavía se prueba la traslación de ese subpaso con el ángulo aceptado y luego se detiene por el bloqueo. Esa distinción explica que girar contra una pared no equivalga siempre a revertir toda traslación del frame. Al siguiente frame S puede proponer alejarse. No hay reactivación automática de crucero.

### Comprobar y explicar una modificación

Después de editar un ejercicio, comprobar primero sintaxis con `node --check desarrollo/src/escena.js` (y `colisiones.js` si se modificó). Luego usar las suites de colisiones/iluminación y abrir el HTML para revisar sombras, transparencia, contacto y circulación. Las pruebas contienen expectativas del escenario cerrado, por ejemplo cantidades y límites: si cambian por un ejercicio, distinguir una expectativa desactualizada de una regresión real. No borrar una prueba fallida sin entender por qué falló.

El resultado del ensayo no reemplaza automáticamente el respaldo V5. Restaurar el código activo al estado deseado después de practicar y conservar la versión cerrada como referencia. No se han aplicado estos ejercicios durante el cierre.

## Reserva para V6

La calzada vertical centrada en X=39, ancho 8 (X de 35 a 43), queda despejada entre Z=-34 y Z=34. Se reservan 68 unidades longitudinales para aproximación, subida, bajada y salida de una futura lomada. No se agrega geometría de desnivel ni lógica de inclinación. Postes cercanos están en X=34.5, fuera de esa franja; casas/comercios del bloque X=26 terminan antes de la calle. Las pruebas recorren el eje completo sin colisión.

## G. Preguntas de defensa oral

**¿Por qué no basta una coordenada del auto?** Porque la carrocería tiene extensión. Un centro libre puede tener su paragolpes dentro del obstáculo; la huella orientada comprueba ancho, largo y ángulo.

**¿Qué hace SAT?** Busca un eje que separe las proyecciones. Si existe uno no hay intersección; si se superponen en los cuatro ejes relevantes, los rectángulos se intersectan.

**¿Dónde se registran los obstáculos?** En las funciones constructoras, después de ubicar los sólidos. `registrarObstaculo` calcula Box3 mundial y guarda un registro uniforme; el movimiento no necesita conocer cada edificio por nombre.

**¿Por qué usar cajas para edificios?** Los cuerpos son cajas estáticas alineadas con XZ. La AABB coincide con sus plantas; para sólidos futuros rotados sería una envolvente conservadora, posiblemente más grande que la forma real.

**¿Por qué no chocan ventanas o copas?** Son detalles o elementos elevados; V5 registra explícitamente solo cuerpos/troncos/soportes/muros. El plano XZ no resuelve altura del vehículo ni desniveles; la elección de sólidos respeta esa simplificación.

**¿Cómo evita atravesar un poste rápido?** Divide distancia y giro en pasos cuyo recorrido combinado de esquina es como máximo 0.08, y valida cada uno antes de asignarlo. El poste más fino mide 0.22.

**¿Cómo impide atravesar una pared girando?** Comprueba la nueva huella angular en cada subpaso, incluso sin traslación. Si no cabe, conserva el ángulo anterior.

**¿Puede girar detenido?** Sí, V5 usa sentido +1 cuando la velocidad media es cero. Solo permite orientaciones libres; no fuerza a la geometría a atravesar un sólido.

**¿Qué sucede al chocar en crucero?** Se conserva el último estado válido, se permite un componente tangencial libre si existe, se pone velocidad cero, reinicia rampa y cancela crucero. El indicador se actualiza en el mismo frame. No se reactiva solo.

**¿Por qué no rebota ni vibra?** No corrige una penetración expulsando al auto; rechaza el candidato antes de aplicarlo y no conserva velocidad acumulada contra el obstáculo.

**¿Cómo sale de un contacto?** La reversa propone alejar la huella; si es libre se acepta. Si la dirección bloquea una esquina, se puede soltar A/D, retroceder recto y luego girar con espacio.

**¿Por qué una construcción transparente sigue bloqueando?** La transparencia es un recurso visual de cámara; el registro de colisión es independiente de materiales y no se elimina.

**¿Dónde está la lomada?** Todavía no existe. Solo se reservó la calle X=39, Z entre -34 y 34 para V6.

## Validación y límites prácticos

Se ejecutan comprobaciones de sintaxis de ambos scripts, `node desarrollo/pruebas/colisiones.test.cjs` y `node desarrollo/pruebas/iluminacion.test.cjs`. Ambas reutilizan la suite de conducción. Las pruebas cargan Three.js real con DOM y renderer simulados. Para acceder a funciones privadas, el arnés inserta una referencia de pruebas solo en el texto ejecutado en la VM; el archivo de producción no publica esa API.

Se comprueban cinco veredas y 32 obstáculos; posición inicial libre; ejes de las siete calles y reserva V6 transitables; diferencia entre auto orientado y punto; bloqueo de edificios, troncos, postes y muros; subpasos con propuestas de 30 unidades; persistencia contra pared; reversa y giro libre; giro bloqueado por esquina; deslizamiento; cancelación de crucero a 30/60/120 FPS; restauración de opacidad; encuadre, cámara, faros y controles de iluminación. Los recorridos de crucero en curva se trasladaron al sector libre porque el recorrido antiguo de pruebas atravesaba construcciones, ahora correctamente sólidas.

Resultado de pruebas lógicas: aprobado. El autor confirmó que V5 fue implementada y probada para su cierre. Esta confirmación se distingue de las pruebas automatizadas, que no renderizan WebGL ni evalúan comodidad, píxeles o rendimiento de GPU. La guía conserva comprobaciones visuales para repetir en otros equipos. El HTML contiene todas las rutas locales necesarias y no se cambió la biblioteca.

Limitaciones: colisiones estáticas 2D, sin pendientes, sin colisión de cámara física, sin física de contacto y sin barreras en veredas. La forma del auto y el umbral deben revisarse si cambia su geometría o escala.

### Cierre y ejecución independiente

El respaldo `versiones/V5_Ciudad_Colisiones/` incluye todos los archivos de `desarrollo`, documentación anterior y esta ampliación. Se comparan sus archivos mediante SHA-256 y se verifica que el HTML cargue su propio Three.js, `src/colisiones.js` y `src/escena.js`, en ese orden. El CSS está dentro del HTML. La copia no depende de `desarrollo` ni de los respaldos anteriores para ejecutarse.

Los scripts de prueba del autor se ejecutan desde `desarrollo` dentro del repositorio: incluyen una comparación de biblioteca contra V1. Esa referencia no se carga desde el HTML ni afecta la independencia de la aplicación. No se modifica código funcional durante el cierre; la indicación «V5 en desarrollo» del HTML se conserva tal como fue probada y el estado oficial se registra en la documentación. No se realizan commits, push ni etiquetas.
