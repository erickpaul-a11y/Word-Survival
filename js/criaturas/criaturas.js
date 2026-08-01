class GestorCriaturas {
    constructor(m,d) {
        this.m = m; // referencia al motor
        this.d = d; // datos de criaturas
        this.lista = [];
        this.expGanar = 15; // experiencia por criatura
    }

    crear(t,x,z) {
        const c = this.d[t];
        if(!c) return null;
        const modelo = new THREE.Group();
        modelo.add(new THREE.Mesh(new THREE.BoxGeometry(1.2,0.7,2), new THREE.MeshLambertMaterial({color:0x78716c})));
        modelo.position.set(x,1,z);
        this.m.escena.add(modelo);
        this.lista.push({
            tipo: t,
            x: x,
            z: z,
            y: 1,
            vida: c.vida,
            vidaMax: c.vida,
            daño: c.daño,
            modelo: modelo,
            tiempoAtaque: false
        });
    }

    generarIniciales() {
        // Crear algunos lobos iniciales
        this.crear("lobo", 8, 8);
        this.crear("lobo", -12, 5);
    }

    recibirDaño(cantidad) {
        // Aplica daño a las criaturas cercanas al jugador (por ejemplo al hacer click)
        this.lista.forEach((cri) => {
            if(cri.vida <= 0) return;
            const dist = Math.hypot(this.m.j.x - cri.x, this.m.j.z - cri.z);
            if(dist < 2.5) {
                cri.vida -= cantidad;
                console.log(`💥 ${cri.tipo} recibe ${cantidad} de daño. Vida: ${cri.vida}`);
                if(cri.vida <= 0) {
                    console.log(`☠️ ${cri.tipo} derrotado! +${this.expGanar} XP`);
                    if(this.m.j) this.m.j.exp += this.expGanar;
                    // Dar loot si hay inventario
                    if(this.m.inv && typeof this.m.inv.agregar === 'function') {
                        // Por ahora, lobos dan "madera" en el código original; dejar como estaba
                        this.m.inv.agregar("madera", 1);
                    }
                    // Remover modelo de la escena
                    if(cri.modelo && cri.modelo.parent) cri.modelo.parent.remove(cri.modelo);
                }
            }
        });
        // Filtrar lista para eliminar los muertos
        this.lista = this.lista.filter(c => c.vida > 0);
    }

    actualizar() {
        // Actualizar comportamiento de cada criatura
        this.lista.forEach(c => {
            const dx = this.m.j.x - c.x;
            const dz = this.m.j.z - c.z;
            const d = Math.hypot(dx, dz);

            // Moverse hacia el jugador si está dentro de rango
            if(d < 12 && d > 2) {
                const nx = dx / d;
                const nz = dz / d;
                c.x += nx * 0.04;
                c.z += nz * 0.04;
                if(c.modelo) c.modelo.position.set(c.x, c.y, c.z);
                if(c.modelo) c.modelo.lookAt(new THREE.Vector3(this.m.j.x, 1, this.m.j.z));
            }

            // Ataque al jugador
            if(d < 2.2 && !c.tiempoAtaque) {
                if(this.m.j) {
                    this.m.j.hp -= c.daño;
                    console.log("Vida jugador:", this.m.j.hp);
                    if(this.m.j.hp <= 0) {
                        // Reiniciar jugador si muere
                        this.m.j.hp = this.m.j.maxHp || 100;
                        this.m.j.x = 0;
                        this.m.j.z = 0;
                        this.m.j.exp = 0;
                    }
                }
                c.tiempoAtaque = true;
                setTimeout(() => c.tiempoAtaque = false, 1200);
            }
        });

        // Limpiar criaturas muertas por seguridad
        this.lista = this.lista.filter(c => c.vida > 0);
    }
}
