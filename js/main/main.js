const motor = new Motor();

// Exponer el motor para otros scripts
window.motor = motor;

const btnEmpezar = document.getElementById("btn-empezar");

if (btnEmpezar) {
    btnEmpezar.onclick = () => {

        const pantallaInicio = document.getElementById("pantalla-inicio");
        const hudJuego = document.getElementById("hud-juego");

        if (pantallaInicio) {
            pantallaInicio.style.display = "none";
        }

        if (hudJuego) {
            hudJuego.style.display = "block";
        }

        motor.iniciar();

        // ==============================
        // INVENTARIO
        // ==============================

        if (typeof Inventario !== "undefined") {
            try {
                motor.inv = new Inventario(motor);

                const btnInv = document.getElementById("btn-open-inv");

                if (btnInv) {
                    btnInv.onclick = () => {
                        if (motor.inv && typeof motor.inv.toggle === "function") {
                            motor.inv.toggle();
                        }
                    };
                }

            } catch (error) {
                console.warn("No se pudo inicializar Inventario:", error);
            }
        }

        // ==============================
        // RESPAWN
        // ==============================

        const btnRespawn = document.getElementById("btn-respawn");

        if (btnRespawn) {

            btnRespawn.onclick = () => {

                const pantallaMuerte =
                    document.getElementById("pantalla-muerte");

                if (pantallaMuerte) {
                    pantallaMuerte.style.display = "none";
                }

                if (motor.j) {

                    motor.j.hp = motor.j.maxHp;
                    motor.j.vivo = true;

                    motor.j.x = 0;
                    motor.j.z = 0;

                    const altura =
                        typeof motor.getGroundHeightAt === "function"
                            ? motor.getGroundHeightAt(0, 0)
                            : 0;

                    motor.j.y = altura + 0.6;

                    if (typeof motor.j.actualizarPosicion === "function") {
                        motor.j.actualizarPosicion();
                    }

                    if (typeof motor.j.actualizarHUD === "function") {
                        motor.j.actualizarHUD();
                    }
                }
            };
        }

        // ==============================
        // CONFIGURACIÓN
        // ==============================

        window.GAME_CONFIG = window.GAME_CONFIG || {};

        if (typeof window.GAME_CONFIG.spawnCowsEnabled === "undefined") {
            window.GAME_CONFIG.spawnCowsEnabled = true;
        }

        if (typeof window.GAME_CONFIG.spawnCowCount === "undefined") {
            window.GAME_CONFIG.spawnCowCount = 5;
        }

        if (typeof window.GAME_CONFIG.fpEnabled === "undefined") {
            window.GAME_CONFIG.fpEnabled = true;
        }

        if (typeof window.GAME_CONFIG.fpHeight === "undefined") {
            window.GAME_CONFIG.fpHeight = 1.6;
        }

        // ==============================
        // VACAS
        // ==============================

        try {

            if (window.GAME_CONFIG.spawnCowsEnabled) {

                const count = Math.max(
                    0,
                    Math.min(
                        50,
                        parseInt(window.GAME_CONFIG.spawnCowCount, 10) || 5
                    )
                );

                const posiciones = [];

                const distanciaJugador = 4;
                const distanciaMinima = 3;
                const intentosMaximos = 200;

                for (let i = 0; i < count; i++) {

                    let colocado = false;
                    let intentos = 0;

                    while (
                        !colocado &&
                        intentos < intentosMaximos
                    ) {

                        intentos++;

                        const jugadorX = motor.j ? motor.j.x : 0;
                        const jugadorZ = motor.j ? motor.j.z : 0;

                        const angulo = Math.random() * Math.PI * 2;
                        const distancia = 6 + Math.random() * 20;

                        const x =
                            jugadorX + Math.cos(angulo) * distancia;

                        const z =
                            jugadorZ + Math.sin(angulo) * distancia;

                        const distanciaJugadorActual =
                            Math.hypot(
                                jugadorX - x,
                                jugadorZ - z
                            );

                        if (distanciaJugadorActual < distanciaJugador) {
                            continue;
                        }

                        let valido = true;

                        for (const posicion of posiciones) {

                            if (
                                Math.hypot(
                                    posicion.x - x,
                                    posicion.z - z
                                ) < distanciaMinima
                            ) {
                                valido = false;
                                break;
                            }
                        }

                        if (!valido) {
                            continue;
                        }

                        if (typeof window.createCow === "function") {

                            window.createCow({
                                x: x,
                                z: z
                            });

                            posiciones.push({
                                x: x,
                                z: z
                            });

                            colocado = true;
                        }
                    }
                }

                console.log(
                    `Vacas creadas: ${posiciones.length}`
                );
            }

        } catch (error) {

            console.warn(
                "Error creando vacas:",
                error
            );
        }

        // ==============================
        // BOTÓN DE CÁMARA
        // ==============================

        const btnCamera =
            document.getElementById("btn-toggle-camera");

        if (btnCamera) {

            btnCamera.textContent =
                motor.cameraMode === "first"
                    ? "Cámara: 1ª"
                    : "Cámara: 3ª";

            btnCamera.onclick = () => {

                if (typeof motor.toggleCamera === "function") {
                    motor.toggleCamera();
                }

                btnCamera.textContent =
                    motor.cameraMode === "first"
                        ? "Cámara: 1ª"
                        : "Cámara: 3ª";
            };
        }

        // ==============================
        // CROSSHAIR
        // ==============================

        const chkCrosshair =
            document.getElementById("chk-crosshair");

        const crosshair =
            document.getElementById("crosshair");

        if (chkCrosshair && crosshair) {

            crosshair.style.display =
                chkCrosshair.checked
                    ? "block"
                    : "none";

            chkCrosshair.onchange = () => {

                crosshair.style.display =
                    chkCrosshair.checked
                        ? "block"
                        : "none";
            };
        }

        // ==============================
        // FIRST PERSON
        // ==============================

        const chkFP =
            document.getElementById("chk-fp");

        if (chkFP) {

            chkFP.checked =
                !!window.GAME_CONFIG.fpEnabled;

            chkFP.onchange = () => {

                window.GAME_CONFIG.fpEnabled =
                    !!chkFP.checked;

                try {
                    sessionStorage.setItem(
                        "game_config",
                        JSON.stringify(window.GAME_CONFIG)
                    );
                } catch (error) {
                    console.warn(
                        "No se pudo guardar configuración:",
                        error
                    );
                }
            };
        }

        // ==============================
        // ACTUALIZACIÓN FIRST PERSON
        // ==============================

        const actualizarFirstPerson = () => {

            try {

                if (
                    !motor ||
                    !motor.cam ||
                    !motor.j
                ) {
                    requestAnimationFrame(
                        actualizarFirstPerson
                    );
                    return;
                }

                const primeraPersona =
                    !!window.GAME_CONFIG.fpEnabled;

                if (
                    typeof motor.j.setFirstPerson === "function"
                ) {

                    motor.j.setFirstPerson(
                        primeraPersona
                    );
                }

                if (primeraPersona) {

                    const altura =
                        parseFloat(
                            window.GAME_CONFIG.fpHeight
                        ) || 1.6;

                    motor.cam.position.set(
                        motor.j.x,
                        motor.j.y + altura - 0.6,
                        motor.j.z
                    );

                    motor.cam.rotation.order = "YXZ";

                    motor.cam.rotation.x =
                        motor.ang.x;

                    motor.cam.rotation.y =
                        motor.ang.y;

                }

            } catch (error) {

                console.warn(
                    "Error actualizando primera persona:",
                    error
                );
            }

            requestAnimationFrame(
                actualizarFirstPerson
            );
        };

        requestAnimationFrame(
            actualizarFirstPerson
        );
    };
}
