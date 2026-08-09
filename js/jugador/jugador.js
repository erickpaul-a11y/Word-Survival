class Jugador {

    constructor() {

        this.x = 0;
        this.y = 0.6;
        this.z = 0;

        this.hp = 100;
        this.maxHp = 100;

        this.mana = 100;
        this.hambre = 100;

        this.nivel = 1;
        this.exp = 0;
        this.expSig = 120;

        this.vivo = true;

        // Estados de movimiento
        this.corriendo = false;
        this.saltando = false;

        // ========================================
        // MODELO
        // ========================================

        this.modelo =
            new THREE.Group();

        const body =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.5,
                    1.2,
                    0.5
                ),
                new THREE.MeshLambertMaterial({
                    color: 0x22c55e
                })
            );

        body.name =
            "torso";

        body.position.y =
            0.6;

        this.modelo.add(
            body
        );

        // ========================================
        // BRAZOS
        // ========================================

        const armGeo =
            new THREE.BoxGeometry(
                0.18,
                0.9,
                0.18
            );

        const armMat =
            new THREE.MeshLambertMaterial({
                color: 0xffcc99
            });

        const leftArm =
            new THREE.Mesh(
                armGeo,
                armMat
            );

        leftArm.name =
            "leftArm";

        leftArm.position.set(
            -0.45,
            1.0,
            0
        );

        leftArm.rotation.z =
            0.08;

        this.modelo.add(
            leftArm
        );

        const rightArm =
            new THREE.Mesh(
                armGeo,
                armMat
            );

        rightArm.name =
            "rightArm";

        rightArm.position.set(
            0.45,
            1.0,
            0
        );

        rightArm.rotation.z =
            -0.08;

        this.modelo.add(
            rightArm
        );

        this.leftArm =
            leftArm;

        this.rightArm =
            rightArm;

    }

    agregarAEscena(escena) {

        escena.add(
            this.modelo
        );

    }

    actualizarPosicion() {

        this.modelo.position.set(
            this.x,
            this.y - 0.6,
            this.z
        );

    }

    recibirDaño(cantidad) {

        if (
            !this.vivo
        ) {

            return;

        }

        this.hp -=
            cantidad;

        if (
            this.hp < 0
        ) {

            this.hp = 0;

        }

        if (
            this.hp <= 0
        ) {

            this.vivo = false;

        }

    }

    curar(cantidad) {

        this.hp +=
            cantidad;

        if (
            this.hp >
            this.maxHp
        ) {

            this.hp =
                this.maxHp;

        }

    }

    ganarExperiencia(cantidad) {

        this.exp +=
            cantidad;

        if (
            this.exp >=
            this.expSig
        ) {

            this.nivel++;

            this.exp = 0;

            this.expSig *=
                1.2;

            console.log(
                "Nivel nuevo:",
                this.nivel
            );

        }

    }

    setFirstPerson(fp) {

        this.leftArm.visible =
            !!fp;

        this.rightArm.visible =
            !!fp;

        this.modelo.children.forEach(
            (child) => {

                if (
                    child.name === "leftArm" ||
                    child.name === "rightArm"
                ) {

                    return;

                }

                child.visible =
                    !fp;

            }
        );

    }

    actualizarHUD() {

        const lvl =
            document.getElementById(
                "lvl"
            );

        if (lvl) {

            lvl.textContent =
                this.nivel;

        }

        const pos =
            document.getElementById(
                "pos"
            );

        if (pos) {

            pos.textContent =
                `X:${Math.round(this.x)} Z:${Math.round(this.z)}`;

        }

        const hp =
            document.getElementById(
                "b-hp"
            );

        if (hp) {

            hp.style.width =
                this.hp + "%";

        }

        const mana =
            document.getElementById(
                "b-mana"
            );

        if (mana) {

            mana.style.width =
                this.mana + "%";

        }

        const exp =
            document.getElementById(
                "b-exp"
            );

        if (exp) {

            exp.style.width =
                (
                    this.exp /
                    this.expSig *
                    100
                ) + "%";

        }

        const hambre =
            document.getElementById(
                "b-hambre"
            );

        if (hambre) {

            hambre.style.width =
                this.hambre + "%";

        }

    }

}

window.Jugador =
    Jugador;
