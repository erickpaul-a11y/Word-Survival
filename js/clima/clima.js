class Tiempo {
    constructor() { this.hora = 8; this.dur = 300; }
    avanzar(s) { this.hora += s/this.dur*24; if(this.hora>=24)this.hora-=24; }
    esNoche() { return this.hora<6 || this.hora>19; }
}
class Clima { constructor() { this.tipo="soleado"; } actualizar(m){} }
