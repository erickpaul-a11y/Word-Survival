/* ============================================================
   WORD SURVIVAL ∞
   INTERACCIÓN CON EL TERRENO
   - Terreno
   - Árboles
   - Agua
   - Peces
   ============================================================ */

(function () {

    'use strict';


    class Terreno {

        constructor(mundo) {

            this.mundo =
                mundo;

            this.raycaster =
                new THREE.Raycaster();
        }


        // =====================================================
        // OBTENER OBJETOS INTERACTIVOS
        // =====================================================

        obtenerObjetosInteractivos() {

            const objetos = [];


            for (
                const chunk of
                this.mundo.chunks.values()
            ) {

                if (
                    !chunk ||
                    !chunk.grupo
                ) {
                    continue;
                }


                chunk.grupo.traverse(
                    child => {

                        if (
                            !child ||
                            !child.isObject3D
                        ) {
                            return;
                        }


                        /*
                         * El terreno actual es THREE.Mesh,
                         * no InstancedMesh.
                         */

                        if (
                            child.userData &&
                            child.userData.interactivo
                        ) {

                            objetos.push(
                                child
                            );
                        }

                    }
                );
            }


            return objetos;
        }


        // =====================================================
        // BLOQUE MIRADO
        // =====================================================

        obtenerBloqueMirado(
            camara,
            distanciaMax = 8
        ) {

            this.raycaster.setFromCamera(
                {
                    x: 0,
                    y: 0
                },
                camara
            );


            const objetos =
                this.obtenerObjetosInteractivos();


            if (
                objetos.length === 0
            ) {

                return null;
            }


            const impactos =
                this.raycaster.intersectObjects(
                    objetos,
                    true
                );


            for (
                const impacto of
                impactos
            ) {

                if (
                    impacto.distance >
                    distanciaMax
                ) {

                    continue;
                }


                /*
                 * No permitir seleccionar
                 * el agua como si fuera terreno.
                 */

                let objeto =
                    impacto.object;

                while (
                    objeto
                ) {

                    if (
                        objeto.userData &&
                        objeto.userData.tipo ===
                        'agua'
                    ) {

                        break;
                    }

                    objeto =
                        objeto.parent;
                }


                /*
                 * Si encontramos agua,
                 * seguimos buscando otro objeto.
                 */

                let esAgua =
                    false;

                objeto =
                    impacto.object;

                while (
                    objeto
                ) {

                    if (
                        objeto.userData &&
                        objeto.userData.tipo ===
                        'agua'
                    ) {

                        esAgua =
                            true;

                        break;
                    }

                    objeto =
                        objeto.parent;
                }


                if (esAgua) {
                    continue;
                }


                return impacto;
            }


            return null;
        }


        // =====================================================
        // EXCAVAR
        // =====================================================

        excavar(camara) {

            const hit =
                this.obtenerBloqueMirado(
                    camara
                );


            if (!hit) {

                return null;
            }


            return this.mundo.destruirBloque(
                hit,
                1
            );
        }


        // =====================================================
        // COLOCAR TIERRA
        // =====================================================

        colocarTierra(camara) {

            const hit =
                this.obtenerBloqueMirado(
                    camara
                );


            if (!hit) {

                return null;
            }


            return this.mundo.colocarTierraCercana(
                hit,
                1
            );
        }


        // =====================================================
        // AGUA
        // =====================================================

        obtenerProfundidadAgua(
            x,
            z
        ) {

            return this.mundo.getWaterDepthAt(
                x,
                z
            );
        }


        estaEnAgua(
            x,
            z
        ) {

            return this.mundo.esAgua(
                x,
                z
            );
        }


        // =====================================================
        // OBJETO MIRADO
        // =====================================================

        obtenerObjetoMirado(
            camara,
            distanciaMax = 8
        ) {

            this.raycaster.setFromCamera(
                {
                    x: 0,
                    y: 0
                },
                camara
            );


            const objetos =
                this.obtenerObjetosInteractivos();


            const impactos =
                this.raycaster.intersectObjects(
                    objetos,
                    true
                );


            for (
                const impacto of
                impactos
            ) {

                if (
                    impacto.distance <=
                    distanciaMax
                ) {

                    return impacto;
                }
            }


            return null;
        }
    }


    // =========================================================
    // EXPORTAR
    // =========================================================

    window.Terreno =
        Terreno;

})();
