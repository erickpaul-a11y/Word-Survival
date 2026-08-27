/* Módulo de Interacción con el Terreno 3D */
(function() {
  'use strict';

  class Terreno {
    constructor(mundo) {
      this.mundo = mundo;
      this.raycaster = new THREE.Raycaster();
    }

    // Detecta qué bloque 3D está mirando la cámara o cursor
    obtenerBloqueMirado(camara, distanciaMax = 8) {
      this.raycaster.setFromCamera({ x: 0, y: 0 }, camara); // Apunta al centro de la pantalla
      
      const objetosInteractivos = [];
      for (const chunk of this.mundo.chunks.values()) {
        chunk.grupo.traverse(child => {
          if (child.isInstancedMesh && child.userData.interactivo) {
            objetosInteractivos.push(child);
          }
        });
      }

      const impactos = this.raycaster.intersectObjects(objetosInteractivos);
      if (impactos.length > 0 && impactos[0].distance <= distanciaMax) {
        return impactos[0];
      }
      return null;
    }

    // Acción para picar / excavar un bloque en 3D
    excavar(camara) {
      const hit = this.obtenerBloqueMirado(camara);
      if (hit) {
        return this.mundo.destruirBloque(hit, 1);
      }
      return null;
    }

    // Acción para colocar un bloque de tierra en 3D sobre la cara seleccionada
    colocarTierra(camara) {
      const hit = this.obtenerBloqueMirado(camara);
      if (hit) {
        return this.mundo.colocarTierraCercana(hit, 1);
      }
      return null;
    }
  }

  window.Terreno = Terreno;
})();
