class Mundo {
  constructor(m, seed) {
    this.m = m;
    this.chunks = new Map();
    this.tam = 12;            // Tamaño del chunk en unidades 3D
    this.res = 1;             // Resolución de densidad
    this.radioCarga = 2;
    this.radioEliminar = 4;
    this.seed = seed || Math.random() * 100000;
    
    this.nivelAgua = 3;       // Nivel donde se genera el volumen de agua profundo
    
    // Almacena las modificaciones tridimensionales hechas por el jugador: Map<"x,y,z", densidad>
    this.modificaciones = new Map();

    this._materiales = {
      terreno: new THREE.MeshPhongMaterial({
        vertexColors: true,
        flatShading: true,
        shininess: 5
      }),
      agua: new THREE.MeshPhongMaterial({
        color: 0x176dcc,
        transparent: true,
        opacity: 0.7,
        shininess: 80,
        side: THREE.DoubleSide
      })
    };
  }

  ruido(x, y, z) {
    const n = Math.sin((x * 127.1 + y * 311.7 + z * 74.7 + this.seed) * 12.9898) * 43758.5453;
    return n - Math.floor(n);
  }

  // Consulta la densidad en un punto tridimensional (X, Y, Z)
  obtenerDensidad(x, y, z) {
    const rx = Math.round(x * 2) / 2;
    const ry = Math.round(y * 2) / 2;
    const rz = Math.round(z * 2) / 2;
    const clave = `${rx},${ry},${rz}`;
    
    // Si la zona fue modificada por el jugador, usar ese valor
    if (this.modificaciones.has(clave)) {
      return this.modificaciones.get(clave);
    }

    // Terreno procedural base
    const hBase = Math.sin(x * 0.15 + this.seed) * 3 + Math.cos(z * 0.15 + this.seed) * 3 + 4;
    const detalle = (this.ruido(x * 0.2, y * 0.2, z * 0.2) - 0.5) * 1.5;
    
    return (hBase + detalle) - y;
  }

  // Aplica o quita masa en un radio dentro del volumen 3D
  modificarDensidadEn(posCentro, radio, cambio) {
    const minX = Math.floor(posCentro.x - radio);
    const maxX = Math.ceil(posCentro.x + radio);
    const minY = Math.floor(posCentro.y - radio);
    const maxY = Math.ceil(posCentro.y + radio);
    const minZ = Math.floor(posCentro.z - radio);
    const maxZ = Math.ceil(posCentro.z + radio);

    const chunksAfectados = new Set();

    for (let x = minX; x <= maxX; x += 0.5) {
      for (let y = minY; y <= maxY; y += 0.5) {
        for (let z = minZ; z <= maxZ; z += 0.5) {
          const d = Math.hypot(x - posCentro.x, y - posCentro.y, z - posCentro.z);
          if (d <= radio) {
            const rx = Math.round(x * 2) / 2;
            const ry = Math.round(y * 2) / 2;
            const rz = Math.round(z * 2) / 2;
            const clave = `${rx},${ry},${rz}`;

            const densActual = this.obtenerDensidad(x, y, z);
            const factor = (1 - d / radio);
            this.modificaciones.set(clave, densActual + cambio * factor);

            const cx = Math.floor(x / this.tam);
            const cz = Math.floor(z / this.tam);
            chunksAfectados.add(`${cx},${cz}`);
          }
        }
      }
    }

    // Regenera dinámicamente los chunks modificados
    chunksAfectados.forEach(claveChunk => {
      if (this.chunks.has(claveChunk)) {
        const [cx, cz] = claveChunk.split(',').map(Number);
        const oldChunk = this.chunks.get(claveChunk);
        this.m.escena.remove(oldChunk.grupo);
        this.chunks.delete(claveChunk);
        this.generar(cx, cz);
      }
    });
  }

  excavar(posicionImpacto, radio = 1.5) {
    this.modificarDensidadEn(posicionImpacto, radio, -2.0);
  }

  anadirTierra(posicionImpacto, radio = 1.5) {
    this.modificarDensidadEn(posicionImpacto, radio, 2.0);
  }

  // --- MÉTODOS DE INTERACCIÓN Y PERSISTENCIA ---

  destruirBloque(hit, radio) {
    if (!hit || !hit.point) return null;
    const p = hit.point;
    const r = radio || 1.5;

    this.excavar(p, r);
    return { x: p.x, y: p.y, z: p.z, radio: r };
  }

  colocarBloque(x, y, z, radio) {
    const pos = new THREE.Vector3(x, y, z);
    const r = radio || 1.5;

    this.anadirTierra(pos, r);
    return { x, y, z, radio: r };
  }

  colocarTierraCercana(hit, radio) {
    if (!hit || !hit.point) return null;
    
    let pos = hit.point.clone();
    if (hit.face && hit.face.normal) {
      pos.add(hit.face.normal.clone().multiplyScalar(0.5));
    }

    return this.colocarBloque(pos.x, pos.y, pos.z, radio);
  }

  // --- GENERACIÓN DE MALLA Y VOLUMEN 3D ---

  generar(cx, cz) {
    const clave = `${cx},${cz}`;
    if (this.chunks.has(clave)) return;

    const chunk = { grupo: new THREE.Group(), cx, cz };
    const size = this.tam;
    const minY = -4, maxY = 12;

    const vertsTerreno = [];
    const colorsTerreno = [];
    const vertsAgua = [];

    for (let x = 0; x < size; x += this.res) {
      for (let z = 0; z < size; z += this.res) {
        for (let y = minY; y < maxY; y += this.res) {
          const wx = cx * size + x;
          const wz = cz * size + z;
          
          const d0 = this.obtenerDensidad(wx, y, wz);
          const dX = this.obtenerDensidad(wx + this.res, y, wz);
          const dY = this.obtenerDensidad(wx, y + this.res, wz);
          const dZ = this.obtenerDensidad(wx, y, wz + this.res);

          // Construcción de la superficie suave del terreno en 3D
          if ((d0 > 0) !== (dX > 0) || (d0 > 0) !== (dY > 0) || (d0 > 0) !== (dZ > 0)) {
            vertsTerreno.push(
              wx, y, wz,
              wx + this.res, y, wz,
              wx, y + this.res, wz
            );

            let color = [0.15, 0.5, 0.15]; // Césped
            if (y < this.nivelAgua) color = [0.7, 0.6, 0.3]; // Arena
            if (y < 0) color = [0.4, 0.4, 0.45]; // Roca
            
            colorsTerreno.push(...color, ...color, ...color);
          }

          // Generación de volumen de agua 3D (Se llena si hay hueco bajo el nivel del agua)
          if (d0 <= 0 && y <= this.nivelAgua) {
            vertsAgua.push(
              wx, y, wz,
              wx + this.res, y, wz,
              wx, y + this.res, wz,
              
              wx + this.res, y, wz,
              wx + this.res, y + this.res, wz,
              wx, y + this.res, wz
            );
          }
        }
      }
    }

    if (vertsTerreno.length > 0) {
      const geoT = new THREE.BufferGeometry();
      geoT.setAttribute('position', new THREE.Float32BufferAttribute(vertsTerreno, 3));
      geoT.setAttribute('color', new THREE.Float32BufferAttribute(colorsTerreno, 3));
      geoT.computeVertexNormals();

      const meshT = new THREE.Mesh(geoT, this._materiales.terreno);
      meshT.userData.interactivo = true;
      chunk.grupo.add(meshT);
    }

    if (vertsAgua.length > 0) {
      const geoA = new THREE.BufferGeometry();
      geoA.setAttribute('position', new THREE.Float32BufferAttribute(vertsAgua, 3));
      geoA.computeVertexNormals();

      const meshA = new THREE.Mesh(geoA, this._materiales.agua);
      chunk.grupo.add(meshA);
    }

    this.chunks.set(clave, chunk);
    this.m.escena.add(chunk.grupo);
  }

  solicitarChunk(cx, cz) {
    const clave = `${cx},${cz}`;
    if (!this.chunks.has(clave)) {
      this.generar(cx, cz);
    }
  }

  actualizar(jx, jz) {
    const cx = Math.floor(jx / this.tam);
    const cz = Math.floor(jz / this.tam);

    for (let x = -this.radioCarga; x <= this.radioCarga; x++) {
      for (let z = -this.radioCarga; z <= this.radioCarga; z++) {
        this.solicitarChunk(cx + x, cz + z);
      }
    }
  }
}

window.Mundo = Mundo;
