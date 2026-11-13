/*
 * Informática 3 — Conducción Nocturna
 * Versión 2 en desarrollo: conducción simple y cámara seguidora.
 *
 * IMPORTANTE: no usamos import/export ni fetch. Este archivo puede abrirse
 * con index.html mediante doble clic (file://) cuando THREE está disponible.
 *
 * Flujo de ejecución:
 *   comprobación de THREE -> iniciar() -> inicializarRenderer() -> crearEscena() ->
 *   crearTerreno() -> crearCalles() -> crearManzanas() ->
 *   crearAlumbrado() -> crearVehiculo() -> crearFaros() ->
 *   configurarCamara() -> configurarControles() -> animar(tiempoActual).
 */
(function () {
  'use strict';

  function mostrarError(mensaje) {
    document.getElementById('mensaje-error').textContent = mensaje;
    document.getElementById('error').style.display = 'grid';
  }

  if (typeof THREE === 'undefined') {
    mostrarError('No se pudo cargar Three.js. Con Internet, volvé a abrir el HTML. Para que funcione también sin Internet, ejecutá una vez PREPARAR_OFFLINE.bat y entregá la carpeta completa.');
    return;
  }

  // Parámetros fijos: en las próximas versiones los convertiremos en controles.
  const AJUSTES = {
    anchoManzana: 18,
    separacionEntreManzanas: 8,
    anchoCalle: 8,
    intensidadAmbiente: 0.50,
    intensidadAlumbrado: 23,
    intensidadFaros: 85,
    colorCielo: 0x0a1020
  };

  let escena;
  let camara;
  let renderer;
  let auto;
  const faros = [];
  const lamparas = [];

  // Unidades de escena por segundo y radianes por segundo.
  const CONDUCCION = { velocidad: 12, velocidadGiro: 1.6, limiteX: 51, limiteZ: 40 };
  const CAMARA = { altura: 8.8, distancia: 14, suavidad: 8 };
  const teclas = new Set();
  const teclasConduccion = new Set(['KeyW', 'KeyS', 'KeyA', 'KeyD',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
  let tiempoAnterior = null;
  const direccionFrontal = new THREE.Vector3();
  const posicionCamaraDeseada = new THREE.Vector3();
  const objetivoCamara = new THREE.Vector3();

  // 1) Configuración del renderizador WebGL y de las sombras.
  function inicializarRenderer() {
    const contenedor = document.getElementById('app');
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    contenedor.appendChild(renderer.domElement);
  }

  // Utilidad común: crea una caja y opcionalmente permite que proyecte sombras.
  function caja(ancho, alto, largo, color, x, y, z, proyectaSombra, recibeSombra) {
    const geometria = new THREE.BoxGeometry(ancho, alto, largo);
    const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.84 });
    const malla = new THREE.Mesh(geometria, material);
    malla.position.set(x, y, z);
    malla.castShadow = Boolean(proyectaSombra);
    malla.receiveShadow = Boolean(recibeSombra);
    return malla;
  }

  // 2) Escena de noche con una iluminación muy tenue de base.
  function crearEscena() {
    escena = new THREE.Scene();
    escena.background = new THREE.Color(AJUSTES.colorCielo);
    escena.fog = new THREE.Fog(AJUSTES.colorCielo, 55, 130);

    const luzAmbiente = new THREE.HemisphereLight(0x9cb8e4, 0x344126, AJUSTES.intensidadAmbiente);
    escena.add(luzAmbiente);

    // La 'luna' da volumen a los edificios; el objetivo siguen siendo
    // los faros del auto y las luces de la calle.
    const luna = new THREE.DirectionalLight(0x8ba5df, 0.37);
    luna.position.set(-24, 35, 14);
    escena.add(luna);
  }

  // 3) Piso general del escenario (no es un mapa externo).
  function crearTerreno() {
    const suelo = caja(110, 0.3, 88, 0x253426, 0, -0.17, 0, false, true);
    escena.add(suelo);

    // Borde oscuro que deja claro dónde termina el escenario cerrado.
    escena.add(caja(110, 0.65, 1.2, 0x111f21, 0, 0.24, -43.5, true, true));
    escena.add(caja(110, 0.65, 1.2, 0x111f21, 0, 0.24, 43.5, true, true));
    escena.add(caja(1.2, 0.65, 88, 0x111f21, -54.5, 0.24, 0, true, true));
    escena.add(caja(1.2, 0.65, 88, 0x111f21, 54.5, 0.24, 0, true, true));
  }

  // 4) Cuatro vías verticales y tres horizontales separan las cinco manzanas.
  function crearCalles() {
    const verticales = [-39, -13, 13, 39];
    const horizontales = [-26, 0, 26];

    verticales.forEach(function (x) {
      escena.add(caja(AJUSTES.anchoCalle, 0.10, 80, 0x252c36, x, 0.04, 0, false, true));
      for (let z = -35; z < 37; z += 8) {
        escena.add(caja(0.13, 0.014, 2.7, 0xc6b992, x, 0.105, z, false, false));
      }
    });

    horizontales.forEach(function (z) {
      escena.add(caja(102, 0.10, AJUSTES.anchoCalle, 0x252c36, 0, 0.045, z, false, true));
      for (let x = -46; x < 47; x += 8) {
        escena.add(caja(2.8, 0.014, 0.13, 0xc6b992, x, 0.108, z, false, false));
      }
    });
  }

  // Utilidad de edificios: combina cubos, ventanas y puerta.
  function crearEdificio(posX, posZ, ancho, largo, alto, color, indice) {
    const grupo = new THREE.Group();
    grupo.position.set(posX, 0.2, posZ);
    grupo.add(caja(ancho, alto, largo, color, 0, alto / 2, 0, true, true));
    grupo.add(caja(ancho + 0.35, 0.26, largo + 0.35, 0x1b2430, 0, alto + 0.12, 0, true, true));

    const ventanaApagada = new THREE.MeshBasicMaterial({ color: 0x2a4055 });
    const ventanaPrendida = new THREE.MeshBasicMaterial({ color: 0xf9d58d });
    const filas = Math.max(1, Math.floor((alto - 1) / 2.7));

    // Ventanas del frente, orientadas a la calle por el lado -Z.
    for (let f = 0; f < filas; f++) {
      for (let c = -1; c <= 1; c += 2) {
        const ventana = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.96, 0.045),
          ((indice + f + c + 10) % 3 === 0) ? ventanaApagada : ventanaPrendida);
        ventana.position.set(c * ancho * 0.22, 1.58 + f * 2.45, -largo / 2 - 0.028);
        grupo.add(ventana);
      }
    }
    grupo.add(caja(1.18, 2.05, 0.07, 0x222d3b, 0, 1.025, -largo / 2 - 0.055, false, false));
    escena.add(grupo);
  }

  function crearArbol(posX, posZ) {
    const grupo = new THREE.Group();
    grupo.position.set(posX, 0, posZ);
    grupo.add(caja(0.45, 1.75, 0.45, 0x493f32, 0, 1.1, 0, true, true));
    grupo.add(caja(2.1, 2.25, 2.1, 0x284e42, 0, 2.6, 0, true, true));
    escena.add(grupo);
  }

  // 5) Cinco manzanas: dos abajo y tres arriba. Es un mapa pequeño, no abierto.
  function crearManzanas() {
    const posiciones = [
      [-26, -13], [0, -13], [26, -13],
      [-26, 13], [0, 13]
    ];
    const colores = [0x777a84, 0x4d6675, 0x927b6c, 0x6d717b, 0x8d8170];
    posiciones.forEach(function (pos, i) {
      const x = pos[0];
      const z = pos[1];
      escena.add(caja(AJUSTES.anchoManzana, 0.36, AJUSTES.anchoManzana,
        0x66716f, x, 0.02, z, false, true));
      // Dos edificios por manzana, para mostrar volúmenes y sombras.
      crearEdificio(x - 4.25, z - 1.2, 7.2, 9.0, 6.5 + (i % 3) * 2.0, colores[i], i);
      crearEdificio(x + 4.35, z + 1.2, 6.8, 8.5, 5.6 + ((i + 1) % 3) * 2.4,
        colores[(i + 2) % colores.length], i + 2);
      crearArbol(x - 6.4, z + 6.7);
      crearArbol(x + 6.6, z - 6.6);
    });
  }

  // 6) Postes y luces: cada poste tiene una esfera visible + una PointLight.
  function crearPoste(x, z) {
    const poste = new THREE.Group();
    poste.position.set(x, 0, z);
    poste.add(caja(0.22, 6.1, 0.22, 0x687681, 0, 3.05, 0, true, true));
    poste.add(caja(1.2, 0.16, 0.24, 0x768590, 0.52, 6.08, 0, true, true));
    const foco = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xffd897 })
    );
    foco.position.set(1.1, 5.95, 0);
    poste.add(foco);

    const luz = new THREE.PointLight(0xffd6a1, AJUSTES.intensidadAlumbrado, 18, 2);
    luz.position.set(1.1, 5.85, 0);
    poste.add(luz);
    lamparas.push(luz);
    escena.add(poste);
  }

  function crearAlumbrado() {
    [
      [-17.6, -3.9], [9.5, -3.9], [35.4, -3.9],
      [-17.6, 22.1], [9.5, 22.1],
      [-35.4, -22.1], [35.4, 22.1]
    ].forEach(function (p) { crearPoste(p[0], p[1]); });
  }

  function agregarVentanaAuto(grupo, ancho, alto, profundo, x, y, z) {
    grupo.add(caja(ancho, alto, profundo, 0x6388a0, x, y, z, false, false));
  }

  // 7) Auto retro cuadrado hecho solo con primitivas.
  function crearVehiculo() {
    auto = new THREE.Group();
    auto.name = 'autoRetro';

    // La parte delantera está orientada al eje local -Z.
    auto.add(caja(2.30, 0.62, 4.60, 0xc2a57e, 0, 0.90, 0, true, true));
    auto.add(caja(1.96, 0.70, 2.55, 0xad8f6b, 0, 1.53, 0.35, true, true));
    auto.add(caja(2.36, 0.19, 0.20, 0x343f48, 0, 0.69, -2.33, true, true));
    auto.add(caja(2.36, 0.19, 0.20, 0x343f48, 0, 0.69, 2.33, true, true));

    // Parabrisas, luneta y ventanas laterales.
    agregarVentanaAuto(auto, 1.72, 0.43, 0.035, 0, 1.58, -0.945);
    agregarVentanaAuto(auto, 1.72, 0.43, 0.035, 0, 1.58, 1.645);
    agregarVentanaAuto(auto, 0.035, 0.43, 1.62, -0.996, 1.58, 0.38);
    agregarVentanaAuto(auto, 0.035, 0.43, 1.62, 0.996, 1.58, 0.38);

    const goma = new THREE.MeshStandardMaterial({ color: 0x17191e, roughness: 1.0 });
    const tapacubo = new THREE.MeshStandardMaterial({ color: 0xa5b1bd, metalness: 0.2, roughness: 0.5 });
    [-1.17, 1.17].forEach(function (x) {
      [-1.45, 1.45].forEach(function (z) {
        const rueda = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.25, 16), goma);
        rueda.rotation.z = Math.PI / 2; // El eje de las ruedas apunta a X.
        rueda.position.set(x, 0.47, z);
        rueda.castShadow = true;
        auto.add(rueda);
        const tapa = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.26, 12), tapacubo);
        tapa.rotation.z = Math.PI / 2;
        tapa.position.set(x, 0.47, z);
        auto.add(tapa);
      });
    });

    // Faroles visuales (los dos SpotLight reales se crean en crearFaros).
    const vidrioFaro = new THREE.MeshBasicMaterial({ color: 0xffe9ac });
    [-0.77, 0.77].forEach(function (x) {
      const farol = new THREE.Mesh(new THREE.BoxGeometry(0.51, 0.27, 0.045), vidrioFaro);
      farol.position.set(x, 0.97, -2.328);
      auto.add(farol);
      auto.add(caja(0.45, 0.22, 0.04, 0xd66a5b, x, 0.94, 2.33, false, false));
    });

    auto.position.set(-13, 0.04, 11);
    auto.rotation.y = 0;
    escena.add(auto);
  }

  // 8) Faros vinculados al auto: cuando rote/se incline, rotarán con él.
  function crearFaros() {
    [-0.77, 0.77].forEach(function (x) {
      const luz = new THREE.SpotLight(0xffefd3, AJUSTES.intensidadFaros, 34,
        Math.PI / 7, 0.52, 1.7);
      luz.position.set(x, 1.0, -2.38);
      luz.target.position.set(x, 0.20, -20);
      luz.castShadow = true;
      luz.shadow.mapSize.set(512, 512);
      luz.shadow.camera.near = 0.5;
      luz.shadow.camera.far = 35;
      luz.shadow.bias = -0.0002;
      auto.add(luz);
      auto.add(luz.target); // Sin el target enlazado al auto, apuntaría mal.
      faros.push(luz);
    });
  }

  // 9) Cámara en tercera persona, atrás y un poco arriba del auto.
  function configurarCamara() {
    camara = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 200);
    actualizarCamara(0, true);
  }

  function actualizarCamara(deltaTime, inmediata) {
    // position/rotation cambiaron: actualizar antes de convertir a coordenadas mundiales.
    auto.updateMatrixWorld(true);
    posicionCamaraDeseada.set(0, CAMARA.altura, CAMARA.distancia);
    auto.localToWorld(posicionCamaraDeseada);
    // Mirar cerca del centro mantiene el auto encuadrado aun durante un giro.
    objetivoCamara.set(0, 1, 0);
    auto.localToWorld(objetivoCamara);
    const factor = 1 - Math.exp(-CAMARA.suavidad * deltaTime);
    if (inmediata) camara.position.copy(posicionCamaraDeseada);
    else camara.position.lerp(posicionCamaraDeseada, factor);
    camara.lookAt(objetivoCamara);
  }

  function alPresionarTecla(evento) {
    if (!teclasConduccion.has(evento.code)) return;
    evento.preventDefault();
    teclas.add(evento.code); // Repeticiones de keydown no duplican una tecla.
  }

  function alSoltarTecla(evento) {
    if (!teclasConduccion.has(evento.code)) return;
    evento.preventDefault();
    teclas.delete(evento.code);
  }

  function reiniciarEntrada() {
    teclas.clear();
    tiempoAnterior = null; // No acumular el tiempo pasado fuera de la ventana.
  }

  function configurarControles() {
    window.addEventListener('keydown', alPresionarTecla);
    window.addEventListener('keyup', alSoltarTecla);
    window.addEventListener('blur', reiniciarEntrada);
    document.addEventListener('visibilitychange', reiniciarEntrada);
  }

  function actualizarMovimiento(deltaTime) {
    const avance = Number(teclas.has('KeyW') || teclas.has('ArrowUp')) -
      Number(teclas.has('KeyS') || teclas.has('ArrowDown'));
    const giro = Number(teclas.has('KeyA') || teclas.has('ArrowLeft')) -
      Number(teclas.has('KeyD') || teclas.has('ArrowRight'));
    // Sin traslación no giramos; en marcha atrás se invierte el giro de la carrocería.
    auto.rotation.y += giro * avance * CONDUCCION.velocidadGiro * deltaTime;
    const angulo = auto.rotation.y;
    direccionFrontal.set(-Math.sin(angulo), 0, -Math.cos(angulo));
    auto.position.addScaledVector(direccionFrontal, avance * CONDUCCION.velocidad * deltaTime);
    // Margen para la carrocería: límite rectangular, no colisiones con objetos.
    auto.position.x = THREE.MathUtils.clamp(auto.position.x, -CONDUCCION.limiteX, CONDUCCION.limiteX);
    auto.position.z = THREE.MathUtils.clamp(auto.position.z, -CONDUCCION.limiteZ, CONDUCCION.limiteZ);
  }

  // 10) RAF entrega milisegundos. Limitamos pausas largas a 0.05 segundos simulados.
  function animar(tiempoActual) {
    const deltaTime = tiempoAnterior === null ? 0 : Math.min((tiempoActual - tiempoAnterior) / 1000, 0.05);
    tiempoAnterior = tiempoActual;
    actualizarMovimiento(deltaTime);
    actualizarCamara(deltaTime, false);
    renderer.render(escena, camara);
    requestAnimationFrame(animar);
  }

  function alCambiarTamano() {
    if (!renderer || !camara) return;
    camara.aspect = window.innerWidth / window.innerHeight;
    camara.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Punto de entrada de la aplicación: ejecuta los pasos en orden.
  function iniciar() {
    try {
      inicializarRenderer();
      crearEscena();
      crearTerreno();
      crearCalles();
      crearManzanas();
      crearAlumbrado();
      crearVehiculo();
      crearFaros();
      configurarCamara();
      configurarControles();
      window.addEventListener('resize', alCambiarTamano);
      requestAnimationFrame(animar);
    } catch (error) {
      console.error('Error al iniciar Conducción Nocturna:', error);
      mostrarError('Error al crear el escenario 3D. Abrí la consola del navegador (F12) para ver el detalle.');
    }
  }

  iniciar();
})();
