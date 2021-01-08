class Self {

    constructor() { }

    init(settings, manager, scene, physics) {
        this.settings = settings.self;
        this.elements = {};
        this.createElements(scene);
        physics.addMesh(this.elements.yaw);
        return this;
    }

    createElements(scene) {

        const yaw = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshPhongMaterial({ color: 0xff4444, wireframe: this.settings.useWireframe })
        );
        yaw.position.set(0, this.settings.height, 0);

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

        scene.add(yaw);
    }

    changespeeed(s) { this.settings.speed = s; }

    moveDegRad(degRad) {
        this.elements.yaw.position.add(
            this.elements.camera.getWorldDirection(new THREE.Vector3())
                .applyAxisAngle(new THREE.Vector3(0, 1, 0), degRad)
                .multiply(new THREE.Vector3(this.settings.speed, 0, this.settings.speed))
        );
    }

    do(option) {
        switch (option) {
            case "controls_forward": this.moveDegRad(0); break;
            case "controls_backward": this.moveDegRad(Math.PI); break;
            case "controls_left": this.moveDegRad(Math.PI / 2); break;
            case "controls_right": this.moveDegRad(-Math.PI / 2); break;
            case "controls_jump": this.elements.yaw.position.y += this.settings.speed; break;
            case "controls_sprint":
                this.settings.speed = 2;
                break;
            case "setDefaults":
                this.settings.speed = 0.4;
                break;
        }
    }

    moveCam(x, y) {
        this.elements.yaw.rotation.y -= x * 0.002;
        this.elements.pitch.rotation.x += y * 0.002;
    }

    rndFlt(num, dec = 3) {
        return parseFloat(num.toFixed(dec));
    }

    getPosRot() {
        const posRaw = this.elements.pitch.getWorldPosition(new THREE.Vector3());
        const rotRaw = new THREE.Euler().setFromQuaternion(this.elements.pitch.getWorldQuaternion(new THREE.Quaternion()));
        return {
            position: {
                x: this.rndFlt(posRaw.x),
                y: this.rndFlt(posRaw.y),
                z: this.rndFlt(posRaw.z)
            },
            rotation: {
                x: this.rndFlt(rotRaw._x),
                y: this.rndFlt(rotRaw._y),
                z: this.rndFlt(rotRaw._z)
            }
        };
    }
}