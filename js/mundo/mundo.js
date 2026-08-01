class Mundo {
    constructor(m) { this.m = m; this.chunks = new Map(); this.tam = 16; }
    altura(x,z) { return ruido(x*0.08,z*0.08)*6 + ruido(x*0.25,z*0.25)*1.2; }
    tipoBloque(x,z,h) {
        if(h<0.5) return 0x1d4ed8; if(h<2) return 0xfcd34d; if(h<4) return 0x22c55e; if(h<6) return 0x92400e; return 0x6b7280;
    }
    generar(cx,cz) {
        const k = `${cx},${cz}`; if(this.chunks.has(k)) return;
        const g = new THREE.Group(); const b = new THREE.BoxGeometry();
        for(let x=0;x<this.tam;x++){
            for(let z=0;z<this.tam;z++){
                const wx=cx*this.tam+x, wz=cz*this.tam+z, h=Math.floor(this.altura(wx,wz));
                const m = new THREE.Mesh(b, new THREE.MeshLambertMaterial({color:this.tipoBloque(wx,wz,h)}));
                m.position.set(wx,h/2,wz); m.scale.y = Math.max(0.3,h); g.add(m);
            }
        }
        this.chunks.set(k,g); this.m.escena.add(g);
    }
    actualizar(jx,jz) {
        const cx=Math.floor(jx/this.tam), cz=Math.floor(jz/this.tam);
        for(let dx=-1;dx<=1;dx++) for(let dz=-1;dz<=1;dz++) this.generar(cx+dx,cz+dz);
    }
}
