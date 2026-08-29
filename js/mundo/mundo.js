/* ============================================================
   WORD SURVIVAL ∞
   MUNDO 3D
   - Terreno procedural
   - Altura correcta
   - Colisión con suelo
   - Agua
   - Excavación
   - Colocación de tierra
   - Chunks infinitos
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

        this._boxGeo =
            new THREE.BoxGeometry(
                1,
                1,
                1
            );

        this._materiales = {

            cesped:
                new THREE.MeshLambertMaterial({
                    color: 0x2d8a2d
                }),

            tierra:
                new THREE.MeshLambertMaterial({
                    color: 0x5a3d28
                }),

            arena:
                new THREE.MeshLambertMaterial({
                    color: 0xc2a649
                }),

            roca:
                new THREE.MeshLambertMaterial({
                    color: 0x666666
                }),

            agua:
                new THREE.MeshPhongMaterial({
                    color: 0x176dcc,
                    transparent: true,
                    opacity: 0.7,
                    shininess: 80,
                    depthWrite: false
                })
        };
    }


    // ============================================================
    // RUIDO
    // ============================================================

    ruido(x, y, z) {

        const n =
            Math.sin(
                (
                    x * 127.1 +
                    y * 311.7 +
                    z * 74.7 +
                    this.seed
                ) * 12.9898
            ) * 43758.5453;

        return n - Math.floor(n);
    }


    // ============================================================
    // ALTURA DEL TERRENO
    // ============================================================

    altura(x, z) {

        const h =
            Math.floor(
                Math.sin(
                    x * 0.15 +
                    this.seed
                ) * 3 +

                Math.cos(
                    z * 0.15 +
                    this.seed
                ) * 3 +

                4
            );

        /*
         * obtenerSolido() considera sólido
         * todo bloque y <= h.
         *
         * Por eso la superficie REAL está
         * en h + 1.
         */

        return h + 1;
    }


    // ============================================================
    // ALTURA SEGURA
    // ============================================================

    obtenerAlturaSegura(x, z) {

        const h = this.altura(x, z);

        return Math.max(
            -1,
            h
        );
    }


    // ============================================================
    // BLOQUE SÓLIDO
    // ============================================================

    obtenerSolido(x, y, z) {

        const rx =
            Math.floor(x);

        const ry =
            Math.floor(y);

        const rz =
            Math.floor(z);

        const clave =
            `${rx},${ry},${rz}`;

        if (
            this.modificaciones.has(
                clave
            )
        ) {

            return this.modificaciones.get(
                clave
            );
        }

        const h =
            this.altura(
                rx,
                rz
            ) - 1;

        return ry <= h
            ? 1
            : 0;
    }


    // ============================================================
    // AGUA
    // ============================================================

    esAgua(x, z) {

        const superficie =
            this.altura(x, z);

        return (
            superficie <=
            this.nivelAgua
        );
    }


    getWaterHeightAt(x, z) {

        if (!this.esAgua(x, z)) {
            return null;
        }

        /*
         * El agua ocupa bloques hasta
         * el nivel de agua.
         */

        return this.nivelAgua + 1;
    }


    // ============================================================
    // EXCAVAR
    // ============================================================

    excavar(
        posicionImpacto,
        radio = 1
    ) {

        if (!posicionImpacto) {
            return;
        }

        const cx =
            Math.floor(
                posicionImpacto.x
            );

        const cy =
            Math.floor(
                posicionImpacto.y
            );

        const cz =
            Math.floor(
                posicionImpacto.z
            );

        const r =
            Math.ceil(radio);

        const chunksAfectados =
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

                        const bx =
                            cx + x;

                        const by =
                            cy + y;

                        const bz =
                            cz + z;

                        this.modificaciones.set(
                            `${bx},${by},${bz}`,
                            0
                        );

                        const chunkX =
                            Math.floor(
                                bx / this.tam
                            );

                        const chunkZ =
                            Math.floor(
                                bz / this.tam
                            );

                        chunksAfectados.add(
                            `${chunkX},${chunkZ}`
                        );
                    }
                }
            }
        }

        this.recargarChunks(
            chunksAfectados
        );
    }


    // ============================================================
    // AÑADIR TIERRA
    // ============================================================

    anadirTierra(
        posicionImpacto,
        radio = 1
    ) {

        if (!posicionImpacto) {
            return;
        }

        const cx =
            Math.floor(
                posicionImpacto.x
            );

        const cy =
            Math.floor(
                posicionImpacto.y
            );

        const cz =
            Math.floor(
                posicionImpacto.z
            );

        const r =
            Math.ceil(radio);

        const chunksAfectados =
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

                        const bx =
                            cx + x;

                        const by =
                            cy + y;

                        const bz =
                            cz + z;

                        this.modificaciones.set(
                            `${bx},${by},${bz}`,
                            1
                        );

                        const chunkX =
                            Math.floor(
                                bx / this.tam
                            );

                        const chunkZ =
                            Math.floor(
                                bz / this.tam
                            );

                        chunksAfectados.add(
                            `${chunkX},${chunkZ}`
                        );
                    }
                }
            }
        }

        this.recargarChunks(
            chunksAfectados
        );
    }


    // ============================================================
    // RECARGAR CHUNKS
    // ============================================================

    recargarChunks(
        setChunks
    ) {

        setChunks.forEach(
            claveChunk => {

                if (
                    !this.chunks.has(
                        claveChunk
                    )
                ) {
                    return;
                }

                const partes =
                    claveChunk
                        .split(',')
                        .map(Number);

                const cx =
                    partes[0];

                const cz =
                    partes[1];

                const oldChunk =
                    this.chunks.get(
                        claveChunk
                    );

                if (
                    oldChunk &&
                    oldChunk.grupo
                ) {

                    this.m.escena.remove(
                        oldChunk.grupo
                    );
                }

                this.chunks.delete(
                    claveChunk
                );

                this.generar(
                    cx,
                    cz
                );
            }
        );
    }


    // ============================================================
    // DESTRUIR BLOQUE
    // ============================================================

    destruirBloque(
        hit,
        radio
    ) {

        if (
            !hit ||
            !hit.point
        ) {

            return null;
        }

        this.excavar(
            hit.point,
            radio || 1
        );

        return hit.point;
    }


    // ============================================================
    // COLOCAR BLOQUE
    // ============================================================

    colocarBloque(
        x,
        y,
        z,
        radio
    ) {

        this.anadirTierra(
            new THREE.Vector3(
                x,
                y,
                z
            ),
            radio || 1
        );

        return {
            x,
            y,
            z
        };
    }


    // ============================================================
    // COLOCAR TIERRA CERCA
    // ============================================================

    colocarTierraCercana(
        hit,
        radio
    ) {

        if (
            !hit ||
            !hit.point
        ) {

            return null;
        }

        const posicion =
            hit.point.clone();

        if (
            hit.face &&
            hit.face.normal
        ) {

            posicion.add(
                hit.face.normal
                    .clone()
                    .multiplyScalar(
                        0.5
                    )
            );
        }

        return this.colocarBloque(
            posicion.x,
            posicion.y,
            posicion.z,
            radio
        );
    }


    // ============================================================
    // GENERAR CHUNK
    // ============================================================

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

            cx,
            cz,

            /*
             * Importante:
             * motor.js espera que exista
             * esta propiedad al limpiar.
             */

            objetos: []
        };

        const size =
            this.tam;

        const minY =
            -2;

        const maxY =
            12;

        const listas = {

            cesped: [],
            tierra: [],
            arena: [],
            roca: [],
            agua: []
        };


        // --------------------------------------------------------
        // BLOQUES
        // --------------------------------------------------------

        for (
            let x = 0;
            x < size;
            x++
        ) {

            for (
                let z = 0;
                z < size;
                z++
            ) {

                const wx =
                    cx * size + x;

                const wz =
                    cz * size + z;


                for (
                    let y = minY;
                    y <= maxY;
                    y++
                ) {

                    const solido =
                        this.obtenerSolido(
                            wx,
                            y,
                            wz
                        );


                    // ------------------------------------------------
                    // BLOQUE SÓLIDO
                    // ------------------------------------------------

                    if (
                        solido === 1
                    ) {

                        const arriba =
                            this.obtenerSolido(
                                wx,
                                y + 1,
                                wz
                            );

                        let tipo =
                            'tierra';


                        if (
                            arriba === 0
                        ) {

                            if (
                                y <=
                                this.nivelAgua
                            ) {

                                tipo =
                                    'arena';

                            } else {

                                tipo =
                                    'cesped';
                            }

                        } else if (
                            y < 0
                        ) {

                            tipo =
                                'roca';
                        }


                        listas[
                            tipo
                        ].push(

                            new THREE.Vector3(
                                wx,
                                y,
                                wz
                            )

                        );

                    }

                    // ------------------------------------------------
                    // AGUA
                    // ------------------------------------------------

                    else if (
                        y <=
                        this.nivelAgua &&
                        this.altura(
                            wx,
                            wz
                        ) <=
                        this.nivelAgua
                    ) {

                        listas.agua.push(

                            new THREE.Vector3(
                                wx,
                                y,
                                wz
                            )

                        );
                    }
                }
            }
        }


        // ========================================================
        // CREAR MESHES
        // ========================================================

        const dummy =
            new THREE.Object3D();


        for (
            const [
                tipo,
                posiciones
            ]
            of Object.entries(
                listas
            )
        ) {

            if (
                posiciones.length === 0
            ) {

                continue;
            }


            const mesh =
                new THREE.InstancedMesh(
                    this._boxGeo,
                    this._materiales[
                        tipo
                    ],
                    posiciones.length
                );


            posiciones.forEach(
                (pos, i) => {

                    dummy.position.set(
                        pos.x + 0.5,
                        pos.y + 0.5,
                        pos.z + 0.5
                    );

                    dummy.updateMatrix();

                    mesh.setMatrixAt(
                        i,
                        dummy.matrix
                    );
                }
            );


            mesh.instanceMatrix.needsUpdate =
                true;

            mesh.userData.interactivo =
                true;

            mesh.userData.pixeles =
                true;

            mesh.userData.tipo =
                tipo;

            /*
             * Esto hace que el raycaster
             * pueda identificar el terreno.
             */

            mesh.userData.suelo =
                true;

            chunk.grupo.add(
                mesh
            );
        }


        // ========================================================
        // GUARDAR CHUNK
        // ========================================================

        this.chunks.set(
            clave,
            chunk
        );

        this.m.escena.add(
            chunk.grupo
        );
    }


    // ============================================================
    // SOLICITAR CHUNK
    // ============================================================

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


    // ============================================================
    // ACTUALIZAR MUNDO
    // ============================================================

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
}


// ============================================================
// EXPORTAR
// ============================================================

window.Mundo =
    Mundo;
