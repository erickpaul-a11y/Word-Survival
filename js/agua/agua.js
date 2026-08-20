class AguaUnificada {
    constructor(motor){
        this.motor=motor;
        this.aguas=[];
        this.signature='';
        this.time=0;
        this.lastBuild=0;
        this.instalarFisica();
    }

    esLagoChunk(cx,cz){
        const m=this.motor.mundo;
        if(!m||!m.chunks)return false;
        const tieneAgua=(x,z)=>{
            const c=m.chunks.get(`${x},${z}`);
            return !!(c&&c.pixeles&&c.pixeles.some(p=>p.tipo==='agua'));
        };
        if(!tieneAgua(cx,cz))return false;
        const visit=new Set([`${cx},${cz}`]),cola=[[cx,cz]];
        while(cola.length&&visit.size<=4){
            const [x,z]=cola.shift();
            for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
                const k=`${x+dx},${z+dz}`;
                if(!visit.has(k)&&tieneAgua(x+dx,z+dz)){
                    visit.add(k);
                    cola.push([x+dx,z+dz]);
                }
            }
        }
        return visit.size<=4;
    }

    ocultarAguasAntiguas(){
        const mundo=this.motor.mundo;
        if(!mundo)return;
        for(const chunk of mundo.chunks.values()){
            if(chunk.agua){
                chunk.agua.visible=false;
                chunk.agua.userData.agua=true;
                chunk.agua.userData.colision=false;
            }
        }
    }

    instalarFisica(){
        const m=this.motor;
        if(m._fisicaAguaInstalada)return;
        m._fisicaAguaInstalada=true;

        const original=m._updateMovement.bind(m);
        m._updateMovement=(dt)=>{
            original(dt);
            if(!m.j)return;

            const agua=m.mundo&&m.mundo.getWaterHeightAt
                ?m.mundo.getWaterHeightAt(m.j.x,m.j.z)
                :null;

            // El agua NO tiene colisión: el jugador puede atravesar la superficie.
            if(agua!==null&&agua!==undefined){
                const subir=!!m.teclas[' '];
                const bajar=!!m.teclas.control;
                if(bajar)m.j.y-=2.8*dt;
                else if(subir)m.j.y+=3.2*dt;
                m.enAgua=true;
                m.enSuelo=false;
                m.j.saltando=false;
                m.velocidadY=0;
            }else{
                m.enAgua=false;
            }
            m.j.actualizarPosicion();
        };
    }

    limpiar(){
        for(const a of this.aguas){
            if(a.mesh.parent)this.motor.escena.remove(a.mesh);
            if(a.geometry)a.geometry.dispose();
            if(a.material)a.material.dispose();
        }
        this.aguas=[];
    }

    reconstruir(){
        const mundo=this.motor.mundo;
        if(!mundo)return;

        const chunks=[];
        for(const chunk of mundo.chunks.values()){
            if(chunk.agua&&chunk.agua.geometry)chunks.push(chunk);
        }
        const firma=chunks.map(c=>`${c.cx},${c.cz}`).join('|');
        if(firma===this.signature)return;
        this.signature=firma;
        this.limpiar();

        // Cada superficie de agua se mantiene como una pieza independiente.
        // No se fusionan en una malla única: cada pieza puede animarse por separado.
        for(const chunk of chunks){
            const g0=chunk.agua.geometry;
            const p=g0.getAttribute('position');
            if(!p)continue;

            const posiciones=[];
            for(let i=0;i<p.count;i++){
                posiciones.push(p.getX(i),mundo.nivelAgua,p.getZ(i));
            }

            const geometry=new THREE.BufferGeometry();
            geometry.setAttribute('position',new THREE.Float32BufferAttribute(posiciones,3));
            if(g0.index)geometry.setIndex(g0.index.clone());
            geometry.computeVertexNormals();

            // Transparente y sin profundidad de escritura para poder ver peces y fondo.
            const material=new THREE.MeshBasicMaterial({
                color:0x55bfff,
                transparent:true,
                opacity:0.34,
                depthWrite:false,
                side:THREE.DoubleSide
            });

            const mesh=new THREE.Mesh(geometry,material);
            mesh.name=`Agua_${chunk.cx}_${chunk.cz}`;
            mesh.userData.agua=true;
            mesh.userData.colision=false;
            mesh.userData.independiente=true;
            mesh.userData.esLago=this.esLagoChunk(chunk.cx,chunk.cz);
            mesh.frustumCulled=false;
            this.motor.escena.add(mesh);

            this.aguas.push({mesh,geometry,material,base:posiciones.slice(),lago:mesh.userData.esLago,fase:Math.random()*Math.PI*2});
        }

        this.ocultarAguasAntiguas();
    }

    actualizar(dt){
        if(!this.motor.mundo)return;
        this.time+=dt;
        this.ocultarAguasAntiguas();

        if(performance.now()-this.lastBuild>400){
            this.lastBuild=performance.now();
            this.reconstruir();
        }

        // Cada pieza se mueve de forma independiente.
        for(const agua of this.aguas){
            const p=agua.geometry.getAttribute('position');
            if(!p)continue;
            const base=agua.base;
            const fuerza=agua.lago?0:1;
            for(let i=0;i<p.count;i++){
                const x=base[i*3],z=base[i*3+2];
                const onda=(
                    Math.sin(x*.55+this.time*1.35+agua.fase)*.055+
                    Math.cos(z*.42+this.time*1.05+agua.fase)*.045+
                    Math.sin((x+z)*.22+this.time*.75+agua.fase)*.035
                )*fuerza;
                p.setY(i,base[i*3+1]+onda);
            }
            p.needsUpdate=true;
            agua.geometry.computeVertexNormals();
        }
    }
}
window.AguaUnificada=AguaUnificada;
