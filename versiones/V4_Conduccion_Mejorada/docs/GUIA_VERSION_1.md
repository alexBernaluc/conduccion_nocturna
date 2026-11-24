# Guía de estudio — Versión 1

## Qué hace esta versión

- Dibuja cinco manzanas de estilo low-poly y calles que las separan.
- Incluye edificios, ventanas, árboles y alumbrado con `PointLight`.
- Incluye un auto simple ensamblado con `BoxGeometry` y `CylinderGeometry`.
- Coloca dos faros delanteros usando `SpotLight` que pertenecen al grupo del vehículo.
- Usa `castShadow` y `receiveShadow` para generar y recibir sombras.
- Coloca una cámara `PerspectiveCamera` detrás y por encima del auto.
- **No hay movimiento, sliders ni lomada todavía.** Se incorporarán por etapas.

## Flujo exacto de ejecución

1. El navegador abre `index.html`, crea el elemento `#app` y carga Three.js.
2. Se carga `src/escena.js`. Su función autoejecutable evita variables globales innecesarias.
3. Se verifica que el objeto global `THREE` esté disponible.
4. `iniciar()` llama primero a `inicializarRenderer()`: crea WebGL, activa sombras y pone el `canvas` dentro de `#app`.
5. `crearEscena()` crea `Scene`, cielo oscuro, niebla e iluminación base.
6. `crearTerreno()` crea la base general y el borde.
7. `crearCalles()` añade geometrías de calles verticales/horizontales y las marcas.
8. `crearManzanas()` crea exactamente cinco bloques de aceras y los edificios/árboles.
9. `crearAlumbrado()` coloca faroles y `PointLight`.
10. `crearVehiculo()` crea un `Group` que contiene carrocería, ruedas, ventanas, paragolpes y faroles visuales.
11. `crearFaros()` añade las dos `SpotLight` y **sus objetivos (`target`)** dentro del grupo del vehículo.
12. `configurarCamara()` coloca la cámara detrás y arriba del auto, mirando hacia delante.
13. `animar()` llama a `requestAnimationFrame` y `renderer.render(escena, camara)` en cada fotograma.
14. Si cambia el tamaño de la ventana, `alCambiarTamano()` actualiza la proporción de la cámara y el tamaño de WebGL.

## Conceptos fundamentales para defender

**Scene:** contenedor de objetos, geometrías y luces.

**Mesh:** combinación de geometría y material que el renderizador puede dibujar.

**Group:** objeto que contiene otros objetos. El auto completo se traslada o rota a través de un solo grupo; los faros rotarán con él.

**Camera:** establece desde dónde se observa la escena. Esta primera cámara está situada en tercera persona y permanecerá fija hasta que agreguemos movimiento.

**Renderer:** utiliza WebGL para dibujar la escena dentro del canvas.

**MeshStandardMaterial:** material cuya apariencia depende de la iluminación.

**MeshBasicMaterial:** material que mantiene el color sin depender de la iluminación; se utiliza como recurso visual para vidrios de luz.

**PointLight:** emite luz en todas las direcciones, como el alumbrado público simplificado.

**SpotLight:** emite un cono de luz, útil para los faros del vehículo.

**`castShadow` / `receiveShadow`:** el primero permite que un objeto o luz proyecte sombras; el segundo indica que una superficie recibe sombras.

**Bucle de renderizado:** en V1 la imagen es estática, pero dibujamos continuamente porque en V2 introduciremos actualizaciones de posición y cámara.

## Qué revisar visualmente

- Se distinguen las manzanas y las calles.
- El auto está visible en primer plano, con la cámara detrás.
- Las ventanas y el alumbrado tienen puntos brillantes.
- Los faros proyectan luz hacia el asfalto delante del auto.
- Los edificios y árboles tienen volúmenes, oscuridad y zonas iluminadas.
- Cambiar de tamaño la ventana no rompe la escena.

## Próxima versión

En la V2 se incorporará el teclado (W/S para avanzar/retroceder, A/D para girar) y el cálculo del vector frontal basado en `Math.sin` / `Math.cos` o `THREE.Vector3.applyQuaternion`. **No modificar todavía la V1**, para poder comparar diferencias y explicar qué se añadió.
