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

    // Inicializar texto del botón de cámara según modo actual
    const camBtn = document.getElementById("btn-toggle-camera");
    if (camBtn) camBtn.textContent = motor.cameraMode === "first" ? "Cámara: 1ª" : "Cámara: 3ª";

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
