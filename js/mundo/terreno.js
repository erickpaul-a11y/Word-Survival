/* Persistencia e interacción de terreno tridimensional (Excavar / Colocar) */
(function() {
  'use strict';

  // Guarda o remueve una modificación de densidad en el mapa global del mundo
  Mundo.prototype.establecerDensidad3D = function(x, y, z, nuevaDensidad) {
    const rx = Math.round(x * 2) / 2;
    const ry = Math.round(y * 2) / 2;
    const rz = Math.round(z * 2) / 2;
    const clave = `${rx},${ry},${rz}`;

    this.modificaciones.set(clave, nuevaDensidad);

    // Identificar y regenerar el chunk 3D correspondiente
    const cx = Math.floor(rx / this.tam);
    const cz = Math.floor(rz / this.tam);
    const claveChunk = `${cx},${cz}`;

    if (this.chunks.has(claveChunk)) {
      const chunkAnterior = this.chunks.get(claveChunk);
      this.m.escena.remove(chunkAnterior.grupo);
      this.chunks.delete(claveChunk);
      this.generar(cx, cz);
    }
  };

  // Redefinición de romper/excavar terreno suave
  Mundo.prototype.destruirBloque = function(hit, radio) {
    if (!hit || !hit.point) return null;
    const p = hit.point;
    const r = radio || 1.5;

    // Reduce la densidad en la posición recibida
    this.excavar(p, r);

    return { x: p.x, y: p.y, z: p.z, radio: r };
  };

  // Colocar o rellenar con tierra en una posición tridimensional
  Mundo.prototype.colocarBloque = function(x, y, z, radio) {
    const pos = new THREE.Vector3(x, y, z);
    const r = radio || 1.5;

    // Aumenta la densidad en el punto para reconstruir la masa de tierra
    this.anadirTierra(pos, r);

    return { x, y, z, radio: r };
  };

  // Helper específico para colocar tierra utilizando un punto de impacto
  Mundo.prototype.colocarTierraCercana = function(hit, radio) {
    if (!hit || !hit.point) return null;
    
    // Si la colisión incluye una normal, colocamos la tierra ligeramente empujada hacia afuera
    let pos = hit.point.clone();
    if (hit.face && hit.face.normal) {
      pos.add(hit.face.normal.clone().multiplyScalar(0.5));
    }

    return this.colocarBloque(pos.x, pos.y, pos.z, radio);
  };
})();
