function normalizarPalabra(p) {
    return p.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
}

class GestorLenguaje {
    constructor() {
        this.letrasConocidas = [];
        this.configuracionLetras = {};
    }
    async cargarDatos() {}
    puedeEscribir(palabra) {
        const limpia = normalizarPalabra(palabra).toUpperCase();
        for (const l of limpia) if (!this.letrasConocidas.includes(l)) return false;
        return true;
    }
    desbloquearLetra(l) { if(!this.letrasConocidas.includes(l.toUpperCase())) this.letrasConocidas.push(l.toUpperCase()); }
    cargarPartida() {}
    guardarPartida() {}
    reiniciar() {}
}
