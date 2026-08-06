*** Begin Patch
*** Update File: js/motor/motor.js
@@
         if(document.pointerLockElement){
             this.raycaster.setFromCamera(new THREE.Vector2(0,0), this.cam);
         } else {
             this.raycaster.setFromCamera(this.mouse, this.cam);
         }
         const intersectPoint = new THREE.Vector3();
         this.raycaster.ray.intersectPlane(this.groundPlane, intersectPoint);
         if (intersectPoint) {
             this.targetPoint.copy(intersectPoint);
         }
+
+        // --- Crosshair color change: detectar si el rayo central apunta a un objeto interactuable ---
+        const cross = document.getElementById('crosshair');
+        if (cross) {
+            // Intersectar con todos los objetos de la escena (true => recorrido en profundidad)
+            const intersects = this.raycaster.intersectObjects(this.escena.children, true);
+            let hitInteractable = false;
+            for (let i = 0; i < intersects.length; i++) {
+                const obj = intersects[i].object;
+                if (obj.userData && obj.userData.interactable) {
+                    hitInteractable = true;
+                    break;
+                }
+            }
+
+            if (hitInteractable) {
+                cross.style.background = 'rgba(255,80,80,0.95)';
+                cross.style.boxShadow = '0 0 8px rgba(255,80,80,0.9)';
+            } else {
+                cross.style.background = 'rgba(255,255,255,0.95)';
+                cross.style.boxShadow = '0 0 6px rgba(0,0,0,0.6)';
+            }
+        }
*** End Patch
