class Mundo {
  constructor(m, seed) {
    this.m = m;
    this.chunks = new Map();
    this.tam = 12;            // Tamaño de chunk en unidades de espacio 3D
    this.res = 1;             // Resolución de puntos por unidad
    this.radioCarga = 2;
    this.radioEliminar = 4;
    this.seed = seed || Math.random() * 100000;
    
    this.nivelAgua = 3;       // Altura del agua (Crea volumen hasta este punto)
    
    // Almacena modificaciones hechas por el jugador: Map<"x,y,z", densidad>
    // Densidad > 0 = Tierra/Roca | Densidad <= 0 = Aire/Hueco
    this.modificaciones = new Map();

    this._texturas = this.crearTexturasNaturales();
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

  crearTextura(w, h, pintar) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    pintar(x, w, h);
    const t = new THREE.CanvasTexture(c);
    t.magFilter = t.minFilter = THREE.NearestFilter;
    return t;
  }

  crearTexturasNaturales() {
    return {};
  }

  ruido(x, y, z) {
    const n = Math.sin((x * 127.1 + y * 311.7 + z * 74.7 + this.seed) * 12.9898) * 43758.5453;
    return n - Math.floor(n);
  }

  // Devuelve la densidad en un punto tridimensional
  obtenerDensidad(x, y, z) {
    const clave = `${Math.round(x * 2) / 2},${Math.round(y * 2) / 2},${Math.round(z * 2) / 2}`;
    
    // Si el jugador modificó esta zona concreta, usar ese valor
    if (this.modificaciones.has(clave)) {
      return this.modificaciones.get(clave);
    }

    // Terreno procedural base suave usando funciones continuas
    const hBase = Math.sin(x * 0.15 + this.seed) * 3 + Math.cos(z * 0.15 + this.seed) * 3 + 4;
    const detalle = (this.ruido(x * 0.2, y * 0.2, z * 0.2) - 0.5) * 1.5;
    
    // Si Y está por debajo de la altura, la densidad es positiva (Sólido)
    return (hBase + detalle) - y;
  }

  // Modifica un punto concreto o esfera de influencia en el espacio 3D
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
            const clave = `${x},${y},${z}`;
            const densActual = this.obtenerDensidad(x, y, z);
            
            // Suavizado según la distancia al centro de la interacción
            const factor = (1 - d / radio);
            this.modificaciones.set(clave, densActual + cambio * factor);

            // Marcar chunks vecinos para reconstruir su geometría
            const cx = Math.floor(x / this.tam);
            const cz = Math.floor(z / this.tam);
            chunksAfectados.add(`${cx},${cz}`);
          }
        }
      }
    }

    // Recargar solo las áreas modificadas dinámicamente
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

  generar(cx, cz) {
    const clave = `${cx},${cz}`;
    if (this.chunks.has(clave)) return;

    const chunk = { grupo: new THREE.Group(), cx, cz };
    const size = this.tam;
    const minY = -4, maxY = 12; // Límites verticales del volumen

    const vertsTerreno = [];
    const colorsTerreno = [];
    const vertsAgua = [];

    // Generador de Malla Suave editable (Surface Sampling / Grid Evaluation)
    for (let x = 0; x < size; x += this.res) {
      for (let z = 0; z < size; z += this.res) {
        for (let y = minY; y < maxY; y += this.res) {
          const wx = cx * size + x;
          const wz = cz * size + z;
          
          const d0 = this.obtenerDensidad(wx, y, wz);
          const dX = this.obtenerDensidad(wx + this.res, y, wz);
          const dY = this.obtenerDensidad(wx, y + this.res, wz);
          const dZ = this.obtenerDensidad(wx, y, wz + this.res);

          // Construcción de triángulos suaves en intersecciones de densidad (Puntos interactuables)
          if ((d0 > 0) !== (dX > 0) || (d0 > 0) !== (dY > 0) || (d0 > 0) !== (dZ > 0)) {
            vertsTerreno.push(
              wx, y, wz,
              wx + this.res, y, wz,
              wx, y + this.res, wz
            );

            // Asignación cromática natural según altura y material
            let color = [0.15, 0.5, 0.15]; // Césped
            if (y < this.nivelAgua) color = [0.7, 0.6, 0.3]; // Arena
            if (y < 0) color = [0.4, 0.4, 0.45]; // Roca
            
            colorsTerreno.push(...color, ...color, ...color);
          }

          // AGUA VOLUMÉTRICA EN 3D:
          // Si el terreno está vacío (densidad <= 0) pero está por debajo del nivelAgua, genera volumen acuático con profundidad
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

    // Malla de Terreno editable
    if (vertsTerreno.length > 0) {
      const geoT = new THREE.BufferGeometry();
      geoT.setAttribute('position', new THREE.Float32BufferAttribute(vertsTerreno, 3));
      geoT.setAttribute('color', new THREE.Float32BufferAttribute(colorsTerreno, 3));
      geoT.computeVertexNormals();

      const meshT = new THREE.Mesh(geoT, this._materiales.terreno);
      meshT.userData.interactivo = true;
      chunk.grupo.add(meshT);
    }

    // Malla de Agua con Volumen Real 3D
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

  // Métodos de interacción desde el juego:
  
  // Llama a esto para excavar/picar una esfera en el espacio 3D
  excavar(posicionImpacto, radio = 1.5) {
    this.modificarDensidadEn(posicionImpacto, radio, -2.0);
  }

  // Llama a esto para añadir/construir tierra orgánica en el espacio 3D
  anadirTierra(posicionImpacto, radio = 1.5) {
    this.modificarDensidadEn(posicionImpacto, radio, 2.0);
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
