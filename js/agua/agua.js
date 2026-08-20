class AguaUnificada {
    constructor(motor){
        this.motor=motor;
        this.mesh=null;
        this.geometry=null;
        this.material=null;
        this.signature='';
        this.time=0;
        this.lastBuild=0;
    }
    ocultarAguasPorChunk(){
        const mundo=this.motor.mundo;
        if(!mundo)return;
        for(const chunk of mundo.chunks.values()){
            if(chunk.agua)chunk.agua.visible=false;
        }
    }
    reconstruir(){
        const mundo=this.motor.mundo;
        if(!mundo)return;
        const posiciones=[];
        const indices=[];
        let vertexOffset=0;
        let cantidad=0;
        const chunks=[];
        for(const chunk of mundo.chunks.values()){
            if(!chunk.agua||!chunk.agua.geometry)continue;
            const g=chunk.agua.geometry;
            const p=g.getAttribute('position');
            const idx=g.index;
            if(!p||!idx)continue;
            for(let i=0;i<p.count;i++)posiciones.push(p.getX(i),mundo.nivelAgua,p.getZ(i));
            for(let i=0;i<idx.count;i++)indices.push(idx.getX(i)+vertexOffset);
            vertexOffset+=p.count;
            cantidad+=idx.count;
            chunks.push(chunk);
        }
        if(!cantidad)return;
        const firma=chunks.map(c=>c.cx+','+c.cz).join('|')+':'+cantidad;
        if(firma===this.signature&&this.mesh)return;
        this.signature=firma;
        if(this.mesh){this.motor.escena.remove(this.mesh);this.geometry.dispose();this.material.dispose();}
        this.geometry=new THREE.BufferGeometry();
        this.geometry.setAttribute('position',new THREE.Float32BufferAttribute(posiciones,3));
        this.geometry.setIndex(indices);
        this.geometry.computeVertexNormals();
        this.material=new THREE.MeshPhongMaterial({color:0x176dcc,transparent:true,opacity:.74,side:THREE.DoubleSide,shininess:100});
        const material=this.material;
        material.onBeforeCompile=shader=>{
            shader.uniforms.waveTime={value:this.time};
            material.userData.shader=shader;
            shader.vertexShader=shader.vertexShader
                .replace('#include <begin_vertex>','#include <begin_vertex>\nfloat w1=sin(position.x*0.55 + waveTime*1.35);\nfloat w2=cos(position.z*0.42 + waveTime*1.05);\nfloat w3=sin((position.x+position.z)*0.22 + waveTime*0.75);\ntransformed.y += w1*0.055 + w2*0.045 + w3*0.035;')
                .replace('void main() {','uniform float waveTime;\nvoid main() {');
        };
        this.mesh=new THREE.Mesh(this.geometry,this.material);
        this.mesh.name='AguaUnificada';
        this.mesh.userData.agua=true;
        this.mesh.frustumCulled=false;
        this.motor.escena.add(this.mesh);
        this.ocultarAguasPorChunk();
    }
    actualizar(dt){
        if(!this.motor.mundo)return;
        this.time+=dt;
        this.ocultarAguasPorChunk();
        if(performance.now()-this.lastBuild>400){
            this.lastBuild=performance.now();
            this.reconstruir();
        }
        const shader=this.material&&this.material.userData.shader;
        if(shader)shader.uniforms.waveTime.value=this.time;
    }
}
window.AguaUnificada=AguaUnificada;
