class Game {
    constructor() {
        //settings
        this.USE_WIREFRAME = false;
        this.scene = new THREE.Scene();
        this.player = { height:0.5, speed:0.5, turnSpeed:Math.PI*0.005, gravity: 0.3};
        this.bullet = { height:0.4, speed:0.8, end: 500, gravity: 0};
        this.keys = {};
        this.audio = {ugh: new Audio('audio/ugh.mp3'), hit: new Audio('audio/hit.mp3') };

        //stats
        this.stats = new Stats();
         // 0: fps, 1: ms, 2: mb, 3+: custom
        this.stats.showPanel( 0 );
        document.body.appendChild( this.stats.dom );

        //lights
        let ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        this.sun = new THREE.DirectionalLight (0xffffff, 0.5);
        this.sun.castShadow = true;
        this.sun.shadow.camera.left = -200;
        this.sun.shadow.camera.right = 200;
        this.sun.shadow.camera.top = 200;
        this.sun.shadow.camera.bottom = -200;
        this.sun.shadow.mapSize.width = 2048;//32768;
        this.sun.shadow.mapSize.height = 2048;//32768;
        this.sun.shadow.camera.near = 0.1;
        this.sun.shadow.camera.far = 1000;
        this.sun.position.set(170, 130, 280);
        this.sun.lookAt(new THREE.Vector3(0,this.player.height,0));
        // this.scene.add(new THREE.DirectionalLightHelper( this.sun ));
        // this.scene.add(new THREE.CameraHelper( this.sun.shadow.camera ));
        this.scene.add(this.sun);
    
        //skybox            
        const directions  = ["left", "right", "back", "front", "bottom", "top"];
        let materialArray = [];
        for (let i = 0; i < 6; i++)
            materialArray.push( new THREE.MeshBasicMaterial({
            map: THREE.ImageUtils.loadTexture("skybox/" + directions[i] + ".jpg"),
            side: THREE.BackSide
        }));
        const skyGeometry = new THREE.CubeGeometry( 500, 500, 500 );
        const skyMaterial = new THREE.MeshFaceMaterial( materialArray );
        const skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
        skyBox.rotation.x += Math.PI / 2;
        skyBox.position.set(0, this.player.height, -5);
        this.scene.add( skyBox );

        //floor
        const meshFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(250,250, 10,10),
            new THREE.MeshPhongMaterial({color:0xcccccc, wireframe:this.USE_WIREFRAME})
        );
        meshFloor.rotation.x -= Math.PI / 2;
        meshFloor.receiveShadow = true;
        this.scene.add(meshFloor);
        
        //mesh
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1,1,1),
            new THREE.MeshPhongMaterial({color:0xff4444, wireframe:this.USE_WIREFRAME})
        );
        mesh.position.set(0, 1, 0);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        mesh.name = "rotateCube";
        this.scene.add(mesh);

        //self
        this.self = {};
        this.self.yaw = new THREE.Object3D();
        this.self.yaw.position.set(0,this.player.height,0);
        this.scene.add(this.self.yaw);

        this.self.pitch = new THREE.Mesh(
            new THREE.BoxGeometry(1,1,1),
            new THREE.MeshPhongMaterial({color:0xff4444, wireframe:this.USE_WIREFRAME})
        );
        this.self.pitch.receiveShadow = true;
        this.self.pitch.castShadow = true;
        this.self.yaw.add(this.self.pitch);

        //camera
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);
        //this.camera.position.set(0,2,-5);
        this.camera.rotation.set(0, Math.PI, 0);
        //this.scene.add( new THREE.CameraHelper( this.camera ) );
        this.self.pitch.add(this.camera);

        //renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        // this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // this.renderer.gammaInput = true;
        // this.renderer.gammaOutput = true;

        //add to document
        document.body.appendChild(this.renderer.domElement);

        //eventlisteners
        window.addEventListener('keydown', ev => { this.keys[ev.keyCode] = true });
        window.addEventListener('keyup', ev => { delete this.keys[ev.keyCode]; });

        window.addEventListener('resize', ev => {
            this.camera.aspect = window.innerWidth/window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.initPointerlock();
        //start animaiton
        this.animate();
    }

    animate(){
        this.stats.begin();
        //movement
        const move = (degRad) => {
            this.self.yaw.position.add(
                this.camera.getWorldDirection(new THREE.Vector3())
                    .applyAxisAngle(new THREE.Vector3(0,1,0), degRad)
                    .multiply(new THREE.Vector3(this.player.speed, 0, this.player.speed))
            );
        }
        if(this.keys[87]){ // W key
            move(0);
        }
        if(this.keys[83]){ // S key
            move(Math.PI);
        }
        if(this.keys[65]){ // A key
            move(Math.PI/2);
        }
        if(this.keys[68]){ // D key
            move(-Math.PI/2);
        }
        if(this.keys[37]){ // left arrow key
            this.self.yaw.rotation.y += this.player.turnSpeed;
        }
        if(this.keys[39]){ // right arrow key
            this.self.yaw.rotation.y -= this.player.turnSpeed;
        }
        if(this.keys[40]){ // down arrow key
            this.self.pitch.rotation.x += this.player.turnSpeed;
        }
        if(this.keys[38]){ // up arrow key
            this.newBullet(ws.playerId);
        }
        if(this.keys[16]){ // left shift
            this.player.speed = 0.4;
            this.player.turnSpeed = Math.PI*0.02;
        }
        else{
            this.player.speed = 0.2;
            this.player.turnSpeed = Math.PI*0.005;
        }
        if(this.keys[32]){ // space bar
            this.self.yaw.position.y += 1;
        }

        //gravity
        if (Math.abs(this.self.yaw.position.x) > 125 || Math.abs(this.self.yaw.position.z) > 125)  {
            this.self.yaw.position.y -= this.player.gravity;
        }
        else if(this.self.yaw.position.y < this.player.height ){
            this.self.yaw.position.y = this.player.height;
        }
        else if(this.self.yaw.position.y > this.player.height) {
            this.self.yaw.position.y -= this.player.gravity;
        }

        //despawn
        if(this.self.yaw.position.y < -25){
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
                if(sc[i].position.distanceTo(new THREE.Vector3(json.x, json.y, json.z)) > this.bullet.end){
                    this.scene.remove(sc[i]);
                }
                else{
                    //check if bullet is near players
                    for (const player of ws.players) {
                        let playerObj = this.scene.getObjectByName(player.id);
                        if(sc[i].name.split("_")[1] !== player.id && playerObj && this.colisionDetect(playerObj, sc[i], 5)){
                            sc[i].prevPlayerInRange = sc[i].playerInRange;
                            sc[i].playerInRange = player.id;
                            break;
                        }
                        else if(sc[i].name.split("_")[1] !== player.id){
                            sc[i].prevPlayerInRange = sc[i].playerInRange;
                            sc[i].playerInRange = null;
                        }
                    }

                    if (sc[i].playerInRange !== sc[i].prevPlayerInRange && sc[i].playerInRange) {
                        sc[i].lookAt(this.scene.getObjectByName(sc[i].playerInRange).position);
                        //sc[i].rotation.set(sc[i].rotation._x, sc[i].rotation._y + Math.PI, sc[i].rotation._z);   
                    }

                    //hit detection
                    if (!this.waitForSpawn && sc[i].name.split("_")[1] !== ws.playerId && this.colisionDetect(this.self.yaw, sc[i])) {
                        this.waitForSpawn = true;
                        this.playAudio("ugh");
                        ws.sendJson({
                            hit: {   
                                id: ws.playerId,
                                hitter: sc[i].name.split("_")[1]
                            }
                        });
                        this.scene.remove(sc[i]);
                    }
                    else{
                        sc[i].position.add(
                            sc[i].getWorldDirection(new THREE.Vector3())
                                .multiplyScalar(this.bullet.speed)
                        );
                        sc[i].position.y -= this.bullet.gravity;
                    }
                }
            }   
        }

        //center rotating cube
        const mesh = this.scene.getObjectByName("rotateCube");
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.02;

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => { this.animate(); });
        this.stats.end();
    }

    newAvatar(obj) {
        const avatar = new THREE.Mesh(
            new THREE.BoxGeometry(1,1,1),
            new THREE.MeshPhongMaterial({color:obj.color, wireframe:this.USE_WIREFRAME})
        );
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
                new THREE.BoxGeometry(0.2,0.2,0.2),
                new THREE.MeshPhongMaterial({color: ws.getPlayer(msg.nb.id.split("_")[1]).color, wireframe:this.USE_WIREFRAME})
            );
            bullet.receiveShadow = true;
            bullet.castShadow = true;

            bullet.name = msg.nb.id;
            bullet.position.set(msg.nb.loc.x, msg.nb.loc.y, msg.nb.loc.z);
            bullet.rotation.set(msg.nb.loc._x, msg.nb.loc._y, msg.nb.loc._z);   
        }
        else{
            bullet = new THREE.Mesh(
                new THREE.BoxGeometry(0.2,0.2,0.2),
                new THREE.MeshPhongMaterial({color: ws.getPlayer(ws.playerId).color, wireframe:this.USE_WIREFRAME})
            );
            bullet.receiveShadow = true;
            bullet.castShadow = true;

            bullet.name = "b_" + msg;
            bullet.position.add(this.self.pitch.getWorldPosition(new THREE.Vector3()));
            bullet.position.y -= 0.25;
            bullet.rotation.setFromQuaternion( this.self.pitch.getWorldQuaternion(new THREE.Quaternion()));

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

    colisionDetect(obj1, obj2, dist = 0.8) {
        return obj1.position.distanceTo(obj2.position) < dist ? true : false;
    }

    setSelf(obj){
        this.waitForSpawn = false;
        this.self.yaw.name = obj.id;
        this.self.yaw.position.set(obj.loc.x, obj.loc.y, obj.loc.z);
        if(obj.color) game.self.pitch.material.color.setHex(parseInt(obj.color.substring(1), 16))
    }

    setPlayer(id, loc) {
        const obj = this.scene.getObjectByName(id);
        if (obj) {
            obj.position.set(loc.x, loc.y, loc.z);
            obj.rotation.set(loc._x, loc._y, loc._z);
        }
    }

    getPlayer(){
        return {
            position : this.self.pitch.getWorldPosition(new THREE.Vector3()),
            rotation : new THREE.Euler().setFromQuaternion(this.self.pitch.getWorldQuaternion(new THREE.Quaternion()))
        };
    }

    playAudio(name) {
        try {
            this.audio[name].play();
        } catch (error) {}
    }

    initPointerlock(){
        this.havePointerLock = 'pointerLockElement' in document ||
		'mozPointerLockElement' in document ||
        'webkitPointerLockElement' in document;
        
        const setPointerlock = () => {
            if(game.pointerLocked === true) return;
            game.pointerLocked = true;
            game.renderer.domElement.requestPointerLock();
            game.renderer.domElement.addEventListener("mousemove", moveCam, false);

            setTimeout(() => {
                document.addEventListener('pointerlockchange', lockChange, false);
                document.addEventListener('mozpointerlockchange', lockChange, false);
                document.addEventListener("mousedown", shoot, false);
                document.addEventListener("mousedown", shoot, false);
            },0);
        }

        const lockChange = () => {
            if(game.pointerLocked === true){
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

		if(this.havePointerLock === true){
			this.pointerLocked = false;

			this.renderer.domElement.requestPointerLock = this.renderer.domElement.requestPointerLock ||
			this.renderer.domElement.mozRequestPointerLock || this.renderer.domElement.webkitRequestPointerLock;
			this.renderer.domElement.addEventListener("click", setPointerlock);
		}
    }
}