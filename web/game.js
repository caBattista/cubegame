class Game {
    constructor() {
        //settings
        this.USE_WIREFRAME = false;
        this.scene = new THREE.Scene();
        this.player = { height:1.8, speed:0.2, turnSpeed:Math.PI*0.005, gravity: 0.5};
        this.bullet = { height:0.6, speed:2, end: 500, gravity: 0};
        this.keys = {};
        this.pointerLocked = false;
        this.audio = {ugh: new Audio('ugh.mp3')};

        //lights
        let ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        let directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.castShadow = true;
        directionalLight.position.set(125, 150, 200);
        directionalLight.lookAt(new THREE.Vector3(0,this.player.height,0));
        directionalLight.shadow.camera.near = 0;
        directionalLight.shadow.camera.far = 1000;
        this.scene.add( directionalLight );
    
        //skybox            
        let directions  = ["left", "right", "back", "front", "bottom", "top"];
        let materialArray = [];
        for (let i = 0; i < 6; i++)
            materialArray.push( new THREE.MeshBasicMaterial({
            map: THREE.ImageUtils.loadTexture("skybox/" + directions[i] + ".jpg"),
            side: THREE.BackSide
        }));
        let skyGeometry = new THREE.CubeGeometry( 500, 500, 500 );
        let skyMaterial = new THREE.MeshFaceMaterial( materialArray );
        let skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
        skyBox.rotation.x += Math.PI / 2;
        skyBox.position.set(0, this.player.height, -5);
        this.scene.add( skyBox );

        //floor
        let meshFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(250,250, 10,10),
            new THREE.MeshPhongMaterial({color:0xcccccc, wireframe:this.USE_WIREFRAME})
        );
        meshFloor.rotation.x -= Math.PI / 2;
        meshFloor.receiveShadow = true;
        this.scene.add(meshFloor);
        
        //mesh
        let mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1,1,1),
            new THREE.MeshPhongMaterial({color:0xff4444, wireframe:this.USE_WIREFRAME})
        );
        mesh.position.set(0, 1, 0);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        mesh.name = "rotateCube";
        this.scene.add(mesh);

        //self
        this.self = new THREE.Mesh();
        this.self.position.set(0, this.player.height, 1);


        //camera
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);  
        this.camera.position.set(0, this.player.height, 1);
        //this.camera.lookAt(new THREE.Vector3(0,this.player.height,0));
        //this.self.add(this.camera);

        this.scene.add(self);

        //renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap;

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
        
        //mouse
        var havePointerLock = 'pointerLockElement' in document ||
        'mozPointerLockElement' in document ||
        'webkitPointerLockElement' in document;
        if(havePointerLock === true){
            // Ask the browser to lock the pointer
            let canvas = document.getElementsByTagName("canvas")[0];
            canvas.requestPointerLock = canvas.requestPointerLock ||
            canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;

            const setPointerlock = ev => {
                if(this.pointerLocked === true) return;

                this.pointerLocked = true;
                canvas.requestPointerLock();


                const moveCam = (ev) => {
                    this.camera.rotation.set(
                        this.camera.rotation._x + ev.movementY/1500,
                        this.camera.rotation._y + ev.movementX/1500,
                        this.camera.rotation._z
                     );
                }
                canvas.addEventListener("mousemove", moveCam, false);

                const shoot = (ev) => {
                    this.newBullet(ws.playerId);
                } 
                canvas.addEventListener("mousedown", shoot, false);

                const lockChange = () => {
                    if(this.pointerLocked === true){
                        this.pointerLocked = false;
                        canvas.removeEventListener("mousemove", moveCam);
                        canvas.removeEventListener("mousedown", shoot);
                        document.removeEventListener('pointerlockchange', lockChange, false);
                        document.removeEventListener('mozpointerlockchange', lockChange, false);
                        document.removeEventListener('webkitpointerlockchange', lockChange, false);
                    }
                }
                setTimeout(() => {
                    document.addEventListener('pointerlockchange', lockChange, false);
                    document.addEventListener('mozpointerlockchange', lockChange, false);
                    document.addEventListener('webkitpointerlockchange', lockChange, false);
                },0);
            }
            canvas.addEventListener("click", setPointerlock);


            // Ask the browser to release the pointer
            // document.exitPointerLock = document.exitPointerLock ||
            // document.mozExitPointerLock ||
            // document.webkitExitPointerLock;
            //document.exitPointerLock();
        }


        //start animaiton
        this.animate();
    }

    animate(){
        //movement
        if(this.keys[87]){ // W key
            this.camera.position.x -= Math.sin(this.camera.rotation.y) * this.player.speed;
            this.camera.position.z -= -Math.cos(this.camera.rotation.y) * this.player.speed;
        }
        if(this.keys[83]){ // S key
            this.camera.position.x += Math.sin(this.camera.rotation.y) * this.player.speed;
            this.camera.position.z += -Math.cos(this.camera.rotation.y) * this.player.speed;
        }
        if(this.keys[65]){ // A key
            this.camera.position.x += Math.sin(this.camera.rotation.y + Math.PI/2) * this.player.speed;
            this.camera.position.z += -Math.cos(this.camera.rotation.y + Math.PI/2) * this.player.speed;
        }
        if(this.keys[68]){ // D key
            this.camera.position.x += Math.sin(this.camera.rotation.y - Math.PI/2) * this.player.speed;
            this.camera.position.z += -Math.cos(this.camera.rotation.y - Math.PI/2) * this.player.speed;
        }

        if(this.keys[37]){ // left arrow key
            this.camera.rotation.y -= this.player.turnSpeed;
        }
        if(this.keys[39]){ // right arrow key
            this.camera.rotation.y += this.player.turnSpeed;
        }
        if(this.keys[40]){ // down arrow key
            //this.camera.rotation.x += this.player.turnSpeed;
        }
        if(this.keys[38] && !this.keys[38].pressed){ // up arrow key
            this.keys[38] = {pressed: true};
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
            this.camera.position.y += 1;
        }

        //check if fall map
        if (Math.abs(this.camera.position.x) > 125 || Math.abs(this.camera.position.z) > 125)  {
            this.camera.position.y -= this.player.gravity;
        }
        //gravity
        else if(this.camera.position.y > 1){
            this.camera.position.y -= this.player.gravity;
        }

        //despawn
        if(this.camera.position.y < -25){
            this.ws.sendJson({
                hit: {   
                    id: ws.playerId
                }
            });
            this.playAudio("ugh");
        }

        //bullets
        let sc = this.scene.children;
        for (let i = 0; i < sc.length; i++) {
            if (sc[i].name.split("_")[0] === "b") {
                let json = JSON.parse(sc[i].startPos);
                if(sc[i].position.distanceTo(new THREE.Vector3(json.x, json.y, json.z)) > this.bullet.end){
                    this.scene.remove(sc[i]);
                }
                else{
                    sc[i].position.x -= Math.sin(sc[i].rotation.y) * this.bullet.speed;
                    sc[i].position.y -= this.bullet.gravity;
                    sc[i].position.z -= -Math.cos(sc[i].rotation.y) * this.bullet.speed;
                }
                if (this.colisionDetect(this.camera, sc[i]) && sc[i].name.split("_")[1] !== ws.playerId) {
                    this.ws.sendJson({
                        hit: {   
                            id: ws.playerId,
                            hitter: sc[i].name.split("_")[1]
                        }
                    });
                    this.playAudio("ugh");
                }
            }   
        }

        //center rotating cube
        let mesh = this.scene.getObjectByName("rotateCube");
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.02;

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => { this.animate(); });
    }

    newAvatar(obj) {
        let avatar = new THREE.Mesh(
            new THREE.BoxGeometry(2,2,2),
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
                new THREE.MeshPhongMaterial({color: this.ws.getPlayer(msg.nb.id.split("_")[1]).color, wireframe:this.USE_WIREFRAME})
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
                new THREE.MeshPhongMaterial({color: this.ws.getPlayer(this.ws.playerId).color, wireframe:this.USE_WIREFRAME})
            );
            bullet.receiveShadow = true;
            bullet.castShadow = true;

            bullet.name = "b_" + msg;
            bullet.position.set(this.camera.position.x, this.camera.position.y - this.bullet.height, this.camera.position.z);
            bullet.rotation.set(this.camera.rotation._x,this.camera.rotation._y,this.camera.rotation._z);

            this.ws.sendJson({
                nb: {   
                    id: bullet.name,
                    loc: {
                        x: this.ws.rndFlt(bullet.position.x),
                        y: this.ws.rndFlt(bullet.position.y),
                        z: this.ws.rndFlt(bullet.position.z),
                        _x: this.ws.rndFlt(bullet.rotation._x),
                        _y: this.ws.rndFlt(bullet.rotation._y),
                        _z: this.ws.rndFlt(bullet.rotation._z),
                    },
                }
            });
        }

        bullet.startPos = JSON.stringify(bullet.position);
        this.scene.add(bullet);
    }

    colisionDetect(obj1, obj2, dist = 1.5) {
        if(obj1 && obj2){
            return obj1.position.distanceTo(obj2.position) < dist ? true : false;
        }
    }

    setSelf(loc, rot = true){
        this.camera.position.set(loc.x, loc.y, loc.z);
        if(rot) this.camera.rotation.set(loc._x, loc._y, loc._z);
        //else this.camera.lookAt(new THREE.Vector3(0, this.player.height, 0));
    }

    setPlayer(id, loc) {
        let obj = this.scene.getObjectByName(id);
        if (obj) {
            obj.position.set(loc.x, loc.y, loc.z);
            obj.rotation.set(loc._x, loc._y, loc._z);
        }
    }

    playAudio(name) {
        try {
            this.audio[name].play();
        } catch (error) {}
    }
}