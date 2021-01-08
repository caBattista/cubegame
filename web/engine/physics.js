class Pysics {

    constructor() { }

    init(settings) {
        this.settings = settings.physics;
        this.dynamicMeshes = [];
        return this;
    }

    addMesh(mesh) {
        this.dynamicMeshes.push(mesh);
    };

    // advanced Gravity
    // gravity(directionVector, gravity, terminalVelocity) {
    //     pObject.velocity.y -= Math.abs(directionVector.y) < terminalVelocity ? gravity : 0;
    //     pObject.mesh.position.y += pObject.velocity.y;
    // }

    applyGravity(mesh) {
        // simplified Gravity
        // const meshHight = new THREE.Box3().setFromObject(mesh).getSize();
        // console.log(meshHight);
        if (Math.abs(mesh.position.x) > 125 || Math.abs(mesh.position.z) > 125) {
            mesh.position.y -= this.settings.gravity;
        }
        else if (mesh.position.y < 1) {
            mesh.position.y = 1;
        }
        else if (mesh.position.y > 1) {
            mesh.position.y -= this.settings.gravity;
        }
    }

    applyCollision(position, directionVector) {
        const ray = new THREE.Raycaster(position, directionVector, 0.5, 1);
        const collisionResults = ray.intersectObjects(this.dynamicMeshes);
        return collisionResults.length > 0;
    }

    animate() {
        this.dynamicMeshes.forEach(mesh => {
            this.applyGravity(mesh);
            this.applyCollision(mesh);
        })
    }
} 