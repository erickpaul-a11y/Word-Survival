// Cow entity: simple primitive cow built from boxes/spheres
// Exposes createCow(escena, x, z, options) and global createCow()

function _randRange(a,b){ return a + Math.random()*(b-a); }
function _choose(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function createCow(escena, x=0, z=0, options={}){
    // por defecto no agresiva
    const defaultOpts = {
        colorVariant: _choose(['black','brown']),
        spots: Math.floor(_randRange(1,4)),
        name: 'Vaca',
        aggressive: false
    };
    const opts = Object.assign({}, defaultOpts, options || {});
    const group = new THREE.Group();

    // Body
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 1.0), bodyMat);
    body.position.set(0, 1, 0);
    group.add(body);

    // Legs: 4 thin boxes
    const legGeo = new THREE.BoxGeometry(0.25, 0.8, 0.25);
    const legMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const legOffsets = [ [-0.8, 0, -0.35], [0.8,0,-0.35], [-0.8,0,0.35], [0.8,0,0.35] ];
    legOffsets.forEach(o => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(o[0], 0.4, o[2]);
        group.add(leg);
    });

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.7,0.6,0.6), new THREE.MeshLambertMaterial({color:0xFFFFFF}));
    head.position.set(1.45,1.2,0);
    group.add(head);

    // Ears (small boxes)
    const earGeo = new THREE.BoxGeometry(0.12,0.2,0.06);
    const earMat = new THREE.MeshLambertMaterial({color:0xFFFFFF});
    const earL = new THREE.Mesh(earGeo, earMat); earL.position.set(1.6,1.4,-0.18); group.add(earL);
    const earR = new THREE.Mesh(earGeo, earMat); earR.position.set(1.6,1.4,0.18); group.add(earR);

    // Eyes (small spheres)
    const eyeGeo = new THREE.SphereGeometry(0.05,8,6);
    const eyeMat = new THREE.MeshBasicMaterial({color:0x000000});
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(1.7,1.2,-0.12); group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(1.7,1.2,0.12); group.add(eyeR);

    // Mouth (thin box)
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.04,0.02), new THREE.MeshBasicMaterial({color:0x000000}));
    mouth.position.set(1.8,1.0,0); group.add(mouth);

    // Color variant: apply black or brown spots
    const spotColors = { black:0x000000, brown:0x7B3F00 };
    const spotColor = spotColors[opts.colorVariant] || 0x000000;
    const spotsCount = Math.max(1, Math.min(4, opts.spots));
    for(let i=0;i<spotsCount;i++){
        const sx = _randRange(-0.8,0.8);
        const sy = _randRange(0.2,0.6);
        const sz = _randRange(-0.4,0.4);
        const s = new THREE.Mesh(new THREE.BoxGeometry(_randRange(0.2,0.6), _randRange(0.1,0.4), _randRange(0.1,0.4)), new THREE.MeshLambertMaterial({color:spotColor}));
        s.position.set(sx, sy+0.9, sz);
        group.add(s);
    }

    // Slightly vary base color if brown variant
    if(opts.colorVariant === 'brown'){
        body.material.color.setHex(0x7B3F00);
        // legs and head are after body in children; legs start at index 1
        group.children.forEach(ch => { if(ch.material && ch.material.color) ch.material.color.setHex(0xFFFFFF); });
        head.material.color.setHex(0x7B3F00);
    }

    // position on ground: use motor helper if available, fallback y=0
    let y = 0;
    try {
        if (window.motor && typeof window.motor.getGroundHeightAt === 'function') {
            y = window.motor.getGroundHeightAt(x, z);
        }
    } catch (e) { /* ignore */ }

    group.position.set(x, y, z);
    group.userData = group.userData || {};
    group.userData.tipo = 'vaca';
    group.userData.interactable = false;
    // marca explícita para evitar ataques salvo que opts.aggressive sea true
    group.userData.aggressive = !!opts.aggressive;
    group.userData.canAttack = !!opts.aggressive;

    if(escena) escena.add(group);
    return group;
}

// Expose globally for console access
window.createCow = function(pos){
    try{
        const escena = window.motor && window.motor.escena ? window.motor.escena : null;
        if(!escena){ console.warn('No escena disponible para crear vaca'); return null; }
        if(pos && typeof pos.x === 'number' && typeof pos.z === 'number'){
            // allow passing options via pos.options
            return createCow(escena, pos.x, pos.z, pos.options||{});
        }
        // random near player
        const player = window.motor && window.motor.j ? window.motor.j : {x:0,z:0};
        const angle = Math.random()*Math.PI*2;
        const dist = 4 + Math.random()*8;
        const x = player.x + Math.cos(angle)*dist;
        const z = player.z + Math.sin(angle)*dist;
        return createCow(escena, x, z, pos && pos.options ? pos.options : undefined);
    }catch(e){ console.error(e); return null; }
};
