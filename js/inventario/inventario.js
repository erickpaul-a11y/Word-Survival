class Inventario {
    constructor(motor, capacity = 24) {
        this.m = motor;
        this.capacity = capacity;
        this.items = {}; // { id: {name, qty} }
        this.open = false;
        this.panel = this._createPanel();
        // cargar desde sessionStorage (persistencia por escena)
        this._load();
        // Start update loop to check for pickups
        const loop = () => {
            this._checkPickups();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    _save(){
        try{
            sessionStorage.setItem('inventory_state', JSON.stringify(this.items));
        }catch(e){ }
    }

    _load(){
        try{
            const s = sessionStorage.getItem('inventory_state');
            if(s) this.items = JSON.parse(s) || {};
        }catch(e){ this.items = {}; }
    }

    _createPanel(){
        const panel = document.createElement('div');
        panel.id = 'inventory-panel';
        panel.style.position = 'absolute';
        panel.style.right = '20px';
        panel.style.top = '60px';
        panel.style.width = '260px';
        panel.style.maxHeight = '60vh';
        panel.style.overflowY = 'auto';
        panel.style.background = 'rgba(20,20,20,0.9)';
        panel.style.color = '#fff';
        panel.style.padding = '12px';
        panel.style.borderRadius = '8px';
        panel.style.boxShadow = '0 8px 24px rgba(0,0,0,0.6)';
        panel.style.zIndex = 9998;
        panel.style.display = 'none';
        panel.innerHTML = `<div style="font-weight:700;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">Inventario <button id="inv-close" style="font-size:0.8em;padding:4px 6px;">Cerrar</button></div><div id="inv-list"></div>`;
        document.body.appendChild(panel);
        const btnClose = panel.querySelector('#inv-close');
        if(btnClose) btnClose.onclick = () => this.close();
        return panel;
    }

    _render(){
        const list = this.panel.querySelector('#inv-list');
        if(!list) return;
        list.innerHTML = '';
        const keys = Object.keys(this.items);
        if(keys.length === 0){
            list.innerHTML = '<div style="opacity:0.8">(Vacío)</div>';
            return;
        }
        keys.forEach(id => {
            const it = this.items[id];
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.marginBottom = '6px';
            row.innerHTML = `<div>${it.name}</div><div>x${it.qty}</div>`;
            list.appendChild(row);
        });
    }

    agregar(id, qty = 1, name = null){
        if(!id) return;
        if(!this.items[id]){
            if(Object.keys(this.items).length >= this.capacity) {
                console.warn('Inventario lleno');
                return false;
            }
            this.items[id] = { name: name || id, qty: 0 };
        }
        this.items[id].qty += qty;
        this._render();
        this._save();
        return true;
    }

    toggle(){
        if(this.open) this.close(); else this.openPanel();
    }

    openPanel(){
        this.open = true;
        this.panel.style.display = 'block';
        this._render();
    }

    close(){
        this.open = false;
        this.panel.style.display = 'none';
    }

    _checkPickups(){
        try {
            if(!this.m || !this.m.escena || !this.m.j) return;
            const escena = this.m.escena;
            const player = this.m.j;
            // buscar objetos en escena con userData.pickup
            escena.traverse(obj => {
                if(obj.userData && obj.userData.pickup && !obj.userData._collected){
                    const dx = (obj.position.x || 0) - (player.x || 0);
                    const dz = (obj.position.z || 0) - (player.z || 0);
                    const dist = Math.hypot(dx, dz);
                    const radius = obj.userData.pickupRadius || 2.0;
                    if(dist <= radius){
                        const pd = obj.userData.pickup;
                        const added = this.agregar(pd.id, pd.qty || 1, pd.name || pd.id);
                        if(added){
                            obj.userData._collected = true;
                            // remover del mundo
                            if(obj.parent) obj.parent.remove(obj);
                            console.log(`Recolectado: ${pd.id} x${pd.qty||1}`);
                        }
                    }
                }
            });
        } catch(e){
            // no bloquear loop por errores
        }
    }
}

// Helper global to create a pickup mesh quickly
function crearPickup(id, name, qty, x, z, escena, radius = 1.6){
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.4), new THREE.MeshLambertMaterial({color:0xffd166}));
    m.position.set(x, 1, z);
    m.userData.pickup = { id, name, qty };
    m.userData.interactable = true;
    m.userData.pickupRadius = radius;
    if(escena) escena.add(m);
    return m;
}
