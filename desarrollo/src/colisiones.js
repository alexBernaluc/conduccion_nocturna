/* Geometría horizontal independiente del render. Scripts clásicos, sin módulos. */
const ColisionesCiudad = (function () {
  'use strict';

  // SAT: si hay separación en alguno de los cuatro ejes, no hay intersección.
  function intersectaAuto(x, z, angulo, semiancho, semilargo, caja) {
    const c = Math.cos(angulo), s = Math.sin(angulo);
    const dx = (caja.min.x + caja.max.x) / 2 - x;
    const dz = (caja.min.z + caja.max.z) / 2 - z;
    const hx = (caja.max.x - caja.min.x) / 2;
    const hz = (caja.max.z - caja.min.z) / 2;
    const ac = Math.abs(c), as = Math.abs(s);
    if (Math.abs(dx) > hx + semiancho * ac + semilargo * as) return false;
    if (Math.abs(dz) > hz + semiancho * as + semilargo * ac) return false;
    if (Math.abs(dx * c - dz * s) > semiancho + hx * ac + hz * as) return false;
    if (Math.abs(dx * s + dz * c) > semilargo + hx * as + hz * ac) return false;
    return true;
  }

  function posicionLibre(x, z, angulo, forma, obstaculos, limites) {
    const c = Math.abs(Math.cos(angulo)), s = Math.abs(Math.sin(angulo));
    const extensionX = forma.semiancho * c + forma.semilargo * s;
    const extensionZ = forma.semiancho * s + forma.semilargo * c;
    if (Math.abs(x) + extensionX >= limites.x || Math.abs(z) + extensionZ >= limites.z) return false;
    return !obstaculos.some(function (obstaculo) {
      return intersectaAuto(x, z, angulo, forma.semiancho, forma.semilargo, obstaculo.caja);
    });
  }

  // Acota cuánto viaja una esquina al trasladarse y rotar durante cada subpaso.
  function cantidadPasos(distancia, giro, forma, pasoMaximo) {
    const radio = Math.hypot(forma.semiancho, forma.semilargo);
    return Math.max(1, Math.ceil((Math.abs(distancia) + radio * Math.abs(giro)) / pasoMaximo));
  }

  return { intersectaAuto: intersectaAuto, posicionLibre: posicionLibre, cantidadPasos: cantidadPasos };
})();
