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


        // Modelo del jugador
        this.modelo = new THREE.Mesh(

            new THREE.BoxGeometry(
                0.5,
                1.2,
                0.5
            ),

            new THREE.MeshLambertMaterial({
                color:0x22c55e
            })

        );


        this.modelo.position.y = 0.6;

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



        let hambre =
        document.getElementById("b-hambre");

        if(hambre)
        hambre.style.width =
        this.hambre + "%";


    }

}
