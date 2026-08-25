class Jugador {
    constructor() {
        // Escala del personaje: 1 unidad de alto.
        // La posición x/y/z representa los pies del jugador.
        this.x = 0; this.z = 0; this.y = 2;
        this.altura = 1.0;
        this.ancho = 0.45;
        this.hp = 100; this.maxHp = 100; this.mana = 100; this.hambre = 100;
        this.nivel = 1; this.exp = 0; this.expSig = 120; this.vivo = true;

        this.modelo = new THREE.Mesh(
            new THREE.BoxGeometry(this.ancho, this.altura, this.ancho),
            new THREE.MeshLambertMaterial({color:0x22c55e})
        );

        // El modelo nace desde los pies, no desde el centro.
        this.modelo.position.y = this.y - this.altura / 2;
    }

    agregarAEscena(e) { e.add(this.modelo); }

    actualizarPosicion() {
        // x/y/z = posición de los pies.
        this.modelo.position.set(this.x, this.y - this.altura / 2, this.z);
    }

    actualizarHUD() {
        document.getElementById("lvl").textContent = this.nivel;
        document.getElementById("pos").textContent = `X:${Math.round(this.x)} Z:${Math.round(this.z)}`;
        document.getElementById("b-hp").style.width = `${this.hp}%`;
        document.getElementById("b-mana").style.width = `${this.mana}%`;
        document.getElementById("b-exp").style.width = `${this.exp/this.expSig*100}%`;
        document.getElementById("b-hambre").style.width = `${this.hambre}%`;
    }
}
