console.log("JUGADOR.JS CARGADO");

class Jugador {

constructor(){

    this.x=0;
    this.z=0;
    this.y=2;

    this.hp=100;

    this.modelo = new THREE.Mesh(
        new THREE.BoxGeometry(0.5,1.2,0.5),
        new THREE.MeshLambertMaterial({
            color:0x22c55e
        })
    );

}


agregarAEscena(escena){

    escena.add(this.modelo);

}


actualizarPosicion(){

    this.modelo.position.set(
        this.x,
        this.y,
        this.z
    );

}


actualizarHUD(){}

}
