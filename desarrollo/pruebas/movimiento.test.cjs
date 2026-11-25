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
  vm.runInContext(fs.readFileSync(path.join(base, 'src/colisiones.js'), 'utf8'), contexto);
  const T = contexto.THREE;
  T.WebGLRenderer = class {
    constructor() { this.shadowMap = {}; this.domElement = {}; }
    setPixelRatio() {} setSize() {}
    render(s, c) { escena = s; camara = c; s.updateMatrixWorld(true); c.updateMatrixWorld(true); }
  };
  // Instrumentación solo en memoria de pruebas; no publica una API en el navegador.
  const fuente = fs.readFileSync(path.join(base, 'src/escena.js'), 'utf8').replace('  iniciar();',
    '  iniciar(); globalThis.pruebaCiudad = { obstaculos, FORMA_AUTO, LIMITES_SOLIDOS, aplicarMovimientoSeguro, posicionAutoLibre, registrarObstaculo };');
  vm.runInContext(fuente, contexto);
  pendiente(0);
  return {
    T, escena, camara, contexto, elementos, ciudad: contexto.pruebaCiudad,
    geometria: vm.runInContext('ColisionesCiudad', contexto),
    control(id) {
      function buscar(e) { if (e.id === id) return e; for (const h of e.hijos || []) { const r = buscar(h); if (r) return r; } }
      for (const e of Object.values(elementos)) { const r = buscar(e); if (r) return r; }
      throw Error('Control ausente: ' + id);
    },
    auto: escena.getObjectByName('autoRetro'),
    evento(nombre) { eventos[nombre](); },
    tecla(code, soltar = false, target, repeat = false) {
      let bloqueado = false;
      eventos[soltar ? 'keyup' : 'keydown']({ code, target, repeat, preventDefault() { bloqueado = true; } });
      return bloqueado;
    },
    paso(dt) { tiempo += dt * 1000; pendiente(tiempo); },
    conducir(segundos, fps) { for (let i = 0; i < segundos * fps; i++) this.paso(1 / fps); }
  };
}
const cerca = (a, b, tolerancia = 1e-8) => assert.ok(Math.abs(a - b) < tolerancia, `${a} != ${b}`);
const velocidad = p => Number(p.elementos['velocidad-actual'].textContent);
const crucero = p => p.elementos['estado-crucero'].textContent.startsWith('Activado');
const pulsarC = p => { p.tecla('KeyC'); p.tecla('KeyC', true); };
for (const fps of [30, 60, 120]) {
  const p = iniciar(); p.tecla('KeyW'); p.conducir(1, fps);
  cerca(velocidad(p), 1.33, 0.01); // Integral 0.8*t + (3.2/6)*t².
  cerca(p.auto.position.z, 11 - (0.4 + 3.2/18), 0.002);
  p.conducir(2, fps); cerca(velocidad(p), 7.2, 0.01);
  p.conducir(1, fps); cerca(velocidad(p), 11.2, 0.01);
  p.conducir(0.5, fps); cerca(velocidad(p), 12);
  p.tecla('KeyW', true); p.conducir(0.5, fps); cerca(velocidad(p), 11);
}
{
  const p = iniciar(); p.tecla('KeyS'); p.conducir(3,60); cerca(velocidad(p),-5);
  p.tecla('KeyS',true); p.tecla('KeyW'); p.conducir(0.5,60); cerca(velocidad(p),-1,0.01);
  p.conducir(0.5,60); assert.ok(velocidad(p)>0);
}
{
  const p = iniciar(); p.tecla('KeyW'); p.conducir(3,60); p.tecla('KeyW',true); p.tecla('KeyS');
  p.conducir(0.5,60); cerca(velocidad(p),3.2,0.01);
  p.conducir(1,60); assert.ok(velocidad(p)<0);
}
{
  const p=iniciar(); p.auto.position.set(26,0.04,13); pulsarC(p); assert.equal(crucero(p),false);
  p.tecla('KeyW'); p.conducir(1,60); pulsarC(p); assert.equal(crucero(p),false);
  p.conducir(1,60); p.tecla('KeyC'); const fija=velocidad(p); assert.equal(crucero(p),true);
  p.tecla('KeyC'); assert.equal(crucero(p),true); // Una pulsación sostenida.
  p.tecla('KeyC',false,undefined,true); assert.equal(crucero(p),true);
  p.tecla('KeyW',true); p.tecla('KeyA'); p.conducir(2,60); cerca(velocidad(p),fija);
  assert.ok(p.auto.rotation.y>0); p.tecla('KeyC',true); pulsarC(p); assert.equal(crucero(p),false);
  p.conducir(0.5,60); assert.ok(velocidad(p)<fija);
}
for(const pedal of ['KeyW','KeyS','ArrowUp','ArrowDown']) {
  const p=iniciar(); p.tecla('KeyW'); p.conducir(2,60); p.tecla('KeyW',true); pulsarC(p);
  assert.equal(crucero(p),true); p.tecla(pedal); assert.equal(crucero(p),false);
}
for(const evento of ['blur','visibilitychange']) {
  const p=iniciar(); p.tecla('KeyW'); p.conducir(2,60); pulsarC(p); const pos=p.auto.position.clone();
  p.evento(evento); p.paso(10); p.conducir(1,60);
  cerca(velocidad(p),0); assert.equal(crucero(p),false); assert.ok(pos.equals(p.auto.position));
}
for(const [marcha,signo] of [['KeyW',1],['KeyS',-1]]) {
  const p=iniciar(); p.tecla(marcha); p.tecla('KeyA'); p.conducir(1,60);
  cerca(p.auto.rotation.y,signo*1.6); cerca(p.auto.position.y,0.04);
}
{
  const p=iniciar(); p.tecla('KeyW'); p.tecla('ArrowUp'); p.conducir(1,60); cerca(velocidad(p),1.33,0.01);
  p.tecla('KeyS'); p.conducir(1,60); cerca(velocidad(p),0);
  p.tecla('KeyW',true); p.tecla('ArrowUp',true); p.conducir(1,60); assert.ok(velocidad(p)<0);
  pulsarC(p); assert.equal(crucero(p),false);
}
{
  const p=iniciar(); p.tecla('KeyW'); p.paso(10); assert.ok(velocidad(p)<0.1);
  p.conducir(12,60); assert.ok(Math.abs(p.auto.position.z)<=42.8-2.47); assert.equal(crucero(p),false);
}
{
  const p=iniciar(), {T,auto,camara}=p; auto.position.set(26,0.04,13);
  // Dar tiempo a la cámara a seguir el cambio de ubicación de esta prueba.
  p.conducir(3,60); p.tecla('KeyW'); p.tecla('KeyA');
  for(let i=0;i<600;i++) {
    p.paso(1/60); assert.ok(velocidad(p)<=12);
    for(const x of [-1.35,1.35]) for(const y of [0,2]) for(const z of [-2.45,2.45]) {
      const punto=auto.localToWorld(new T.Vector3(x,y,z)).project(camara);
      assert.ok(Math.abs(punto.x)<1 && Math.abs(punto.y)<1 && Math.abs(punto.z)<1);
    }
  }
  auto.children.filter(o=>o.isSpotLight).forEach(luz=>{
    assert.equal(luz.target.parent,auto); assert.equal(luz.castShadow,true);
    const d=luz.target.getWorldPosition(new T.Vector3()).sub(luz.getWorldPosition(new T.Vector3())).normalize();
    assert.ok(d.distanceTo(new T.Vector3(0,-0.8,-17.62).normalize().applyQuaternion(auto.quaternion))<1e-8);
  });
  p.contexto.window.innerWidth=600; p.contexto.window.innerHeight=900; p.evento('resize'); cerca(camara.aspect,2/3);
}
const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
for (const [, ruta] of html.matchAll(/<script src="(\.\/[^\"]+)"/g)) assert.ok(fs.existsSync(path.join(base, ruta)));
assert.equal(fs.readFileSync(path.join(base, 'vendor/three.min.js')).equals(fs.readFileSync(path.join(base, '../versiones/V1_Escenario_Fijo/vendor/three.min.js'))), true);
console.log('OK: V4 aceleración, límites, frenado, reversa, crucero, foco, cámara, faros y rutas. WebGL simulado.');
module.exports = { iniciar, cerca };
