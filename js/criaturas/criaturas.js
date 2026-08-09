class GestorCriaturas {

    constructor(motor, datos) {

        this.m = motor;

        this.d = datos || {};

        this.lista = [];

        this.expGanar = 15;

    }

    // ==========================================
    // CREAR CRIATURA
    // ==========================================

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

        // ========================================
        // MODELO
        // ========================================

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

        modelo.add(
            cuerpo
        );

        modelo.position.set(
            x,
            y,
            z
        );

        this.m.escena.add(
            modelo
        );

        // ========================================
        // CRIATURA
        // ========================================

        const criatura = {

            tipo: tipo,

            x: x,
            y: y,
            z: z,

            vida: datos.vida,
            vidaMax: datos.vida,

            daño: datos.daño,

            modelo: modelo,

            // Movimiento
            direccion: Math.random() * Math.PI * 2,

            velocidad:
                0.01 +
                Math.random() * 0.025,

            caminando:
                Math.random() > 0.3,

            tiempoMovimiento:
                60 +
                Math.random() * 180,

            tiempoQuieto: 0,

            // Ataque eliminado:
            // las criaturas no persiguen ni atacan
            tiempoAtaque: false

        };

        this.lista.push(
            criatura
        );

        return criatura;

    }

    // ==========================================
    // GENERAR CRIATURAS
    // ==========================================

    generarIniciales() {

        // Lobos
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

            this.crear(
                "lobo",
                15,
                -10
            );

        }

        // Vacas
        if (this.d.vaca) {

            this.crear(
                "vaca",
                10,
                -15
            );

            this.crear(
                "vaca",
                -18,
                -8
            );

            this.crear(
                "vaca",
                20,
                12
            );

        }

        // Ciervos
        if (this.d.ciervo) {

            this.crear(
                "ciervo",
                -20,
                15
            );

            this.crear(
                "ciervo",
                25,
                5
            );

        }

    }

    // ==========================================
    // DAÑO
    // ==========================================

    recibirDaño(cantidad) {

        if (
            !this.m ||
            !this.m.j
        ) {

            return;

        }

        let objetivo = null;

        let distanciaMenor = Infinity;

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
                distancia < 2.5 &&
                distancia < distanciaMenor
            ) {

                objetivo =
                    criatura;

                distanciaMenor =
                    distancia;

            }

        }

        if (!objetivo) {

            return;

        }

        objetivo.vida -=
            cantidad;

        console.log(
            `${objetivo.tipo} recibe ${cantidad} de daño. Vida: ${objetivo.vida}`
        );

        if (
            objetivo.vida <= 0
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
                objetivo.modelo &&
                objetivo.modelo.parent
            ) {

                objetivo.modelo.parent.remove(
                    objetivo.modelo
                );

            }

        }

        this.lista =
            this.lista.filter(
                criatura =>
                    criatura.vida > 0
            );

    }

    // ==========================================
    // CAMBIO DE DIRECCIÓN
    // ==========================================

    cambiarDireccion(criatura) {

        criatura.direccion =
            Math.random() *
            Math.PI *
            2;

        criatura.velocidad =
            0.008 +
            Math.random() *
            0.025;

    }

    // ==========================================
    // ACTUALIZAR
    // ==========================================

    actualizar() {

        for (
            const criatura of this.lista
        ) {

            if (
                criatura.vida <= 0
            ) {

                continue;

            }

            // ====================================
            // CONTADOR
            // ====================================

            if (
                criatura.tiempoMovimiento > 0
            ) {

                criatura.tiempoMovimiento--;

            }

            // ====================================
            // CAMBIAR ENTRE CAMINAR Y PARAR
            // ====================================

            if (
                criatura.tiempoMovimiento <= 0
            ) {

                criatura.caminando =
                    !criatura.caminando;

                if (
                    criatura.caminando
                ) {

                    criatura.tiempoMovimiento =
                        80 +
                        Math.random() *
                        200;

                    this.cambiarDireccion(
                        criatura
                    );

                } else {

                    criatura.tiempoMovimiento =
                        60 +
                        Math.random() *
                        150;

                }

            }

            // ====================================
            // CAMINAR
            // ====================================

            if (
                criatura.caminando
            ) {

                criatura.x +=
                    Math.sin(
                        criatura.direccion
                    ) *
                    criatura.velocidad;

                criatura.z +=
                    Math.cos(
                        criatura.direccion
                    ) *
                    criatura.velocidad;

                // --------------------------------
                // ALTURA DEL TERRENO
                // --------------------------------

                if (
                    this.m &&
                    typeof this.m.getGroundHeightAt ===
                    "function"
                ) {

                    criatura.y =
                        this.m.getGroundHeightAt(
                            criatura.x,
                            criatura.z
                        );

                }

                // --------------------------------
                // GIRAR EL MODELO
                // --------------------------------

                if (
                    criatura.modelo
                ) {

                    criatura.modelo.position.set(
                        criatura.x,
                        criatura.y,
                        criatura.z
                    );

                    criatura.modelo.rotation.y =
                        criatura.direccion;

                }

            }

        }

    }

}

window.GestorCriaturas =
    GestorCriaturas;
