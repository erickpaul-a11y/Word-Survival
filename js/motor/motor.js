class Motor {

    constructor() {

        this.escena = new THREE.Scene();

        this.cam = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });

        this.renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

        this.renderer.domElement.id = "canvas-3d";

        document.body.appendChild(
            this.renderer.domElement
        );

        this.raycaster = new THREE.Raycaster();

        this.groundPlane = new THREE.Plane(
            new THREE.Vector3(0, 1, 0),
            0
        );

        this.mouse = new THREE.Vector2(0, 0);

        this.targetPoint = new THREE.Vector3();

        this.ang = {
            x: 0,
            y: 0
        };

        this.teclas = {};

        this.cameraMode = "first";

        this.j = null;
        this.mundo = null;
        this.criaturas = null;
        this.inv = null;

        // ==========================================
        // LUCES
        // ==========================================

        const luzAmbiente =
            new THREE.HemisphereLight(
                0xffffff,
                0x444444,
                1.0
            );

        this.escena.add(luzAmbiente);

        const luzDireccional =
            new THREE.DirectionalLight(
                0xffffff,
                0.6
            );

        luzDireccional.position.set(
            5,
            10,
            7
        );

        this.escena.add(luzDireccional);

        // ==========================================
        // CONTROLES DE TECLADO
        // ==========================================

        window.addEventListener("keydown", (evento) => {

            const tecla =
                evento.key.toLowerCase();

            this.teclas[tecla] = true;

            if (
                [
                    "w",
                    "a",
                    "s",
                    "d",
                    " ",
                    "arrowup",
                    "arrowdown",
                    "arrowleft",
                    "arrowright"
                ].includes(tecla)
            ) {
                evento.preventDefault();
            }

            // Inventario con E
            if (
                tecla === "e" &&
                this.inv &&
                typeof this.inv.toggle === "function"
            ) {
                this.inv.toggle();
            }

        });

        window.addEventListener("keyup", (evento) => {

            const tecla =
                evento.key.toLowerCase();

            this.teclas[tecla] = false;

        });

        // ==========================================
        // CONTROLES DE RATÓN
        // ==========================================

        this.mouseControlActivo = false;

        this.renderer.domElement.addEventListener(
            "click",
            () => {

                if (
                    document.pointerLockElement !==
                    this.renderer.domElement
                ) {
                    this.renderer.domElement.requestPointerLock();
                }

            }
        );

        document.addEventListener(
            "mousemove",
            (evento) => {

                if (
                    document.pointerLockElement !==
                    this.renderer.domElement
                ) {
                    return;
                }

                const sensibilidad = 0.0025;

                this.ang.y -=
                    evento.movementX *
                    sensibilidad;

                this.ang.x -=
                    evento.movementY *
                    sensibilidad;

                const limite =
                    Math.PI / 2 - 0.05;

                this.ang.x =
                    Math.max(
                        -limite,
                        Math.min(
                            limite,
                            this.ang.x
                        )
                    );

            }
        );

        // ==========================================
        // RESIZE
        // ==========================================

        window.addEventListener(
            "resize",
            () => {

                this.cam.aspect =
                    window.innerWidth /
                    window.innerHeight;

                this.cam.updateProjectionMatrix();

                this.renderer.setSize(
                    window.innerWidth,
                    window.innerHeight
                );

            }
        );
    }

    // ==========================================
    // ALTURA DEL TERRENO
    // ==========================================

    getGroundHeightAt(x, z) {

        try {

            if (
                this.mundo &&
                typeof this.mundo.altura === "function"
            ) {

                return this.mundo.altura(x, z);

            }

        } catch (error) {

            console.warn(
                "Error obteniendo altura:",
                error
            );

        }

        return 0;
    }

    // ==========================================
    // INICIAR
    // ==========================================

    iniciar() {

        // ========================================
        // JUGADOR
        // ========================================

        try {

            if (
                typeof Jugador !== "undefined"
            ) {

                this.j = new Jugador();

                this.j.x = 0;
                this.j.z = 0;

                this.j.y =
                    this.getGroundHeightAt(
                        this.j.x,
                        this.j.z
                    ) + 0.6;

                this.j.agregarAEscena(
                    this.escena
                );

                this.j.actualizarPosicion();

            }

        } catch (error) {

            console.warn(
                "Error creando jugador:",
                error
            );

        }

        // ========================================
        // MUNDO
        // ========================================

        try {

            if (
                typeof Mundo !== "undefined"
            ) {

                this.mundo =
                    new Mundo(this);

            }

        } catch (error) {

            console.warn(
                "Error creando mundo:",
                error
            );

        }

        // ========================================
        // CRIATURAS
        // ========================================

        try {

            const criaturaData = {

                lobo: {
                    vida: 30,
                    daño: 8
                },

                vaca: {
                    vida: 20,
                    daño: 5
                },

                ciervo: {
                    vida: 15,
                    daño: 3
                }

            };

            if (
                typeof GestorCriaturas !== "undefined"
            ) {

                this.criaturas =
                    new GestorCriaturas(
                        this,
                        criaturaData
                    );

            }

            if (
                this.criaturas &&
                typeof this.criaturas.generarIniciales ===
                "function"
            ) {

                this.criaturas.generarIniciales();

            }

        } catch (error) {

            console.warn(
                "Error creando criaturas:",
                error
            );

        }

        // ========================================
        // CÁMARA
        // ========================================

        if (this.j) {

            this.cam.position.set(
                this.j.x,
                this.j.y + 1.0,
                this.j.z
            );

        }

        // ========================================
        // LOOP PRINCIPAL
        // ========================================

        const loop = () => {

            this._updateMovement();

            // Mundo
            try {

                if (
                    this.j &&
                    this.mundo
                ) {

                    this.mundo.actualizar(
                        this.j.x,
                        this.j.z
                    );

                }

            } catch (error) {

                console.warn(
                    "Error actualizando mundo:",
                    error
                );

            }

            // Criaturas
            try {

                if (
                    this.criaturas &&
                    typeof this.criaturas.actualizar ===
                    "function"
                ) {

                    this.criaturas.actualizar();

                }

            } catch (error) {

                console.warn(
                    "Error actualizando criaturas:",
                    error
                );

            }

            // HUD
            try {

                if (
                    this.j &&
                    typeof this.j.actualizarHUD ===
                    "function"
                ) {

                    this.j.actualizarHUD();

                }

            } catch (error) {}

            // Cámara
            this._actualizarCamara();

            // Render
            this.renderer.render(
                this.escena,
                this.cam
            );

            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
    }

    // ==========================================
    // MOVIMIENTO
    // ==========================================

    _updateMovement() {

        if (!this.j) {
            return;
        }

        const velocidad = 0.10;

        const forward =
            (this.teclas["w"] ? 1 : 0) -
            (this.teclas["s"] ? 1 : 0);

        const right =
            (this.teclas["d"] ? 1 : 0) -
            (this.teclas["a"] ? 1 : 0);

        if (
            forward === 0 &&
            right === 0
        ) {
            return;
        }

        const yaw = this.ang.y;

        let dx =
            Math.cos(yaw) * forward -
            Math.sin(yaw) * right;

        let dz =
            Math.sin(yaw) * forward +
            Math.cos(yaw) * right;

        const longitud =
            Math.hypot(dx, dz);

        if (longitud > 0) {

            dx /= longitud;
            dz /= longitud;

        }

        this.j.x +=
            dx * velocidad;

        this.j.z +=
            dz * velocidad;

        // Mantener jugador sobre el terreno
        this.j.y =
            this.getGroundHeightAt(
                this.j.x,
                this.j.z
            ) + 0.6;

        if (
            typeof this.j.actualizarPosicion ===
            "function"
        ) {

            this.j.actualizarPosicion();

        }

    }

    // ==========================================
    // CÁMARA
    // ==========================================

    _actualizarCamara() {

        if (!this.j) {
            return;
        }

        this.cam.rotation.order =
            "YXZ";

        if (
            this.cameraMode === "first"
        ) {

            this.cam.position.set(
                this.j.x,
                this.j.y + 1.0,
                this.j.z
            );

            this.cam.rotation.y =
                this.ang.y;

            this.cam.rotation.x =
                this.ang.x;

        } else {

            const distancia = 5;
            const altura = 2;

            const camX =
                this.j.x -
                Math.sin(this.ang.y) *
                distancia;

            const camZ =
                this.j.z -
                Math.cos(this.ang.y) *
                distancia;

            this.cam.position.set(
                camX,
                this.j.y + altura,
                camZ
            );

            this.cam.lookAt(
                this.j.x,
                this.j.y + 0.8,
                this.j.z
            );

        }

    }

    // ==========================================
    // CAMBIAR CÁMARA
    // ==========================================

    toggleCamera() {

        this.cameraMode =
            this.cameraMode === "first"
                ? "third"
                : "first";

    }

    // ==========================================
    // ATAQUE
    // ==========================================

    atacar() {

        if (
            this.criaturas &&
            typeof this.criaturas.recibirDaño ===
            "function"
        ) {

            this.criaturas.recibirDaño(10);

        }

    }

}

// Exponer globalmente
window.Motor = Motor;
