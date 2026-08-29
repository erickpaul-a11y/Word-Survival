/* ============================================================
   WORD SURVIVAL ∞
   SISTEMA DE INTERACCIÓN
   - Dos manos
   - Recoger con E
   - Soltar con Q
   - Golpear con clic
   - Solo interactúa con lo que estás apuntando
   ============================================================ */

(function () {

    'use strict';

    // ------------------------------------------------------------
    // UTILIDADES
    // ------------------------------------------------------------

    const clamp = (v, min, max) =>
        Math.max(min, Math.min(max, v));

    function obtenerMano(motor, lado) {
        return lado === 'izquierda'
            ? motor.j.leftHand
            : motor.j.rightHand;
    }

    function obtenerObjetoMano(motor, lado) {
        return lado === 'izquierda'
            ? motor.manoIzquierdaObjeto
            : motor.manoDerechaObjeto;
    }

    function guardarObjetoMano(motor, lado, objeto) {

        if (lado === 'izquierda') {
            motor.manoIzquierdaObjeto = objeto;
        } else {
            motor.manoDerechaObjeto = objeto;
        }
    }

    function buscarPadre(objeto, condicion) {

        let actual = objeto;

        while (actual) {

            if (condicion(actual)) {
                return actual;
            }

            actual = actual.parent;
        }

        return null;
    }

    // ------------------------------------------------------------
    // RAYCAST
    // ------------------------------------------------------------

    function obtenerImpacto(motor) {

        if (!motor || !motor.cam || !motor.escena) {
            return null;
        }

        const raycaster = new THREE.Raycaster();

        raycaster.setFromCamera(
            new THREE.Vector2(0, 0),
            motor.cam
        );

        const impactos =
            raycaster.intersectObjects(
                motor.escena.children,
                true
            );

        for (const impacto of impactos) {

            if (impacto.distance > 4) {
                continue;
            }

            return impacto;
        }

        return null;
    }

    // ------------------------------------------------------------
    // TEXTURAS
    // ------------------------------------------------------------

    function crearTextura(tipo) {

        const canvas =
            document.createElement('canvas');

        canvas.width = 64;
        canvas.height = 64;

        const ctx = canvas.getContext('2d');

        const colores = {

            tierra: '#704020',
            piedra: '#777d83',
            madera: '#8a5528',
            palo: '#b9793c',
            arena: '#c5a15b',
            cesped: '#3f7f35',
            hojas: '#2f7d35',
            agua: '#2d82c7'

        };

        const base =
            colores[tipo] || '#b58a55';

        ctx.fillStyle = base;
        ctx.fillRect(
            0,
            0,
            64,
            64
        );

        for (let y = 0; y < 64; y += 4) {

            for (let x = 0; x < 64; x += 4) {

                const ruido =
                    Math.abs(
                        Math.sin(
                            x * 12.7 +
                            y * 31.1 +
                            tipo.length * 17
                        )
                    );

                ctx.fillStyle =
                    `rgba(255,255,255,${0.04 + ruido * 0.12})`;

                ctx.fillRect(
                    x,
                    y,
                    3,
                    3
                );
            }
        }

        const textura =
            new THREE.CanvasTexture(canvas);

        textura.magFilter =
            THREE.NearestFilter;

        textura.minFilter =
            THREE.NearestFilter;

        textura.generateMipmaps = false;

        return textura;
    }

    // ------------------------------------------------------------
    // PONER OBJETO EN UNA MANO
    // ------------------------------------------------------------

    function colocarEnMano(
        motor,
        lado,
        objeto
    ) {

        if (!motor.j || !objeto) {
            return false;
        }

        const mano =
            obtenerMano(
                motor,
                lado
            );

        if (!mano) {
            return false;
        }

        const anterior =
            obtenerObjetoMano(
                motor,
                lado
            );

        if (anterior && anterior.parent) {

            anterior.parent.remove(
                anterior
            );
        }

        guardarObjetoMano(
            motor,
            lado,
            objeto
        );

        if (objeto.parent) {
            objeto.parent.remove(
                objeto
            );
        }

        mano.add(objeto);

        objeto.position.set(
            0,
            -0.22,
            -0.18
        );

        objeto.rotation.set(
            0,
            0,
            0
        );

        const id =
            objeto.userData &&
            objeto.userData.pickup &&
            objeto.userData.pickup.id;

        objeto.scale.setScalar(
            id === 'pala_madera'
                ? 1.35
                : 1.15
        );

        objeto.userData.enMano = true;
        objeto.userData.colision = false;

        return true;
    }

    // ------------------------------------------------------------
    // RECOGER
    // ------------------------------------------------------------

    function recoger(motor, lado) {

        if (!motor.j) {
            return false;
        }

        // IMPORTANTE:
        // Solo se recoge lo que está apuntando.
        const impacto =
            obtenerImpacto(motor);

        if (!impacto) {
            return false;
        }

        let objeto =
            buscarPadre(
                impacto.object,
                nodo =>
                    nodo.userData &&
                    nodo.userData.pickup &&
                    nodo.userData.suelo === true
            );

        if (!objeto) {
            return false;
        }

        // No permitir recoger dos veces
        // el mismo objeto.
        if (
            motor.manoIzquierdaObjeto === objeto ||
            motor.manoDerechaObjeto === objeto
        ) {
            return false;
        }

        motor.retirarObjeto(
            objeto
        );

        return colocarEnMano(
            motor,
            lado,
            objeto
        );
    }

    // ------------------------------------------------------------
    // SOLTAR
    // ------------------------------------------------------------

    function soltar(motor, lado) {

        if (!motor.j) {
            return false;
        }

        const objeto =
            obtenerObjetoMano(
                motor,
                lado
            );

        if (!objeto) {
            return false;
        }

        const direccion =
            new THREE.Vector3();

        motor.cam.getWorldDirection(
            direccion
        );

        const posicion =
            objeto.getWorldPosition(
                new THREE.Vector3()
            );

        posicion.addScaledVector(
            direccion,
            0.8
        );

        const pickup =
            objeto.userData &&
            objeto.userData.pickup;

        if (!pickup) {
            return false;
        }

        if (objeto.parent) {
            objeto.parent.remove(
                objeto
            );
        }

        guardarObjetoMano(
            motor,
            lado,
            null
        );

        const nuevo =
            motor.crearObjeto(
                pickup.id,
                pickup.name,
                posicion.x,
                posicion.z,
                pickup.qty || 1
            );

        if (nuevo) {

            nuevo.position.y =
                posicion.y;

            nuevo.userData.enMano =
                false;

            nuevo.userData.colision =
                true;

        }

        return true;
    }

    // ------------------------------------------------------------
    // IMPACTO
    // ------------------------------------------------------------

    function golpear(
        motor,
        lado,
        fuerza
    ) {

        const impacto =
            obtenerImpacto(motor);

        if (!impacto) {
            return false;
        }

        const objetoGolpeado =
            impacto.object;

        const objetoMano =
            obtenerObjetoMano(
                motor,
                lado
            );

        const idObjeto =
            objetoMano &&
            objetoMano.userData &&
            objetoMano.userData.pickup &&
            objetoMano.userData.pickup.id;

        // --------------------------------------------------------
        // TIERRA
        // --------------------------------------------------------

        if (
            objetoMano &&
            idObjeto === 'tierra' &&
            motor.mundo &&
            typeof motor.mundo.colocarTierraCercana === 'function'
        ) {

            const colocado =
                motor.mundo.colocarTierraCercana(
                    impacto.point.x,
                    impacto.point.z
                );

            if (colocado) {

                if (objetoMano.parent) {
                    objetoMano.parent.remove(
                        objetoMano
                    );
                }

                guardarObjetoMano(
                    motor,
                    lado,
                    null
                );

                return true;
            }
        }

        // --------------------------------------------------------
        // ÁRBOL
        // --------------------------------------------------------

        const arbol =
            buscarPadre(
                objetoGolpeado,
                nodo =>
                    nodo.userData &&
                    nodo.userData.arbol
            );

        if (arbol) {

            const dano =
                (
                    idObjeto === 'hacha'
                        ? 2
                        : 1
                ) *
                (
                    0.2 +
                    fuerza * 2.8
                );

            arbol.userData.vida =
                (
                    arbol.userData.vida == null
                        ? 3
                        : arbol.userData.vida
                ) - dano;

            if (
                motor.mundo &&
                typeof motor.mundo.derribarArbol === 'function' &&
                arbol.userData.vida <= 0
            ) {

                motor.mundo.derribarArbol(
                    arbol
                );
            }

            return true;
        }

        // --------------------------------------------------------
        // TERRENO CON PALA
        // --------------------------------------------------------

        const terreno =
            buscarPadre(
                objetoGolpeado,
                nodo =>
                    nodo.userData &&
                    nodo.userData.interactivo &&
                    nodo.userData.pixeles
            );

        if (
            terreno &&
            idObjeto === 'pala_madera' &&
            fuerza > 0.15 &&
            motor.mundo &&
            typeof motor.mundo.destruirBloque === 'function'
        ) {

            const resultado =
                motor.mundo.destruirBloque(
                    impacto
                );

            if (resultado) {

                const tierra =
                    motor.crearObjeto(
                        'tierra',
                        'tierra',
                        resultado.x,
                        resultado.z,
                        1
                    );

                if (tierra) {

                    motor.retirarObjeto(
                        tierra
                    );

                    colocarEnMano(
                        motor,
                        lado,
                        tierra
                    );
                }
            }

            return true;
        }

        // --------------------------------------------------------
        // RECURSOS
        // --------------------------------------------------------

        const recurso =
            buscarPadre(
                objetoGolpeado,
                nodo =>
                    nodo.userData &&
                    nodo.userData.recurso &&
                    !nodo.userData.arbol
            );

        if (recurso) {

            recurso.userData.vida =
                (
                    recurso.userData.vida == null
                        ? 2
                        : recurso.userData.vida
                ) -
                (
                    0.2 +
                    fuerza * 1.5
                );

            if (
                recurso.userData.vida <= 0
            ) {

                const posicion =
                    recurso.getWorldPosition(
                        new THREE.Vector3()
                    );

                if (
                    motor.soltarRecursos
                ) {

                    motor.soltarRecursos(
                        recurso.userData.recurso,
                        posicion
                    );
                }

                if (recurso.parent) {
                    recurso.parent.remove(
                        recurso
                    );
                }
            }

            return true;
        }

        return false;
    }

    // ------------------------------------------------------------
    // INICIAR SISTEMA
    // ------------------------------------------------------------

    function iniciar(motor) {

        if (
            !motor ||
            !motor.j ||
            motor.__interaccion2
        ) {
            return;
        }

        motor.__interaccion2 = true;

        motor.manoIzquierdaObjeto =
            null;

        motor.manoDerechaObjeto =
            null;

        motor.ultimaMano =
            'izquierda';

        motor.golpe2 = {

            izquierda: {
                activa: false,
                fuerza: 0
            },

            derecha: {
                activa: false,
                fuerza: 0
            }

        };

        // --------------------------------------------------------
        // TEXTURAS
        // --------------------------------------------------------

        motor.texturasObjetos = {};

        const tipos = [
            'tierra',
            'piedra',
            'madera',
            'palo',
            'arena',
            'cesped',
            'hojas',
            'agua'
        ];

        for (const tipo of tipos) {

            motor.texturasObjetos[tipo] =
                crearTextura(tipo);
        }

        // --------------------------------------------------------
        // APLICAR TEXTURA
        // --------------------------------------------------------

        const aplicarTextura =
            objeto => {

                if (
                    !objeto ||
                    !objeto.material
                ) {
                    return;
                }

                const id =
                    objeto.userData &&
                    objeto.userData.pickup &&
                    objeto.userData.pickup.id;

                const tipo =
                    objeto.userData &&
                    objeto.userData.tipo;

                const clave =
                    id || tipo;

                const textura =
                    motor.texturasObjetos[
                        clave
                    ];

                if (!textura) {
                    return;
                }

                objeto.material.map =
                    textura;

                if (
                    objeto.material.color
                ) {

                    objeto.material.color.set(
                        0xffffff
                    );
                }

                objeto.material.needsUpdate =
                    true;
            };

        motor.escena.traverse(
            aplicarTextura
        );

        // --------------------------------------------------------
        // NUEVOS OBJETOS
        // --------------------------------------------------------

        const crearOriginal =
            motor.crearObjeto.bind(
                motor
            );

        motor.crearObjeto =
            function () {

                const objeto =
                    crearOriginal(
                        ...arguments
                    );

                if (objeto) {
                    aplicarTextura(
                        objeto
                    );
                }

                return objeto;
            };

        // --------------------------------------------------------
        // E = RECOGER
        // --------------------------------------------------------

        motor.recogerEnMano =
            function (lado) {

                return recoger(
                    motor,
                    lado
                );
            };

        // --------------------------------------------------------
        // Q = SOLTAR
        // --------------------------------------------------------

        motor.dejarMano =
            function (lado) {

                return soltar(
                    motor,
                    lado
                );
            };

        // --------------------------------------------------------
        // CLIC
        // --------------------------------------------------------

        const mouseDown =
            (lado, evento) => {

                if (!motor.j) {
                    return;
                }

                motor.ultimaMano =
                    lado;

                const golpe =
                    motor.golpe2[lado];

                golpe.activa =
                    true;

                golpe.fuerza =
                    0;

                try {

                    motor.renderer.domElement
                        .requestPointerLock();

                } catch (_) {}

                motor.j.animarMano(
                    lado
                );

                evento.preventDefault();
                evento.stopImmediatePropagation();
            };

        const mouseUp =
            (lado, evento) => {

                const golpe =
                    motor.golpe2[lado];

                if (!golpe.activa) {
                    return;
                }

                golpe.activa =
                    false;

                golpear(
                    motor,
                    lado,
                    clamp(
                        golpe.fuerza,
                        0.03,
                        1
                    )
                );

                evento.preventDefault();
                evento.stopImmediatePropagation();
            };

        // --------------------------------------------------------
        // BOTÓN IZQUIERDO
        // --------------------------------------------------------

        motor.renderer.domElement
            .addEventListener(
                'mousedown',
                evento => {

                    if (evento.button === 0) {

                        mouseDown(
                            'izquierda',
                            evento
                        );
                    }

                    if (evento.button === 2) {

                        mouseDown(
                            'derecha',
                            evento
                        );
                    }

                },
                true
            );

        // --------------------------------------------------------
        // SOLTAR BOTÓN
        // --------------------------------------------------------

        motor.renderer.domElement
            .addEventListener(
                'mouseup',
                evento => {

                    if (evento.button === 0) {

                        mouseUp(
                            'izquierda',
                            evento
                        );
                    }

                    if (evento.button === 2) {

                        mouseUp(
                            'derecha',
                            evento
                        );
                    }

                },
                true
            );

        // --------------------------------------------------------
        // FUERZA DEL GOLPE
        // --------------------------------------------------------

        document.addEventListener(
            'mousemove',
            evento => {

                if (
                    document.pointerLockElement !==
                    motor.renderer.domElement
                ) {
                    return;
                }

                const fuerza =
                    clamp(
                        (
                            Math.abs(
                                evento.movementX || 0
                            ) +
                            Math.abs(
                                evento.movementY || 0
                            )
                        ) / 55,
                        0,
                        1
                    );

                for (
                    const lado of [
                        'izquierda',
                        'derecha'
                    ]
                ) {

                    const golpe =
                        motor.golpe2[lado];

                    if (
                        !golpe.activa
                    ) {
                        continue;
                    }

                    golpe.fuerza =
                        clamp(
                            golpe.fuerza +
                            fuerza,
                            0,
                            1
                        );

                    motor.j.animarMano(
                        lado
                    );
                }

            },
            true
        );

        // --------------------------------------------------------
        // CLICK DERECHO
        // --------------------------------------------------------

        motor.renderer.domElement
            .addEventListener(
                'contextmenu',
                evento => {

                    evento.preventDefault();
                    evento.stopImmediatePropagation();

                },
                true
            );

        // --------------------------------------------------------
        // RUEDA
        // --------------------------------------------------------

        motor.renderer.domElement
            .addEventListener(
                'wheel',
                evento => {

                    evento.preventDefault();
                    evento.stopImmediatePropagation();

                },
                {
                    capture: true,
                    passive: false
                }
            );

        // --------------------------------------------------------
        // TECLADO
        // --------------------------------------------------------

        window.addEventListener(
            'keydown',
            evento => {

                const tecla =
                    evento.key.toLowerCase();

                // E = recoger
                if (
                    tecla === 'e' &&
                    !evento.repeat
                ) {

                    recoger(
                        motor,
                        motor.ultimaMano
                    );

                    evento.preventDefault();
                }

                // Q = soltar
                if (
                    tecla === 'q' &&
                    !evento.repeat
                ) {

                    soltar(
                        motor,
                        motor.ultimaMano
                    );

                    evento.preventDefault();
                }

            }
        );
    }

    // ------------------------------------------------------------
    // ESPERAR AL MOTOR
    // ------------------------------------------------------------

    function esperarMotor() {

        if (
            window.motor &&
            window.motor.j
        ) {

            iniciar(
                window.motor
            );

            return;
        }

        requestAnimationFrame(
            esperarMotor
        );
    }

    esperarMotor();

})();
