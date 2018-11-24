class Websocket {
    constructor(game) {
        this.precision = 3;
        //htpps not working
        this.ws = new WebSocket(location.protocol === "https:" ? "wss://" + location.host : "ws://" + location.host);
        // When the ws is open, send some data to the server
        this.ws.onopen = () => {
            this.requestPlayer();
            this.ws.onmessage = e => {
                //console.log(e.data);
                this.handleMessage(e.data);
            };
        };
        // Log errors
        this.ws.onerror = error => {
            console.log('WebSocket Error ' + error);
        };
    }

    handleMessage(msgString) {
        let msg = JSON.parse(msgString);
        if(msg.ns){
            this.playerId = msg.ns.id;
            this.players.push(msg.ns);
            game.setSelf(msg.ns);
            let oldCam = JSON.stringify(game.getPlayer());

            setInterval(() => {
                let camLoc = game.getPlayer();
                let camString = JSON.stringify(camLoc);
                if (oldCam !== camString) {
                    oldCam = camString;
                    //console.log(camString);
                    this.sendJson({
                        udp: {   
                            id: this.playerId,
                            loc: {
                                x: this.rndFlt(camLoc.position.x),
                                y: this.rndFlt(camLoc.position.y),
                                z: this.rndFlt(camLoc.position.z),
                                _x: this.rndFlt(camLoc.rotation._x),
                                _y: this.rndFlt(camLoc.rotation._y),
                                _z: this.rndFlt(camLoc.rotation._z),
                            },
                        }
                    });
                }
            }, 33);
        } else if(msg.np) {
            if (msg.np.id !== this.playerId) {
                this.players.push(msg.np);
                game.newAvatar(msg.np);
            }
        } else if(msg.udp) {
            game.setPlayer(msg.udp.id, msg.udp.loc);
        } else if(msg.nb) {
            game.newBullet(msg,true);
        } else if(msg.sp) {
            msg.sp.id = this.playerId;
            game.setSelf(msg.sp);
        } else if(msg.hit) {
            if(msg.hit.hitter === this.playerId){
                if(game.lastHitTime !== undefined){
                    console.log(new Date().getTime() - game.lastHitTime);
                    game.lastHitTime = undefined;
                } else {
                    console.log("before");
                    game.lastHitTime = undefined; 
                }
                game.playAudio("hit");
            }
        } else if(msg.lTest) {
            console.log(new Date().getTime()-this.lTestTime);
        } else if(msg.lb) {
            let table = document.getElementById("leaderBoard").children[1];
            table.innerHTML = "<tr><th></th><th>nick</th><th>k</th><th>d</th></tr>";
            for (var key in msg.lb) {
                let player = this.getPlayer(key);

                let tr = document.createElement("tr");
                if(key !== this.playerId) tr.style.backgroundColor = "rgba(0,0,0,0.2)";
                table.appendChild(tr);

                let td0 = document.createElement("td");
                let td1 = document.createElement("td");
                let td2 = document.createElement("td");
                let td3 = document.createElement("td");

                td0.style.backgroundColor = player.color;
                td0.style.width = "20px";
                td1.textContent = player.nick;
                td2.textContent = msg.lb[key].k;
                td3.textContent = msg.lb[key].d;

                tr.appendChild(td0);
                tr.appendChild(td1);
                tr.appendChild(td2);
                tr.appendChild(td3);
            }
        } else if(msg.dc) {
            //remove player from players
            for (let i = 0; i < this.players.length; i++) {
                if (this.players[i].id === msg.dc.id) {
                    game.scene.remove(game.scene.getObjectByName(this.players[i].id));
                    this.players.splice(i,1);
                }
            }
        }
    }
    requestPlayer() {
        this.playerId = -1;
        this.players = [];
        let nick = prompt("Plase select a nickname.");
        this.sendJson({rp:{nick: nick}});
    }
    sendJson(json) {
        this.ws.send(JSON.stringify(json));
    }
    rndFlt(num, dec = this.precision){
        return parseFloat(num.toFixed(dec));
    }
    getPlayer(id){
        return this.players.find(el => {
            return el.id === id ? el : null;
        });
    }
    latencyTest(){
        this.lTestTime = new Date().getTime();
        this.ws.send(JSON.stringify({lTest:this.playerId}));
    }
}