class Pysics {

    constructor() {
        this.collidableMeshes = [];
    }

    setColidable(mesh) {
        this.collidableMeshes.push(mesh);
    }

    gravity(directionVector, gravity, terminalVelocity) {
        pObject.velocity.y -= Math.abs(directionVector.y) < terminalVelocity ? gravity : 0;
        pObject.mesh.position.y += pObject.velocity.y;
    }

    collision(position, directionVector) {
        const ray = new THREE.Raycaster(position, directionVector, 0.5, 1);
        const collisionResults = ray.intersectObjects(this.collidableMeshes);
        return collisionResults.length > 0;
    }

    animate(){
        
    }
} 