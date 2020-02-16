class Engine {
    constructor(game, settings) {
        this.game = game;
        this.addCid = url => { return url + "?clientId=" + this.game.loader.clientId; };

        // ############# settings #############

        this.settings = settings;
        this.settings.useWireframe = false;
        this.settings.player = { height: 0.5, speed: 0.5, turnSpeed: Math.PI * 0.005, gravity: 0.3 };
        this.settings.bullet = { height: 0.4, speed: 2, end: 500, gravity: 0 };

        this.audio = {
            ugh: new Audio(this.addCid('maps/mountainwaters/audio/ugh.mp3')),
            hit: new Audio(this.addCid('maps/mountainwaters/audio/hit.mp3'))
        };

        // ############# init process #############

        this.initRenderer();
        this.initLoadingManager();
        this.initScene();
        this.initUi();
        this.initControls();
        this.initResizeHandler();
        this.startRender();
    }

    initRenderer() {
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(renderer.domElement);

        this.renderer = renderer;
    }

    initLoadingManager() {
        const manager = new THREE.LoadingManager();
        manager.resolveURL = this.addCid;

        ;
        manager.onProgress = (url, itemsLoaded, itemsTotal) => {
            if (!this.progressBar) {
                this.progressBar =
                    this.game.ui.createHTML(`<div id="progressBar"><div></div><div></div></div>`, document.body);
            }
            this.progressBar.children[0].style.width = `${itemsLoaded / itemsTotal * 100}%`;
            this.progressBar.children[1].textContent =
                'Loading: ' + url.replace(/^.*[\\\/]/, '').split("?")[0] + ' (' + itemsLoaded + ' of ' + itemsTotal + ')';
        };

        manager.onLoad = () => {
            if (this.progressBar) {
                this.progressBar.parentNode.removeChild(this.progressBar);
                this.progressBar = undefined;
            }
        };

        this.manager = manager;
    }

    initScene() {
        //scene
        this.scene = new THREE.Scene();

        //map
        this.map = new Map(this.settings);
        this.map.loadTextures(this.manager);
        this.map.addElementsToscene(this.scene);

        //self
        this.self = new Self(this.settings);
        this.self.addElementsToscene(this.scene);
    }

    initUi() {
        this.game.ui.createHTML(`<div id="crosshair"></div>`, document.body);
        this.game.ui.createHTML(`<div id="leaderBoard"><h4>Players</h4><table></table></div>`, document.body);
    }

    initControls() {
        // ################ Mouse ################
        this.havePointerLock = 'pointerLockElement' in document ||
            'mozPointerLockElement' in document ||
            'webkitPointerLockElement' in document;

        const setPointerlock = () => {
            if (this.pointerLocked === true) return;
            this.pointerLocked = true;
            this.renderer.domElement.requestPointerLock();
            this.renderer.domElement.addEventListener("mousemove", moveCam, false);

            setTimeout(() => {
                document.addEventListener('pointerlockchange', lockChange, false);
                document.addEventListener('mozpointerlockchange', lockChange, false);
                // document.addEventListener("mousedown", shoot, false);
            }, 0);
        }

        const lockChange = () => {
            if (this.pointerLocked === true) {
                this.pointerLocked = false;
                this.renderer.domElement.removeEventListener("mousemove", moveCam);
                // document.removeEventListener("mousedown", shoot, false);
                document.removeEventListener('pointerlockchange', lockChange, false);
                document.removeEventListener('mozpointerlockchange', lockChange, false);
            }
        }

        const moveCam = ev => {
            this.self.elements.yaw.rotation.y -= ev.movementX * 0.002;
            this.self.elements.pitch.rotation.x += ev.movementY * 0.002;
        }

        // const shoot = (ev) => {
        //     this.newBullet(ws.playerId);
        // }

        if (this.havePointerLock === true) {
            this.pointerLocked = false;

            this.renderer.domElement.requestPointerLock = this.renderer.domElement.requestPointerLock ||
                this.renderer.domElement.mozRequestPointerLock || this.renderer.domElement.webkitRequestPointerLock;
            this.renderer.domElement.addEventListener("click", setPointerlock);
        }

        // ################ Keys ################
        this.keys = {};
        window.addEventListener('keydown', ev => { this.keys[ev.keyCode] = true });
        window.addEventListener('keyup', ev => { delete this.keys[ev.keyCode]; });
    }

    initResizeHandler() {
        window.addEventListener('resize', ev => {
            this.self.elements.camera.aspect = window.innerWidth / window.innerHeight;
            this.self.elements.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    startRender() {

        this.stats0 = new Stats("fps");

        const renderScene = () => {
            this.stats0.start();

            this.self.render(this.keys);
            this.map.render();

            this.renderer.render(this.scene, this.self.elements.camera);

            this.stats0.end();
        }

        setInterval(() => {
            requestAnimationFrame(() => { renderScene(); });
        }, 20);

    }

}

/*

animate() {
        //water
        this.water.material.uniforms.time.value += 1.0 / 60.0;

        //movement
        const move = (degRad) => {
            this.self.yaw.position.add(
                this.camera.getWorldDirection(new THREE.Vector3())
                    .applyAxisAngle(new THREE.Vector3(0, 1, 0), degRad)
                    .multiply(new THREE.Vector3(this.settings.player.speed, 0, this.settings.player.speed))
            );
        }
        if (this.keys[87]) { // W key
            move(0);
        }
        if (this.keys[83]) { // S key
            move(Math.PI);
        }
        if (this.keys[65]) { // A key
            move(Math.PI / 2);
        }
        if (this.keys[68]) { // D key
            move(-Math.PI / 2);
        }
        if (this.keys[37]) { // left arrow key
            this.self.yaw.rotation.y += this.settings.player.turnSpeed;
        }
        if (this.keys[39]) { // right arrow key
            this.self.yaw.rotation.y -= this.settings.player.turnSpeed;
        }
        if (this.keys[40]) { // down arrow key
            this.self.pitch.rotation.x += this.settings.player.turnSpeed;
        }
        if (this.keys[38]) { // up arrow key
            this.newBullet(ws.playerId);
        }
        if (this.keys[16]) { // left shift
            this.settings.player.speed = 0.8;
            this.settings.player.turnSpeed = Math.PI * 0.02;
        }
        else {
            this.settings.player.speed = 0.4;
            this.settings.player.turnSpeed = Math.PI * 0.005;
        }
        if (this.keys[32]) { // space bar
            this.self.yaw.position.y += this.settings.player.speed;
        }

        //gravity
        if (Math.abs(this.self.yaw.position.x) > 125 || Math.abs(this.self.yaw.position.z) > 125) {
            this.self.yaw.position.y -= this.settings.player.gravity;
        }
        else if (this.self.yaw.position.y < this.settings.player.height) {
            this.self.yaw.position.y = this.settings.player.height;
        }
        else if (this.self.yaw.position.y > this.settings.player.height) {
            this.self.yaw.position.y -= this.settings.player.gravity;
        }

        //despawn whren out of boundsw
        if (this.self.yaw.position.y < -25 ||
            this.self.yaw.position.y > 250 ||
            this.self.yaw.position.x < -250 ||
            this.self.yaw.position.x > 250 ||
            this.self.yaw.position.z < -250 ||
            this.self.yaw.position.z > 250
        ) {
            ws.sendJson({
                hit: {
                    id: ws.playerId
                }
            });
            this.playAudio("ugh");
        }

        //bullets
        const sc = this.scene.children;
        for (let i = 0; i < sc.length; i++) {
            if (sc[i].name && sc[i].name.split("_")[0] === "b") {
                //bullets
                const json = JSON.parse(sc[i].startPos);
                //remove bullets out of bounds
                if (sc[i].position.distanceTo(new THREE.Vector3(json.x, json.y, json.z)) > this.settings.bullet.end) {
                    this.scene.remove(sc[i]);
                }
                else {
                    //check if bullet is near players
                    // for (const player of ws.players) {
                    //     let playerObj = this.scene.getObjectByName(player.id);
                    //     if(sc[i].name.split("_")[1] !== player.id && playerObj && this.colisionDetect(playerObj, sc[i], 5)){
                    //         sc[i].prevPlayerInRange = sc[i].playerInRange;
                    //         sc[i].playerInRange = player.id;
                    //         break;
                    //     }
                    //     else if(sc[i].name.split("_")[1] !== player.id){
                    //         sc[i].prevPlayerInRange = sc[i].playerInRange;
                    //         sc[i].playerInRange = null;
                    //     }
                    // }

                    // if (sc[i].playerInRange !== sc[i].prevPlayerInRange && sc[i].playerInRange) {
                    //     sc[i].lookAt(this.scene.getObjectByName(sc[i].playerInRange).position);
                    //     //sc[i].rotation.set(sc[i].rotation._x, sc[i].rotation._y + Math.PI, sc[i].rotation._z);
                    // }

                    //self hit detection
                    if (!this.waitForSpawn && sc[i].name.split("_")[1] !== ws.playerId && this.colisionDetect(this.self.yaw, sc[i])) {
                        ws.sendJson({
                            hit: {
                                id: ws.playerId,
                                hitter: sc[i].name.split("_")[1]
                            }
                        });
                        this.scene.remove(sc[i]);
                        this.waitForSpawn = true;
                        this.playAudio("ugh");
                    }
                    else {
                        sc[i].position.add(
                            sc[i].getWorldDirection(new THREE.Vector3())
                                .multiplyScalar(this.settings.bullet.speed)
                        );
                        sc[i].position.y -= this.settings.bullet.gravity;
                    }

                    //hits from others
                    for (const player of ws.players) {
                        let playerObj = this.scene.getObjectByName(player.id);
                        //console.log(playerObj.geometry);
                        if (ws.playerId !== player.id && this.colisionDetect(playerObj, sc[i])) {
                            this.lastHitTime = new Date().getTime();
                            // this.scene.remove(sc[i]);
                        }
                    }
                }
            }
        }
    }

newAvatar(obj) {
    if (this.settings.graphics.quality === "High") {
        var avatar = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({
                color: obj.color,
                roughness: 0.4,
                metalness: 1,
                normalMap: this.textures["textures/metal/Metal06_nrm.jpg"],
                normalScale: new THREE.Vector2(1, - 1), // why does the normal map require negation in this case?
                roughnessMap: this.textures["textures/metal/Metal06_rgh.jpg"],
                metalnessMap: this.textures["textures/metal/Metal06_met.jpg"],
                envMap: this.textures["skyboxCube"], // important -- especially for metals!
                envMapIntensity: 2,
                wireframe: this.settings.useWireframe
            })
        );
    } else {
        var avatar = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({
                color: obj.color,
                wireframe: this.settings.useWireframe
            })
        );
    }
    avatar.name = String(obj.id);
    avatar.receiveShadow = true;
    avatar.castShadow = true;
    avatar.position.set(obj.loc.x, obj.loc.y, obj.loc.z);
    avatar.rotation.set(obj.loc._x, obj.loc._y, obj.loc._z);
    this.scene.add(avatar);
}

newBullet(msg, fromWS) {
    let bullet;
    if (fromWS) {
        bullet = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.2, this.settings.bullet.speed),
            new THREE.MeshPhongMaterial({ color: ws.getPlayer(msg.nb.id.split("_")[1]).color, wireframe: this.settings.useWireframe })
        );
        bullet.receiveShadow = true;
        bullet.castShadow = true;

        bullet.name = msg.nb.id;
        bullet.position.set(msg.nb.loc.x, msg.nb.loc.y, msg.nb.loc.z);
        bullet.rotation.set(msg.nb.loc._x, msg.nb.loc._y, msg.nb.loc._z);
    } else {
        bullet = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.2, this.settings.bullet.speed),
            new THREE.MeshPhongMaterial({ color: ws.getPlayer(ws.playerId).color, wireframe: this.settings.useWireframe })
        );
        bullet.receiveShadow = true;
        bullet.castShadow = true;

        bullet.name = "b_" + msg;
        bullet.position.add(this.self.pitch.getWorldPosition(new THREE.Vector3()));
        bullet.position.y -= 0.25;
        bullet.rotation.setFromQuaternion(this.self.pitch.getWorldQuaternion(new THREE.Quaternion()));

        ws.sendJson({
            nb: {
                id: bullet.name,
                loc: {
                    x: ws.rndFlt(bullet.position.x),
                    y: ws.rndFlt(bullet.position.y),
                    z: ws.rndFlt(bullet.position.z),
                    _x: ws.rndFlt(bullet.rotation._x),
                    _y: ws.rndFlt(bullet.rotation._y),
                    _z: ws.rndFlt(bullet.rotation._z),
                },
            }
        });
    }
    bullet.startPos = JSON.stringify(bullet.position);
    this.scene.add(bullet);
}

colisionDetect(obj1, obj2) {
    //requirement: both objs need to be in same space (no parenting)
    for (var vertexIndex = 0; vertexIndex < obj1.geometry.vertices.length; vertexIndex++) {
        var localVertex = obj1.geometry.vertices[vertexIndex].clone();
        var globalVertex = localVertex.applyMatrix4(obj1.matrix);
        var directionVector = globalVertex.sub(obj1.position);

        var ray = new THREE.Raycaster(obj1.position.clone(), directionVector.clone().normalize());
        var collisionResults = ray.intersectObjects([obj2]);
        if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
            return true;
        }
    }
}

setSelf(obj) {
    this.waitForSpawn = false;
    this.self.yaw.name = obj.id;
    this.self.yaw.position.set(obj.loc.x, obj.loc.y, obj.loc.z);
    if (obj.color) this.self.pitch.material.color.setHex(parseInt(obj.color.substring(1), 16))
    let look = new THREE.Object3D();
    look.position.set(obj.loc.x, obj.loc.y, obj.loc.z);
    look.lookAt(this.scene.getObjectByName("rotateCube").position);
    this.self.yaw.rotation.set(0, look.rotation._y, 0);
}

setPlayer(id, loc) {
    const obj = this.scene.getObjectByName(id);
    if (obj) {
        obj.position.set(loc.x, loc.y, loc.z);
        obj.rotation.set(loc._x, loc._y, loc._z);
    }
}

getPlayer() {
    return {
        position: this.self.pitch.getWorldPosition(new THREE.Vector3()),
        rotation: new THREE.Euler().setFromQuaternion(this.self.pitch.getWorldQuaternion(new THREE.Quaternion()))
    };
}

playAudio(name) {
    this.audio[name].play();
}

*/