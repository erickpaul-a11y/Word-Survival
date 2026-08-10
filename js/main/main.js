const motor=new Motor();window.motor=motor;
const btnEmpezar=document.getElementById('btn-empezar');
if(btnEmpezar){btnEmpezar.onclick=()=>{
 const pantallaInicio=document.getElementById('pantalla-inicio'),hudJuego=document.getElementById('hud-juego');if(pantallaInicio)pantallaInicio.style.display='none';if(hudJuego)hudJuego.style.display='block';motor.iniciar();
 if(typeof Inventario!=='undefined'){motor.inv=new Inventario(motor);const b=document.getElementById('btn-open-inv');if(b)b.onclick=()=>motor.inv.toggle();}
 if(typeof Crafteos!=='undefined'&&motor.inv){motor.crafteos=new Crafteos(motor.inv);}
 window.GAME_CONFIG=window.GAME_CONFIG||{};window.GAME_CONFIG.fpEnabled=true;window.GAME_CONFIG.fpHeight=1.6;
 const btnCamera=document.getElementById('btn-toggle-camera');if(btnCamera){btnCamera.textContent=motor.cameraMode==='first'?'Cámara: 1ª':'Cámara: 3ª';btnCamera.onclick=()=>{motor.toggleCamera();btnCamera.textContent=motor.cameraMode==='first'?'Cámara: 1ª':'Cámara: 3ª';};}
 const chk=document.getElementById('chk-crosshair'),cross=document.getElementById('crosshair');if(chk&&cross){cross.style.display=chk.checked?'block':'none';chk.onchange=()=>cross.style.display=chk.checked?'block':'none';}
 const fp=document.getElementById('chk-fp');if(fp){fp.checked=true;fp.onchange=()=>window.GAME_CONFIG.fpEnabled=!!fp.checked;}
};}
