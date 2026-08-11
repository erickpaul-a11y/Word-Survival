const motor=new Motor();window.motor=motor;
const btnEmpezar=document.getElementById('btn-empezar');
const btnOpciones=document.getElementById('btn-opciones');
const btnIdiomas=document.getElementById('btn-idiomas');
const panelOpciones=document.getElementById('panel-opciones');
const panelIdiomas=document.getElementById('panel-idiomas');
if(btnOpciones)btnOpciones.onclick=()=>{if(panelOpciones)panelOpciones.style.display=panelOpciones.style.display==='block'?'none':'block';if(panelIdiomas)panelIdiomas.style.display='none';};
if(btnIdiomas)btnIdiomas.onclick=()=>{if(panelIdiomas)panelIdiomas.style.display=panelIdiomas.style.display==='block'?'none':'block';if(panelOpciones)panelOpciones.style.display='none';};
if(btnEmpezar){btnEmpezar.onclick=()=>{
 const pantallaInicio=document.getElementById('pantalla-inicio'),hudJuego=document.getElementById('hud-juego');if(pantallaInicio)pantallaInicio.style.display='none';if(hudJuego)hudJuego.style.display='block';motor.iniciar();
 if(typeof Inventario!=='undefined'){motor.inv=new Inventario(motor);const b=document.getElementById('btn-open-inv');if(b)b.onclick=()=>motor.inv.toggle();}
 if(typeof Crafteos!=='undefined'&&motor.inv){motor.crafteos=new Crafteos(motor.inv);}
 window.GAME_CONFIG=window.GAME_CONFIG||{};window.GAME_CONFIG.fpEnabled=true;window.GAME_CONFIG.fpHeight=.88;
 const btnCamera=document.getElementById('btn-toggle-camera');if(btnCamera){btnCamera.textContent=motor.cameraMode==='first'?'Cámara: 1ª':'Cámara: 3ª';btnCamera.onclick=()=>{motor.toggleCamera();btnCamera.textContent=motor.cameraMode==='first'?'Cámara: 1ª':'Cámara: 3ª';};}
 const chk=document.getElementById('chk-crosshair'),cross=document.getElementById('crosshair');if(chk&&cross){cross.style.display=chk.checked?'block':'none';chk.onchange=()=>cross.style.display=chk.checked?'block':'none';}
 const fp=document.getElementById('chk-fp');if(fp){fp.checked=true;fp.onchange=()=>window.GAME_CONFIG.fpEnabled=!!fp.checked;}
};}
