const THREE = require("./three.js");
class Simulator {

    constructor() {
        this.maps = {};
    }

    addMap(mapId) {
        this.maps[mapId] = { scene: new THREE.Scene(), players: {} }
    }

    addPlayer(clientId, posRot) {
        this.players[clientId] = { posRot: posRot };
    }

    changePlayer(clientId, posRot) {
        this.players[clientId] = { posRot: posRot };
    }

}
module.exports = Simulator;