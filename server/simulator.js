class Simulator {

    constructor() {
        this.maps = {};
    }

    addMap(mapId) {
        this.maps[mapId] = { players: {} }
    }

    addPlayer(clientId, posRot) {
        this.players[clientId] = { posRot: posRot };
    }

    changePlayer(clientId, posRot) {
        this.players[clientId] = { posRot: posRot };
    }

}
module.exports = Simulator;