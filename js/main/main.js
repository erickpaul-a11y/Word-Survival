const motor = new Motor();


document.getElementById("btn-empezar").onclick = () => {

    document.getElementById("pantalla-inicio").style.display = "none";

    document.getElementById("hud-juego").style.display = "block";


    motor.iniciar();

    // Inicializar inventario (simple manager) y botón
    if (typeof Inventario !== 'undefined') {
        try {
            motor.inv = new Inventario(motor);
            const btnInv = document.getElementById('btn-open-inv');
            if (btnInv) btnInv.onclick = () => motor.inv.toggle();
        } catch(e) { console.warn('No se pudo inicializar Inventario:', e); }
    }

    // Spawn cows according to config
    try {
        window.GAME_CONFIG = window.GAME_CONFIG || {};
        if(typeof window.GAME_CONFIG.spawnCowsEnabled === 'undefined') window.GAME_CONFIG.spawnCowsEnabled = true;
        if(typeof window.GAME_CONFIG.spawnCowCount === 'undefined') window.GAME_CONFIG.spawnCowCount = 5;
        // simple spawn: avoid player's spawn (around 0,0) and avoid overlap
        if(window.GAME_CONFIG.spawnCowsEnabled){
            const count = Math.max(0, Math.min(50, parseInt(window.GAME_CONFIG.spawnCowCount||5)));
            const positions = [];
            const minDistFromPlayer = 4;
            const minGap = 3;
            const maxAttempts = 200;
            for(let i=0;i<count;i++){
                let attempts=0; let placed=false;
                while(!placed && attempts++ < maxAttempts){
                    const angle = Math.random()*Math.PI*2;
                    const dist = 6 + Math.random()*20; // spawn radius
                    const x = (motor.j ? motor.j.x : 0) + Math.cos(angle)*dist;
                    const z = (motor.j ? motor.j.z : 0) + Math.sin(angle)*dist;
                    // check distance from player
                    const dx = (motor.j ? motor.j.x : 0) - x;
                    const dz = (motor.j ? motor.j.z : 0) - z;
                    const dp = Math.hypot(dx,dz);
                    if(dp < minDistFromPlayer) continue;
                    // check against other cows
                    let ok=true;
                    for(const p of positions){ if(Math.hypot(p.x-x,p.z-z) < minGap){ ok=false; break; } }
                    if(!ok) continue;
                    // place
                    if(typeof window.createCow === 'function'){
                        window.createCow({x,z});
                    } else if (typeof createCow === 'function'){
                        createCow(motor.escena, x, z);
                    }
                    positions.push({x,z});
                    placed=true;
                }
            }
            console.log(`Spawned ${positions.length} cows`);
        }
    } catch(e){ console.warn('Error spawning cows', e); }

    // Inicializar texto del botón de cámara según modo actual
    const camBtn = document.getElementById("btn-toggle-camera");
    if (camBtn) camBtn.textContent = motor.cameraMode === "first" ? "Cámara: 1ª" : "Cámara: 3ª";

    // First-person camera placement and controls enforcement
    try {
        if (typeof window.GAME_CONFIG.fpEnabled === 'undefined') window.GAME_CONFIG.fpEnabled = true;
        if (typeof window.GAME_CONFIG.fpHeight === 'undefined') window.GAME_CONFIG.fpHeight = 1.6;

        const chkFP = document.getElementById('chk-fp');
        if (chkFP) { chkFP.checked = !!window.GAME_CONFIG.fpEnabled; chkFP.onchange = () => { window.GAME_CONFIG.fpEnabled = !!chkFP.checked; sessionStorage.setItem('game_config', JSON.stringify(window.GAME_CONFIG)); }}

        // RAF loop to position camera at player's head and hide body when fp enabled
        const updateFP = () => {
            try{
                if(motor && motor.cam && motor.j){
                    const fp = !!window.GAME_CONFIG.fpEnabled;
                    // hide/show player model parts
                    if(motor.j.setFirstPerson && typeof motor.j.setFirstPerson === 'function'){
                        motor.j.setFirstPerson(fp);
                    } else if(motor.j.modelo){
                        motor.j.modelo.children.forEach(ch => { ch.visible = !fp; });
                    }
                    // position camera at player's head
                    const headY = parseFloat(window.GAME_CONFIG.fpHeight) || 1.6;
                    motor.cam.position.set(motor.j.x, headY, motor.j.z);
                    // apply rotation from motor.ang (if available)
                    if(motor.ang){ motor.cam.rotation.x = motor.ang.x; motor.cam.rotation.y = motor.ang.y; }
                }
            }catch(e){ }
            requestAnimationFrame(updateFP);
        };
        requestAnimationFrame(updateFP);
    } catch(e){ console.warn('FP setup failed', e); }

};



window.onkeydown = e => {

    motor.teclas[e.key.toLowerCase()] = true;

    if(e.code === "Space"){

        motor.teclas.space = true;

    }

};



window.onkeyup = e => {

    motor.teclas[e.key.toLowerCase()] = false;


    if(e.code === "Space"){

        motor.teclas.space = false;

    }

};



window.onmousemove = e => {


    if(document.pointerLockElement){

        // yaw
        motor.ang.y -= e.movementX * 0.002;
        // pitch
        motor.ang.x -= e.movementY * 0.002;
        // clamp pitch to avoid flip
        const limit = Math.PI/2 - 0.05;
        motor.ang.x = Math.max(-limit, Math.min(limit, motor.ang.x));

    }

};



document.body.onclick = () => {

    document.body.requestPointerLock?.();

};

// CORREGIDO: Agregar evento de ataque con click izquierdo
document.addEventListener('click', (e) => {
    // Solo atacar si el puntero está bloqueado (en juego)
    if (document.pointerLockElement && motor) {
        motor.atacar();
    }
});

// boton para alternar cámara
const btnToggle = document.getElementById("btn-toggle-camera");
if (btnToggle) {
    btnToggle.onclick = () => {
        motor.toggleCamera();
        btnToggle.textContent = motor.cameraMode === "first" ? "Cámara: 1ª" : "Cámara: 3ª";
    };
}

// GAME config with persistence (sessionStorage) for inspector-style toggles
window.GAME_CONFIG = window.GAME_CONFIG || {};
try{
    const stored = sessionStorage.getItem('game_config');
    if(stored) Object.assign(window.GAME_CONFIG, JSON.parse(stored));
}catch(e){ }
if (typeof window.GAME_CONFIG.crosshairEnabled === 'undefined') window.GAME_CONFIG.crosshairEnabled = true;

// Crosshair toggle wiring (sync with GAME_CONFIG)
const chkCross = document.getElementById('chk-crosshair');
const crossEl = document.getElementById('crosshair');
if (crossEl) crossEl.style.display = window.GAME_CONFIG.crosshairEnabled ? 'block' : 'none';
if (chkCross) {
    chkCross.checked = !!window.GAME_CONFIG.crosshairEnabled;
    chkCross.onchange = () => {
        window.GAME_CONFIG.crosshairEnabled = !!chkCross.checked;
        try{ sessionStorage.setItem('game_config', JSON.stringify(window.GAME_CONFIG)); }catch(e){}
        if (crossEl) crossEl.style.display = window.GAME_CONFIG.crosshairEnabled ? 'block' : 'none';
    };
}

// Inventory key (E) shortcut (user preference)
window.addEventListener('keydown', (e) => {
    if (e.key && e.key.toLowerCase() === 'e') {
        if (motor.inv && typeof motor.inv.toggle === 'function') motor.inv.toggle();
    }
});
