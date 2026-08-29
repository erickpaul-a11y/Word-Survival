/* ============================================================
   WORD SURVIVAL ∞
   MUNDO
   - Terreno suave
   - Chunks infinitos
   - Árboles
   - Agua con profundidad real
   - Peces
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

        this.profundidadMinimaPez = 1.5;

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


    // PROFUNDIDAD REAL DEL AGUA
    getWaterDepthAt(x, z) {

        const suelo =
            this.altura(x, z);

        if (
            suelo >= this.nivelAgua
        ) {

            return 0;
        }

        return Math.max(
            0,
            this.nivelAgua - suelo
        );
    }


    // =========================================================
    // CREAR TERRENO
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

    crearArbol(x, y, z, escala = 1) {

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


        // Tronco
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


        // Copa
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
    // GENERAR ÁRBOLES
    // =========================================================

    generarArbolesChunk(
        chunk,
        cx,
        cz
    ) {

        /*
         * Revisamos posiciones separadas.
         * El ruido determina dónde aparecen.
         */

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

                const profundidad =
                    this.getWaterDepthAt(
                        wx,
                        wz
                    );

                // Nunca generar árboles dentro del agua
                if (
                    profundidad > 0
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

    crearAguaChunk(cx, cz) {

        const size =
            this.tam;

        const geometria =
            new THREE.PlaneGeometry(
                size,
                size,
                1,
                1
            );

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

            this.nivelAgua,

            cz * size +
            size / 2
        );

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

    crearPez(x, y, z) {

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
            Math.PI * 2;


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
    // GENERAR PECES
    // =========================================================

    generarPecesChunk(
        chunk,
        cx,
        cz
    ) {

        for (
            let z = 1;
            z < this.tam;
            z += 4
        ) {

            for (
                let x = 1;
                x < this.tam;
                x += 4
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

                /*
                 * El pez necesita agua suficientemente profunda.
                 */

                if (
                    profundidad <
                    this.profundidadMinimaPez
                ) {
                    continue;
                }

                const probabilidad =
                    this.ruido(
                        wx * 8.21,
                        wz * 6.17
                    );

                if (
                    probabilidad < 0.70
                ) {
                    continue;
                }

                /*
                 * El pez aparece entre el fondo
                 * y la superficie.
                 */

                const fondo =
                    this.altura(
                        wx,
                        wz
                    );

                const margen =
                    Math.min(
                        0.7,
                        profundidad * 0.25
                    );

                const y =
                    fondo +
                    margen +
                    Math.random() *
                    Math.max(
                        0.2,
                        profundidad -
                        margen * 2
                    );

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

    generar(cx, cz) {

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


        // Terreno
        const terreno =
            this.crearTerrenoChunk(
                cx,
                cz
            );

        chunk.grupo.add(
            terreno
        );


        // Árboles
        this.generarArbolesChunk(
            chunk,
            cx,
            cz
        );


        // Comprobar agua
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

                if (
                    this.esAgua(
                        cx * this.tam + x,
                        cz * this.tam + z
                    )
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

            chunk.objetos.push(
                agua
            );

            // Peces
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

    solicitarChunk(cx, cz) {

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


    actualizar(jx, jz) {

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

                /*
                 * Carga circular para evitar
                 * una zona perfectamente cuadrada.
                 */

                if (
                    Math.hypot(
                        x,
                        z
                    ) >
                    this.radioCarga + 0.35
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

    actualizarPeces(delta = 0.016) {

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

                const velocidad =
                    pez.userData.velocidad;

                const direccion =
                    pez.userData.direccion;

                pez.position.x +=
                    Math.cos(direccion) *
                    velocidad *
                    delta;

                pez.position.z +=
                    Math.sin(direccion) *
                    velocidad *
                    delta;

                /*
                 * Mantener el pez dentro del agua.
                 */

                const profundidad =
                    this.getWaterDepthAt(
                        pez.position.x,
                        pez.position.z
                    );

                if (
                    profundidad <
                    this.profundidadMinimaPez
                ) {

                    pez.userData.direccion +=
                        Math.PI * 0.75;
                }

                /*
                 * Movimiento suave de subida/bajada.
                 */

                pez.position.y +=
                    Math.sin(
                        performance.now() *
                        0.003 +
                        pez.position.x
                    ) *
                    delta *
                    0.08;

                pez.rotation.y =
                    -direccion;
            }
        }
    }


    // =========================================================
    // ÁRBOL: GOLPEAR
    // =========================================================

    golpearArbol(arbol, dano = 1) {

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
            arbol.userData.vida <= 0
        ) {

            const madera =
                arbol.userData.madera || 1;

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

    recargarChunks(lista) {

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

        /*
         * Si el golpe fue contra un árbol,
         * se usa su sistema de vida.
         */

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
