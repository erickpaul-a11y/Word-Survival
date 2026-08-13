class GestorCriaturas {
    constructor(motor, datos) { this.m=motor; this.d=datos||{}; this.lista=[]; }
    mat(c){ return new THREE.MeshLambertMaterial({color:c}); }
    tex(n,c){ const t=new THREE.TextureLoader().load(`textura/${n}.svg`); t.magFilter=THREE.NearestFilter; t.minFilter=THREE.NearestFilter; return new THREE.MeshLambertMaterial({map:t,color:c}); }
    pieza(g,m,x,y,z,p){ const q=new THREE.Mesh(g,m); q.position.set(x,y,z); p.add(q); return q; }

    modeloAnimal(tipo){
        const p=new THREE.Group(), negro=this.mat(0x111111), blanco=this.mat(0xffffff), gris=this.mat(0x777777), amarillo=this.mat(0xf2c94c), rojo=this.mat(0xd62828), azul=this.mat(0x3b82f6);
        if(tipo==='vaca'){
            const vaca=this.tex('vaca',0xffffff);
            this.pieza(new THREE.BoxGeometry(1.8,.9,1.05),vaca,0,1.05,0,p); this.pieza(new THREE.BoxGeometry(.65,.65,.7),vaca,1.05,1.25,0,p);
            const pata=new THREE.BoxGeometry(.22,.75,.22); [[-.65,-.35],[.65,-.35],[-.65,.35],[.65,.35]].forEach(a=>this.pieza(pata,blanco,a[0],.38,a[1],p));
            this.pieza(new THREE.BoxGeometry(.22,.18,.12),negro,1.38,1.38,-.22,p); this.pieza(new THREE.BoxGeometry(.22,.18,.12),negro,1.38,1.38,.22,p);
            const cuerno=new THREE.ConeGeometry(.13,.38,4); this.pieza(cuerno,gris,.98,1.75,-.22,p).rotation.z=-.45; this.pieza(cuerno,gris,.98,1.75,.22,p).rotation.z=-.45;
        } else if(tipo==='oveja'){
            const lana=this.mat(0xf5f5f5); this.pieza(new THREE.BoxGeometry(1.7,1,1),lana,0,1,0,p);
            [[-.55,0],[0,0],[.55,0],[-.3,.35],[.3,.35],[-.3,-.35],[.3,-.35]].forEach(a=>this.pieza(new THREE.BoxGeometry(.55,.55,.55),lana,a[0],1.2,a[1],p));
            this.pieza(new THREE.BoxGeometry(.55,.65,.6),gris,1,1.2,0,p); const pata=new THREE.BoxGeometry(.2,.7,.2); [[-.6,-.3],[.6,-.3],[-.6,.3],[.6,.3]].forEach(a=>this.pieza(pata,gris,a[0],.35,a[1],p));
            this.pieza(new THREE.BoxGeometry(.12,.12,.08),negro,1.28,1.3,-.18,p); this.pieza(new THREE.BoxGeometry(.12,.12,.08),negro,1.28,1.3,.18,p);
        } else if(tipo==='pollo'){
            this.pieza(new THREE.BoxGeometry(.8,.75,.7),this.tex('pollo',0xfff8e8),0,.8,0,p); this.pieza(new THREE.BoxGeometry(.5,.5,.5),blanco,.48,1.05,0,p);
            const pata=new THREE.BoxGeometry(.12,.45,.12); this.pieza(pata,amarillo,-.2,.3,0,p); this.pieza(pata,amarillo,.2,.3,0,p); this.pieza(new THREE.ConeGeometry(.12,.28,4),amarillo,.78,1.05,0,p).rotation.z=Math.PI/2;
            this.pieza(new THREE.BoxGeometry(.16,.18,.12),rojo,.38,1.38,0,p); this.pieza(new THREE.BoxGeometry(.08,.08,.08),negro,.66,1.18,-.18,p); this.pieza(new THREE.BoxGeometry(.08,.08,.08),negro,.66,1.18,.18,p);
        } else if(tipo==='pez'){
            this.pieza(new THREE.SphereGeometry(.38,10,8),azul,0,0,0,p);
            this.pieza(new THREE.ConeGeometry(.22,.5,4),azul,-.48,0,0,p).rotation.z=-Math.PI/2;
            this.pieza(new THREE.ConeGeometry(.13,.28,4),azul,.05,.28,0,p);
            this.pieza(new THREE.SphereGeometry(.045,6,6),blanco,.22,.12,-.13,p); this.pieza(new THREE.SphereGeometry(.045,6,6),blanco,.22,.12,.13,p);
        }
        return p;
    }

    crear(tipo,x,z,opciones={}){
        const d=this.d[tipo]; if(!d)return null;
        const esPez=tipo==='pez';
        if(this.m&&this.m.mundo){
            const agua=this.m.mundo.esAgua(x,z);
            if(esPez&&!agua)return null;
            if(!esPez&&agua)return null;
        }
        const y=esPez?(this.m.mundo.getWaterHeightAt(x,z)-.45):(this.m&&typeof this.m.getGroundHeightAt==='function'?this.m.getGroundHeightAt(x,z):0);
        const modelo=this.modeloAnimal(tipo); modelo.position.set(x,y,z); this.m.escena.add(modelo);
        const c={tipo,x,y,z,vida:d.vida,vidaMax:d.vida,daño:0,modelo,direccion:Math.random()*Math.PI*2,velocidad:d.velocidad||.015,caminando:true,tiempoMovimiento:80+Math.random()*180,acuatico:esPez};
        this.lista.push(c); return c;
    }

    buscarAgua(){
        if(!this.m||!this.m.mundo)return null;
        for(let i=0;i<80;i++){
            const a=Math.random()*Math.PI*2,dist=10+Math.random()*55,x=this.m.j.x+Math.cos(a)*dist,z=this.m.j.z+Math.sin(a)*dist;
            if(this.m.mundo.esAgua(x,z))return [x,z];
        }
        return null;
    }

    generarIniciales(){
        [['vaca',8,8],['vaca',-12,5],['vaca',15,-10],['oveja',-18,-8],['oveja',20,12],['oveja',-20,15],['pollo',12,-18],['pollo',-8,-14],['pollo',18,4]].forEach(p=>this.crear(p[0],p[1],p[2]));
        let peces=0; for(let i=0;i<24&&peces<8;i++){const p=this.buscarAgua();if(p&&this.crear('pez',p[0],p[1]))peces++;}
    }

    recibirDaño(cantidad){ let o=null,m=Infinity; for(const c of this.lista){const d=Math.hypot(this.m.j.x-c.x,this.m.j.z-c.z);if(c.vida>0&&d<2.5&&d<m){o=c;m=d;}} if(!o)return; o.vida-=cantidad; if(o.vida<=0&&o.modelo.parent)o.modelo.parent.remove(o.modelo); this.lista=this.lista.filter(c=>c.vida>0); }
    cambiarDireccion(c){c.direccion=Math.random()*Math.PI*2;}
    actualizar(){
        for(const c of this.lista){
            if(--c.tiempoMovimiento<=0){c.caminando=!c.caminando;c.tiempoMovimiento=60+Math.random()*180;if(c.caminando)this.cambiarDireccion(c);}
            if(!c.caminando)continue;
            const nx=c.x+Math.sin(c.direccion)*c.velocidad,nz=c.z+Math.cos(c.direccion)*c.velocidad;
            if(this.m&&this.m.mundo){
                const agua=this.m.mundo.esAgua(nx,nz);
                if(c.acuatico){if(!agua){this.cambiarDireccion(c);continue;}c.x=nx;c.z=nz;c.y=this.m.mundo.getWaterHeightAt(c.x,c.z)-.45+Math.sin(performance.now()*.004+c.x)*.08;}
                else {if(agua){this.cambiarDireccion(c);continue;}c.x=nx;c.z=nz;c.y=this.m.getGroundHeightAt(c.x,c.z);}
            } else {c.x=nx;c.z=nz;c.y=this.m.getGroundHeightAt(c.x,c.z);}
            c.modelo.position.set(c.x,c.y,c.z);c.modelo.rotation.y=c.direccion;
        }
    }
}
window.GestorCriaturas=GestorCriaturas;
