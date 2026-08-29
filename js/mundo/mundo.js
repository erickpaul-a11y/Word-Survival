/* ============================================================
   WORD SURVIVAL ∞
   MUNDO
   - Terreno suave
   - Chunks infinitos
   - Árboles
   - Agua mucho más frecuente
   - Agua con profundidad real
   - Peces
   - Peces animados
   - Excavación
   - Colocación de tierra
   ============================================================ */

class Mundo {

    constructor(motor, seed) {

        this.m = motor;

        this.chunks = new Map();

        this.tam = 12;

        this.radioCarga = 2;
        this.radioEliminar = 4;

        this.seed =
            seed || Math.floor(Math.random() * 2147483647);

        /*
         * SUBIMOS EL NIVEL DEL AGUA.
         *
         * Antes:
         * nivelAgua = 3
         *
         * Ahora:
         * hay muchas más zonas bajas
         * convertidas en agua.
         */
        this.nivelAgua = 4.4;

        /*
         * Profundidad mínima necesaria
         * para que aparezcan peces.
         */
        this.profundidadMinimaPez = 1.5;

        /*
         * Radio seco alrededor del inicio.
         *
         * Esto evita que el jugador aparezca
         * directamente dentro de un lago.
         */
        this.radioInicioSeco = 10;

        this.modificaciones = new Map();

        this.materialTerreno =
            new THREE.MeshLambertMaterial({
                color: 0x4d8f38,
                side: THREE.DoubleSide
            });

        this.materialTierra =
            new THREE.MeshLambertMaterial({
                color: 0x6e4b2f,
                side: THREE.DoubleSide
            });

        this.materialTronco =
            new THREE.MeshLambertMaterial({
                color: 0x75451f
            });

        this.materialHojas =
            new THREE.MeshLambertMaterial({
                color: 0x287a32
            });

        this.materialAgua =
            new THREE.MeshPhongMaterial({
                color: 0x176dcc,
                transparent: true,
                opacity: 0.60,
                shininess: 90,
                depthWrite: false,
                side: THREE.DoubleSide
            });

        this.materialPez =
            new THREE.MeshLambertMaterial({
                color: 0xe28b32
            });
    }


    // =========================================================
    // RUIDO
    // =========================================================

    ruido(x, z) {

        const n =
            Math.sin(
                (
                    x * 127.1 +
                    z * 311.7 +
                    this.seed
                ) * 12.9898
            ) * 43758.5453;

        return n - Math.floor(n);
    }


    suavizar(t) {

        return t * t * (3 - 2 * t);
    }


    ruidoSuave(x, z) {

        const x0 = Math.floor(x);
        const z0 = Math.floor(z);

        const fx =
            this.suavizar(x - x0);

        const fz =
            this.suavizar(z - z0);

        const a =
            this.ruido(x0, z0);

        const b =
            this.ruido(x0 + 1, z0);

        const c =
            this.ruido(x0, z0 + 1);

        const d =
            this.ruido(x0 + 1, z0 + 1);

        const ab =
            a + (b - a) * fx;

        const cd =
            c + (d - c) * fx;

        return ab +
            (cd - ab) * fz;
    }


    // =========================================================
    // ALTURA DEL TERRENO
    // =========================================================

    altura(x, z) {

        const grande =
            this.ruidoSuave(
                x * 0.045,
                z * 0.045
            );

        const medio =
            this.ruidoSuave(
                x * 0.11,
                z * 0.11
            );

        const pequeno =
            this.ruidoSuave(
                x * 0.23,
                z * 0.23
            );

        /*
         * Terreno un poco más bajo que antes.
         *
         * Esto permite que el nivel del agua
         * cubra bastantes más zonas.
         */
        let h =
            1.8 +
            grande * 5.0 +
            medio * 1.8 +
            pequeno * 0.45;

        /*
         * Zona inicial seca.
         *
         * Evita aparecer debajo del agua
         * en el punto 0,0.
         */
        const distanciaInicio =
            Math.hypot(x, z);

        if (
            distanciaInicio < this.radioInicioSeco
        ) {

            const factor =
                distanciaInicio /
                this.radioInicioSeco;

            const alturaMinima =
                this.nivelAgua + 0.7;

            if (
                h <
                alturaMinima
            ) {

                h =
                    alturaMinima *
                    (1 - factor) +
                    h *
                    factor;
            }
        }

        h =
            Math.max(
                -1,
                Math.min(
                    10,
                    h
                )
            );

        const bx =
            Math.floor(x);

        const bz =
            Math.floor(z);

        const base =
            Math.floor(h);

        const clave =
            `${bx},${base},${bz}`;

        if (
            this.modificaciones.has(
                clave
            )
        ) {

            const valor =
                this.modificaciones.get(
                    clave
                );

            if (valor === 0) {
                h -= 1;
            }

            if (valor === 1) {
                h += 1;
            }
        }

        return h;
    }


    // =========================================================
    // ALTURA SEGURA
    // =========================================================

    obtenerAlturaSegura(x, z) {

        return Math.max(
            -1,
            this.altura(x, z)
        );
    }


    // =========================================================
    // SOLIDO
    // =========================================================

    obtenerSolido(x, y, z) {

        const bx =
            Math.floor(x);

        const by =
            Math.floor(y);

        const bz =
            Math.floor(z);

        const h =
            Math.floor(
                this.altura(
                    bx,
                    bz
                )
            );

        const clave =
            `${bx},${by},${bz}`;

        if (
            this.modificaciones.has(
                clave
            )
        ) {

            return this.modificaciones.get(
                clave
            );
        }

        return by <= h ? 1 : 0;
    }


    // =========================================================
    // AGUA
    // =========================================================

    esAgua(x, z) {

        /*
         * Nunca agua en la zona inicial.
         */
        if (
            Math.hypot(x, z) <
            this.radioInicioSeco
        ) {
            return false;
        }

        return (
            this.altura(x, z) <
            this.nivelAgua
        );
    }


    getWaterHeightAt(x, z) {

        if (
            !this.esAgua(x, z)
        ) {
            return null;
        }

        return this.nivelAgua;
    }


    // =========================================================
    // PROFUNDIDAD REAL
    // =========================================================

    getWaterDepthAt(x, z) {

        if (
            !this.esAgua(x, z)
        ) {
            return 0;
        }

        const suelo =
            this.altura(
                x,
                z
            );

        return Math.max(
            0,
            this.nivelAgua - suelo
        );
    }


    // =========================================================
    // TERRENO
    // =========================================================

    crearTerrenoChunk(cx, cz) {

        const size =
            this.tam;

        const verticesPorLado =
            size + 1;

        const vertices = [];
        const indices = [];

        for (
            let z = 0;
            z <= size;
            z++
        ) {

            for (
                let x = 0;
                x <= size;
                x++
            ) {

                const wx =
                    cx * size + x;

                const wz =
                    cz * size + z;

                const y =
                    this.altura(
                        wx,
                        wz
                    );

                vertices.push(
                    wx,
                    y,
                    wz
                );
            }
        }


        for (
            let z = 0;
            z < size;
            z++
        ) {

            for (
                let x = 0;
                x < size;
                x++
            ) {

                const a =
                    z *
                    verticesPorLado +
                    x;

                const b =
                    a + 1;

                const c =
                    a +
                    verticesPorLado;

                const d =
                    c + 1;

                indices.push(
                    a,
                    c,
                    b,

                    b,
                    c,
                    d
                );
            }
        }


        const geometria =
            new THREE.BufferGeometry();

        geometria.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(
                vertices,
                3
            )
        );

        geometria.setIndex(
            indices
        );

        geometria.computeVertexNormals();


        const malla =
            new THREE.Mesh(
                geometria,
                this.materialTerreno
            );

        malla.castShadow =
            true;

        malla.receiveShadow =
            true;

        malla.userData.interactivo =
            true;

        malla.userData.suelo =
            true;

        malla.userData.tipo =
            'terreno';

        return malla;
    }


    // =========================================================
    // ÁRBOL
    // =========================================================

    crearArbol(
        x,
        y,
        z,
        escala = 1
    ) {

        const arbol =
            new THREE.Group();

        arbol.position.set(
            x,
            y,
            z
        );

        arbol.scale.set(
            escala,
            escala,
            escala
        );

        arbol.userData.tipo =
            'arbol';

        arbol.userData.interactivo =
            true;

        arbol.userData.vida =
            5;

        arbol.userData.madera =
            3;

        /*
         * Esto permite que Motor
         * reconozca el árbol como recurso.
         */
        arbol.userData.recurso = {
            madera: 3
        };


        // TRONCO

        const troncoGeo =
            new THREE.CylinderGeometry(
                0.22,
                0.30,
                2.3,
                7
            );

        const tronco =
            new THREE.Mesh(
                troncoGeo,
                this.materialTronco
            );

        tronco.position.y =
            1.15;

        tronco.castShadow =
            true;

        tronco.userData.tipo =
            'tronco';

        tronco.userData.arbol =
            arbol;

        arbol.add(
            tronco
        );


        // HOJAS

        const hojasGeo =
            new THREE.SphereGeometry(
                1.15,
                8,
                6
            );

        const hojas =
            new THREE.Mesh(
                hojasGeo,
                this.materialHojas
            );

        hojas.position.y =
            2.45;

        hojas.scale.set(
            1,
            1.1,
            1
        );

        hojas.castShadow =
            true;

        hojas.userData.tipo =
            'hojas';

        hojas.userData.arbol =
            arbol;

        arbol.add(
            hojas
        );

        return arbol;
    }


    // =========================================================
    // ÁRBOLES
    // =========================================================

    generarArbolesChunk(
        chunk,
        cx,
        cz
    ) {

        for (
            let z = 2;
            z < this.tam;
            z += 3
        ) {

            for (
                let x = 2;
                x < this.tam;
                x += 3
            ) {

                const wx =
                    cx * this.tam + x;

                const wz =
                    cz * this.tam + z;

                const h =
                    this.altura(
                        wx,
                        wz
                    );

                /*
                 * No árboles en agua.
                 */
                if (
                    this.esAgua(
                        wx,
                        wz
                    )
                ) {
                    continue;
                }

                const probabilidad =
                    this.ruido(
                        wx * 3.71,
                        wz * 5.19
                    );

                if (
                    probabilidad < 0.76
                ) {
                    continue;
                }

                const escala =
                    0.85 +
                    this.ruido(
                        wx * 7.13,
                        wz * 4.27
                    ) * 0.45;

                const arbol =
                    this.crearArbol(
                        wx,
                        h,
                        wz,
                        escala
                    );

                chunk.grupo.add(
                    arbol
                );

                chunk.objetos.push(
                    arbol
                );
            }
        }
    }


    // =========================================================
    // AGUA
    // =========================================================

    crearAguaChunk(
        cx,
        cz
    ) {

        const size =
            this.tam;

        /*
         * En vez de poner un plano gigante
         * encima de TODO el chunk, creamos
         * pequeñas superficies únicamente
         * donde realmente existe agua.
         */
        const posiciones = [];
        const indices = [];

        const paso = 1;

        for (
            let z = 0;
            z < size;
            z += paso
        ) {

            for (
                let x = 0;
                x < size;
                x += paso
            ) {

                const wx =
                    cx * size +
                    x +
                    0.5;

                const wz =
                    cz * size +
                    z +
                    0.5;

                if (
                    !this.esAgua(
                        wx,
                        wz
                    )
                ) {
                    continue;
                }

                const base =
                    posiciones.length / 3;

                const x0 =
                    cx * size + x;

                const x1 =
                    x0 + 1;

                const z0 =
                    cz * size + z;

                const z1 =
                    z0 + 1;

                posiciones.push(
                    x0,
                    this.nivelAgua,
                    z0,

                    x1,
                    this.nivelAgua,
                    z0,

                    x0,
                    this.nivelAgua,
                    z1,

                    x1,
                    this.nivelAgua,
                    z1
                );

                indices.push(
                    base,
                    base + 2,
                    base + 1,

                    base + 1,
                    base + 2,
                    base + 3
                );
            }
        }

        /*
         * Si este chunk no tiene agua,
         * no creamos ninguna malla.
         */
        if (
            posiciones.length === 0
        ) {
            return null;
        }

        const geometria =
            new THREE.BufferGeometry();

        geometria.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(
                posiciones,
                3
            )
        );

        geometria.setIndex(
            indices
        );

        geometria.computeVertexNormals();

        const agua =
            new THREE.Mesh(
                geometria,
                this.materialAgua
            );

        agua.castShadow =
            false;

        agua.receiveShadow =
            true;

        agua.userData.agua =
            true;

        agua.userData.tipo =
            'agua';

        agua.userData.interactivo =
            true;

        return agua;
    }


    // =========================================================
    // PEZ
    // =========================================================

    crearPez(
        x,
        y,
        z
    ) {

        const pez =
            new THREE.Group();

        pez.position.set(
            x,
            y,
            z
        );

        pez.userData.tipo =
            'pez';

        pez.userData.interactivo =
            true;

        pez.userData.vida =
            1;

        pez.userData.velocidad =
            0.5 +
            Math.random() * 0.5;

        pez.userData.direccion =
            Math.random() *
            Math.PI *
            2;

        pez.userData.tiempo =
            Math.random() *
            Math.PI *
            2;


        const cuerpoGeo =
            new THREE.SphereGeometry(
                0.20,
                8,
                6
            );

        const cuerpo =
            new THREE.Mesh(
                cuerpoGeo,
                this.materialPez
            );

        cuerpo.scale.set(
            1.5,
            0.65,
            0.7
        );

        cuerpo.userData.tipo =
            'pez';

        cuerpo.userData.pez =
            pez;

        pez.add(
            cuerpo
        );


        const colaGeo =
            new THREE.ConeGeometry(
                0.16,
                0.35,
                4
            );

        const cola =
            new THREE.Mesh(
                colaGeo,
                this.materialPez
            );

        cola.rotation.z =
            -Math.PI / 2;

        cola.position.x =
            -0.32;

        cola.userData.tipo =
            'pez';

        cola.userData.pez =
            pez;

        pez.add(
            cola
        );

        return pez;
    }


    // =========================================================
    // PECES
    // =========================================================

    generarPecesChunk(
        chunk,
        cx,
        cz
    ) {

        for (
            let z = 1;
            z < this.tam;
            z += 3
        ) {

            for (
                let x = 1;
                x < this.tam;
                x += 3
            ) {

                const wx =
                    cx * this.tam + x;

                const wz =
                    cz * this.tam + z;

                const profundidad =
                    this.getWaterDepthAt(
                        wx,
                        wz
                    );

                if (
                    profundidad <
                    this.profundidadMinimaPez
                ) {
                    continue;
                }

                /*
                 * Más peces que antes.
                 */
                const probabilidad =
                    this.ruido(
                        wx * 8.21,
                        wz * 6.17
                    );

                if (
                    probabilidad < 0.55
                ) {
                    continue;
                }

                const fondo =
                    this.altura(
                        wx,
                        wz
                    );

                /*
                 * El pez queda siempre
                 * por debajo de la superficie.
                 */
                const margenInferior =
                    Math.min(
                        0.5,
                        profundidad * 0.2
                    );

                const margenSuperior =
                    0.45;

                const rango =
                    Math.max(
                        0.25,
                        profundidad -
                        margenInferior -
                        margenSuperior
                    );

                const y =
                    fondo +
                    margenInferior +
                    Math.random() *
                    rango;

                const pez =
                    this.crearPez(
                        wx,
                        y,
                        wz
                    );

                chunk.grupo.add(
                    pez
                );

                chunk.objetos.push(
                    pez
                );
            }
        }
    }


    // =========================================================
    // GENERAR CHUNK
    // =========================================================

    generar(
        cx,
        cz
    ) {

        const clave =
            `${cx},${cz}`;

        if (
            this.chunks.has(
                clave
            )
        ) {
            return;
        }

        const chunk = {

            grupo:
                new THREE.Group(),

            objetos: [],

            cx,
            cz
        };


        // TERRENO

        const terreno =
            this.crearTerrenoChunk(
                cx,
                cz
            );

        chunk.grupo.add(
            terreno
        );


        // ÁRBOLES

        this.generarArbolesChunk(
            chunk,
            cx,
            cz
        );


        // AGUA

        const agua =
            this.crearAguaChunk(
                cx,
                cz
            );

        if (
            agua
        ) {

            chunk.grupo.add(
                agua
            );

            chunk.objetos.push(
                agua
            );

            /*
             * Peces solamente cuando
             * existe agua.
             */
            this.generarPecesChunk(
                chunk,
                cx,
                cz
            );
        }


        this.chunks.set(
            clave,
            chunk
        );

        this.m.escena.add(
            chunk.grupo
        );
    }


    // =========================================================
    // CHUNKS
    // =========================================================

    solicitarChunk(
        cx,
        cz
    ) {

        const clave =
            `${cx},${cz}`;

        if (
            !this.chunks.has(
                clave
            )
        ) {

            this.generar(
                cx,
                cz
            );
        }
    }


    actualizar(
        jx,
        jz
    ) {

        const cx =
            Math.floor(
                jx / this.tam
            );

        const cz =
            Math.floor(
                jz / this.tam
            );

        for (
            let x =
                -this.radioCarga;

            x <=
            this.radioCarga;

            x++
        ) {

            for (
                let z =
                    -this.radioCarga;

                z <=
                this.radioCarga;

                z++
            ) {

                if (
                    Math.hypot(
                        x,
                        z
                    ) >
                    this.radioCarga +
                    0.35
                ) {
                    continue;
                }

                this.solicitarChunk(
                    cx + x,
                    cz + z
                );
            }
        }
    }


    // =========================================================
    // ANIMAR PECES
    // =========================================================

    actualizarPeces(
        delta = 0.016
    ) {

        for (
            const chunk of
            this.chunks.values()
        ) {

            for (
                const objeto of
                chunk.objetos
            ) {

                if (
                    !objeto ||
                    objeto.userData.tipo !==
                    'pez'
                ) {
                    continue;
                }

                const pez =
                    objeto;

                pez.userData.tiempo +=
                    delta;

                let direccion =
                    pez.userData.direccion;

                const velocidad =
                    pez.userData.velocidad;

                /*
                 * Cambio de dirección
                 * ocasional y suave.
                 */
                if (
                    Math.random() <
                    delta * 0.12
                ) {

                    direccion +=
                        (Math.random() - 0.5) *
                        1.2;

                    pez.userData.direccion =
                        direccion;
                }

                pez.position.x +=
                    Math.cos(direccion) *
                    velocidad *
                    delta;

                pez.position.z +=
                    Math.sin(direccion) *
                    velocidad *
                    delta;

                /*
                 * Comprobar profundidad.
                 */
                const profundidad =
                    this.getWaterDepthAt(
                        pez.position.x,
                        pez.position.z
                    );

                /*
                 * Si salió del agua,
                 * gira y vuelve.
                 */
                if (
                    profundidad <
                    this.profundidadMinimaPez
                ) {

                    pez.userData.direccion +=
                        Math.PI;
                }

                /*
                 * Movimiento vertical suave.
                 */
                const fondo =
                    this.altura(
                        pez.position.x,
                        pez.position.z
                    );

                const agua =
                    this.getWaterHeightAt(
                        pez.position.x,
                        pez.position.z
                    );

                if (
                    agua !== null
                ) {

                    const profundidadActual =
                        Math.max(
                            0,
                            agua - fondo
                        );

                    const centro =
                        fondo +
                        profundidadActual *
                        0.5;

                    const movimiento =
                        Math.sin(
                            pez.userData.tiempo *
                            2.2
                        ) *
                        0.12;

                    pez.position.y =
                        Math.min(
                            agua - 0.3,
                            Math.max(
                                fondo + 0.25,
                                centro + movimiento
                            )
                        );
                }

                pez.rotation.y =
                    -direccion;
            }
        }
    }


    // =========================================================
    // GOLPEAR ÁRBOL
    // =========================================================

    golpearArbol(
        arbol,
        dano = 1
    ) {

        if (!arbol) {
            return null;
        }

        if (
            typeof arbol.userData.vida !==
            'number'
        ) {
            return null;
        }

        arbol.userData.vida -=
            dano;

        if (
            arbol.userData.vida <=
            0
        ) {

            const madera =
                arbol.userData.madera ||
                1;

            if (
                arbol.parent
            ) {

                arbol.parent.remove(
                    arbol
                );
            }

            return {
                destruido: true,
                madera
            };
        }

        return {
            destruido: false,
            vida:
                arbol.userData.vida
        };
    }


    // =========================================================
    // DERRIBAR ÁRBOL
    // =========================================================

    derribarArbol(
        arbol
    ) {

        return this.golpearArbol(
            arbol,
            arbol?.userData?.vida || 5
        );
    }


    // =========================================================
    // EXCAVAR
    // =========================================================

    excavar(
        posicionImpacto,
        radio = 1
    ) {

        if (!posicionImpacto) {
            return;
        }

        const bx =
            Math.floor(
                posicionImpacto.x
            );

        const by =
            Math.floor(
                posicionImpacto.y
            );

        const bz =
            Math.floor(
                posicionImpacto.z
            );

        const r =
            Math.ceil(radio);

        const chunks =
            new Set();

        for (
            let x = -r;
            x <= r;
            x++
        ) {

            for (
                let y = -r;
                y <= r;
                y++
            ) {

                for (
                    let z = -r;
                    z <= r;
                    z++
                ) {

                    if (
                        Math.hypot(
                            x,
                            y,
                            z
                        ) <= radio
                    ) {

                        const xx =
                            bx + x;

                        const yy =
                            by + y;

                        const zz =
                            bz + z;

                        this.modificaciones.set(
                            `${xx},${yy},${zz}`,
                            0
                        );

                        chunks.add(
                            `${Math.floor(xx / this.tam)},${Math.floor(zz / this.tam)}`
                        );
                    }
                }
            }
        }

        this.recargarChunks(
            chunks
        );
    }


    // =========================================================
    // AÑADIR TIERRA
    // =========================================================

    anadirTierra(
        posicionImpacto,
        radio = 1
    ) {

        if (!posicionImpacto) {
            return;
        }

        const bx =
            Math.floor(
                posicionImpacto.x
            );

        const by =
            Math.floor(
                posicionImpacto.y
            );

        const bz =
            Math.floor(
                posicionImpacto.z
            );

        const r =
            Math.ceil(radio);

        const chunks =
            new Set();

        for (
            let x = -r;
            x <= r;
            x++
        ) {

            for (
                let y = -r;
                y <= r;
                y++
            ) {

                for (
                    let z = -r;
                    z <= r;
                    z++
                ) {

                    if (
                        Math.hypot(
                            x,
                            y,
                            z
                        ) <= radio
                    ) {

                        const xx =
                            bx + x;

                        const yy =
                            by + y;

                        const zz =
                            bz + z;

                        this.modificaciones.set(
                            `${xx},${yy},${zz}`,
                            1
                        );

                        chunks.add(
                            `${Math.floor(xx / this.tam)},${Math.floor(zz / this.tam)}`
                        );
                    }
                }
            }
        }

        this.recargarChunks(
            chunks
        );
    }


    // =========================================================
    // RECARGAR CHUNKS
    // =========================================================

    recargarChunks(
        lista
    ) {

        lista.forEach(
            clave => {

                const chunk =
                    this.chunks.get(
                        clave
                    );

                if (!chunk) {
                    return;
                }

                if (
                    chunk.grupo
                ) {

                    this.m.escena.remove(
                        chunk.grupo
                    );
                }

                this.chunks.delete(
                    clave
                );

                const partes =
                    clave
                        .split(',')
                        .map(Number);

                this.generar(
                    partes[0],
                    partes[1]
                );
            }
        );
    }


    // =========================================================
    // DESTRUIR BLOQUE
    // =========================================================

    destruirBloque(
        hit,
        radio = 1
    ) {

        if (
            !hit ||
            !hit.point
        ) {
            return null;
        }

        let objeto =
            hit.object;

        while (
            objeto
        ) {

            if (
                objeto.userData &&
                objeto.userData.tipo ===
                'arbol'
            ) {

                return this.golpearArbol(
                    objeto,
                    1
                );
            }

            if (
                objeto.userData &&
                objeto.userData.arbol
            ) {

                return this.golpearArbol(
                    objeto.userData.arbol,
                    1
                );
            }

            objeto =
                objeto.parent;
        }

        this.excavar(
            hit.point,
            radio
        );

        return hit.point;
    }


    // =========================================================
    // COLOCAR BLOQUE
    // =========================================================

    colocarBloque(
        x,
        y,
        z,
        radio = 1
    ) {

        this.anadirTierra(
            new THREE.Vector3(
                x,
                y,
                z
            ),
            radio
        );

        return {
            x,
            y,
            z
        };
    }


    // =========================================================
    // COLOCAR TIERRA
    // =========================================================

    colocarTierraCercana(
        hit,
        radio = 1
    ) {

        if (
            !hit ||
            !hit.point
        ) {
            return null;
        }

        const pos =
            hit.point.clone();

        if (
            hit.face &&
            hit.face.normal
        ) {

            pos.add(
                hit.face.normal
                    .clone()
                    .multiplyScalar(
                        0.45
                    )
            );
        }

        return this.colocarBloque(
            pos.x,
            pos.y,
            pos.z,
            radio
        );
    }
}


// ============================================================
// EXPORTAR
// ============================================================

window.Mundo =
    Mundo;
