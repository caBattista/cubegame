class Controls {

    constructor(settings) {
        this.keyMap = this.mapKeysFromSettings(settings);
        this.pressedKeys = {};
    }

    initControls(self, domElement) {
        // ################ Mouse ################
        const lockChange = (ev) => {
            if (this.pointerLocked === true) {
                this.pointerLocked = false;
                domElement.removeEventListener("mousemove", mouseMoveHandler);
                // document.removeEventListener("mousedown", shoot, false);
                document.removeEventListener('pointerlockchange', lockChange, false);
            }
        }

        const mouseMoveHandler = ev => {
            self.moveCam(ev.movementX, ev.movementY);
        }

        domElement.addEventListener("mousedown", () => {
            if (this.pointerLocked === true) { return; }
            this.pointerLocked = true;
            domElement.requestPointerLock();
            domElement.addEventListener("mousemove", mouseMoveHandler, false);

            setTimeout(() => { document.addEventListener('pointerlockchange', lockChange, false); }, 0);
        });

        // ################ Keys ################
        window.addEventListener('keydown', ev => { this.pressedKeys[ev.code] = true; });
        window.addEventListener('keyup', ev => { delete this.pressedKeys[ev.code]; });
    }

    mapKeysFromSettings(controlSettings) {
        let keyMap = {};
        let typeMap = {
            sprint: "set"
        }
        Object.entries(controlSettings).forEach(([key, val]) => {
            keyMap[val] = { action: key, type: typeMap[key] };
        });

        return keyMap;
    }

    checkChange(prevPosRot, curentPosRot) {
        return prevPosRot.position.x === curentPosRot.position.x &&
            prevPosRot.position.y === curentPosRot.position.y &&
            prevPosRot.position.z === curentPosRot.position.z &&
            prevPosRot.rotation.x === curentPosRot.rotation.x &&
            prevPosRot.rotation.y === curentPosRot.rotation.y &&
            prevPosRot.rotation.z === curentPosRot.rotation.z
            ? false : true;
    }
    //Only Send Position and Veloctiy-Vector when changed

    animate(self) {
        let doOrder = { set: [], fion: [], fifo: [] };
        Object.keys(this.pressedKeys).forEach(key => {
            if (this.keyMap[key]) {
                if (this.keyMap[key].type === "set") {
                    doOrder.set.push(this.keyMap[key].action);
                } else { doOrder.fifo.push(this.keyMap[key].action); }
            }
        });
        self.do("setDefaults");
        //self.do("moveForward");
        doOrder.set.forEach(action => { self.do(action); })
        doOrder.fion.forEach(action => { self.do(action); })
        doOrder.fifo.forEach(action => { self.do(action); })

        //Change Ceck
        const curentPosRot = self.getPosRot();
        this.posRot = this.posRot ? this.posRot : curentPosRot;
        const changed = this.checkChange(this.posRot, curentPosRot);
        this.posRot = curentPosRot;
        return changed;
    }

}