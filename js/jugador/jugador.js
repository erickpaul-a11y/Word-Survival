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
        this.y-0.6,
        this.z
    );

}



actualizarHUD(){

    const lvl=document.getElementById("lvl");

    if(lvl)
    lvl.textContent=this.nivel;


    const pos=document.getElementById("pos");

    if(pos)
    pos.textContent=
    `X:${Math.round(this.x)} Z:${Math.round(this.z)}`;


}


}
