const THREE = require("./three.js");
class Simulator {

    constructor() {
        this.maps = {};
        this.startChageCountValidation();
    }

    offences = {
        "tmcps": "too many changes per second",
        "pmtf": "player movement to fast",
    }

    addMap(mapId) {
        this.maps[mapId] = { players: {} };
    }

    addPlayerToMap(playerId, mapId) {
        this.maps[mapId].players[playerId] = { offences: {} };
    }

    changePlayer(playerId, posRot) {
        const mapId = this.getMapOfPlayer(playerId);
        if (!mapId) { return; }
        const player = this.maps[mapId].players[playerId];

        if (player.posRot && player.posRot.position) {
            const distance =
                new THREE.Vector3(posRot.position.x, posRot.position.y, posRot.position.z).distanceTo(
                    new THREE.Vector3(player.posRot.position.x, player.posRot.position.y, player.posRot.position.z));
            if (distance > 0.6) { this.addOffence(player, "pmtf"); }
        }

        this.maps[mapId].players[playerId].changeCount++;
        this.maps[mapId].players[playerId].posRot = posRot;
        console.log("SM: ", JSON.stringify(this.maps, null, 1))
    }

    removePlayer(){
        this.getPlayers((mapId, playerId) => {
            delete this.maps[mapId].players[playerId];
        })
    }

    addOffence(player, OId) {
        player.offences[OId] = player.offences[OId] > 0 ? ++player.offences[OId] : 1;
    }

    getPlayers(callback) {
        const mapIds = Object.keys(this.maps);
        for (let i = 0; i < mapIds.length; i++) {
            const playerIds = Object.keys(this.maps[mapIds[i]].players);
            for (let j = 0; j < playerIds.length; j++) {
                callback(mapIds[i], playerIds[j]);
            }
        }
    }

    getPlayersIdsOfMap(mapId) {
        return Object.keys(this.maps[mapId].players);
    }

    getMapOfPlayer(currentPlayerId) {
        let res;
        this.getPlayers((mapId, playerId) => {
            if (currentPlayerId === playerId) { res = mapId; }
        })
        return res;
    }

    //checks if players are running higher fps in game
    startChageCountValidation() {

        //set changecount of all palyers 0
        this.getPlayers((mapId, playerId) => {
            this.maps[mapId].players[playerId].changeCount = 0;
        })

        this.changeCountInterv = setInterval(() => {
            this.getPlayers((mapId, playerId) => {
                if (this.maps[mapId].players[playerId].changeCount > 60) {
                    this.addOffence(this.maps[mapId].players[playerId], "tmcps");
                }
                this.maps[mapId].players[playerId].changeCount = 0;
            })
        }, 1000);
    }

    stopChageCountValidation() {
        clearInterval(this.changeCountInterv);
    }

    removeOffenders() {
        let res = [];
        this.getPlayers((mapId, playerId) => {
            const suspect = this.maps[mapId].players[playerId];
            if (Object.keys(suspect.offences).length > 0) {
                res.push({ id: playerId, offences: suspect.offences });
                delete this.maps[mapId].players[playerId];
            }
        })
        return res;
    }
}
module.exports = Simulator;