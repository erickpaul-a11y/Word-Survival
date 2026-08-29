/* ============================================================
   WORD SURVIVAL ∞
   MUNDO
   - Terreno suave
   - Sin aspecto de cubos
   - Altura compatible con Motor
   - Agua
   - Chunks
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
            seed || Math.random() * 100000;

        this.nivelAgua = 3;

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

        this.materialAgua =
            new THREE.MeshPhongMaterial({
                color: 0x176dcc,
                transparent: true,
                opacity: 0.65,
                shininess: 80,
                depthWrite: false,
                side: THREE.DoubleSide
            });
    }


    // =========================================================
    // RUIDO SUAVE
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


    // =========================================================
    // INTERPOLACIÓN SUAVE
    // =========================================================

    suavizar(t) {

        return t * t * (3 - 2 * t);
    }


    ruidoSuave(x, z) {

        const x0 = Math.floor(x);
        const z0 = Math.floor(z);

        const fx =
            this.suavizar(
                x - x0
            );

        const fz =
            this.suavizar(
                z - z0
            );

        const a =
            this.ruido(
                x0,
                z0
            );

        const b =
            this.ruido(
                x0 + 1,
                z0
            );

        const c =
            this.ruido(
                x0,
                z0 + 1
            );

        const d =
            this.ruido(
                x0 + 1,
                z0 + 1
            );

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

        /*
         * Varias escalas de ruido para que el terreno
         * tenga colinas naturales en vez de cuadrados.
         */

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

        let h =
            2.5 +
            grande * 5.0 +
            medio * 1.8 +
            pequeno * 0.45;

        h =
            Math.max(
                -1,
                Math.min(
                    10,
                    h
                )
            );

        /*
         * Las modificaciones del jugador pueden cambiar
         * ligeramente la superficie.
         */

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
            this.altura(
                x,
                z
            )
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

        return by <= h
            ? 1
            : 0;
    }


    // =========================================================
    // AGUA
    // =========================================================

    esAgua(x, z) {

        return (
            this.altura(
                x,
                z
            ) < this.nivelAgua
        );
    }


    getWaterHeightAt(x, z) {

        if (
            !this.esAgua(
                x,
                z
            )
        ) {

            return null;
        }

        return this.nivelAgua;
    }


    // =========================================================
    // CREAR TERRENO SUAVE
    // =========================================================

    crearTerrenoChunk(
        cx,
        cz
    ) {

        const size =
            this.tam;

        const verticesPorLado =
            size + 1;

        const vertices = [];

        const indices = [];

        /*
         * Generamos una cuadrícula de vértices.
         *
         * Cada vértice tiene una altura diferente,
         * creando una superficie continua.
         */

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

        malla.userData.pixeles =
            true;

        malla.userData.suelo =
            true;

        malla.userData.tipo =
            'terreno';

        return malla;
    }


    // =========================================================
    // CREAR AGUA
    // =========================================================

    crearAguaChunk(
        cx,
        cz
    ) {

        const size =
            this.tam;

        const geometria =
            new THREE.PlaneGeometry(
                size,
                size,
                size,
                size
            );

        const posiciones =
            geometria.attributes.position;

        for (
            let i = 0;
            i < posiciones.count;
            i++
        ) {

            const x =
                posiciones.getX(i) +
                cx * size;

            const z =
                -posiciones.getY(i) +
                cz * size;

            posiciones.setXYZ(
                i,
                x - cx * size,
                -(z - cz * size),
                this.nivelAgua
            );
        }

        posiciones.needsUpdate =
            true;

        geometria.computeVertexNormals();

        const agua =
            new THREE.Mesh(
                geometria,
                this.materialAgua
            );

        agua.rotation.x =
            -Math.PI / 2;

        agua.position.set(
            cx * size +
            size / 2,

            0,

            cz * size +
            size / 2
        );

        agua.userData.agua =
            true;

        return agua;
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


        // Terreno suave
        const terreno =
            this.crearTerrenoChunk(
                cx,
                cz
            );

        chunk.grupo.add(
            terreno
        );


        // Agua
        let hayAgua =
            false;

        for (
            let z = 0;
            z <= this.tam;
            z++
        ) {

            for (
                let x = 0;
                x <= this.tam;
                x++
            ) {

                const h =
                    this.altura(
                        cx * this.tam + x,
                        cz * this.tam + z
                    );

                if (
                    h <
                    this.nivelAgua
                ) {

                    hayAgua =
                        true;

                    break;
                }
            }

            if (hayAgua) {
                break;
            }
        }


        if (hayAgua) {

            const agua =
                this.crearAguaChunk(
                    cx,
                    cz
                );

            chunk.grupo.add(
                agua
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
    // CHUNK
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


    // =========================================================
    // ACTUALIZAR MUNDO
    // =========================================================

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

                this.solicitarChunk(
                    cx + x,
                    cz + z
                );
            }
        }
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
    // COLOCAR TIERRA CERCA
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
