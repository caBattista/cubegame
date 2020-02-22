class Bullet {

    constructor(settings) {
        this.settings = settings;
    }

    elements = {}

    addElementsToscene(scene, msg, fromWS) {
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
        scene.add(bullet);
        this.elements.bullet = bullet;
    }
}