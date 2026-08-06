class Motor {
    constructor() {
        this.escena = new THREE.Scene();
        this.cam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.domElement.id = 'canvas-3d';
        document.body.appendChild(this.renderer.domElement);

        this.raycaster = new THREE.Raycaster();
        this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.mouse = new THREE.Vector2(0, 0);
        this.targetPoint = new THREE.Vector3();

        this.ang = { x: 0, y: 0 };
        this.teclas = {};
        this.cameraMode = 'first';

        // basic scene
        const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
        this.escena.add(light);
        const dir = new THREE.DirectionalLight(0xffffff, 0.6);
        dir.position.set(5, 10, 7);
        this.escena.add(dir);

        // player placeholder; will be set in iniciar()
        this.j = null;
        this.mundo = null;
        this.criaturas = null;

        // resize handling
        window.addEventListener('resize', () => {
            this.cam.aspect = window.innerWidth / window.innerHeight;
            this.cam.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    iniciar() {
        // create player
        try {
            if (typeof Jugador !== 'undefined') {
                this.j = new Jugador();
                this.j.x = 0; this.j.z = 0; this.j.y = 2;
                this.j.agregarAEscena(this.escena);
            }
        } catch (e) { console.warn('Jugador not available', e); }

        // mundo
        try {
            if (typeof Mundo !== 'undefined') this.mundo = new Mundo(this);
        } catch (e) { }

        // criaturas manager - CORREGIDO: pasar datos de criaturas
        try {
            const criaturaData = {
                'lobo': { vida: 30, daño: 8 },
                'vaca': { vida: 20, daño: 5 },
                'ciervo': { vida: 15, daño: 3 }
            };
            if (typeof GestorCriaturas !== 'undefined') this.criaturas = new GestorCriaturas(this, criaturaData);
            if (this.criaturas && typeof this.criaturas.generarIniciales === 'function') this.criaturas.generarIniciales();
        } catch (e) { console.warn('Criaturas error:', e); }

        // position camera initially
        this.cam.position.set(0, 1.6, 0);

        // main loop
        const loop = (t) => {
            // movement
            try {
                this._updateMovement();
            } catch (e) { }

            // update world chunks
            try {
                if (this.j && this.mundo) {
                    this.mundo.actualizar(this.j.x, this.j.z);
                }
            } catch (e) { }

            // update creatures
            try {
                if (this.criaturas && typeof this.criaturas.actualizar === 'function') {
                    this.criaturas.actualizar();
                }
            } catch (e) { }

            // update player HUD - CORREGIDO
            try {
                if (this.j && typeof this.j.actualizarHUD === 'function') {
                    this.j.actualizarHUD();
                }
            } catch (e) { }

            // update camera position based on mode - CORREGIDO
            try {
                if (this.j) {
                    if (this.cameraMode === 'first') {
                        // Primera persona: cámara en la cabeza del jugador
                        this.cam.position.set(this.j.x, this.j.y + 0.8, this.j.z);
                    } else {
                        // Tercera persona: cámara detrás del jugador
                        const distance = 5;
                        const height = 2;
                        const camX = this.j.x - Math.cos(this.ang.y) * distance;
                        const camZ = this.j.z - Math.sin(this.ang.y) * distance;
                        this.cam.position.set(camX, this.j.y + height, camZ);
                        this.cam.lookAt(this.j.x, this.j.y + 0.5, this.j.z);
                    }
                    
                    // aplicar rotación (pitch y yaw) - CORREGIDO
                    this.cam.rotation.order = 'YXZ';
                    this.cam.rotation.y = this.ang.y;
                    this.cam.rotation.x = this.ang.x;
                }
            } catch (e) { }

            // update raycaster from camera center
            try {
                this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.cam);
                const intersectPoint = new THREE.Vector3();
                this.raycaster.ray.intersectPlane(this.groundPlane, intersectPoint);
                if (intersectPoint) this.targetPoint.copy(intersectPoint);
            } catch (e) { }

            // render
            this.renderer.render(this.escena, this.cam);
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    _updateMovement() {
        if (!this.j) return;
        const speed = 0.1;
        const forward = (this.teclas['w'] ? 1 : 0) - (this.teclas['s'] ? 1 : 0);
        const right = (this.teclas['d'] ? 1 : 0) - (this.teclas['a'] ? 1 : 0);
        if (forward !== 0 || right !== 0) {
            const yaw = this.ang.y || 0;
            const dx = Math.cos(yaw) * forward - Math.sin(yaw) * right;
            const dz = Math.sin(yaw) * forward + Math.cos(yaw) * right;
            this.j.x += dx * speed;
            this.j.z += dz * speed;
            if (typeof this.j.actualizarPosicion === 'function') this.j.actualizarPosicion();
        }
    }

    toggleCamera() {
        this.cameraMode = this.cameraMode === 'first' ? 'third' : 'first';
    }

    // CORREGIDO: agregar método para atacar
    atacar() {
        if (this.criaturas && typeof this.criaturas.recibirDaño === 'function') {
            this.criaturas.recibirDaño(10); // 10 de daño
        }
    }
}

// expose Motor globally
window.Motor = Motor;
