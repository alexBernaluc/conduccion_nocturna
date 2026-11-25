const assert = require('node:assert/strict');
const { iniciar, cerca } = require('./movimiento.test.cjs');
const p = iniciar(), {T, ciudad, geometria: G} = p;
const forma = ciudad.FORMA_AUTO;
assert.equal(ciudad.obstaculos.length, 32); // 10 construcciones, 10 troncos, 7 postes, 5 muros.
assert.equal(p.escena.children.filter(o=>o.name==='vereda').length,5);
assert.ok(ciudad.posicionAutoLibre(-13,11,0));
// Tramos centrales de las siete calles: no hay barreras escondidas en las calzadas.
for(const x of [-39,-13,13,39]) for(let z=-34;z<=34;z+=0.5) assert.ok(ciudad.posicionAutoLibre(x,z,0));
for(const z of [-26,0,26]) for(let x=-46;x<=46;x+=0.5) assert.ok(ciudad.posicionAutoLibre(x,z,Math.PI/2));
// Caso que requiere orientación: largo del auto invade aunque su centro quede afuera.
const caja = new T.Box3(new T.Vector3(2,-1,-1), new T.Vector3(3,3,1));
assert.equal(G.intersectaAuto(0,0,0,forma.semiancho,forma.semilargo,caja),false);
assert.equal(G.intersectaAuto(0,0,Math.PI/2,forma.semiancho,forma.semilargo,caja),true);
// Cada tipo real registrado bloquea un auto centrado sobre su geometría sólida.
for(const o of ciudad.obstaculos) {
  const centro=o.caja.getCenter(new T.Vector3());
  assert.ok(G.intersectaAuto(centro.x,centro.z,0,forma.semiancho,forma.semilargo,o.caja));
}
// Ensayos aislados con obstáculos sintéticos: mismo registro y movimiento de producción.
function ensayo(ancho, largo, x=26, z=0) {
  const q=iniciar();
  q.ciudad.obstaculos.length=0; // Solo el fixture, nunca la escena de producción.
  const m=new q.T.Mesh(new q.T.BoxGeometry(ancho,3,largo),new q.T.MeshStandardMaterial());
  m.position.set(x,1.5,z); q.escena.add(m); q.ciudad.registrarObstaculo(m,'prueba');
  q.auto.position.set(26,0.04,12); q.auto.rotation.y=0;
  return q;
}
for(const [ancho,largo] of [[8,8],[0.22,0.22],[0.45,0.45],[12,0.35]]) {
  const q=ensayo(ancho,largo);
  q.ciudad.aplicarMovimientoSeguro(30,0); // Equivalente a mucho más que 12 u/s en un frame.
  assert.ok(q.auto.position.z>largo/2+forma.semilargo);
  assert.ok(q.ciudad.posicionAutoLibre(q.auto.position.x,q.auto.position.z,q.auto.rotation.y));
  const antes=q.auto.position.z;
  for(let i=0;i<20;i++) q.ciudad.aplicarMovimientoSeguro(1,0);
  assert.ok(q.auto.position.z<=antes && q.auto.position.z>largo/2+forma.semilargo);
  q.ciudad.aplicarMovimientoSeguro(-3,0); assert.ok(q.auto.position.z>antes+2.9);
  q.ciudad.aplicarMovimientoSeguro(0,0.3); cerca(q.auto.rotation.y,0.3);
}
{
  const q=ensayo(1,10,29,0); q.auto.position.set(26,0.04,0);
  q.ciudad.aplicarMovimientoSeguro(0,Math.PI/2);
  assert.ok(q.auto.rotation.y<Math.PI/2); // Una esquina no puede barrer la pared.
  assert.ok(q.ciudad.posicionAutoLibre(q.auto.position.x,q.auto.position.z,q.auto.rotation.y));
}
{
  const q=ensayo(20,0.35); q.auto.position.set(26,0.04,4); q.auto.rotation.y=Math.PI/4;
  for(let i=0;i<100;i++) {
    q.ciudad.aplicarMovimientoSeguro(0.2,0);
    assert.ok(q.ciudad.posicionAutoLibre(q.auto.position.x,q.auto.position.z,q.auto.rotation.y));
  }
  assert.ok(q.auto.position.x<24); // Conservó componente tangencial a la pared.
}
for(const fps of [30,60,120]) {
  const q=ensayo(10,0.35); q.auto.position.set(26,0.04,35);
  q.tecla('KeyW'); q.conducir(4.5,fps); cerca(Number(q.elementos['velocidad-actual'].textContent),12);
  q.tecla('KeyC'); q.tecla('KeyC',true); q.tecla('KeyW',true);
  q.conducir(2,fps);
  assert.ok(q.elementos['estado-crucero'].textContent.startsWith('Desactivado'));
  cerca(Number(q.elementos['velocidad-actual'].textContent),0);
  assert.ok(q.auto.position.z>forma.semilargo+0.175);
  const pos=q.auto.position.clone(); q.conducir(1,fps); assert.ok(pos.equals(q.auto.position));
  q.tecla('KeyS'); q.conducir(2,fps); assert.ok(q.auto.position.z>pos.z+2);
}
{
  const q=iniciar(); const antes=q.auto.rotation.y; q.tecla('KeyA'); q.conducir(0.3,60);
  assert.ok(q.auto.rotation.y>antes); // Nuevo giro en reposo, en calle libre.
  assert.ok(q.ciudad.posicionAutoLibre(q.auto.position.x,q.auto.position.z,q.auto.rotation.y));
}
// Restauración de transparencia al despejar la vista, sin modificar emisión.
{
  const q=iniciar(); q.auto.position.set(-21.7,0.04,-21); q.auto.rotation.y=0;
  q.conducir(3,60);
  const materiales=[]; q.escena.traverse(o=>{if(o.material)materiales.push(o.material);});
  assert.ok(materiales.some(m=>m.opacity===0.18));
  q.auto.position.set(39,0.04,0); q.conducir(3,60);
  assert.ok(materiales.every(m=>m.opacity===1));
}
console.log('OK: cinco manzanas, calles libres, SAT, impactos/subpasos, giro, reversa, deslizamiento, crucero y visibilidad.');
