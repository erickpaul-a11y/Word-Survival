class Motor {

    constructor(){

        this.escena = new THREE.Scene();

        this.escena.background =
        new THREE.Color(0x87ceeb);

        this.escena.fog =
        new THREE.FogExp2(
            0x87ceeb,
            0.007
        );

        this.cam =
        new THREE.PerspectiveCamera(
            70,
            innerWidth / innerHeight,
            0.1,
            1000
        );

        this.ren =
        new THREE.WebGLRenderer({
            antialias:true
        });

        this.ren.setSize(
            innerWidth,
            innerHeight
        );

        document.body.appendChild(
            this.ren.domElement
        );

        // jugador
        this.j =
        new Jugador();

        // mundo
        this.mundo =
        new Mundo(this);

        this.criaturas = null;

        this.teclas = {};

        this.ang = {
            x:0,
            y:0
        };

        // Movimiento / física
        this.grav = -0.022;
        this.velY = 0;
        this.suelo = false;

        this.salto = 0.38;

        this.andar = 0.15;
        this.correr = 0.28;

        // cámara tercera persona
        this.distCam = 6;

        // --- Nuevo: apuntado y raycast para punto bajo ratón ---
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2(0, 0); // NDC coords (-1..1)
        this.targetPoint = new THREE.Vector3();
        this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // y=0

        // Cámara pivot (se añadirá al modelo del jugador cuando lo agreguemos a la escena)
        this.cameraPivot = new THREE.Object3D();
        this.cameraPivot.position.set(0, 1.0, 0);

        // Luz
        this.escena.add(
            new THREE.AmbientLight(
                0xffffff,
                0.5
            )
        );

        const luz =
        new THREE.DirectionalLight(
            0xffffff,
            1.2
        );

        luz.position.set(
            20,
            30,
            10
        );

        this.escena.add(luz);

        // Eventos de ratón: calculamos mouse NDC relativo al canvas
        window.addEventListener('mousemove', (e) => {
            const rect = this.ren.domElement.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        }, false);

    }

    iniciar(){

        // añadir jugador a la escena
        this.j.agregarAEscena(
            this.escena
        );

        // añadir cameraPivot al modelo del jugador para que la cámara mire a ese punto
        // (this.j.modelo ahora es un Group por el cambio realizado)
        if (this.j && this.j.modelo) {
            this.j.modelo.add(this.cameraPivot);
        }

        if(this.criaturas){

            this.criaturas.generarIniciales();

        }

        this.bucle();

    }

    bucle(){

        requestAnimationFrame(
            ()=>this.bucle()
        );

        // actualizar mundo
        this.mundo.actualizar(
            this.j.x,
            this.j.z
        );

        // animales
        if(this.criaturas){
            this.criaturas.actualizar();
        }

        // --- Calcular punto del mundo bajo el ratón ---
        // Si pointer lock activo usamos el centro de la pantalla como apuntador
        if(document.pointerLockElement){
            // centro de la pantalla = (0,0) NDC
            this.raycaster.setFromCamera(new THREE.Vector2(0,0), this.cam);
        } else {
            this.raycaster.setFromCamera(this.mouse, this.cam);
        }
        // intersect with ground plane (y = 0)
        const intersectPoint = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(this.groundPlane, intersectPoint);
        if (intersectPoint) {
            this.targetPoint.copy(intersectPoint);
        }

        // movimiento básico por teclas (a/d/s) como antes pero W tiene comportamiento especial
        let dx = 0;
        let dz = 0;

        let velocidad =
        this.teclas.shift ?
        this.correr :
        this.andar;

        // Mantengo a/s/d para strafing tras rotación de ang.y
        if(this.teclas.s)
            dz += velocidad;
        if(this.teclas.a)
            dx -= velocidad;
        if(this.teclas.d)
            dx += velocidad;

        // Si se pulsa W, mover hacia targetPoint (ignorar altura)
        if (this.teclas.w) {
            const dir = new THREE.Vector3(
                this.targetPoint.x - this.j.x,
                0,
                this.targetPoint.z - this.j.z
            );
            const dist = dir.length();
            if (dist > 0.01) {
                dir.normalize();
                // aplicar movimiento proporcional a velocidad
                this.j.x += dir.x * velocidad;
                this.j.z += dir.z * velocidad;
                // girar el modelo para mirar al objetivo (suavizado)
                const desiredAngle = Math.atan2(dir.x, dir.z);
                const currentAngle = this.j.modelo.rotation.y || 0;
                // pequeño lerp para suavizar rotación
                this.j.modelo.rotation.y = THREE.MathUtils.lerpAngle(currentAngle, desiredAngle, 0.2);
            }
        } else {
            // si no se usa W, también podemos orientar el jugador según el ratón:
            // calcular dirección desde jugador hacia targetPoint y orientar sutilmente
            const dirLook = new THREE.Vector3(
                this.targetPoint.x - this.j.x,
                0,
                this.targetPoint.z - this.j.z
            );
            if (dirLook.lengthSq() > 0.0001) {
                const desiredAngle = Math.atan2(dirLook.x, dirLook.z);
                const currentAngle = this.j.modelo.rotation.y || 0;
                this.j.modelo.rotation.y = THREE.MathUtils.lerpAngle(currentAngle, desiredAngle, 0.06);
            }
        }

        // aplicar movimiento por dx/dz (usando ang.y para rotación global como antes)
        if(dx || dz){
            let c =
            Math.cos(this.ang.y);

            let s =
            Math.sin(this.ang.y);

            this.j.x +=
            dx*c - dz*s;

            this.j.z +=
            dx*s + dz*c;
        }

        // gravedad
        this.velY += this.grav;
        this.j.y += this.velY;

        let suelo =
        this.mundo.altura(
            this.j.x,
            this.j.z
        ) + 2;

        if(this.j.y < suelo){
            this.j.y = suelo;
            this.velY = 0;
            this.suelo=true;
        }

        // Cámara: calcular posición deseada detrás del jugador usando la rotación del modelo
        const pivotWorld = new THREE.Vector3();
        this.cameraPivot.getWorldPosition(pivotWorld);

        // offset local (atrás y arriba). Nota: distCam puede ajustarse.
        const offsetLocal = new THREE.Vector3(0, 1.2, this.distCam);
        // rotar offset según la rotación Y del modelo (jugador)
        const playerY = this.j.modelo.rotation.y || 0;
        const sinY = Math.sin(playerY);
        const cosY = Math.cos(playerY);
        // rotar offsetLocal.z,x por Y
        const offsetWorld = new THREE.Vector3(
            offsetLocal.x * cosY + offsetLocal.z * sinY,
            offsetLocal.y,
            -offsetLocal.x * sinY + offsetLocal.z * cosY
        );

        const desiredCameraPos = pivotWorld.clone().add(offsetWorld);

        // suavizado
        this.cam.position.lerp(desiredCameraPos, 0.08);
        this.cam.lookAt(pivotWorld);

        // actualizar jugador y HUD
        this.j.actualizarPosicion();
        this.j.actualizarHUD();

        this.ren.render(
            this.escena,
            this.cam
        );

    }

}
