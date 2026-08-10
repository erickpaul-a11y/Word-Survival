class Jugador {
    constructor(){
        this.x=0;this.y=.6;this.z=0;this.hp=100;this.maxHp=100;this.mana=100;this.hambre=100;this.nivel=1;this.exp=0;this.expSig=120;this.vivo=true;this.corriendo=false;this.saltando=false;
        this.modelo=new THREE.Group();
        const tex=new THREE.TextureLoader().load('textura/humano.svg');tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;
        const mat=new THREE.MeshLambertMaterial({map:tex});
        const body=new THREE.Mesh(new THREE.BoxGeometry(.5,1.2,.5),mat);body.name='torso';body.position.y=.6;this.modelo.add(body);
        const armGeo=new THREE.BoxGeometry(.18,.9,.18);this.leftArm=new THREE.Mesh(armGeo,mat);this.rightArm=new THREE.Mesh(armGeo,mat);this.leftArm.name='leftArm';this.rightArm.name='rightArm';this.leftArm.position.set(-.45,1,0);this.rightArm.position.set(.45,1,0);this.leftArm.rotation.z=.08;this.rightArm.rotation.z=-.08;this.modelo.add(this.leftArm,this.rightArm);
        const head=new THREE.Mesh(new THREE.BoxGeometry(.55,.55,.55),mat);head.name='head';head.position.y=1.48;this.modelo.add(head);this.leftHandHeld=false;this.rightHandHeld=false;
    }
    agregarAEscena(e){e.add(this.modelo);} actualizarPosicion(){this.modelo.position.set(this.x,this.y-.6,this.z);}
    recibirDaño(c){if(!this.vivo)return;this.hp=Math.max(0,this.hp-c);if(this.hp<=0)this.vivo=false;} curar(c){this.hp=Math.min(this.maxHp,this.hp+c);}
    ganarExperiencia(c){this.exp+=c;if(this.exp>=this.expSig){this.nivel++;this.exp=0;this.expSig*=1.2;}}
    setFirstPerson(fp){this.leftArm.visible=!!fp;this.rightArm.visible=!!fp;this.modelo.children.forEach(c=>{if(c.name==='leftArm'||c.name==='rightArm')return;c.visible=!fp;});}
    actualizarManoIzquierda(cam,activo){this.actualizarManos(cam,activo,this.rightHandHeld);}
    actualizarManos(cam,izquierda,derecha){this.leftHandHeld=!!izquierda;this.rightHandHeld=!!derecha;if(!cam)return;this.leftArm.rotation.z=izquierda?.55:.08;this.leftArm.rotation.x=izquierda?cam.rotation.x*.35:0;this.leftArm.rotation.y=izquierda?cam.rotation.y*.25:0;this.leftArm.position.z=izquierda?-.18:0;this.rightArm.rotation.z=derecha?-.55:-.08;this.rightArm.rotation.x=derecha?cam.rotation.x*.35:0;this.rightArm.rotation.y=derecha?cam.rotation.y*.25:0;this.rightArm.position.z=derecha?-.18:0;}
    actualizarHUD(){const ids=[['lvl',this.nivel],['pos',`X:${Math.round(this.x)} Z:${Math.round(this.z)}`]];ids.forEach(a=>{const e=document.getElementById(a[0]);if(e)e.textContent=a[1];});[['b-hp',this.hp],['b-mana',this.mana],['b-exp',this.exp/this.expSig*100],['b-hambre',this.hambre]].forEach(a=>{const e=document.getElementById(a[0]);if(e)e.style.width=a[1]+'%';});}
}
window.Jugador=Jugador;
