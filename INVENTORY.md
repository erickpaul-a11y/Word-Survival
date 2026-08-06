Cambios implementados:

- Crosshair centrado (div #crosshair) con checkbox en HUD para activar/desactivar (id: chk-crosshair).
- Inventario simple (js/inventario/inventario.js): panel flotante, abrir/cerrar con tecla I o botón "Inventario (I)", pickups automáticos.
- Helper crearPickup(id,name,qty,x,z,escena): crea un mesh con userData.pickup para ser recogido.

Cómo probar (manual):
1. Ejecutar la página/index.html en un servidor local.
2. Pulsar ▶ EMPEZAR. HUD se muestra.
3. Asegurarse que el crosshair aparece en el centro. Usar el checkbox "Crosshair" para activarlo/desactivarlo.
4. Pulsar E para abrir/cerrar el inventario o clicar el botón "Inventario (E)".
5. Para probar pickups manualmente (desde consola):
   - crearPickup('madera','Madera',1, motor.j.x+2, motor.j.z, motor.escena);
   - Acercarse al objeto en el mundo; al acercar (< ~2 unidades) el item se añadirá al inventario.

Notas:
- Los pickups deben marcarse con userData.pickup (id, name, qty). El manager elimina el mesh de la escena al recoger.
- El gestor de criaturas ya intenta dar loot usando motor.inv.agregar si existe (se preservó esa integración).

Aceptación:
- Crosshair centrado y toggle funciona.
- Inventario abre/cierra con I; items recogidos aparecen con cantidad correcta.

Archivos modificados/añadidos:
- index.html (HUD: checkbox crosshair + botón inventario; script include)
- js/main/main.js (inicializa motor.inv, wiring de crosshair y tecla I)
- js/inventario/inventario.js (nuevo)
- INVENTORY.md (esta documentación breve)

Si se quiere, puedo hacer commits y abrir el PR ahora con descripción y pasos. 