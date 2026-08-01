class Mundo {
    constructor(m) {
        this.m = m;
        this.chunks = new Map();
        this.tam = 16;

        this.distanciaCarga = 2; // chunks alrededor del jugador
        this.recursos = [];
        this.animales = [];
    }


    altura(x,z) {
        return ruido(x*0.08,z*0.08)*6 +
               ruido(x*0.25,z*0.25)*1.2;
    }


    tipoBloque(x,z,h) {
        if(h < 0.5) return "agua";
        if(h < 2) return "arena";
        if(h < 4) return "cesped";
        if(h < 6) return "tierra";
        return "piedra";
    }


    generarRecurso(x,z,h,tipo,chunk) {

        let recurso = new THREE.Group();

        if(tipo==="arbol"){

            let tronco = new THREE.Mesh(
                new THREE.CylinderGeometry(.25,.35,2.5),
                new THREE.MeshLambertMaterial({color:0x92400e})
            );

            let hojas = new THREE.Mesh(
                new THREE.SphereGeometry(1.2),
                new THREE.MeshLambertMaterial({color:0x15803d})
            );

            tronco.position.y=1.25;
            hojas.position.y=3;

            recurso.add(tronco);
            recurso.add(hojas);

            recurso.dato={
                tipo:"arbol",
                item:"madera",
                cantidad:3
            };
        }


        if(tipo==="roca"){

            let piedra=new THREE.Mesh(
                new THREE.DodecahedronGeometry(.7),
                new THREE.MeshLambertMaterial({color:0x6b7280})
            );

            recurso.add(piedra);

            recurso.dato={
                tipo:"roca",
                item:"piedra",
                cantidad:2
            };
        }


        recurso.position.set(x,h+1,z);

        this.m.escena.add(recurso);

        this.recursos.push(recurso);

        chunk.recursos.push(recurso);
    }



    generarAnimal(x,z,tipo,chunk){

        let color=0xffffff;

        if(tipo==="lobo")
            color=0x78716c;

        let animal=new THREE.Mesh(
            new THREE.BoxGeometry(1,1,1.8),
            new THREE.MeshLambertMaterial({color})
        );


        animal.position.set(x,1,z);


        animal.dato={
            tipo,
            vida:100
        };


        this.m.escena.add(animal);

        this.animales.push(animal);

        chunk.animales.push(animal);
    }



    generar(cx,cz){

        let clave=`${cx},${cz}`;

        if(this.chunks.has(clave))
            return;


        let grupo=new THREE.Group();

        grupo.recursos=[];
        grupo.animales=[];


        let b=new THREE.BoxGeometry();


        for(let x=0;x<this.tam;x++){

            for(let z=0;z<this.tam;z++){

                let wx=cx*this.tam+x;
                let wz=cz*this.tam+z;

                let h=Math.floor(this.altura(wx,wz));

                let tipo=this.tipoBloque(wx,wz,h);


                let colores={
                    agua:0x1d4ed8,
                    arena:0xfcd34d,
                    cesped:0x22c55e,
                    tierra:0x92400e,
                    piedra:0x6b7280
                };


                let bloque=new THREE.Mesh(
                    b,
                    new THREE.MeshLambertMaterial({
                        color:colores[tipo]
                    })
                );


                bloque.position.set(wx,h/2,wz);
                bloque.scale.y=Math.max(.3,h);

                grupo.add(bloque);



                // árboles
                if(tipo==="cesped" && Math.random()<0.04)
                    this.generarRecurso(wx,wz,h,"arbol",grupo);


                // rocas
                if(tipo==="piedra" && Math.random()<0.05)
                    this.generarRecurso(wx,wz,h,"roca",grupo);



                // animales
                if(tipo==="cesped" && Math.random()<0.01)
                    this.generarAnimal(wx,wz,"lobo",grupo);

                if(tipo==="cesped" && Math.random()<0.01)
                    this.generarAnimal(wx,wz,"ciervo",grupo);

            }
        }


        this.chunks.set(clave,grupo);

        this.m.escena.add(grupo);
    }





    eliminarLejanos(cx,cz){

        for(let [clave,chunk] of this.chunks){

            let partes=clave.split(",");
            let x=parseInt(partes[0]);
            let z=parseInt(partes[1]);


            let distancia=Math.max(
                Math.abs(cx-x),
                Math.abs(cz-z)
            );


            if(distancia>this.distanciaCarga){


                chunk.recursos.forEach(r=>{
                    this.m.escena.remove(r);
                    let i=this.recursos.indexOf(r);
                    if(i>=0)this.recursos.splice(i,1);
                });


                chunk.animales.forEach(a=>{
                    this.m.escena.remove(a);
                    let i=this.animales.indexOf(a);
                    if(i>=0)this.animales.splice(i,1);
                });


                this.m.escena.remove(chunk);

                this.chunks.delete(clave);

                console.log("Chunk eliminado:",clave);
            }
        }
    }





    recogerCerca(x,z){

        for(let i=this.recursos.length-1;i>=0;i--){

            let r=this.recursos[i];

            if(Math.hypot(
                r.position.x-x,
                r.position.z-z
            )<2){


                this.m.inv.agregar(
                    r.dato.item,
                    r.dato.cantidad
                );


                this.m.escena.remove(r);

                this.recursos.splice(i,1);


                return true;
            }
        }

        return false;
    }




    actualizar(jx,jz){

        let cx=Math.floor(jx/this.tam);
        let cz=Math.floor(jz/this.tam);


        for(let dx=-this.distanciaCarga;dx<=this.distanciaCarga;dx++){
            for(let dz=-this.distanciaCarga;dz<=this.distanciaCarga;dz++){

                this.generar(
                    cx+dx,
                    cz+dz
                );
            }
        }


        this.eliminarLejanos(cx,cz);
    }
}
