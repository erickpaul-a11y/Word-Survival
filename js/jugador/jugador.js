class Jugador {

    constructor(){

        this.x = 0;
        this.z = 0;
        this.y = 2;

        this.hp = 100;
        this.maxHp = 100;

        this.mana = 100;
        this.hambre = 100;

        this.nivel = 1;
        this.exp = 0;
        this.expSig = 120;
        this.vivo = true;


        // Modelo del jugador: ahora es un Group con cuerpo y brazos
        this.modelo = new THREE.Group();

        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 1.2, 0.5),
            new THREE.MeshLambertMaterial({ color: 0x22c55e })
        );
        body.name = 'torso';
        body.position.y = 0.6; // centrar el cuerpo
        this.modelo.add(body);

        // Brazos
        const armGeo = new THREE.BoxGeometry(0.18, 0.9, 0.18);
        const armMat = new THREE.MeshLambertMaterial({ color: 0xffcc99 });

        const leftArm = new THREE.Mesh(armGeo, armMat);
        leftArm.name = 'leftArm';
        leftArm.position.set(-0.45, 1.0, 0);
        leftArm.rotation.z = 0.08;
        this.modelo.add(leftArm);

        const rightArm = new THREE.Mesh(armGeo, armMat);
        rightArm.name = 'rightArm';
        rightArm.position.set(0.45, 1.0, 0);
        rightArm.rotation.z = -0.08;
        this.modelo.add(rightArm);

        // Guardar referencias por si queremos animar brazos luego
        this.leftArm = leftArm;
        this.rightArm = rightArm;

        // Helper para habilitar/deshabilitar visibilidad del cuerpo (first person)
        this.setFirstPerson = function(fp){
            // ocultar torso y piernas, mantener brazos opcionalmente visibles
            this.leftArm.visible = !!fp; // show arms in FP
            this.rightArm.visible = !!fp;
            // hide other meshes except arms
            this.modelo.children.forEach(ch => {
                if(ch.name === 'leftArm' || ch.name === 'rightArm') return;
                ch.visible = !fp;
            });
        }.bind(this);

        // Posición inicial del modelo (el motor usa this.x, this.y, this.z)
        this.modelo.position.y = 0;

    }



    agregarAEscena(escena){

        escena.add(this.modelo);

    }



    actualizarPosicion(){

        this.modelo.position.set(

            this.x,

            this.y - 0.6,

            this.z

        );

    }



    recibirDaño(cantidad){

        this.hp -= cantidad;

        if(this.hp < 0){

            this.hp = 0;

        }

    }



    curar(cantidad){

        this.hp += cantidad;

        if(this.hp > this.maxHp){

            this.hp = this.maxHp;

        }

    }



    ganarExperiencia(cantidad){

        this.exp += cantidad;


        if(this.exp >= this.expSig){

            this.nivel++;

            this.exp = 0;

            this.expSig *= 1.2;

            console.log(
                "Nivel nuevo:",
                this.nivel
            );

        }

    }



    actualizarHUD(){

        let lvl =
        document.getElementById("lvl");

        if(lvl)
        lvl.textContent = this.nivel;



        let pos =
        document.getElementById("pos");

        if(pos)
        pos.textContent =
        `X:${Math.round(this.x)} Z:${Math.round(this.z)}`;



        let hp =
        document.getElementById("b-hp");

        if(hp)
        hp.style.width =
        this.hp + "%";



        let mana =
        document.getElementById("b-mana");

        if(mana)
        mana.style.width =
        this.mana + "%";


        // CORREGIDO: Agregar actualización de barra de experiencia
        let exp =
        document.getElementById("b-exp");

        if(exp)
        exp.style.width =
        (this.exp / this.expSig * 100) + "%";



        let hambre =
        document.getElementById("b-hambre");

        if(hambre)
        hambre.style.width =
        this.hambre + "%";


    }

}
