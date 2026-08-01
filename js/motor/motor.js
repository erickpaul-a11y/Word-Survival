class Motor {

    constructor(){

        this.escena = new THREE.Scene();

        this.escena.background =
        new THREE.Color(0x87ceeb);

        this.escena.fog =
        new THREE.FogExp2(
            0x87ceeb,
            0.007
        );


        this.cam =
        new THREE.PerspectiveCamera(
            70,
            innerWidth / innerHeight,
            0.1,
            1000
        );


        this.ren =
        new THREE.WebGLRenderer({
            antialias:true
        });


        this.ren.setSize(
            innerWidth,
            innerHeight
        );


        document.body.appendChild(
            this.ren.domElement
        );


        this.j =
        new Jugador();


        this.mundo =
        new Mundo(this);


        this.criaturas = null;


        this.teclas = {};


        this.ang = {
            x:0,
            y:0
        };


        // Movimiento

        this.grav = -0.022;
        this.velY = 0;
        this.suelo = false;

        this.salto = 0.38;

        this.andar = 0.15;
        this.correr = 0.28;



        // Cámara tercera persona

        this.distCam = 6;



        // Luz

        this.escena.add(
            new THREE.AmbientLight(
                0xffffff,
                0.5
            )
        );


        const luz =
        new THREE.DirectionalLight(
            0xffffff,
            1.2
        );


        luz.position.set(
            20,
            30,
            10
        );


        this.escena.add(luz);


    }




    iniciar(){

        this.j.agregarAEscena(
            this.escena
        );


        if(this.criaturas){

            this.criaturas.generarIniciales();

        }


        this.bucle();

    }




    bucle(){


        requestAnimationFrame(
            ()=>this.bucle()
        );



        // cargar mundo

        this.mundo.actualizar(
            this.j.x,
            this.j.z
        );



        // animales

        if(this.criaturas){

            this.criaturas.actualizar();

        }



        // movimiento

        let dx = 0;
        let dz = 0;


        let velocidad =
        this.teclas.shift ?
        this.correr :
        this.andar;



        if(this.teclas.w)
            dz -= velocidad;


        if(this.teclas.s)
            dz += velocidad;


        if(this.teclas.a)
            dx -= velocidad;


        if(this.teclas.d)
            dx += velocidad;



        if(
            this.teclas.space &&
            this.suelo
        ){

            this.velY =
            this.salto;

            this.suelo=false;

        }



        if(dx || dz){

            let c =
            Math.cos(this.ang.y);

            let s =
            Math.sin(this.ang.y);


            this.j.x +=
            dx*c - dz*s;


            this.j.z +=
            dx*s + dz*c;

        }



        // gravedad

        this.velY += this.grav;

        this.j.y += this.velY;



        let suelo =
        this.mundo.altura(
            this.j.x,
            this.j.z
        ) + 2;



        if(this.j.y < suelo){

            this.j.y = suelo;

            this.velY = 0;

            this.suelo=true;

        }



        // cámara tercera persona

        let camX =
        this.j.x -
        Math.sin(this.ang.y)
        * this.distCam;



        let camZ =
        this.j.z -
        Math.cos(this.ang.y)
        * this.distCam;



        this.cam.position.set(
            camX,
            this.j.y+3,
            camZ
        );



        this.cam.lookAt(
            this.j.x,
            this.j.y+1,
            this.j.z
        );



        this.j.actualizarPosicion();

        this.j.actualizarHUD();



        this.ren.render(
            this.escena,
            this.cam
        );


    }

}
