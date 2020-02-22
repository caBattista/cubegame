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

        //controls
        this.controls = new Controls(this.settings.controls);
        this.controls.initControls(this.self, this.renderer.domElement);
    }

    initUi() {
        this.game.ui.createHTML(`<div id="crosshair"></div>`, document.body);
        this.game.ui.createHTML(`<div id="leaderBoard"><h4>Players</h4><table></table></div>`, document.body);
    }

    initResizeHandler() {
        window.addEventListener('resize', ev => {
            this.self.elements.camera.aspect = window.innerWidth / window.innerHeight;
            this.self.elements.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    startRender() {

        this.stats0 = new Stats();

        const renderScene = () => {
            this.stats0.start();

            this.map.render();

            let changed = false;
            let changes = {};

            if (this.controls.render(this.self)) {
                changed = true;
                changes.self = this.controls.posRot;
            }

            if (changed) {
                this.game.ws.request("map", { action: "move", changes: changes });
            }

            this.renderer.render(this.scene, this.self.elements.camera);

            this.stats0.end();
        }

        setInterval(() => {
            requestAnimationFrame(() => { renderScene(); });
        }, 16);

    }

}


/*

            let obj = {}
            for (let index = 0; index < window.slowit; index++) {
                if (index % 2 === 0) {
                    obj.id = 2;
                } else {
                    obj = {};
                }
            }
animate() {
        //water
        this.water.material.uniforms.time.value += 1.0 / 60.0;

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