class GestorCriaturas {

    constructor(motor, datos) {
        this.motor = motor;
        this.datos = datos;
        this.lista = [];
    }


    crear(tipo,x,z){

        const config=this.datos[tipo];

        if(!config) return null;


        let color=0x78716c;

        if(tipo==="ciervo")
            color=0x92400e;

        if(tipo==="lobo")
            color=0x525252;


        const modelo=new THREE.Mesh(
            new THREE.BoxGeometry(1,1,1.8),
            new THREE.MeshLambertMaterial({
                color:color
            })
        );


        modelo.position.set(x,1,z);


        this.motor.escena.add(modelo);



        let criatura={

            tipo:tipo,

            x:x,
            z:z,
            y:1,

            vida:config.vida || 100,

            daño:config.daño || 5,

            velocidad:
                tipo==="lobo" ? 0.07 : 0.04,


            estado:"normal",

            modelo:modelo,

            ultimoAtaque:0
        };


        this.lista.push(criatura);

        return criatura;
    }





    generarIniciales(){

        this.crear("lobo",8,8);
        this.crear("lobo",-10,5);

        this.crear("ciervo",15,10);
        this.crear("ciervo",-15,-8);

    }





    actualizar(){

        let jugador=this.motor.jugador;


        this.lista.forEach(c=>{


            let dx=jugador.x-c.x;
            let dz=jugador.z-c.z;

            let distancia=Math.hypot(dx,dz);



            // IA LOBO

            if(c.tipo==="lobo"){


                if(distancia<12){

                    c.estado="atacando";


                    c.x+=dx/distancia*c.velocidad;
                    c.z+=dz/distancia*c.velocidad;


                    c.modelo.lookAt(
                        jugador.x,
                        c.y,
                        jugador.z
                    );


                    if(distancia<2){

                        this.atacar(c);

                    }

                }

            }



            // IA CIERVO


            if(c.tipo==="ciervo"){


                if(distancia<8){

                    c.estado="huyendo";


                    c.x-=dx/distancia*c.velocidad;
                    c.z-=dz/distancia*c.velocidad;


                }else{

                    c.estado="caminando";


                    c.x+=
                    Math.sin(Date.now()*0.001)
                    *0.01;


                }

            }



            c.modelo.position.set(
                c.x,
                c.y,
                c.z
            );


        });

    }





    atacar(c){

        let tiempo=Date.now();


        if(tiempo-c.ultimoAtaque<1000)
            return;


        c.ultimoAtaque=tiempo;


        this.motor.jugador.hp-=c.daño;


        console.log(
            "🐺 Ataque recibido:",
            c.daño
        );


        if(this.motor.jugador.hp<=0){

            this.motor.jugador.hp=0;

            console.log(
                "💀 Has muerto"
            );

        }

    }





    recibirDaño(criatura,daño){

        criatura.vida-=daño;


        console.log(
            criatura.tipo,
            "vida:",
            criatura.vida
        );


        if(criatura.vida<=0){

            this.motor.escena.remove(
                criatura.modelo
            );


            let i=this.lista.indexOf(criatura);

            if(i>=0)
                this.lista.splice(i,1);



            console.log(
                "Derrotaste:",
                criatura.tipo
            );

        }

    }

}
