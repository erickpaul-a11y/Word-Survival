class Jugador {
    constructor() {
        this.x=0;this.y=.6;this.z=0;this.hp=100;this.maxHp=100;this.mana=100;this.hambre=100;this.nivel=1;this.exp=0;this.expSig=120;this.vivo=true;this.corriendo=false;this.saltando=false;
        this.modelo=new THREE.Group();
        const tex=new THREE.TextureLoader().load('textura/humano.svg'); tex.magFilter=THREE.NearestFilter; tex.minFilter=THREE.NearestFilter;
        const body=new THREE.Mesh(new THREE.BoxGeometry(.5,1.2,.5),new THREE.MeshLambertMaterial({map:tex})); body.name='torso';body.position.y=.6;this.modelo.add(body);
        const armGeo=new THREE.BoxGeometry(.18,.9,.18), armMat=new THREE.MeshLambertMaterial({map:tex});
        const left=new THREE.Mesh(armGeo,armMat),right=new THREE.Mesh(armGeo,armMat);left.name='leftArm';right.name='rightArm';left.position.set(-.45,1,0);right.position.set(.45,1,0);left.rotation.z=.08;right.rotation.z=-.08;this.modelo.add(left,right);this.leftArm=left;this.rightArm=right;
        const head=new THREE.Mesh(new THREE.BoxGeometry(.55,.55,.55),new THREE.MeshLambertMaterial({map:tex}));head.name='head';head.position.y=1.48;this.modelo.add(head);
    }
    agregarAEscena(escena){escena.add(this.modelo);}
    actualizarPosicion(){this.modelo.position.set(this.x,this.y-.6,this.z);}
    recibirDaño(c){if(!this.vivo)return;this.hp=Math.max(0,this.hp-c);if(this.hp<=0)this.vivo=false;}
    curar(c){this.hp=Math.min(this.maxHp,this.hp+c);}
    ganarExperiencia(c){this.exp+=c;if(this.exp>=this.expSig){this.nivel++;this.exp=0;this.expSig*=1.2;console.log('Nivel nuevo:',this.nivel);}}
    setFirstPerson(fp){this.leftArm.visible=!!fp;this.rightArm.visible=!!fp;this.modelo.children.forEach(c=>{if(c.name==='leftArm'||c.name==='rightArm')return;c.visible=!fp;});}
    actualizarHUD(){const ids=[['lvl',this.nivel],['pos',`X:${Math.round(this.x)} Z:${Math.round(this.z)}`]];ids.forEach(a=>{const e=document.getElementById(a[0]);if(e)e.textContent=a[1];});const hp=document.getElementById('b-hp');if(hp)hp.style.width=this.hp+'%';const mana=document.getElementById('b-mana');if(mana)mana.style.width=this.mana+'%';const exp=document.getElementById('b-exp');if(exp)exp.style.width=(this.exp/this.expSig*100)+'%';const hambre=document.getElementById('b-hambre');if(hambre)hambre.style.width=this.hambre+'%';}
}
window.Jugador=Jugador;
