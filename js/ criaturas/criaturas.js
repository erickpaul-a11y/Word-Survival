class GestorCriaturas {
    constructor(m,d) { this.m=m; this.d=d; this.lista=[]; this.expGanar=15; }
    crear(t,x,z) {
        const c = this.d[t]; if(!c) return null;
        const modelo = new THREE.Group();
        modelo.add(new THREE.Mesh(new THREE.BoxGeometry(1.2,0.7,2), new THREE.MeshLambertMaterial({color:0x78716c})));
        modelo.position.set(x,1,z); this.m.escena.add(modelo);
        this.lista.push({tipo:t,x:x,z:z,y:1,vida:c.vida,vidaMax:c.vida,daño:c.daño,modelo,tiempoAtaque:false});
    }
    generarIniciales() { this.crear("lobo",8,8); this.crear("lobo",-12,5); }
    recibirDaño(cantidad) {
        this.lista.forEach(c=>{
            if(c.vida<=0) return;
            const dist = Math.hypot(this.m.j.x-c.x,this.m.j.z-c.z);
            if(dist<2.5){
                c.vida -= cantidad;
                console.log(`💥 Lobo recibe ${cantidad} de daño. Vida: ${c.vida}`);
                if(c.vida<=0){
                    console.log("☠️ Lobo derrotado! +Experiencia");
                    this.m.j.exp += this.expGanar;
                    this.m.inv.agregar("madera",1);
                    this.m.escena.remove(c.modelo);
                }
            }
        });
    }
    actualizar() {
        this.lista = this.lista.filter(c=>c.vida>0);
        this.lista.forEach(c=>{
            const dx=this.m.j.x-c.x, dz=this.m.j.z-c.z, d=Math.hypot(dx,dz);
            if(d<12 && d>2){ c.x+=dx/d*0.04; c.z+=dz/d*0.04; c.modelo.position.set(c.x,1,c.z); c.modelo.lookAt(this.m.j.x,1,c.z); }
            if(d<2.2 && !c.tiempoAtaque){ this.m.j.hp -= c.daño; console.log("Vida jugador:",this.m.j.hp); c.tiempoAtaque=true; setTimeout(()=>c.tiempoAtaque=false,1200); }
            if(this.m.j.hp<=0){ this.m.j.hp=100; this.m.j.x=this.m.j.z=0; this.m.j.exp=0; }
        });
    }
}
