class Player {

    constructor(settings) {
        this.settings = settings;
    }

    textures = {
        "textures/metal/Metal06_nrm.jpg": { type: "texture" },
        "textures/metal/Metal06_rgh.jpg": { type: "texture" },
        "textures/metal/Metal06_met.jpg": { type: "texture" }
    }

    loadTextures(manager) {
        const tl = new THREE.TextureLoader(manager);
        const ctl = new THREE.CubeTextureLoader(manager);
        for (const key in this.textures) {
            if (this.textures[key].type === "texture") {
                this.textures[key] = tl.load(key, this.textures[key].fn);
                this.textures[key].anisotropy = 16;
            }
            else if (this.textures[key].type === "cubeTexture") {
                this.textures[key] = ctl.load(this.textures[key].urls);
                this.textures[key].anisotropy = 16;
            }
        }
    }

    elements = {}

    addElementsToscene(scene, obj) {
        const playerSettings = {
            High: {
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
            }, Low: {
                color: obj.color,
                wireframe: this.settings.useWireframe
            }
        }

        const player = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial(playerSettings[this.settings.graphics.quality])
        );

        player.name = String(obj.id);
        player.receiveShadow = true;
        player.castShadow = true;
        player.position.set(obj.loc.x, obj.loc.y, obj.loc.z);
        player.rotation.set(obj.loc._x, obj.loc._y, obj.loc._z);

        scene.add(player);
        this.elements.player = player;
    }
}