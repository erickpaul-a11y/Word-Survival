const motor = new Motor();


document.getElementById("btn-empezar").onclick = () => {

    document.getElementById("pantalla-inicio").style.display = "none";

    document.getElementById("hud-juego").style.display = "block";


    motor.iniciar();

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

        motor.ang.y -= e.movementX * 0.002;

    }

};



document.body.onclick = () => {

    document.body.requestPointerLock?.();

};
