class Mundo {
  constructor(m, seed) {
    this.m = m;
    this.chunks = new Map();
    this.tam = 12;            // Tamaño del chunk
    this.radioCarga = 2;
    this.radioEliminar = 4;
    this.seed = seed || Math.random() * 100000;
    
    this.nivelAgua = 3;       // Límite donde el agua tiene volumen 3D
    
    // Almacena modificaciones hechas por el jugador en espacio 3D
    this.modificaciones = new Map();

    // Geometría sólida 3D real de 1x1x1
    this._boxGeo = new THREE.BoxGeometry(1, 1, 1);

    this._materiales = {
      cesped: new THREE.MeshLambertMaterial({ color: 0x2d8a2d }),
      tierra: new THREE.MeshLambertMaterial({ color: 0x5a3d28 }),
      arena:  new THREE.MeshLambertMaterial({ color: 0xc2a649 }),
      roca:   new THREE.MeshLambertMaterial({ color: 0x666666 }),
      agua:   new THREE.MeshPhongMaterial({
        color: 0x176dcc,
        transparent: true,
        opacity: 0.7,
        shininess: 80
      })
    };
  }

  ruido(x, y, z) {
    const n = Math.sin((x * 127.1 + y * 311.7 + z * 74.7 + this.seed) * 12.9898) * 43758.5453;
    return n - Math.floor(n);
  }

  obtenerSolido(x, y, z) {
    const rx = Math.floor(x);
    const ry = Math.floor(y);
    const rz = Math.floor(z);
    const clave = `${rx},${ry},${rz}`;
    
    // Modificaciones directas (1 = Bloque / 0 = Aire)
    if (this.modificaciones.has(clave)) {
      return this.modificaciones.get(clave);
    }

    // Terreno procedural base
    const hBase = Math.floor(Math.sin(x * 0.15 + this.seed) * 3 + Math.cos(z * 0.15 + this.seed) * 3 + 4);
    return y <= hBase ? 1 : 0;
  }

  // --- INTERACCIÓN Y PERSISTENCIA 3D ---

  excavar(posicionImpacto, radio = 1) {
    const cx = Math.floor(posicionImpacto.x);
    const cy = Math.floor(posicionImpacto.y);
    const cz = Math.floor(posicionImpacto.z);

    const r = Math.ceil(radio);
    const chunksAfectados = new Set();

    for (let x = -r; x <= r; x++) {
      for (let y = -r; y <= r; y++) {
        for (let z = -r; z <= r; z++) {
          if (Math.hypot(x, y, z) <= radio) {
            const bx = cx + x;
            const by = cy + y;
            const bz = cz + z;
            
            this.modificaciones.set(`${bx},${by},${bz}`, 0); // Quitar bloque

            const chunkX = Math.floor(bx / this.tam);
            const chunkZ = Math.floor(bz / this.tam);
            chunksAfectados.add(`${chunkX},${chunkZ}`);
          }
        }
      }
    }

    this.recargarChunks(chunksAfectados);
  }

  anadirTierra(posicionImpacto, radio = 1) {
    const cx = Math.floor(posicionImpacto.x);
    const cy = Math.floor(posicionImpacto.y);
    const cz = Math.floor(posicionImpacto.z);

    const r = Math.ceil(radio);
    const chunksAfectados = new Set();

    for (let x = -r; x <= r; x++) {
      for (let y = -r; y <= r; y++) {
        for (let z = -r; z <= r; z++) {
          if (Math.hypot(x, y, z) <= radio) {
            const bx = cx + x;
            const by = cy + y;
            const bz = cz + z;
            
            this.modificaciones.set(`${bx},${by},${bz}`, 1); // Agregar bloque

            const chunkX = Math.floor(bx / this.tam);
            const chunkZ = Math.floor(bz / this.tam);
            chunksAfectados.add(`${chunkX},${chunkZ}`);
          }
        }
      }
    }

    this.recargarChunks(chunksAfectados);
  }

  recargarChunks(setChunks) {
    setChunks.forEach(claveChunk => {
      if (this.chunks.has(claveChunk)) {
        const [cx, cz] = claveChunk.split(',').map(Number);
        const oldChunk = this.chunks.get(claveChunk);
        this.m.escena.remove(oldChunk.grupo);
        this.chunks.delete(claveChunk);
        this.generar(cx, cz);
      }
    });
  }

  destruirBloque(hit, radio) {
    if (!hit || !hit.point) return null;
    this.excavar(hit.point, radio || 1);
    return hit.point;
  }

  colocarBloque(x, y, z, radio) {
    this.anadirTierra(new THREE.Vector3(x, y, z), radio || 1);
    return { x, y, z };
  }

  colocarTierraCercana(hit, radio) {
    if (!hit || !hit.point) return null;
    let pos = hit.point.clone();
    if (hit.face && hit.face.normal) {
      pos.add(hit.face.normal.clone().multiplyScalar(0.5));
    }
    return this.colocarBloque(pos.x, pos.y, pos.z, radio);
  }

  // --- GENERACIÓN DE BLOQUES 3D CON VOLUMEN COMPLETO ---

  generar(cx, cz) {
    const clave = `${cx},${cz}`;
    if (this.chunks.has(clave)) return;

    const chunk = { grupo: new THREE.Group(), cx, cz };
    const size = this.tam;
    const minY = -2, maxY = 10;

    const listas = {
      cesped: [], tierra: [], arena: [], roca: [], agua: []
    };

    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        const wx = cx * size + x;
        const wz = cz * size + z;

        for (let y = minY; y <= maxY; y++) {
          const esSolido = this.obtenerSolido(wx, y, wz);

          if (esSolido === 1) {
            // Determinar tipo de bloque sólido
            const solidoArriba = this.obtenerSolido(wx, y + 1, wz);
            let tipo = 'tierra';
            
            if (solidoArriba === 0) {
              tipo = y <= this.nivelAgua ? 'arena' : 'cesped';
            } else if (y < 0) {
              tipo = 'roca';
            }

            listas[tipo].push(new THREE.Vector3(wx, y, wz));
          } else {
            // Agua en volumen 3D: Llenar si no hay bloque sólido y está bajo el nivel del agua
            if (y <= this.nivelAgua) {
              listas.agua.push(new THREE.Vector3(wx, y, wz));
            }
          }
        }
      }
    }

    // Instanciar bloques sólidos con 6 caras cerradas en 3D
    const dummy = new THREE.Object3D();
    for (const [tipo, posiciones] of Object.entries(listas)) {
      if (posiciones.length === 0) continue;

      const mesh = new THREE.InstancedMesh(
        this._boxGeo,
        this._materiales[tipo],
        posiciones.length
      );

      posiciones.forEach((pos, i) => {
        dummy.position.set(pos.x + 0.5, pos.y + 0.5, pos.z + 0.5);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });

      mesh.instanceMatrix.needsUpdate = true;
      mesh.userData.interactivo = true;
      chunk.grupo.add(mesh);
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
