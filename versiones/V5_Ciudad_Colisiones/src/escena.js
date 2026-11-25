/*
 * Informática 3 — Conducción Nocturna
 * Versión 5 en desarrollo: cinco manzanas variadas y colisiones horizontales.
 *
 * IMPORTANTE: no usamos import/export ni fetch. Este archivo puede abrirse
 * con index.html mediante doble clic (file://) cuando THREE está disponible.
 *
 * Flujo de ejecución:
 *   comprobación de THREE -> iniciar() -> inicializarRenderer() -> crearEscena() ->
 *   crearTerreno() -> crearCalles() -> crearManzanas() ->
 *   crearAlumbrado() -> crearVehiculo() -> crearFaros() ->
 *   configurarCamara() -> configurarControles() -> configurarPanelLuces() -> animar(tiempoActual).
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

  // Construcción inicial; el panel modifica después las propiedades de los objetos.
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
  const obstaculos = [];
  const oclusoresCamara = [];
  const materialesAtenuados = new Set();
  const rayoCamara = new THREE.Raycaster();
  // Incluye ruedas y paragolpes, con un pequeño margen para evitar contactos visuales.
  const FORMA_AUTO = { semiancho: 1.34, semilargo: 2.47 };
  const LIMITES_SOLIDOS = { x: 53.8, z: 42.8 }; // Caras interiores de los bordes.
  const PASO_COLISION = 0.08;
  let luzAmbiente;
  let luna;
  const materialesVentanas = [];
  const focosVisibles = [];
  const farolesVisibles = [];
  const controlesLuz = [
    { clave: 'izquierdo', nombre: 'Faro izquierdo', valor: 85, min: 0, max: 200, paso: 1 },
    { clave: 'derecho', nombre: 'Faro derecho', valor: 85, min: 0, max: 200, paso: 1 },
    { clave: 'publico', nombre: 'Alumbrado público', valor: 23, min: 0, max: 60, paso: 1 },
    { clave: 'ambiente', nombre: 'Luz ambiental', valor: 0.5, min: 0, max: 2, paso: 0.05 },
    { clave: 'luna', nombre: 'Luna', valor: 0.37, min: 0, max: 2, paso: 0.01 },
    { clave: 'ventanas', nombre: 'Emisión de ventanas', valor: 1, min: 0, max: 4, paso: 0.1 },
    { clave: 'alcance', nombre: 'Alcance de faros (unidades)', valor: 34, min: 5, max: 60, paso: 1 },
    { clave: 'apertura', nombre: 'Semiángulo de faros (°)', valor: 180 / 7, min: 10, max: 60, paso: 'any' }
  ];
  const gruposLuz = { faros: 'Faros', publico: 'Alumbrado público', ambiente: 'Ambiental', luna: 'Luna', ventanas: 'Ventanas' };
  const valoresLuz = {};
  const gruposEncendidos = {};
  const entradasLuz = {};
  const salidasLuz = {};
  const interruptoresLuz = {};

  // Velocidades en unidades/s, aceleraciones en unidades/s² y tiempos en segundos.
  const CONDUCCION = {
    velocidadMaxima: 12, velocidadMaximaRetroceso: 5,
    aceleracionInicial: 0.8, aceleracionMaxima: 4, tiempoProgresion: 3,
    frenado: 8, desaceleracionNatural: 2, minimoCrucero: 3,
    velocidadGiro: 1.6
  };
  let velocidadActual = 0; // Positiva hacia -Z local; negativa en reversa.
  let tiempoAcelerando = 0;
  let marchaAcelerando = 0;
  let cruceroActivo = false;
  let velocidadCrucero = 0;
  const CAMARA = { altura: 8.8, distancia: 14, suavidad: 8 };
  const teclas = new Set();
  const teclasConduccion = new Set(['KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyC',
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
    renderer.domElement.tabIndex = 0; // Clic o Tab devuelve el foco a la conducción.
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

  // Registrar una vez, después de agregar al padre. Solo geometría sólida explícita.
  function registrarObstaculo(malla, tipo) {
    malla.updateWorldMatrix(true, true);
    const limites = new THREE.Box3().setFromObject(malla);
    malla.userData.tipoObstaculo = tipo;
    obstaculos.push({ caja: limites, tipo: tipo });
  }

  // 2) Escena de noche con una iluminación muy tenue de base.
  function crearEscena() {
    escena = new THREE.Scene();
    escena.background = new THREE.Color(AJUSTES.colorCielo);
    escena.fog = new THREE.Fog(AJUSTES.colorCielo, 55, 130);

    luzAmbiente = new THREE.HemisphereLight(0x9cb8e4, 0x344126, AJUSTES.intensidadAmbiente);
    escena.add(luzAmbiente);

    // La 'luna' da volumen a los edificios; el objetivo siguen siendo
    // los faros del auto y las luces de la calle.
    luna = new THREE.DirectionalLight(0x8ba5df, 0.37);
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
    const cuerpo = caja(ancho, alto, largo, color, 0, alto / 2, 0, true, true);
    grupo.add(cuerpo);
    grupo.add(caja(ancho + 0.35, 0.26, largo + 0.35, 0x1b2430, 0, alto + 0.12, 0, true, true));

    const ventanaApagada = new THREE.MeshStandardMaterial({ color: 0x2a4055 });
    const ventanaPrendida = new THREE.MeshStandardMaterial({
      color: 0x2a4055, emissive: 0xf9d58d, emissiveIntensity: 1
    });
    materialesVentanas.push(ventanaPrendida);
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
    registrarObstaculo(cuerpo, 'edificio');
    oclusoresCamara.push(grupo);
    return grupo;
  }

  function crearCasa(x, z, pisos, color, indice) {
    const casa = crearEdificio(x, z, 5.8, 6.4, pisos * 2.7, color, indice);
    // Techo a cuatro aguas, low-poly, sin texturas ni luces nuevas.
    const techo = new THREE.Mesh(new THREE.ConeGeometry(4.7, 1.5, 4),
      new THREE.MeshStandardMaterial({ color: 0x704e43, roughness: 0.9 }));
    techo.rotation.y = Math.PI / 4;
    techo.position.y = pisos * 2.7 + 0.85;
    techo.scale.set(1, 1, 1.1);
    techo.castShadow = true;
    techo.receiveShadow = true;
    casa.add(techo);
    return casa;
  }

  function crearComercio(x, z, indice) {
    const comercio = crearEdificio(x, z, 7.2, 7.6, 3.5, 0x688585, indice);
    comercio.add(caja(6.8, 0.55, 0.15, 0xb99761, 0, 2.65, -3.9, false, true));
    return comercio;
  }

  function crearVereda(x, z) {
    const vereda = caja(AJUSTES.anchoManzana, 0.36, AJUSTES.anchoManzana,
      0x66716f, x, 0.02, z, false, true);
    vereda.name = 'vereda';
    escena.add(vereda); // Transitable en V5: aún no hay desniveles físicos.
  }

  function crearMuro(x, z) {
    const muro = caja(4.8, 0.9, 0.35, 0x8d897f, x, 0.65, z, true, true);
    escena.add(muro);
    registrarObstaculo(muro, 'muro');
  }

  function crearArbol(posX, posZ) {
    const grupo = new THREE.Group();
    grupo.position.set(posX, 0, posZ);
    const tronco = caja(0.45, 2.5, 0.45, 0x493f32, 0, 1.45, 0, true, true);
    grupo.add(tronco);
    grupo.add(caja(2.1, 2.25, 2.1, 0x284e42, 0, 3.5, 0, true, true));
    escena.add(grupo);
    registrarObstaculo(tronco, 'arbol');
    oclusoresCamara.push(grupo);
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
      crearVereda(x, z);
      crearCasa(x - 4.4, z - 1, 1 + i % 2, colores[i], i);
      if (i % 2 === 0) crearComercio(x + 4.3, z + 0.8, i + 2);
      else crearEdificio(x + 4.3, z + 0.8, 6.4, 7.8, 7.5 + i, colores[i], i + 2);
      crearArbol(x - 6.4, z + 6.7);
      crearArbol(x + 6.6, z - 6.6);
      crearMuro(x, z + 7.7);
    });
  }

  // 6) Postes y luces: cada poste tiene una esfera visible + una PointLight.
  function crearPoste(x, z) {
    const poste = new THREE.Group();
    poste.position.set(x, 0, z);
    const soporte = caja(0.22, 6.1, 0.22, 0x687681, 0, 3.05, 0, true, true);
    poste.add(soporte);
    poste.add(caja(1.2, 0.16, 0.24, 0x768590, 0.52, 6.08, 0, true, true));
    const foco = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xffd897 })
    );
    foco.position.set(1.1, 5.95, 0);
    poste.add(foco);
    focosVisibles.push(foco);

    const luz = new THREE.PointLight(0xffd6a1, AJUSTES.intensidadAlumbrado, 18, 2);
    luz.position.set(1.1, 5.85, 0);
    poste.add(luz);
    lamparas.push(luz);
    escena.add(poste);
    registrarObstaculo(soporte, 'poste');
  }

  function crearAlumbrado() {
    [
      [-17.6, -4.5], [8.5, -4.5], [34.5, -4.5],
      [-17.6, 21.5], [8.5, 21.5],
      [-34.5, -21.5], [34.5, 21.5]
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
    [-0.77, 0.77].forEach(function (x) {
      const vidrioFaro = new THREE.MeshBasicMaterial({ color: 0xffe9ac });
      const farol = new THREE.Mesh(new THREE.BoxGeometry(0.51, 0.27, 0.045), vidrioFaro);
      farol.position.set(x, 0.97, -2.328);
      auto.add(farol);
      farolesVisibles.push(farol);
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
    despejarVistaCamara();
  }

  // Mantener la cámara V4: atenuar temporalmente grupos que tapen el centro del auto.
  function despejarVistaCamara() {
    materialesAtenuados.forEach(function (material) {
      material.opacity = 1;
      material.transparent = false;
      material.depthWrite = true;
    });
    materialesAtenuados.clear();
    const direccion = objetivoCamara.clone().sub(camara.position);
    rayoCamara.set(camara.position, direccion.clone().normalize());
    rayoCamara.far = direccion.length();
    oclusoresCamara.forEach(function (grupo) {
      grupo.updateWorldMatrix(true, true);
      if (rayoCamara.intersectObject(grupo, true).length === 0) return;
      grupo.traverse(function (objeto) {
        if (!objeto.isMesh) return;
        objeto.material.opacity = 0.18;
        objeto.material.transparent = true;
        objeto.material.depthWrite = false;
        materialesAtenuados.add(objeto.material);
      });
    });
  }

  // Las flechas editan el panel; WASD permite conducir incluso con foco en él.
  function flechaEnPanel(evento) {
    return evento.code.startsWith('Arrow') && evento.target &&
      Boolean(evento.target.closest('#panel-luces'));
  }

  function alPresionarTecla(evento) {
    if (!teclasConduccion.has(evento.code)) return;
    if (flechaEnPanel(evento)) return;
    evento.preventDefault();
    if (evento.repeat || teclas.has(evento.code)) return;
    teclas.add(evento.code); // Repeticiones de keydown no duplican una tecla.
    if (evento.code === 'KeyC') alternarCrucero();
    else if (['KeyW', 'KeyS', 'ArrowUp', 'ArrowDown'].includes(evento.code)) {
      desactivarCrucero();
      actualizarIndicadores();
    }
  }

  function alSoltarTecla(evento) {
    if (!teclasConduccion.has(evento.code)) return;
    teclas.delete(evento.code);
    if (!flechaEnPanel(evento)) evento.preventDefault();
  }

  function aplicarIluminacion() {
    // Orden de crearFaros: X negativo = izquierdo del conductor mirando hacia -Z.
    faros.forEach(function (luz, i) {
      luz.intensity = valoresLuz[i === 0 ? 'izquierdo' : 'derecho'];
      luz.visible = gruposEncendidos.faros && luz.intensity > 0;
      luz.distance = valoresLuz.alcance;
      luz.angle = THREE.MathUtils.degToRad(valoresLuz.apertura);
      luz.shadow.camera.far = luz.distance;
      luz.shadow.camera.updateProjectionMatrix();
      farolesVisibles[i].material.color.setHex(luz.visible ? 0xffe9ac : 0x26303a);
    });
    lamparas.forEach(function (luz, i) {
      luz.intensity = valoresLuz.publico;
      luz.visible = gruposEncendidos.publico && luz.intensity > 0;
      focosVisibles[i].material.color.setHex(luz.visible ? 0xffd897 : 0x26303a);
    });
    luzAmbiente.intensity = valoresLuz.ambiente;
    luzAmbiente.visible = gruposEncendidos.ambiente && luzAmbiente.intensity > 0;
    luna.intensity = valoresLuz.luna;
    luna.visible = gruposEncendidos.luna && luna.intensity > 0;
    materialesVentanas.forEach(function (material) {
      material.emissiveIntensity = gruposEncendidos.ventanas ? valoresLuz.ventanas : 0;
    });
  }

  function restablecerIluminacion() {
    controlesLuz.forEach(function (control) {
      valoresLuz[control.clave] = control.valor;
      entradasLuz[control.clave].value = control.valor;
      salidasLuz[control.clave].textContent = control.valor.toFixed(2);
    });
    Object.keys(gruposLuz).forEach(function (clave) {
      gruposEncendidos[clave] = true;
      interruptoresLuz[clave].checked = true;
    });
    aplicarIluminacion();
  }

  function configurarPanelLuces() {
    const panel = document.getElementById('panel-luces');
    const deslizadores = document.getElementById('deslizadores-luz');
    controlesLuz.forEach(function (control) {
      const fila = document.createElement('div');
      const etiqueta = document.createElement('label');
      const entrada = document.createElement('input');
      const salida = document.createElement('output');
      entrada.type = 'range';
      entrada.id = 'luz-' + control.clave;
      entrada.min = control.min;
      entrada.max = control.max;
      entrada.step = control.paso;
      etiqueta.htmlFor = entrada.id;
      etiqueta.textContent = control.nombre;
      salida.setAttribute('for', entrada.id);
      fila.append(etiqueta, salida, entrada);
      deslizadores.appendChild(fila);
      entradasLuz[control.clave] = entrada;
      salidasLuz[control.clave] = salida;
      entrada.addEventListener('input', function () {
        valoresLuz[control.clave] = Number(entrada.value);
        salida.textContent = valoresLuz[control.clave].toFixed(2);
        aplicarIluminacion();
      });
    });
    Object.keys(gruposLuz).forEach(function (clave) {
      const etiqueta = document.createElement('label');
      const entrada = document.createElement('input');
      entrada.type = 'checkbox';
      entrada.id = 'grupo-' + clave;
      etiqueta.append(entrada, document.createTextNode(gruposLuz[clave]));
      document.getElementById('grupos-luz').appendChild(etiqueta);
      interruptoresLuz[clave] = entrada;
      entrada.addEventListener('change', function () {
        gruposEncendidos[clave] = entrada.checked;
        aplicarIluminacion();
      });
    });
    panel.addEventListener('focusin', function () {
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].forEach(function (codigo) { teclas.delete(codigo); });
    });
    document.getElementById('restablecer-luces').addEventListener('click', restablecerIluminacion);
    restablecerIluminacion();
  }

  function reiniciarEntrada() {
    teclas.clear();
    desactivarCrucero();
    velocidadActual = 0; // Pausa segura al salir: no continuar circulando sin foco.
    tiempoAcelerando = 0;
    marchaAcelerando = 0;
    tiempoAnterior = null; // No acumular el tiempo pasado fuera de la ventana.
    actualizarIndicadores();
  }

  function configurarControles() {
    window.addEventListener('keydown', alPresionarTecla);
    window.addEventListener('keyup', alSoltarTecla);
    window.addEventListener('blur', reiniciarEntrada);
    document.addEventListener('visibilitychange', reiniciarEntrada);
  }

  function desactivarCrucero() {
    cruceroActivo = false;
    velocidadCrucero = 0;
  }

  function alternarCrucero() {
    if (cruceroActivo) desactivarCrucero();
    else if (velocidadActual >= CONDUCCION.minimoCrucero &&
      !teclas.has('KeyS') && !teclas.has('ArrowDown')) {
      cruceroActivo = true;
      velocidadCrucero = velocidadActual;
      tiempoAcelerando = 0;
      marchaAcelerando = 0;
    }
    actualizarIndicadores();
  }

  function reducirVelocidad(intensidad, deltaTime) {
    // Nunca cruzar cero por frenado o rozamiento.
    velocidadActual = Math.sign(velocidadActual) *
      Math.max(0, Math.abs(velocidadActual) - intensidad * deltaTime);
  }

  function actualizarVelocidad(deltaTime) {
    if (cruceroActivo) {
      velocidadActual = velocidadCrucero;
      return;
    }
    const adelante = teclas.has('KeyW') || teclas.has('ArrowUp');
    const atras = teclas.has('KeyS') || teclas.has('ArrowDown');
    const marcha = Number(adelante) - Number(atras);
    if (marcha === 0 || velocidadActual * marcha < 0) {
      tiempoAcelerando = 0;
      marchaAcelerando = 0;
      const frenar = (adelante && atras) || velocidadActual * marcha < 0;
      reducirVelocidad(frenar ? CONDUCCION.frenado : CONDUCCION.desaceleracionNatural, deltaTime);
      return; // Al llegar a cero, la marcha opuesta empieza en el próximo frame.
    }
    if (marcha !== marchaAcelerando) tiempoAcelerando = 0;
    marchaAcelerando = marcha;
    // Integral de una rampa lineal: promedio de aceleración durante la parte progresiva.
    const duracion = Math.max(CONDUCCION.tiempoProgresion, 0.001);
    const tramo = Math.min(deltaTime, Math.max(0, duracion - tiempoAcelerando));
    const progresoMedio = Math.min(1, (tiempoAcelerando + tramo / 2) / duracion);
    const aceleracionMedia = CONDUCCION.aceleracionInicial +
      (CONDUCCION.aceleracionMaxima - CONDUCCION.aceleracionInicial) * progresoMedio;
    const incremento = aceleracionMedia * tramo + CONDUCCION.aceleracionMaxima * (deltaTime - tramo);
    tiempoAcelerando = Math.min(duracion, tiempoAcelerando + deltaTime);
    velocidadActual = THREE.MathUtils.clamp(velocidadActual + marcha * incremento,
      -CONDUCCION.velocidadMaximaRetroceso, CONDUCCION.velocidadMaxima);
  }

  function actualizarIndicadores() {
    document.getElementById('velocidad-actual').textContent = velocidadActual.toFixed(2);
    document.getElementById('velocidad-maxima').textContent = CONDUCCION.velocidadMaxima + ' / ' + CONDUCCION.velocidadMaximaRetroceso;
    document.getElementById('estado-crucero').textContent = cruceroActivo ?
      'Activado · ' + velocidadCrucero.toFixed(2) + ' u/s' : 'Desactivado (C desde ' + CONDUCCION.minimoCrucero + ' u/s)';
  }

  function posicionAutoLibre(x, z, angulo) {
    return ColisionesCiudad.posicionLibre(x, z, angulo, FORMA_AUTO, obstaculos, LIMITES_SOLIDOS);
  }

  function detenerPorColision() {
    velocidadActual = 0;
    tiempoAcelerando = 0;
    marchaAcelerando = 0;
    desactivarCrucero();
  }

  function aplicarMovimientoSeguro(distancia, giroTotal) {
    const pasos = ColisionesCiudad.cantidadPasos(distancia, giroTotal, FORMA_AUTO, PASO_COLISION);
    const pasoDistancia = distancia / pasos;
    const pasoGiro = giroTotal / pasos;
    for (let i = 0; i < pasos; i++) {
      let bloqueado = false;
      const anguloPropuesto = auto.rotation.y + pasoGiro;
      if (posicionAutoLibre(auto.position.x, auto.position.z, anguloPropuesto)) auto.rotation.y = anguloPropuesto;
      else bloqueado = true;
      direccionFrontal.set(-Math.sin(auto.rotation.y), 0, -Math.cos(auto.rotation.y));
      const dx = direccionFrontal.x * pasoDistancia;
      const dz = direccionFrontal.z * pasoDistancia;
      const x = auto.position.x, z = auto.position.z;
      if (posicionAutoLibre(x + dx, z + dz, auto.rotation.y)) {
        auto.position.x += dx;
        auto.position.z += dz;
      } else {
        // Probar cada componente conserva un pequeño deslizamiento tangencial.
        if (posicionAutoLibre(x + dx, z, auto.rotation.y)) auto.position.x += dx;
        if (posicionAutoLibre(auto.position.x, z + dz, auto.rotation.y)) auto.position.z += dz;
        bloqueado = true;
      }
      if (bloqueado) {
        detenerPorColision();
        break; // No consumir más distancia con la velocidad anterior al impacto.
      }
    }
  }

  function actualizarMovimiento(deltaTime) {
    const velocidadAnterior = velocidadActual;
    actualizarVelocidad(deltaTime);
    const velocidadMedia = (velocidadAnterior + velocidadActual) / 2;
    const giro = Number(teclas.has('KeyA') || teclas.has('ArrowLeft')) -
      Number(teclas.has('KeyD') || teclas.has('ArrowRight'));
    // V5 permite maniobrar en reposo; en reversa conserva el giro invertido.
    const sentido = Math.sign(velocidadMedia) || 1;
    aplicarMovimientoSeguro(velocidadMedia * deltaTime,
      giro * sentido * CONDUCCION.velocidadGiro * deltaTime);
  }

  // 10) RAF entrega milisegundos. Limitamos pausas largas a 0.05 segundos simulados.
  function animar(tiempoActual) {
    const deltaTime = tiempoAnterior === null ? 0 : Math.min((tiempoActual - tiempoAnterior) / 1000, 0.05);
    tiempoAnterior = tiempoActual;
    actualizarMovimiento(deltaTime);
    actualizarCamara(deltaTime, false);
    actualizarIndicadores();
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
      if (!posicionAutoLibre(auto.position.x, auto.position.z, auto.rotation.y)) {
        throw new Error('La posición inicial del auto no está libre.');
      }
      crearFaros();
      configurarCamara();
      configurarControles();
      configurarPanelLuces();
      actualizarIndicadores();
      window.addEventListener('resize', alCambiarTamano);
      requestAnimationFrame(animar);
    } catch (error) {
      console.error('Error al iniciar Conducción Nocturna:', error);
      mostrarError('Error al crear el escenario 3D. Abrí la consola del navegador (F12) para ver el detalle.');
    }
  }

  iniciar();
})();
