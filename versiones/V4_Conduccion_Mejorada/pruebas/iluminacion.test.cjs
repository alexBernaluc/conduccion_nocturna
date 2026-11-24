const assert = require('node:assert/strict');
const { iniciar, cerca } = require('./movimiento.test.cjs');
const p = iniciar();
const faros = p.auto.children.filter(o => o.isSpotLight);
const luces = [], materiales = new Set();
p.escena.traverse(o => {
  if (o.isLight) luces.push(o);
  if (o.material && o.material.emissive && o.material.emissive.getHex() === 0xf9d58d) materiales.add(o.material);
});
assert.equal(luces.length, 11); assert.equal(materiales.size, 10);
assert.equal(luces.filter(o => o.castShadow).length, 2);
function ajustar(clave, valor) { const c = p.control('luz-' + clave); c.value = String(valor); c.eventos.input(); }
function encender(clave, valor) { const c = p.control('grupo-' + clave); c.checked = valor; c.eventos.change(); }
ajustar('izquierdo', 140); cerca(faros[0].intensity, 140); cerca(faros[1].intensity, 85);
ajustar('derecho', 0); assert.equal(faros[1].visible, false);
ajustar('publico', 45); luces.filter(l => l.isPointLight).forEach(l => cerca(l.intensity, 45));
ajustar('ambiente', 1.2); cerca(luces.find(l => l.isHemisphereLight).intensity, 1.2);
ajustar('luna', 0.9); cerca(luces.find(l => l.isDirectionalLight).intensity, 0.9);
ajustar('ventanas', 3); materiales.forEach(m => cerca(m.emissiveIntensity, 3));
ajustar('alcance', 60); ajustar('apertura', 60);
faros.forEach(l => { cerca(l.distance, 60); cerca(l.shadow.camera.far, 60); cerca(l.angle, Math.PI / 3); });
encender('faros', false); assert.ok(faros.every(l => !l.visible));
ajustar('izquierdo', 100); assert.equal(faros[0].visible, false);
encender('faros', true); cerca(faros[0].intensity, 100); assert.equal(faros[0].visible, true);
for (const [grupo, tipo] of [['publico','PointLight'],['ambiente','HemisphereLight'],['luna','DirectionalLight']]) {
  encender(grupo, false); assert.ok(luces.filter(l=>l.type===tipo).every(l=>!l.visible));
}
encender('ventanas', false); materiales.forEach(m=>cerca(m.emissiveIntensity,0));
const posicion = p.auto.position.clone();
p.elementos['restablecer-luces'].eventos.click();
faros.forEach(l => { cerca(l.intensity,85); cerca(l.distance,34); cerca(l.angle,Math.PI/7); assert.equal(l.visible,true); });
materiales.forEach(m=>cerca(m.emissiveIntensity,1));
assert.ok(p.auto.position.equals(posicion));
for (const clave of ['faros','publico','ambiente','luna','ventanas']) assert.equal(p.control('grupo-'+clave).checked,true);
const control=p.control('luz-izquierdo'); control.enPanel=true;
p.tecla('ArrowUp'); p.elementos['panel-luces'].eventos.focusin(); p.conducir(1,60);
assert.ok(p.auto.position.equals(posicion));
assert.equal(p.tecla('ArrowUp',false,control),false); p.conducir(1,60); assert.ok(p.auto.position.equals(posicion));
assert.equal(p.tecla('KeyW',false,control),true); ajustar('izquierdo',50); p.conducir(1,60);
assert.ok(p.auto.position.z < posicion.z); const trasAcelerar = p.auto.position.z; p.tecla('KeyW',true,control);
p.conducir(1,60); assert.ok(p.auto.position.z < trasAcelerar); cerca(Number(p.elementos['velocidad-actual'].textContent), 0);
console.log('OK: controles V3, grupos, reset, emisión, sombras limitadas y conducción desde el panel.');
