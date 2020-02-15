class Engine {
    constructor(game) {
        this.game = game;
        this.addCid = url => { return url + "?clientId=" + this.game.loader.clientId; };
        //settings
        this.graphics = true;
        this.USE_WIREFRAME = false;
        this.scene = new THREE.Scene();
        this.player = { height: 0.5, speed: 0.5, turnSpeed: Math.PI * 0.005, gravity: 0.3 };
        this.bullet = { height: 0.4, speed: 2, end: 500, gravity: 0 };
        this.keys = {};
        this.audio = {
            ugh: new Audio(this.addCid('audio/ugh.mp3')),
            hit: new Audio(this.addCid('audio/hit.mp3'))
        };

        //Loading manager
        this.manager = new THREE.LoadingManager();
        this.manager.resolveURL = this.addCid;
        let progressBar = document.createElement("div");
        progressBar.id = "progressBar";
        document.body.appendChild(progressBar);

        this.manager.onLoad = () => {
            progressBar.parentNode.removeChild(progressBar);

            let crosshair = document.createElement("div");
            crosshair.id = "crosshair";
            document.body.appendChild(crosshair);

            let leaderBoard = document.createElement("div");
            leaderBoard.id = "leaderBoard";
            leaderBoard.innerHTML = "<h4>Players</h4><table></table>";
            document.body.appendChild(leaderBoard);

            this.doneLoading();

            this.stats0 = new Stats("fps");
            this.stats1 = new Stats("fps");
            //start animaiton
            // setInterval(() => {
            //     this.stats1.start();
            //     this.animate();
            //     this.stats1.end();
            // }, 16);
            // this.render();
        };

        this.manager.onProgress = function (url, itemsLoaded, itemsTotal) {
            progressBar.textContent =
                'Loading: ' + url.replace(/^.*[\\\/]/, '') + ' (' + itemsLoaded + ' of ' + itemsTotal + ')';
        };

        //preload textures
        this.textures = {
            "textures/skybox/left.jpg": { type: "texture" },
            "textures/skybox/right.jpg": { type: "texture" },
            "textures/skybox/back.jpg": { type: "texture" },
            "textures/skybox/front.jpg": { type: "texture" },
            "textures/skybox/bottom.jpg": { type: "texture" },
            "textures/skybox/top.jpg": { type: "texture" },
            "textures/water/waternormals.jpg": {
                type: "texture", fn: function (texture) {
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                }
            },
            "textures/concrete/concrete_b.png": {
                type: "texture", fn: function (texture) {
                    texture.repeat.set(512, 512);
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                }
            },
            "textures/concrete/concrete_d.png": {
                type: "texture", fn: function (texture) {
                    texture.repeat.set(512, 512);
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                }
            },
            "textures/concrete/concrete_s.png": {
                type: "texture", fn: function (texture) {
                    texture.repeat.set(512, 512);
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                }
            },
            "textures/metal/Metal06_nrm.jpg": { type: "texture" },
            "textures/metal/Metal06_rgh.jpg": { type: "texture" },
            "textures/metal/Metal06_met.jpg": { type: "texture" },
            "skyboxCube": {
                type: "cubeTexture", urls: [
                    "textures/skybox/left.jpg",
                    "textures/skybox/right.jpg",
                    "textures/skybox/back.jpg",
                    "textures/skybox/front.jpg",
                    "textures/skybox/bottom.jpg",
                    "textures/skybox/top.jpg",
                ]
            },

        };

        for (const key in this.textures) {
            if (this.textures[key].type === "texture") {
                this.textures[key] = new THREE.TextureLoader(this.manager).load(key, this.textures[key].fn);
                this.textures[key].anisotropy = 16;
            }
            else if (this.textures[key].type === "cubeTexture") {
                this.textures[key] = new THREE.CubeTextureLoader(this.manager).load(this.textures[key].urls);
                this.textures[key].anisotropy = 16;
            }
        }

        //lights
        let ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        this.sun = new THREE.DirectionalLight(0xffffff, 0.5);
        this.sun.castShadow = true;
        if (this.graphics) {
            this.sun.shadow.camera.left = -200;
            this.sun.shadow.camera.right = 200;
            this.sun.shadow.camera.top = 200;
            this.sun.shadow.camera.bottom = -200;
            this.sun.shadow.mapSize.width = 2048;//32768;
            this.sun.shadow.mapSize.height = 2048;//32768;
            this.sun.shadow.camera.near = 0.1;
            this.sun.shadow.camera.far = 1000;
        }
        this.sun.position.set(170, 130, 280);
        this.sun.lookAt(new THREE.Vector3(0, this.player.height, 0));
        // this.scene.add(new THREE.DirectionalLightHelper( this.sun ));
        // this.scene.add(new THREE.CameraHelper( this.sun.shadow.camera ));
        this.scene.add(this.sun);

        //skybox            
        const directions = ["left", "right", "back", "front", "bottom", "top"];
        let materialArray = [];
        for (let i = 0; i < 6; i++)
            materialArray.push(new THREE.MeshBasicMaterial({
                map: this.textures["textures/skybox/" + directions[i] + ".jpg"],
                side: THREE.BackSide,
                wireframe: this.USE_WIREFRAME
            }));
        const skyGeometry = new THREE.CubeGeometry(10000, 10000, 10000);
        const skyMaterial = new THREE.MeshFaceMaterial(materialArray);
        const skyBox = new THREE.Mesh(skyGeometry, skyMaterial);
        skyBox.rotation.x += Math.PI / 2;
        skyBox.position.set(0, 5, 0);
        this.scene.add(skyBox);

        //floor
        if (this.graphics) {
            this.meshFloor = new THREE.Mesh(
                new THREE.PlaneGeometry(250, 250, 10, 10),
                new THREE.MeshPhongMaterial({
                    map: this.textures["textures/concrete/concrete_d.png"],
                    bumpMap: this.textures["textures/concrete/concrete_b.png"],
                    specularMap: this.textures["textures/concrete/concrete_s.png"],
                    //color: 0xcccccc,
                    wireframe: this.USE_WIREFRAME
                })
            );
            this.meshFloor.rotation.x -= Math.PI / 2;
            this.meshFloor.receiveShadow = true;
        } else {
            this.meshFloor = new THREE.Mesh(
                new THREE.PlaneGeometry(250, 250, 10, 10),
                new THREE.MeshPhongMaterial({
                    //color: 0xcccccc,
                    wireframe: this.USE_WIREFRAME
                })
            );
            this.meshFloor.rotation.x -= Math.PI / 2;
            this.meshFloor.receiveShadow = false;
        }
        this.scene.add(this.meshFloor);

        //water
        let waterGeometry = new THREE.PlaneBufferGeometry(8000, 8000);
        if (this.graphics) {
            this.water = new THREE.Water(
                waterGeometry,
                {
                    textureWidth: 1024,
                    textureHeight: 1024,
                    waterNormals: this.textures['textures/water/waternormals.jpg'],
                    alpha: 0.9,
                    sunDirection: this.sun.position.clone().normalize(),
                    sunColor: 0xffffff,
                    waterColor: 0x00190f,
                    distortionScale: 5,
                    fog: this.scene.fog !== undefined,
                    wireframe: this.USE_WIREFRAME
                }
            );
            this.water.material.uniforms.size.value = 1;
        } else {
            this.water = new THREE.Water(
                waterGeometry,
                {
                    alpha: 0.9,
                    sunDirection: this.sun.position.clone().normalize(),
                    sunColor: 0xffffff,
                    waterColor: 0x00190f,
                    distortionScale: 5,
                    fog: this.scene.fog !== undefined,
                    wireframe: this.USE_WIREFRAME
                }
            );
        }
        this.water.position.set(0, -1, 0);
        this.water.rotation.x = - Math.PI / 2;
        this.scene.add(this.water);

        //mesh
        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshPhongMaterial({ color: 0xff4444, wireframe: this.USE_WIREFRAME })
        );
        this.mesh.position.set(0, 1, 0);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        this.mesh.name = "rotateCube";
        this.scene.add(this.mesh);

        //self
        this.self = {};
        this.self.yaw = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshPhongMaterial({ color: 0xff4444, wireframe: this.true })
        );
        this.self.yaw.position.set(0, this.player.height, 0);
        this.scene.add(this.self.yaw);

        this.self.pitch = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshPhongMaterial({ color: 0xff4444, wireframe: this.USE_WIREFRAME })
        );
        this.self.pitch.receiveShadow = true;
        this.self.pitch.castShadow = true;
        this.self.yaw.add(this.self.pitch);

        //camera
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10000);
        //this.camera.position.set(0,2,-5);
        this.camera.rotation.set(0, Math.PI, 0);
        //this.scene.add( new THREE.CameraHelper( this.camera ) );
        this.self.pitch.add(this.camera);

        //renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        //add to document
        document.body.appendChild(this.renderer.domElement);

        //eventlisteners
        window.addEventListener('keydown', ev => { this.keys[ev.keyCode] = true });
        window.addEventListener('keyup', ev => { delete this.keys[ev.keyCode]; });

        window.addEventListener('resize', ev => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.initPointerlock();
    }

    render() {
        this.stats0.start();
        //center rotating cube
        this.mesh.rotation.x += 0.01;
        this.mesh.rotation.y += 0.02;

        this.renderer.render(this.scene, this.camera);

        requestAnimationFrame(() => { this.render(); });
        this.stats0.end();
    }

    animate() {
        //water
        this.water.material.uniforms.time.value += 1.0 / 60.0;

        //movement
        const move = (degRad) => {
            this.self.yaw.position.add(
                this.camera.getWorldDirection(new THREE.Vector3())
                    .applyAxisAngle(new THREE.Vector3(0, 1, 0), degRad)
                    .multiply(new THREE.Vector3(this.player.speed, 0, this.player.speed))
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
            this.self.yaw.rotation.y += this.player.turnSpeed;
        }
        if (this.keys[39]) { // right arrow key
            this.self.yaw.rotation.y -= this.player.turnSpeed;
        }
        if (this.keys[40]) { // down arrow key
            this.self.pitch.rotation.x += this.player.turnSpeed;
        }
        if (this.keys[38]) { // up arrow key
            this.newBullet(ws.playerId);
        }
        if (this.keys[16]) { // left shift
            this.player.speed = 0.8;
            this.player.turnSpeed = Math.PI * 0.02;
        }
        else {
            this.player.speed = 0.4;
            this.player.turnSpeed = Math.PI * 0.005;
        }
        if (this.keys[32]) { // space bar
            this.self.yaw.position.y += this.player.speed;
        }

        //gravity
        if (Math.abs(this.self.yaw.position.x) > 125 || Math.abs(this.self.yaw.position.z) > 125) {
            this.self.yaw.position.y -= this.player.gravity;
        }
        else if (this.self.yaw.position.y < this.player.height) {
            this.self.yaw.position.y = this.player.height;
        }
        else if (this.self.yaw.position.y > this.player.height) {
            this.self.yaw.position.y -= this.player.gravity;
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
                if (sc[i].position.distanceTo(new THREE.Vector3(json.x, json.y, json.z)) > this.bullet.end) {
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
                                .multiplyScalar(this.bullet.speed)
                        );
                        sc[i].position.y -= this.bullet.gravity;
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
        if (this.graphics) {
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
                    wireframe: this.USE_WIREFRAME
                })
            );
        } else {
            var avatar = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 1),
                new THREE.MeshStandardMaterial({
                    color: obj.color,
                    wireframe: this.USE_WIREFRAME
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
                new THREE.BoxGeometry(0.2, 0.2, this.bullet.speed),
                new THREE.MeshPhongMaterial({ color: ws.getPlayer(msg.nb.id.split("_")[1]).color, wireframe: this.USE_WIREFRAME })
            );
            bullet.receiveShadow = true;
            bullet.castShadow = true;

            bullet.name = msg.nb.id;
            bullet.position.set(msg.nb.loc.x, msg.nb.loc.y, msg.nb.loc.z);
            bullet.rotation.set(msg.nb.loc._x, msg.nb.loc._y, msg.nb.loc._z);
        } else {
            bullet = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.2, this.bullet.speed),
                new THREE.MeshPhongMaterial({ color: ws.getPlayer(ws.playerId).color, wireframe: this.USE_WIREFRAME })
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
        if (obj.color) game.self.pitch.material.color.setHex(parseInt(obj.color.substring(1), 16))
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

    doneLoading() { }

    initPointerlock() {
        this.havePointerLock = 'pointerLockElement' in document ||
            'mozPointerLockElement' in document ||
            'webkitPointerLockElement' in document;

        const setPointerlock = () => {
            if (game.pointerLocked === true) return;
            game.pointerLocked = true;
            game.renderer.domElement.requestPointerLock();
            game.renderer.domElement.addEventListener("mousemove", moveCam, false);

            setTimeout(() => {
                document.addEventListener('pointerlockchange', lockChange, false);
                document.addEventListener('mozpointerlockchange', lockChange, false);
                document.addEventListener("mousedown", shoot, false);
                document.addEventListener("mousedown", shoot, false);
            }, 0);
        }

        const lockChange = () => {
            if (game.pointerLocked === true) {
                game.pointerLocked = false;
                game.renderer.domElement.removeEventListener("mousemove", moveCam);
                document.removeEventListener("mousedown", shoot, false);
                document.removeEventListener('pointerlockchange', lockChange, false);
                document.removeEventListener('mozpointerlockchange', lockChange, false);
            }
        }

        const moveCam = (event) => {
            var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
            var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
            game.self.yaw.rotation.y -= movementX * 0.002;
            game.self.pitch.rotation.x += movementY * 0.002;
        }

        const shoot = (ev) => {
            game.newBullet(ws.playerId);
        }

        if (this.havePointerLock === true) {
            this.pointerLocked = false;

            this.renderer.domElement.requestPointerLock = this.renderer.domElement.requestPointerLock ||
                this.renderer.domElement.mozRequestPointerLock || this.renderer.domElement.webkitRequestPointerLock;
            this.renderer.domElement.addEventListener("click", setPointerlock);
        }
    }
}