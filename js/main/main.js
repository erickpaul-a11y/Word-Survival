const motor = new Motor();


document.getElementById("btn-empezar").onclick = ()=>{

    document.getElementById("pantalla-inicio").style.display="none";

    document.getElementById("hud-juego").style.display="block";

    document.getElementById("panel-palabras").style.display="none";


    motor.j.agregarAEscena(
        motor.escena
    );


    motor.iniciar();

};




// BOTON PALABRAS

document.getElementById("btn-palabras").onclick = ()=>{

    const panel =
    document.getElementById("panel-palabras");


    if(panel.style.display==="none"){

        panel.style.display="flex";

    }else{

        panel.style.display="none";

    }

};




// CERRAR PALABRAS

document.getElementById("btn-cerrar-palabras").onclick = ()=>{

    document.getElementById("panel-palabras")
    .style.display="none";

};




// CREAR PALABRA

document.getElementById("btn-crear").onclick = ()=>{


    let palabra =
    document.getElementById("dict-input").value;


    palabra =
    palabra.normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .trim();



    if(palabra==="") return;



    console.log(
        "Palabra escrita:",
        palabra
    );



    if(motor.datos && motor.datos[palabra]){

        console.log(
            "Objeto encontrado:",
            motor.datos[palabra]
        );


    }else{

        console.log(
            "Palabra no encontrada"
        );

    }



    document.getElementById("dict-input").value="";


};




// TECLADO

window.onkeydown = e=>{

    motor.teclas[
        e.key.toLowerCase()
    ] = true;


    if(e.code==="Space"){

        motor.teclas[" "] = true;

    }

};



window.onkeyup = e=>{

    motor.teclas[
        e.key.toLowerCase()
    ] = false;



    if(e.code==="Space"){

        motor.teclas[" "] = false;

    }

};




// CAMARA CON RATON

window.onmousemove = e=>{


    if(!motor.ang) return;



    motor.ang.y += 
    e.movementX * 0.002;



    motor.ang.x -=
    e.movementY * 0.002;


};




// CLICK PARA ACTIVAR RATON

document.body.onclick = ()=>{

    document.body.requestPointerLock?.();

};




// PANTALLA COMPLETA

document.getElementById("btn-fullscreen").onclick = ()=>{

    document.body.requestFullscreen?.();

};
