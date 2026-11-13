// Solo para el autor: node desarrollo/pruebas/movimiento.test.cjs
// Three.js real, DOM y WebGLRenderer simulados. No prueba la imagen de WebGL.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = path.resolve(__dirname, '..');

function iniciar() {
  const eventos = {};
  const elementos = {};
  function elemento() {
    return { style: {}, hijos: [], eventos: {}, appendChild(hijo) { this.hijos.push(hijo); },
      append(...hijos) { this.hijos.push(...hijos); }, setAttribute() {},
      addEventListener(nombre, fn) { this.eventos[nombre] = fn; },
      closest() { return this.enPanel ? elementos['panel-luces'] : null; }
    };
  }
  let pendiente, escena, camara, tiempo = 0;
  const registrar = (nombre, fn) => { eventos[nombre] = fn; };
  const contexto = {
    console: { warn() {}, error(...args) { throw Error(args.join(' ')); } },
    window: { innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1, addEventListener: registrar },
    document: { addEventListener: registrar,
      getElementById: id => elementos[id] || (elementos[id] = elemento()),
      createElement: elemento, createTextNode: texto => ({ textContent: texto }) },
    requestAnimationFrame: fn => { pendiente = fn; }
  };
  vm.createContext(contexto);
  vm.runInContext(fs.readFileSync(path.join(base, 'vendor/three.min.js'), 'utf8'), contexto);
  const T = contexto.THREE;
  T.WebGLRenderer = class {
    constructor() { this.shadowMap = {}; this.domElement = {}; }
    setPixelRatio() {} setSize() {}
    render(s, c) { escena = s; camara = c; s.updateMatrixWorld(true); c.updateMatrixWorld(true); }
  };
  vm.runInContext(fs.readFileSync(path.join(base, 'src/escena.js'), 'utf8'), contexto);
  pendiente(0);
  return {
    T, escena, camara, contexto, elementos,
    control(id) {
      function buscar(e) { if (e.id === id) return e; for (const h of e.hijos || []) { const r = buscar(h); if (r) return r; } }
      for (const e of Object.values(elementos)) { const r = buscar(e); if (r) return r; }
      throw Error('Control ausente: ' + id);
    },
    auto: escena.getObjectByName('autoRetro'),
    evento(nombre) { eventos[nombre](); },
    tecla(code, soltar = false, target) {
      let bloqueado = false;
      eventos[soltar ? 'keyup' : 'keydown']({ code, target, preventDefault() { bloqueado = true; } });
      return bloqueado;
    },
    paso(dt) { tiempo += dt * 1000; pendiente(tiempo); },
    conducir(segundos, fps) { for (let i = 0; i < segundos * fps; i++) this.paso(1 / fps); }
  };
}
const cerca = (a, b, tolerancia = 1e-8) => assert.ok(Math.abs(a - b) < tolerancia, `${a} != ${b}`);
for (const fps of [30, 60, 120]) {
  const p = iniciar(); p.tecla('KeyW'); p.conducir(1, fps);
  cerca(p.auto.position.z, -1); cerca(p.auto.position.x, -13);
  p.tecla('KeyW', true); p.conducir(1, fps); cerca(p.auto.position.z, -1);
}
for (const [tecla, signo] of [['KeyA', 1], ['KeyD', -1]]) {
  for (const [marcha, avance] of [['KeyW', 1], ['KeyS', -1]]) {
    const p = iniciar(); p.tecla(marcha); p.tecla(tecla); p.conducir(1, 60);
    cerca(p.auto.rotation.y, signo * avance * 1.6);
    cerca(p.auto.position.y, 0.04);
  }
}
{
  const p = iniciar(); p.tecla('KeyA'); p.conducir(1, 60); cerca(p.auto.rotation.y, 0);
  assert.equal(p.tecla('ArrowUp'), true); p.tecla('KeyA', true); p.tecla('KeyW'); p.tecla('KeyW');
  p.conducir(1, 60); cerca(p.auto.position.z, -1); // Dos alias no duplican velocidad.
  p.tecla('KeyW', true); p.conducir(1, 60); cerca(p.auto.position.z, -13);
  p.tecla('ArrowDown'); p.conducir(1, 60); cerca(p.auto.position.z, -13);
  assert.equal(p.tecla('KeyQ'), false);
  p.tecla('ArrowLeft'); p.tecla('ArrowRight'); p.conducir(1, 60); cerca(p.auto.rotation.y, 0);
}
for (const evento of ['blur', 'visibilitychange']) {
  const p = iniciar(); p.tecla('KeyW'); p.paso(1 / 60); const z = p.auto.position.z;
  p.evento(evento); p.paso(10); p.conducir(1, 60); cerca(p.auto.position.z, z);
}
{
  const p = iniciar(); p.tecla('KeyW'); p.paso(10); cerca(p.auto.position.z, 10.4);
  p.conducir(10, 60); cerca(p.auto.position.z, -40);
  p.tecla('KeyW', true); p.tecla('KeyS'); p.conducir(10, 60); cerca(p.auto.position.z, 40);
  p.auto.rotation.y = Math.PI / 2; p.conducir(10, 60); cerca(p.auto.position.x, 51);
  p.tecla('KeyS', true); p.tecla('KeyW'); p.conducir(10, 60); cerca(p.auto.position.x, -51);
}
{
  const p = iniciar(); const {T, auto, camara} = p;
  p.tecla('KeyW'); p.tecla('KeyA');
  for (let i = 0; i < 240; i++) {
    p.paso(1 / 60);
    const caja = new T.Box3();
    // Comprobar las esquinas de la carrocería en el encuadre; no detecta oclusiones.
    caja.setFromCenterAndSize(new T.Vector3(0, 1, 0), new T.Vector3(2.7, 2, 4.9));
    for (const x of [caja.min.x, caja.max.x]) for (const y of [caja.min.y, caja.max.y]) for (const z of [caja.min.z, caja.max.z]) {
      const punto = auto.localToWorld(new T.Vector3(x, y, z)).project(camara);
      assert.ok(Math.abs(punto.x) < 1 && Math.abs(punto.y) < 1 && Math.abs(punto.z) < 1);
    }
  }
  const faros = auto.children.filter(o => o.isSpotLight);
  assert.equal(faros.length, 2);
  faros.forEach(luz => {
    assert.equal(luz.target.parent, auto); assert.equal(luz.castShadow, true);
    const direccion = luz.target.getWorldPosition(new T.Vector3()).sub(luz.getWorldPosition(new T.Vector3())).normalize();
    const esperada = new T.Vector3(0, -0.8, -17.62).normalize().applyQuaternion(auto.quaternion);
    assert.ok(direccion.distanceTo(esperada) < 1e-8);
  });
  const lamparas = []; p.escena.traverse(o => { if (o.isPointLight) lamparas.push(o); });
  assert.equal(lamparas.length, 7); lamparas.forEach(l => { cerca(l.intensity, 23); assert.equal(l.castShadow, false); });
  p.tecla('KeyW', true); p.tecla('KeyA', true); p.conducir(3, 60);
  const deseada = auto.localToWorld(new T.Vector3(0, 8.8, 14));
  assert.ok(camara.position.distanceTo(deseada) < 1e-7);
  p.contexto.window.innerWidth = 600; p.contexto.window.innerHeight = 900; p.evento('resize');
  cerca(camara.aspect, 600 / 900);
}
const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
for (const [, ruta] of html.matchAll(/<script src="(\.\/[^\"]+)"/g)) assert.ok(fs.existsSync(path.join(base, ruta)));
assert.equal(fs.readFileSync(path.join(base, 'vendor/three.min.js')).equals(fs.readFileSync(path.join(base, '../versiones/V1_Escenario_Fijo/vendor/three.min.js'))), true);
console.log('OK: tiempo, teclas, giro, retroceso, límites, foco, cámara, faros, alumbrado y rutas locales. WebGL simulado.');
module.exports = { iniciar, cerca };
