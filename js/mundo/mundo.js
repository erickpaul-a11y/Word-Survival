class Mundo {
    constructor(m) {
        this.m = m;
        this.chunks = new Map();
        this.tam = 16;
        this.recursos = []; // Almacena árboles, rocas, minerales
    }

    altura(x,z) { return ruido(x*0.08,z*0.08)*6 + ruido(x*0.25,z*0.25)*1.2; }

    tipoBloque(x,z,h) {
        if(h<0.5) return 0x1d4ed8; if(h<2) return 0xfcd34d; if(h<4) return 0x22c55e; if(h<6) return 0x92400e; return 0x6b7280;
    }

    generarRecurso(x,z,h,tipo) {
        const recurso = new THREE.Group();
        if(tipo === "arbol") {
            const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.3,2.5), new THREE.MeshLambertMaterial({color:0x92400e}));
            const copa = new THREE.Mesh(new THREE.SphereGeometry(1.2), new THREE.MeshLambertMaterial({color:0x15803d}));
            tronco.position.y = 1.25;
            copa.position.y = 3;
            recurso.add(tronco,copa);
            recurso.dato = {tipo:"arbol",item:"madera",cantidad:3};
        }
        if(tipo === "roca") {
            const piedra = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7), new THREE.MeshLambertMaterial({color:0x6b7280}));
            recurso.add(piedra);
            recurso.dato = {tipo:"roca",item:"piedra",cantidad:2};
        }
        recurso.position.set(x,h+1,z);
        this.m.escena.add(recurso);
        this.recursos.push(recurso);
    }

    generar(cx,cz) {
        const k = `${cx},${cz}`; if(this.chunks.has(k)) return;
        const g = new THREE.Group(); const b = new THREE.BoxGeometry();
        for(let x=0;x<this.tam;x++){
            for(let z=0;z<this.tam;z++){
                const wx=cx*this.tam+x, wz=cz*this.tam+z, h=Math.floor(this.altura(wx,wz));
                const m = new THREE.Mesh(b, new THREE.MeshLambertMaterial({color:this.tipoBloque(wx,wz,h)}));
                m.position.set(wx,h/2,wz); m.scale.y = Math.max(0.3,h); g.add(m);
                // Generar recursos aleatorios
                if(Math.random()<0.03 && this.tipoBloque(wx,wz,h) === 0x22c55e) this.generarRecurso(wx,wz,h,"arbol");
                if(Math.random()<0.02 && this.tipoBloque(wx,wz,h) >= 0x92400e) this.generarRecurso(wx,wz,h,"roca");
            }
        }
        this.chunks.set(k,g); this.m.escena.add(g);
    }

    recogerCerca(x,z) {
        const radio = 2;
        for(let i=this.recursos.length-1;i>=0;i--){
            const r = this.recursos[i];
            if(Math.hypot(r.position.x-x,r.position.z-z) < radio){
                this.m.inv.agregar(r.dato.item,r.dato.cantidad);
                this.m.escena.remove(r);
                this.recursos.splice(i,1);
                console.log(`✅ Recogido: ${r.dato.item} x${r.dato.cantidad}`);
                return true;
            }
        }
        return false;
    }

    actualizar(jx,jz) {
        const cx=Math.floor(jx/this.tam), cz=Math.floor(jz/this.tam);
        for(let dx=-1;dx<=1;dx++) for(let dz=-1;dz<=1;dz++) this.generar(cx+dx,cz+dz);
    }
}
