class Self {

    constructor(settings) {
        this.settings = settings;
    }

    elements = {}

    addElementsToscene(scene) {

        const yaw = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshPhongMaterial({ color: 0xff4444, wireframe: this.settings.useWireframe })
        );
        yaw.position.set(0, this.settings.player.height, 0);
        scene.add(yaw);

        const pitch = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshPhongMaterial({ color: 0xff4444, wireframe: this.settings.useWireframe })
        );
        pitch.receiveShadow = true;
        pitch.castShadow = true;
        yaw.add(pitch);

        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10000);
        //camera.position.set(0,2,-5);
        camera.rotation.set(0, Math.PI, 0);
        //scene.add( new THREE.CameraHelper( camera ) );
        pitch.add(camera);

        this.elements.yaw = yaw;
        this.elements.pitch = pitch;
        this.elements.camera = camera;
    }

    moveDegRad(degRad) {
        this.elements.yaw.position.add(
            this.elements.camera.getWorldDirection(new THREE.Vector3())
                .applyAxisAngle(new THREE.Vector3(0, 1, 0), degRad)
                .multiply(new THREE.Vector3(this.settings.player.speed, 0, this.settings.player.speed))
        );
    }

    move(direction) {
        const res = {
            "forward": () => { this.moveDegRad(0) },
            "backward": () => { this.moveDegRad(Math.PI) },
            "left": () => { this.moveDegRad(Math.PI / 2) },
            "right": () => { this.moveDegRad(-Math.PI / 2) },
            "up": () => { this.elements.yaw.position.y += this.settings.player.speed },
            "run": () => {
                this.settings.player.speed = 0.8;
                this.settings.player.turnSpeed = Math.PI * 0.02;
            },
            "walk": () => {
                this.settings.player.speed = 0.4;
                this.settings.player.turnSpeed = Math.PI * 0.005;
            },

            "rotateLeft": () => { this.elements.yaw.rotation.y += this.settings.player.turnSpeed },
            "rotateRight": () => { this.elements.yaw.rotation.y -= this.settings.player.turnSpeed },
            "rotateForward": () => { this.elements.pitch.rotation.x += this.settings.player.turnSpeed }
        }
        res[direction]();
    }

    render(keys) {
        //movement
        if (keys[87]) this.move("forward")
        if (keys[83]) this.move("backward")
        if (keys[65]) this.move("left")
        if (keys[68]) this.move("right")
        if (keys[32]) this.move("up")
        if (keys[16]) this.move("run")
        else this.move("walk")
    }
}