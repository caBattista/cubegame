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

    do(option) {
        switch (option) {
            case "moveForward": this.moveDegRad(0); break;
            case "moveBackward": this.moveDegRad(Math.PI); break;
            case "moveLeft": this.moveDegRad(Math.PI / 2); break;
            case "moveRight": this.moveDegRad(-Math.PI / 2); break;
            case "jump": this.elements.yaw.position.y += this.settings.player.speed; break;
            case "sprint":
                this.settings.player.speed = 2;
                break;
            case "setDefaults":
                this.settings.player.speed = 0.4;
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