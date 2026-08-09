class GestorCriaturas {

    constructor(motor, datos) {

        this.m = motor;
        this.d = datos || {};
        this.lista = [];

        this.expGanar = 15;

    }

    crear(tipo, x, z) {

        const datos =
            this.d[tipo];

        if (!datos) {

            console.warn(
                `Tipo de criatura '${tipo}' no existe`
            );

            return null;
        }

        let y = 0;

        if (
            this.m &&
            typeof this.m.getGroundHeightAt ===
            "function"
        ) {

            y =
                this.m.getGroundHeightAt(
                    x,
                    z
                );

        }

        const modelo =
            new THREE.Group();

        const cuerpo =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    1.2,
                    0.7,
                    2
                ),
                new THREE.MeshLambertMaterial({
                    color: 0x78716c
                })
            );

        cuerpo.position.y =
            0.35;

        modelo.add(cuerpo);

        modelo.position.set(
            x,
            y,
            z
        );

        this.m.escena.add(
            modelo
        );

        const criatura = {

            tipo: tipo,

            x: x,
            z: z,

            y: y,

            vida: datos.vida,
            vidaMax: datos.vida,

            daño: datos.daño,

            modelo: modelo,

            tiempoAtaque: false

        };

        this.lista.push(
            criatura
        );

        return criatura;
    }

    generarIniciales() {

        if (this.d.lobo) {

            this.crear(
                "lobo",
                8,
                8
            );

            this.crear(
                "lobo",
                -12,
                5
            );

        }

    }

    recibirDaño(cantidad) {

        if (!this.m || !this.m.j) {
            return;
        }

        for (
            const criatura of this.lista
        ) {

            if (
                criatura.vida <= 0
            ) {
                continue;
            }

            const distancia =
                Math.hypot(
                    this.m.j.x -
                    criatura.x,

                    this.m.j.z -
                    criatura.z
                );

            if (
                distancia < 2.5
            ) {

                criatura.vida -=
                    cantidad;

                console.log(
                    `${criatura.tipo} recibe ${cantidad} de daño. Vida: ${criatura.vida}`
                );

                if (
                    criatura.vida <= 0
                ) {

                    this.m.j.ganarExperiencia(
                        this.expGanar
                    );

                    if (
                        this.m.inv &&
                        typeof this.m.inv.agregar ===
                        "function"
                    ) {

                        this.m.inv.agregar(
                            "madera",
                            1,
                            "Madera"
                        );

                    }

                    if (
                        criatura.modelo &&
                        criatura.modelo.parent
                    ) {

                        criatura.modelo.parent.remove(
                            criatura.modelo
                        );

                    }

                }

            }

        }

        this.lista =
            this.lista.filter(
                criatura =>
                    criatura.vida > 0
            );

    }

    actualizar() {

        if (
            !this.m ||
            !this.m.j
        ) {
            return;
        }

        for (
            const criatura of this.lista
        ) {

            if (
                criatura.vida <= 0
            ) {
                continue;
            }

            const dx =
                this.m.j.x -
                criatura.x;

            const dz =
                this.m.j.z -
                criatura.z;

            const distancia =
                Math.hypot(
                    dx,
                    dz
                );

            // Seguir al jugador
            if (
                distancia < 12 &&
                distancia > 2
            ) {

                const nx =
                    dx / distancia;

                const nz =
                    dz / distancia;

                criatura.x +=
                    nx * 0.04;

                criatura.z +=
                    nz * 0.04;

                criatura.y =
                    this.m.getGroundHeightAt(
                        criatura.x,
                        criatura.z
                    );

                if (
                    criatura.modelo
                ) {

                    criatura.modelo.position.set(
                        criatura.x,
                        criatura.y,
                        criatura.z
                    );

                    criatura.modelo.lookAt(
                        this.m.j.x,
                        criatura.y + 0.5,
                        this.m.j.z
                    );

                }

            }

            // Ataque
            if (
                distancia < 2.2 &&
                !criatura.tiempoAtaque
            ) {

                this.m.j.recibirDaño(
                    criatura.daño
                );

                if (
                    this.m.j.hp <= 0
                ) {

                    this.m.j.hp = 0;
                    this.m.j.vivo = false;

                    console.log(
                        "Jugador derrotado"
                    );

                }

                criatura.tiempoAtaque =
                    true;

                setTimeout(
                    () => {
                        criatura.tiempoAtaque =
                            false;
                    },
                    1200
                );

            }

        }

    }

}

window.GestorCriaturas =
    GestorCriaturas;
