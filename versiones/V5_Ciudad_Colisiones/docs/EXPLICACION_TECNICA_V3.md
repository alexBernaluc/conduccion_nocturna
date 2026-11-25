# Explicación técnica — V3: iluminación dinámica y controles

Estado: V3 cerrada oficialmente el 13/11/2026 tras la confirmación del autor de que fue probada y funciona correctamente. Respaldo completo en `versiones/V3_Iluminacion_Dinamica/`. `desarrollo/` continúa como carpeta activa; V1/V2 y sus documentos se conservan intactos. La guía breve de esta etapa es [GUIA_VERSION_3.md](GUIA_VERSION_3.md).

Las rutas de código de este documento son relativas a la carpeta de la aplicación: tanto `desarrollo/` como el respaldo contienen su propio `index.html`, `src/escena.js` y `vendor/three.min.js`. Los estilos están incluidos en el bloque `<style>` del HTML; no hay un archivo CSS externo que deba descargarse o copiarse por separado.

## 1. Archivos y cambios respecto de V2

`index.html` mantiene scripts clásicos, biblioteca local, canvas y textos superpuestos. Añade CSS y un `details` plegable con id `panel-luces`, un contenedor `deslizadores-luz`, el fieldset `grupos-luz` y el botón `restablecer-luces`. Los controles individuales se crean desde JavaScript para no duplicar sus valores entre HTML y código. El panel tiene altura limitada y scroll; las etiquetas y salidas están asociadas a los controles. El overlay de error tiene z-index 10 para quedar encima del panel.

`src/escena.js` conserva el escenario, funciones de movimiento y cámara. Añade referencias a luces/materiales, configuración de controles y aplicación de iluminación. `pruebas/movimiento.test.cjs` adapta su DOM simulado al panel y exporta utilidades; `pruebas/iluminacion.test.cjs` prueba eventos y efectos sobre objetos reales de Three.js sin renderizar WebGL. No son dependencias de ejecución del HTML.

Los documentos nuevos son esta explicación y la guía V3. No hay nueva biblioteca, nuevos modelos, luces adicionales, modificaciones del mapa ni nuevas funciones de conducción.

### Variables nuevas y referencias conservadas

| Nombre | Contenido / propósito |
| --- | --- |
| `luzAmbiente`, `luna` | Referencias compartidas a las luces antes locales de `crearEscena` |
| `materialesVentanas` | Diez materiales emisivos, uno por edificio, compartidos entre sus ventanas encendidas |
| `focosVisibles` | Siete mallas esféricas de postes para oscurecer su apariencia al apagar |
| `farolesVisibles` | Dos mallas delanteras con materiales separados para cambiar cada una por separado |
| `controlesLuz` | Ocho objetos con `clave`, `nombre`, `valor`, `min`, `max`, `paso` |
| `gruposLuz` | Nombres de los cinco grupos con interruptor |
| `valoresLuz` | Valores numéricos actuales elegidos en deslizadores |
| `gruposEncendidos` | Booleanos de activación, independientes de los valores numéricos |
| `entradasLuz`, `salidasLuz`, `interruptoresLuz` | Referencias DOM para actualizar sliders, valores visibles y casillas al restablecer |

Se reutilizan `faros` y `lamparas` de V2. No se buscan luces recorriendo la escena en cada fotograma. Todos los nuevos estados están dentro de la función autoejecutable; no se exponen globalmente. Los valores de `AJUSTES` se usan al construir y el panel aplica sus propios valores iniciales inmediatamente después. Para modificar los valores predeterminados de la interfaz, corresponde editar `controlesLuz`.

## 2. Flujo exacto de ejecución

1. Al abrir `index.html`, el navegador crea el DOM y sus estilos, incluido el panel vacío y su botón.
2. Carga `vendor/three.min.js` local. Se mantiene el fallback CDN anterior si falta `THREE`; con la biblioteca incluida no se ejecuta y no se necesita Internet. No se usa import/export ni fetch.
3. Carga `src/escena.js`, ejecuta la función autoejecutable, comprueba `THREE`, crea parámetros, arrays y referencias y llama a `iniciar()`.
4. `inicializarRenderer()` crea el renderizador, configura sombras y agrega su canvas a `#app`. Ahora el canvas tiene `tabIndex = 0` para recibir foco mediante clic o Tab.
5. `crearEscena()` crea Scene, fondo, niebla, `luzAmbiente` hemisférica y `luna` direccional. Las referencias permanecen disponibles para el panel.
6. `crearTerreno()`, `crearCalles()` y `crearManzanas()` construyen el mapa. Cada llamada a `crearEdificio()` agrega su material de ventanas encendidas a `materialesVentanas`.
7. `crearAlumbrado()` llama a `crearPoste()` siete veces; guarda cada foco visible y cada `PointLight` en arrays paralelos.
8. `crearVehiculo()` construye el auto y guarda los faroles visibles en orden X negativo, X positivo. `crearFaros()` construye las dos luces y objetivos en ese mismo orden.
9. `configurarCamara()` coloca la cámara y `configurarControles()` registra los eventos de conducción, como en V2.
10. `configurarPanelLuces()` recorre el catálogo, crea inputs de rango con etiquetas y outputs, registra `input`, crea las casillas y registra `change`, registra `focusin` y conecta el botón mediante `click`.
11. `restablecerIluminacion()` asigna todos los predeterminados, muestra los valores, marca todas las casillas y llama a `aplicarIluminacion()`. Es fundamental hacerlo después de construir luces y materiales.
12. `iniciar()` registra `resize` y solicita el primer `requestAnimationFrame(animar)`.
13. En cada frame, `animar(tiempoActual)` calcula `deltaTime`, llama a `actualizarMovimiento`, `actualizarCamara`, `renderer.render` y solicita el próximo frame. No se recrean controles ni luces en ese bucle.

### Desde un deslizador hasta el resultado visual

Este callback está dentro de `configurarPanelLuces()`:

```js
entrada.addEventListener('input', function () {
  valoresLuz[control.clave] = Number(entrada.value);
  salida.textContent = valoresLuz[control.clave].toFixed(2);
  aplicarIluminacion();
});
```

`input` se dispara mientras se arrastra o se usa el teclado, sin esperar a soltar el ratón. La propiedad DOM `value` es texto y `Number` la convierte a número. La clausura recuerda qué `control`, `entrada` y `salida` corresponden a esa fila. `toFixed(2)` solo redondea la presentación: no cambia el valor almacenado.

`aplicarIluminacion` asigna inmediatamente propiedades de Three.js, por ejemplo `luz.intensity`. El siguiente render muestra el resultado. No se reconstruye la luz ni hace falta renderizar una segunda vez desde el evento. Los eventos y RAF se procesan secuencialmente en el hilo principal del navegador; el callback actualiza propiedades que el siguiente frame leerá.

Una casilla utiliza `change`, lee `entrada.checked` y modifica `gruposEncendidos[clave]`; luego recorre la misma aplicación centralizada. Separar valores y activación permite apagar, cambiar intensidad y volver a encender conservando la selección.

## 3. Funciones nuevas y modificadas

Todas las funciones de producción están en `src/escena.js`. Las nuevas no devuelven resultados explícitos, excepto `flechaEnPanel`, utilizada como condición.

### `configurarPanelLuces()` — nueva

Sin parámetros, llamada una vez por `iniciar` después de crear objetos. Necesita los IDs HTML del panel y todos los arrays de luces/materiales. Por cada entrada de `controlesLuz` crea `div`, `label`, `input` y `output`, configura rango y paso, asocia `htmlFor` y el atributo `for`, y guarda referencias DOM. Los límites nativos del input restringen lo que selecciona el usuario; no es una API para valores arbitrarios externos.

Los callbacks `input` y `change` actualizan estado y llaman a `aplicarIluminacion`. El callback `focusin` elimina las cuatro flechas del conjunto `teclas` para que una flecha de conducción no quede activa al entrar al panel. Registra el `click` del botón y llama a `restablecerIluminacion`. Sin esta función el HTML mostraría los contenedores vacíos y no habría conexiones con las luces.

### `aplicarIluminacion()` — nueva

Sin parámetros; la llaman los callbacks y `restablecerIluminacion`. Lee `valoresLuz` y `gruposEncendidos`. Modifica los dos focos, las siete luces públicas, las dos luces base y diez materiales emisivos. No altera posiciones, rotaciones, velocidades, cámara ni jerarquía.

```js
luz.intensity = valoresLuz[i === 0 ? 'izquierdo' : 'derecho'];
luz.visible = gruposEncendidos.faros && luz.intensity > 0;
luz.distance = valoresLuz.alcance;
luz.angle = THREE.MathUtils.degToRad(valoresLuz.apertura);
```

`faros[0]` corresponde al X local negativo (-0.77), izquierda del conductor mirando hacia -Z; `faros[1]` es el derecho. Es el orden real de `crearFaros` y `crearVehiculo`, no el lado aparente de la pantalla durante un giro.

Con `visible = false` la fuente no participa en la iluminación de la escena, pero no se elimina ni pierde su intensidad elegida. Los faroles y esferas cambian a `0x26303a` cuando su fuente se apaga y recuperan el color brillante al encender. Esto es una indicación binaria: su material básico no representa proporcionalmente cada nivel de intensidad.

La función también ajusta `shadow.camera.far` al alcance y actualiza su matriz de proyección. Para ventanas asigna `emissiveIntensity`, sin crear una fuente de luz. Si se quitara esta función los controles cambiarían números en pantalla, pero no la iluminación.

### `restablecerIluminacion()` — nueva

Sin parámetros. La llaman la configuración inicial y el botón. Recorre `controlesLuz`, copia `valor` a estado e input, actualiza outputs; luego marca todos los grupos como encendidos y sus checkboxes. Finalmente llama a `aplicarIluminacion`. No llama a `iniciar`, no reconstruye escena y no reposiciona auto/cámara. Los cambios no se guardan en almacenamiento persistente: recargar también comienza con predeterminados.

### `flechaEnPanel(evento)` — nueva

Comprueba si `evento.code` empieza por `Arrow` y si el elemento destino tiene un ancestro `#panel-luces` mediante `closest`. Se usa como condición verdadera/falsa en los manejadores del teclado. El cortocircuito puede devolver un valor falso no booleano cuando no hay target; en eventos DOM normales hay destino. No modifica el estado.

### Manejadores del teclado — modificados

`alPresionarTecla` primero ignora códigos ajenos a conducción; si es una flecha en el panel retorna sin `preventDefault`, dejando la edición nativa. En otro caso mantiene el comportamiento V2: evita la acción predeterminada y añade a `teclas`. WASD se interpreta siempre como conducción, incluso sobre un slider, casilla o botón; no hay campos de texto en este panel.

`alSoltarTecla` siempre elimina una tecla de conducción del conjunto aunque se haya soltado sobre un control. Solo evita su acción predeterminada cuando no es una flecha del panel. Así no queda movimiento activo al cambiar de foco entre `keydown` y `keyup`. Tab, Enter y Espacio no pertenecen a conducción y mantienen accesibilidad nativa. `blur` y `visibilitychange` siguen llamando a `reiniciarEntrada`.

### Cambios pequeños en funciones existentes

- `crearEscena`: conserva las mismas fuentes, ahora asigna las referencias compartidas `luzAmbiente` y `luna` en lugar de ocultarlas como constantes locales.
- `crearEdificio`: cambia ventanas de material básico a estándar, añade `emissive` y `emissiveIntensity` a las encendidas y guarda su material. El patrón de ventanas apagadas y encendidas sigue siendo el cálculo con módulo 3 de V1.
- `crearPoste`: añade la esfera a `focosVisibles` sin moverla ni cambiar la cantidad de luces.
- `crearVehiculo`: crea un material básico separado por farol delantero para oscurecerlos independientemente; guarda las mallas. Carrocería, ruedas y posición inicial se conservan.
- `inicializarRenderer`: añade `tabIndex` al canvas; conserva antialias, exposición 1.35, ACES y sombras PCF.
- `iniciar`: llama a `configurarPanelLuces` después de controles de conducción y antes del primer frame.

`actualizarMovimiento`, `actualizarCamara`, `animar` y `crearFaros` conservan sus operaciones. No se agrega lógica de velocidad crucero ni aceleración.

## 4. Fuentes y significado de sus propiedades

| Tipo real | Cantidad | Uso y limitación |
| --- | ---: | --- |
| `HemisphereLight` | 1 | Luz base con color superior `0x9cb8e4` e inferior `0x344126`; varía según normal de superficie, no proyecta sombras |
| `DirectionalLight` | 1 | Luna `0x8ba5df`, posición (-24,35,14), dirección hacia objetivo en origen; sin atenuación por distancia y sin sombras activadas |
| `PointLight` | 7 | Postes cálidos `0xffd6a1`, alcance 18 y decaimiento 2; iluminan en todas direcciones, sin sombras |
| `SpotLight` | 2 | Faros `0xffefd3`, cono orientado por target, decaimiento 1.7 y penumbra 0.52; únicos proyectores de sombras |

No existe `AmbientLight`; el control «ambiental» modifica la hemisférica. No se añadieron luces: siguen siendo once.

**Intensidad** regula la contribución luminosa. Cero impide contribución y el panel oculta además esa luz para evitar procesarla como activa. Los valores de tipos diferentes no se deben comparar como si produjeran el mismo brillo visual: influyen geometría, orientación, alcance, atenuación y materiales.

**Distancia** en los focos es el corte de alcance; aumentar de 34 a 60 permite iluminar superficies más lejanas, pero no elimina el decaimiento. Se permite 5–60 y no cero, porque en Three.js cero significa ausencia de corte de distancia, no apagar.

**Apertura** es el semiángulo del cono. El panel usa grados y `degToRad` convierte para `SpotLight.angle`. El predeterminado `180/7` grados equivale exactamente a π/7 radianes y se muestra 25.71. El input usa `step='any'` para conservar ese valor sin redondearlo a un paso; el texto mostrado se redondea. A 60°, el ángulo total es 120°. Una apertura mayor cubre más superficie y distribuye la resolución de sombras sobre una región más amplia; no cambia por sí sola la intensidad seleccionada ni la dirección central.

**Color** determina la composición cromática. Se mantiene fijo en cada fuente; no se agregó selector. Cambiar `luz.color` en código variaría el tono, no el alcance ni el ángulo. El color de la luz y el material interactúan; una superficie no cambia de geometría al recibir otra iluminación. La exposición y el mapeo de tonos comprimen el resultado: duplicar intensidad no garantiza duplicar el brillo percibido.

## 5. Materiales emisivos frente a iluminación real

```js
const ventanaPrendida = new THREE.MeshStandardMaterial({
  color: 0x2a4055, emissive: 0xf9d58d, emissiveIntensity: 1
});
materialesVentanas.push(ventanaPrendida);
```

`color` controla la parte de la superficie que responde a luces. `emissive` añade una contribución propia cálida y `emissiveIntensity` la escala. No es una luz oculta: una ventana con emisión 4 se ve brillante, pero no ilumina aceras ni proyecta un cono ni produce sombras como fuente. No hay iluminación global, rebote luminoso ni bloom. Las ventanas inicialmente apagadas usan material estándar sin emisión y responden a iluminación externa.

Al apagar el grupo se pone `emissiveIntensity = 0`; la ventana sigue existiendo y puede ser visible por luz externa. Solo se modifica la emisión de las ventanas originalmente encendidas, conservando la distribución original. Las ventanas de un mismo edificio comparten el material y cambian juntas; se recorren diez materiales, no una luz por ventana.

```js
material.emissiveIntensity = gruposEncendidos.ventanas ? valoresLuz.ventanas : 0;
```

Los faroles visibles y las esferas de postes siguen con `MeshBasicMaterial`: no responden a luz externa ni aportan iluminación al entorno. Su cambio a gris oscuro es un indicador visual del estado. No se eliminaron sus mallas para apagar luces.

## 6. Sombras dinámicas y costo

Se conservan `renderer.shadowMap.enabled = true`, `THREE.PCFShadowMap`, mapas 512×512 por faro, cámara cercana 0.5 y bias -0.0002. Las banderas `castShadow`/`receiveShadow` de los objetos siguen iguales. Solo los dos SpotLight tienen `castShadow = true`; los siete postes y la luna no añaden mapas. Con foco apagado (`visible=false`) no se procesa como fuente visible de sombras. Encenderlo lo incorpora nuevamente, con sus parámetros actuales.

Al variar alcance, `aplicarIluminacion` pone `luz.shadow.camera.far = luz.distance` y llama a `updateProjectionMatrix`. Durante el render Three.js r158 ajusta la cámara de sombras del SpotLight según su ángulo, alcance y orientación. Por eso un cono más amplio requiere una región de sombra más amplia; no se cambia el tamaño de textura. `autoUpdate` conserva el comportamiento predeterminado de Three.js: los mapas de las luces activas se actualizan al renderizar, incluyendo el movimiento del auto.

No se activa un mapa de sombra por ventana o poste. Aumentar alcance y apertura puede reducir el detalle de sombras al cubrir más mundo con los mismos 512×512 texeles. El panel no ofrece resolución ni bias porque no se requieren para el experimento. La luz ambiental o pública puede aclarar una superficie sombreada por un faro; eso no significa que se haya desactivado su sombra. Como la luna y postes no tienen sombras, no comprueban oclusión de edificios para su contribución.

## 7. Movimiento, cámara y faros

La traslación sigue usando `(-sin(ángulo),0,-cos(ángulo))`, escalado por marcha, velocidad 12 y `deltaTime`. La rotación Y mantiene 1.6 rad/s, invertida en reversa. El tiempo se limita a 0.05 s y los límites X ±51/Z ±40 permanecen. La cámara actualiza matrices antes de `localToWorld`, interpola con `1-exp(-8*deltaTime)` y mira al auto.

`crearFaros()` mantiene `auto.add(luz)` y `auto.add(luz.target)`. La fuente local `(x,1,-2.38)` y el objetivo `(x,0.2,-20)` definen la dirección local `(0,-0.8,-17.62)`. Trasladar ambos añade la misma cantidad y no cambia la dirección; rotar el padre rota fuente y objetivo juntos. El panel nunca mueve ni separa esos objetos: solo cambia propiedades fotométricas, alcance y apertura. Apagar no elimina el padre ni el objetivo. Por eso las luces conservan su dirección al reactivarse después de conducir.

## 8. Parámetros y ejemplos prácticos

| Control | Predeterminado / rango | Al aumentar / disminuir |
| --- | --- | --- |
| Cada faro | 85 / 0–200 | Más/menos iluminación en su cono; cero apaga ese foco |
| Público | 23 / 0–60 | Cambian los siete postes a la vez; alcance sigue 18 |
| Ambiental | 0.50 / 0–2 | Aclara/oscurece base y reduce/aumenta contraste relativo de faros |
| Luna | 0.37 / 0–2 | Más/menos contribución direccional sin nuevas sombras |
| Ventanas | 1 / 0–4 | Más/menos brillo propio sin iluminar calles |
| Alcance | 34 / 5–60 | Mayor/menor región iluminada y profundidad de cámara de sombra |
| Semiángulo | 180/7° / 10–60° | Cono más ancho/estrecho, sin cambiar target |

Ejemplo: bajar el faro izquierdo a cero y subir el derecho a 150 permite distinguir sus contribuciones. El izquierdo conserva su relación con el auto, pero su `visible` es falso y su farol se oscurece. Restablecer vuelve ambos a 85.

Ejemplo: apagar luna, ambiente y alumbrado aísla los faros. Al conducir y ampliar el cono se observan cambios de área iluminada y de sombras. La geometría y los materiales estándar no se reemplazan; su respuesta cambia con la iluminación recibida.

Ejemplo: apagar el grupo faros, cambiar alcance a 50 e intensidad a 120 y encenderlo recupera esos valores nuevos. Los interruptores no sobrescriben los números. Restablecer, en cambio, sobrescribe todos los números y enciende todos los grupos.

Ejemplo: elevar emisión de ventanas a 4 con las luces reales apagadas muestra la diferencia entre apariencia luminosa e iluminación del ambiente. La calle continúa oscura, salvo otras contribuciones visuales existentes. No se representa propagación de luz desde esas ventanas.

## 9. Preguntas para la defensa oral

**¿Cómo llega un cambio HTML a la escena?** El evento `input` lee el valor como número, lo guarda por clave y llama a `aplicarIluminacion`. Esta modifica objetos ya existentes; el siguiente `renderer.render` utiliza sus propiedades nuevas.

**¿Por qué usar input en lugar de esperar al botón?** Se necesita respuesta durante el arrastre. El botón solo restablece; no confirma cambios.

**¿Cómo se controla cada faro?** El índice del array corresponde al orden de construcción: -X es izquierdo y +X derecho desde el conductor. Se elige una clave distinta de intensidad por índice; alcance y apertura son compartidos.

**¿Por qué guardar referencias a la luna y a materiales?** Las variables locales de construcción dejarían de ser accesibles al panel. Referencias compartidas permiten modificar los objetos sin volver a crearlos ni buscar por escena en cada frame.

**¿Apagar borra una luz?** No, cambia `visible`. La intensidad seleccionada queda almacenada y se usa al encender. Las ventanas apagan su emisión, no su malla.

**¿Qué ocurre con intensidad cero y casilla marcada?** La fuente se considera activa por grupo, pero se establece `visible=false` por intensidad cero. La casilla conserva la intención del grupo; subir intensidad la vuelve visible.

**¿Por qué no usar una PointLight por ventana?** Añadiría muchas fuentes y costo. El objetivo es representar brillo propio, que se consigue con material emisivo. Emitir color no equivale a iluminar vecinos.

**¿Apertura es el ángulo total?** No. Three.js usa semiángulo: 25.71° corresponde a unos 51.43° de cono completo. Se convierte de grados a radianes antes de asignarlo.

**¿Las sombras se congelan al tocar el panel?** No. El bucle continúa, los faros activos y los objetos mantienen actualización de matrices y mapas de sombras. Solo se procesan sombras de los dos focos.

**¿Por qué las flechas no conducen mientras ajusto un slider?** `flechaEnPanel` detecta el destino del evento y deja actuar al control. WASD sigue conduciendo. Al entrar se limpian flechas antiguas, y keyup elimina la tecla incluso si se suelta sobre el panel.

**¿Restablecer reinicia la partida?** No. Solo restaura valores de iluminación y casillas. No modifica la transformación del auto ni la cámara.

**¿Qué sucede al subir mucho la ambiental?** Aumenta la base iluminada y reduce el contraste perceptible de las sombras de faros; no cambia `castShadow` ni crea nuevos mapas.

**¿Qué conserva el funcionamiento offline?** Todos los recursos necesarios siguen locales, el HTML carga scripts clásicos y no hay nuevas peticiones de recursos. Se conserva el fallback previo, que no se ejecuta con la biblioteca local válida.

## 10. Verificación y límites

Se ejecuta `node --check desarrollo/src/escena.js` y `node desarrollo/pruebas/iluminacion.test.cjs`. La segunda orden ejecuta también las pruebas V2. Se usa la biblioteca local real con DOM y WebGLRenderer simulados: no requiere instalaciones adicionales de paquetes.

Las pruebas verifican movimiento, cámara, estados del teclado, intensidades individuales y colectivas, grupos, cambios mientras están apagados, emisión, alcance, ángulo, restablecimiento sin mover auto, número de luces, límite de dos emisores de sombras y WASD desde controles sin que las flechas conduzcan. Resultado: aprobadas. Se conserva intacto el contenido de los respaldos V1/V2.

Para el cierre, el autor confirmó que V3 fue probada y funciona correctamente. Esta validación personal se distingue de las pruebas automatizadas, que no verifican píxeles, foco nativo ni rendimiento de GPU. La guía conserva una lista para repetir comprobaciones en otros equipos; no se atribuye al autor una lista específica de pruebas que no haya detallado.

### Copia independiente y verificación de cierre

El respaldo conserva todos los archivos de `desarrollo/`, incluidos estilos internos del HTML, biblioteca local, documentación anterior y pruebas del autor. Se verifican las rutas relativas de scripts y la igualdad de todos los archivos mediante SHA-256. Se comprueba también que V1/V2 y el código activo no cambien durante el cierre. La aplicación se abre con doble clic en el `index.html` propio del respaldo, sin servidor ni instalación, usando la biblioteca incluida.

El HTML conserva el texto «Versión 3 en desarrollo» de la implementación probada: el estado oficial de cierre se registra en esta documentación y en `HISTORIAL_VERSIONES.md`, sin editar el HTML ni modificar su comportamiento.

Las pruebas se ejecutan desde `desarrollo` en el repositorio: `movimiento.test.cjs` compara la biblioteca con una ruta relativa hacia V1. Esa referencia es exclusiva de la prueba del autor, no se carga desde el HTML y no afecta la independencia de la aplicación respaldada. Los README y documentos anteriores se conservan como antecedentes; para usar V3 corresponde la guía de esta versión.
