const motor = new Motor();


document.getElementById("btn-empezar").onclick = () => {

    document.getElementById("pantalla-inicio").style.display = "none";

    document.getElementById("hud-juego").style.display = "block";


    motor.iniciar();

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
