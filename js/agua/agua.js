class AguaUnificada {
    constructor(motor){
        this.motor=motor; this.mesh=null; this.geometry=null; this.material=null; this.signature=''; this.time=0; this.lastBuild=0;
        this.instalarFisica();
    }
    ocultarAguasPorChunk(){
        const mundo=this.motor.mundo; if(!mundo)return;
        for(const chunk of mundo.chunks.values())if(chunk.agua){chunk.agua.visible=false;chunk.agua.userData.agua=true;chunk.agua.userData.colision=false;}
    }
    instalarFisica(){
        const m=this.motor; if(m._fisicaAguaInstalada)return; m._fisicaAguaInstalada=true;
        const original=m._updateMovement.bind(m);
        m._updateMovement=(dt)=>{
            if(!m.j){original(dt);return;}
            original(dt);
            const agua=m.enAgua?m.getWaterHeightAt(m.j.x,m.j.z):null;
            if(agua!==null&&agua!==undefined){
                const subir=!!m.teclas[' '],bajar=!!m.teclas.control;
                if(bajar)m.j.y=Math.max(m.getGroundHeightAt(m.j.x,m.j.z)+.18,m.j.y-2.8*dt);
                else if(subir)m.j.y=Math.min(agua+1.8,m.j.y+3.2*dt);
                else if(m.j.y>agua-.15)m.j.y+=(agua-.15-m.j.y)*Math.min(1,dt*2.5);
                m.enSuelo=false; m.j.saltando=false;
            }
            const radio=.34;
            if(m.mundo&&m.mundo.chunks)for(const chunk of m.mundo.chunks.values())for(const o of chunk.objetos||[]){
                if(!o||!o.parent||o.userData.pickup||o.userData.agua||o.userData.cayendo)continue;
                const p=o.getWorldPosition(new THREE.Vector3()),dx=m.j.x-p.x,dz=m.j.z-p.z,d=Math.hypot(dx,dz),ob=o.userData.arbol?.72:.48,min=radio+ob;
                if(d>0.001&&d<min){const k=(min-d)/d;m.j.x+=dx*k;m.j.z+=dz*k;m.velocidadX*=.35;m.velocidadZ*=.35;}
            }
            const suelo=m.getGroundHeightAt(m.j.x,m.j.z)+.18;if(m.j.y<suelo){m.j.y=suelo;m.velocidadY=0;}
            m.j.actualizarPosicion();
        };
    }
    reconstruir(){
        const mundo=this.motor.mundo;if(!mundo)return;const posiciones=[],indices=[];let vertexOffset=0,cantidad=0;const chunks=[];
        for(const chunk of mundo.chunks.values()){
            if(!chunk.agua||!chunk.agua.geometry)continue;const g=chunk.agua.geometry,p=g.getAttribute('position'),idx=g.index;if(!p||!idx)continue;
            for(let i=0;i<p.count;i++)posiciones.push(p.getX(i),mundo.nivelAgua,p.getZ(i));
            for(let i=0;i<idx.count;i++)indices.push(idx.getX(i)+vertexOffset);vertexOffset+=p.count;cantidad+=idx.count;chunks.push(chunk);
        }
        if(!cantidad)return;const firma=chunks.map(c=>c.cx+','+c.cz).join('|')+':'+cantidad;if(firma===this.signature&&this.mesh)return;this.signature=firma;
        if(this.mesh){this.motor.escena.remove(this.mesh);this.geometry.dispose();this.material.dispose();}
        this.geometry=new THREE.BufferGeometry();this.geometry.setAttribute('position',new THREE.Float32BufferAttribute(posiciones,3));this.geometry.setIndex(indices);this.geometry.computeVertexNormals();
        this.material=new THREE.MeshPhongMaterial({color:0x176dcc,transparent:true,opacity:.74,side:THREE.DoubleSide,shininess:100});const material=this.material;
        material.onBeforeCompile=shader=>{shader.uniforms.waveTime={value:this.time};material.userData.shader=shader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloat w1=sin(position.x*.55+waveTime*1.35);\nfloat w2=cos(position.z*.42+waveTime*1.05);\nfloat w3=sin((position.x+position.z)*.22+waveTime*.75);\ntransformed.y+=w1*.055+w2*.045+w3*.035;').replace('void main() {','uniform float waveTime;\nvoid main() {');};
        this.mesh=new THREE.Mesh(this.geometry,this.material);this.mesh.name='AguaUnificada';this.mesh.userData.agua=true;this.mesh.userData.colision=false;this.mesh.frustumCulled=false;this.motor.escena.add(this.mesh);this.ocultarAguasPorChunk();
    }
    actualizar(dt){if(!this.motor.mundo)return;this.time+=dt;this.ocultarAguasPorChunk();if(performance.now()-this.lastBuild>400){this.lastBuild=performance.now();this.reconstruir();}const shader=this.material&&this.material.userData.shader;if(shader)shader.uniforms.waveTime.value=this.time;}
}
window.AguaUnificada=AguaUnificada;
