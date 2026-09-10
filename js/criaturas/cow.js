// WORD SURVIVAL ∞ — VACA LOW-POLY
// Modelo procedural angular; la textura hand-painted la aplica poligonal.js.

function _randRange(a,b){ return a + Math.random()*(b-a); }
function _choose(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function createCow(escena, x=0, z=0, options={}){
    const defaultOpts={
        colorVariant:_choose(['black','brown']),
        spots:Math.floor(_randRange(2,5)),
        name:'Vaca',
        aggressive:false
    };
    const opts=Object.assign({},defaultOpts,options||{});
    const group=new THREE.Group();
    group.name='VacaLowPoly';

    const mat=(color)=>new THREE.MeshLambertMaterial({color,flatShading:true});
    const blanco=mat(0xf2eee5);
    const oscuro=mat(opts.colorVariant==='brown'?0x7b4d2d:0x252525);
    const negro=mat(0x111111);
    const cuerno=mat(0xb99b6b);

    function pieza(geo,material,name,tipo='vaca'){
        const m=new THREE.Mesh(geo,material);
        m.name=name;
        m.userData.tipo=tipo;
        m.castShadow=true;
        m.receiveShadow=true;
        group.add(m);
        return m;
    }

    // Cuerpo: caja simple, deliberadamente angular.
    const body=pieza(new THREE.BoxGeometry(2.2,1.0,1.0),blanco,'CuerpoVaca');
    body.position.set(0,1.02,0);

    // Lomo elevado para que la silueta no sea un bloque perfecto.
    const lomo=pieza(new THREE.IcosahedronGeometry(.72,1),blanco,'LomoVaca');
    lomo.scale.set(1.25,.72,.78);
    lomo.position.set(-.20,1.42,0);

    // Cuatro patas.
    const legGeo=new THREE.BoxGeometry(.25,.82,.25);
    [[-.78,-.35], [.78,-.35], [-.78,.35], [.78,.35]].forEach((o,i)=>{
        const leg=pieza(legGeo,blanco,'PataVaca'+i);
        leg.position.set(o[0],.41,o[1]);
    });

    // Cabeza angular.
    const head=pieza(new THREE.BoxGeometry(.72,.62,.62),blanco,'CabezaVaca');
    head.position.set(1.43,1.25,0);

    // Hocico.
    const muzzle=pieza(new THREE.BoxGeometry(.48,.25,.48),oscuro,'HocicoVaca');
    muzzle.position.set(1.78,1.08,0);

    // Orejas.
    const earGeo=new THREE.BoxGeometry(.16,.20,.10);
    const earL=pieza(earGeo,oscuro,'OrejaVacaL'); earL.position.set(1.52,1.52,-.34);
    const earR=pieza(earGeo,oscuro,'OrejaVacaR'); earR.position.set(1.52,1.52,.34);

    // Cuernos cortos y facetados.
    const hornGeo=new THREE.ConeGeometry(.09,.28,5);
    const hornL=pieza(hornGeo,cuerno,'CuernoVacaL'); hornL.position.set(1.53,1.62,-.20); hornL.rotation.z=-.35;
    const hornR=pieza(hornGeo,cuerno,'CuernoVacaR'); hornR.position.set(1.53,1.62,.20); hornR.rotation.z=-.35;

    // Ojos muy simples, sin exceso de polígonos.
    const eyeGeo=new THREE.SphereGeometry(.055,6,4);
    const eyeL=pieza(eyeGeo,negro,'OjoVacaL','ojo'); eyeL.position.set(1.70,1.37,-.20);
    const eyeR=pieza(eyeGeo,negro,'OjoVacaR','ojo'); eyeR.position.set(1.70,1.37,.20);

    // Manchas como pequeñas piezas irregulares, no como triángulos dibujados.
    const manchas=Math.max(1,Math.min(5,opts.spots));
    for(let i=0;i<manchas;i++){
        const s=pieza(
            new THREE.IcosahedronGeometry(.24+Math.random()*.16,1),
            oscuro,
            'ManchaVaca'+i,
            'vaca'
        );
        s.scale.set(1.25,.55,.25);
        s.position.set(_randRange(-.78,.72),_randRange(.85,1.42),_randRange(-.48,.48));
        s.rotation.set(Math.random()*.5,Math.random()*Math.PI,Math.random()*.5);
    }

    let y=0;
    try{
        if(window.motor&&typeof window.motor.getGroundHeightAt==='function')y=window.motor.getGroundHeightAt(x,z);
    }catch(e){}

    group.position.set(x,y,z);
    group.userData.tipo='vaca';
    group.userData.interactable=false;
    group.userData.aggressive=!!opts.aggressive;
    group.userData.canAttack=!!opts.aggressive;
    group.userData.nombre=opts.name;

    if(escena)escena.add(group);
    return group;
}

window.createCow=function(pos){
    try{
        const escena=window.motor&&window.motor.escena?window.motor.escena:null;
        if(!escena){console.warn('No escena disponible para crear vaca');return null;}
        if(pos&&typeof pos.x==='number'&&typeof pos.z==='number'){
            return createCow(escena,pos.x,pos.z,pos.options||{});
        }
        const player=window.motor&&window.motor.j?window.motor.j:{x:0,z:0};
        const angle=Math.random()*Math.PI*2;
        const dist=4+Math.random()*8;
        return createCow(escena,player.x+Math.cos(angle)*dist,player.z+Math.sin(angle)*dist,pos&&pos.options?pos.options:undefined);
    }catch(e){console.error(e);return null;}
};
