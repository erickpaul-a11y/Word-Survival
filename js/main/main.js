const motor = new Motor();
window.motor = motor;

/*
 * WORD SURVIVAL ∞
 * Integración principal.
 *
 * IMPORTANTE:
 * - interaccion2.js controla manos, recoger y soltar.
 * - motor.js controla movimiento, cámara y mundo.
 * - main.js NO vuelve a registrar los clics de interacción.
 */

// ============================================================
// CONFIGURACIÓN
// ============================================================

window.GAME_CONFIG = {
    fpEnabled: true,
    fpHeight: 0.72
};

motor.manoDerechaObjeto = null;
motor.manoIzquierdaObjeto = null;

// ============================================================
// OBJETOS
// ============================================================

motor.verificarObjeto = function (objeto) {
    return !!(
        objeto &&
        objeto.userData &&
        objeto.userData.pickup &&
        typeof objeto.userData.pickup.id === "string" &&
        objeto.userData.pickup.id.length > 0 &&
        objeto.userData.suelo === true
    );
};

motor.obtenerObjetoApuntado = function () {
    const hit = this.encontrarHit();

    if (!hit) return null;

    let objeto = hit.object;

    while (objeto && !this.verificarObjeto(objeto)) {
        objeto = objeto.parent;
    }

    return objeto && this.verificarObjeto(objeto)
        ? objeto
        : null;
};

// ============================================================
// COLISIÓN CON OBJETOS
// ============================================================

motor._resolverColisionObjetos = function () {
    if (!this.j || !this.objetosSuelo) return;

    const radioJugador = 0.23;

    for (const objeto of this.objetosSuelo) {
        if (!objeto || !objeto.parent) continue;
        if (!this.verificarObjeto(objeto)) continue;

        const dx = this.j.x - objeto.position.x;
        const dz = this.j.z - objeto.position.z;

        const distancia = Math.hypot(dx, dz);

        const radioObjeto = Math.max(
            0.14,
            Math.max(
                Math.abs(objeto.scale.x),
                Math.abs(objeto.scale.z)
            ) * 0.18
        );

        const distanciaMinima =
            radioJugador + radioObjeto;

        if (distancia > 0 && distancia < distanciaMinima) {
            const factor =
                (distanciaMinima - distancia) / distancia;

            this.j.x += dx * factor;
            this.j.z += dz * factor;
        }
    }
};

// ============================================================
// MOVIMIENTO
// ============================================================

const movimientoOriginal = motor._updateMovement.bind(motor);

motor._updateMovement = function (dt) {
    movimientoOriginal(dt);
    this._resolverColisionObjetos();
};

// ============================================================
// RESALTAR OBJETO APUNTADO
// ============================================================

motor._objetoResaltado = null;

motor._restaurarResaltado = function (objeto) {
    if (!objeto) return;

    objeto.traverse(nodo => {
        if (
            nodo.material &&
            nodo.userData &&
            nodo.userData._oldEmissive !== undefined
        ) {
            nodo.material.emissive.setHex(
                nodo.userData._oldEmissive
            );

            delete nodo.userData._oldEmissive;
        }
    });
};

motor._aplicarResaltado = function (objeto) {
    if (!objeto) return;

    objeto.traverse(nodo => {
        if (
            nodo.material &&
            nodo.material.emissive
        ) {
            nodo.userData._oldEmissive =
                nodo.material.emissive.getHex();

            nodo.material.emissive.setHex(0xffff66);
        }
    });
};

motor._actualizarResaltado = function () {
    const objeto = this.obtenerObjetoApuntado();

    if (objeto === this._objetoResaltado) {
        return;
    }

    if (this._objetoResaltado) {
        this._restaurarResaltado(
            this._objetoResaltado
        );
    }

    this._objetoResaltado = objeto;

    if (objeto) {
        this._aplicarResaltado(objeto);
    }
};

// ============================================================
// MANTENER OBJETOS EN LAS MANOS
// ============================================================

motor._actualizarObjetosEnManos = function () {
    if (!this.j) return;

    const manos = [
        [
            this.manoDerechaObjeto,
            this.j.rightHand
        ],
        [
            this.manoIzquierdaObjeto,
            this.j.leftHand
        ]
    ];

    for (const [objeto, mano] of manos) {
        if (!objeto || !mano) continue;

        if (objeto.parent !== mano) {
            mano.add(objeto);
        }

        objeto.visible = true;
        objeto.position.set(
            0,
            -0.22,
            -0.16
        );
    }
};

// ============================================================
// MODELOS DE OBJETOS
// ============================================================

const crearObjetoOriginal =
    motor.crearObjeto.bind(motor);

motor.crearObjeto = function (
    id,
    nombre,
    x,
    z,
    cantidad = 1,
    yOverride = null
) {
    const objeto = crearObjetoOriginal(
        id,
        nombre,
        x,
        z,
        cantidad,
        yOverride
    );

    if (!objeto) return null;

    objeto.userData.suelo = true;
    objeto.userData.colisionable = true;

    return objeto;
};

// ============================================================
// INICIAR JUEGO
// ============================================================

const iniciarOriginal =
    motor.iniciar.bind(motor);

motor.iniciar = function () {
    iniciarOriginal();

    const actualizar = () => {
        if (!this.j) {
            requestAnimationFrame(actualizar);
            return;
        }

        this._actualizarResaltado();
        this._actualizarObjetosEnManos();

        requestAnimationFrame(actualizar);
    };

    requestAnimationFrame(actualizar);
};

// ============================================================
// MENÚ
// ============================================================

const btnEmpezar =
    document.getElementById("btn-empezar");

const btnOpciones =
    document.getElementById("btn-opciones");

const btnIdiomas =
    document.getElementById("btn-idiomas");

const panelOpciones =
    document.getElementById("panel-opciones");

const panelIdiomas =
    document.getElementById("panel-idiomas");

if (btnOpciones) {
    btnOpciones.onclick = () => {
        if (panelOpciones) {
            panelOpciones.style.display =
                panelOpciones.style.display === "block"
                    ? "none"
                    : "block";
        }

        if (panelIdiomas) {
            panelIdiomas.style.display = "none";
        }
    };
}

if (btnIdiomas) {
    btnIdiomas.onclick = () => {
        if (panelIdiomas) {
            panelIdiomas.style.display =
                panelIdiomas.style.display === "block"
                    ? "none"
                    : "block";
        }

        if (panelOpciones) {
            panelOpciones.style.display = "none";
        }
    };
}

// ============================================================
// CREAR PARTIDA
// ============================================================

if (btnEmpezar) {
    btnEmpezar.onclick = () => {

        const pantallaInicio =
            document.getElementById(
                "pantalla-inicio"
            );

        const hudJuego =
            document.getElementById(
                "hud-juego"
            );

        if (pantallaInicio) {
            pantallaInicio.style.display = "none";
        }

        if (hudJuego) {
            hudJuego.style.display = "block";
        }

        window.WORLD_SEED =
            Math.floor(
                Math.random() * 2147483647
            );

        motor.iniciar();

        if (
            typeof Crafteos !== "undefined"
        ) {
            motor.crafteos =
                new Crafteos(motor);
        }

        if (
            typeof GestorLenguaje !== "undefined"
        ) {
            motor.lenguaje =
                new GestorLenguaje(motor);

            motor.lenguaje.cargarDatos();
        }

        // Cámara
        const btnCamera =
            document.getElementById(
                "btn-toggle-camera"
            );

        if (btnCamera) {
            btnCamera.textContent =
                "Cámara: 1ª";

            btnCamera.onclick = () => {
                motor.toggleCamera();

                btnCamera.textContent =
                    motor.cameraMode === "first"
                        ? "Cámara: 1ª"
                        : "Cámara: 3ª";
            };
        }

        // Crosshair
        const checkboxCrosshair =
            document.getElementById(
                "chk-crosshair"
            );

        const crosshair =
            document.getElementById(
                "crosshair"
            );

        if (
            checkboxCrosshair &&
            crosshair
        ) {
            crosshair.style.display =
                checkboxCrosshair.checked
                    ? "block"
                    : "none";

            checkboxCrosshair.onchange = () => {
                crosshair.style.display =
                    checkboxCrosshair.checked
                        ? "block"
                        : "none";
            };
        }

        // Primera persona
        const checkboxFP =
            document.getElementById(
                "chk-fp"
            );

        if (checkboxFP) {
            checkboxFP.checked = true;
        }
    };
}

// ============================================================
// SEGURIDAD DEL MODELO DEL JUGADOR
// ============================================================

setInterval(() => {
    const jugador = motor && motor.j;

    if (!jugador) return;

    if (jugador.modelo) {
        jugador.modelo.visible = false;
    }

    if (jugador.leftHand) {
        jugador.leftHand.visible = true;
    }

    if (jugador.rightHand) {
        jugador.rightHand.visible = true;
    }

}, 250);
