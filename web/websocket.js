class Websocket {
    constructor(game) {
        this.precision = 3;
        //htpps not working
        this.ws = new WebSocket(location.protocol === "https:" ? "wss://" + location.host : "ws://" + location.host);
        this.game = game;
        game.ws = this;
        // When the ws is open, send some data to the server
        this.ws.onopen = () => {
            this.playerId = -1;
            this.players = [];

            let nick = prompt("Plase select a nickname.")

            this.sendJson({rp:{nick: nick}});

            this.ws.onmessage = e => {
                //console.log(e.data);
                let msg = JSON.parse(e.data);

                if(msg.ns){
                    this.playerId = msg.ns.id;
                    this.players.push(msg.ns);
                    this.game.setSelf(msg.ns.loc);
                    let oldCam = JSON.stringify(this.game.camera);

                    setInterval(() => {
                        let camString = JSON.stringify(this.game.camera);
                        if (oldCam !== camString) {
                            oldCam = camString;
                            this.sendJson({
                                udp: {   
                                    id: this.playerId,
                                    loc: {
                                        x: this.rndFlt(this.game.camera.position.x),
                                        y: this.rndFlt(this.game.camera.position.y),
                                        z: this.rndFlt(this.game.camera.position.z),
                                        _x: this.rndFlt(this.game.camera.rotation._x),
                                        _y: this.rndFlt(this.game.camera.rotation._y),
                                        _z: this.rndFlt(this.game.camera.rotation._z),
                                    },
                                }
                            });
                        }
                    }, 33);
                }
                else if(msg.np){
                    if (msg.np.id !== this.playerId) {
                        this.players.push(msg.np);
                        this.game.newAvatar(msg.np);
                    }
                }
                else if(msg.udp){
                    this.game.setPlayer(msg.udp.id, msg.udp.loc);
                }
                else if(msg.nb){
                    this.game.newBullet(msg,true);
                }
                else if(msg.sp){
                    this.game.setSelf(msg.sp.loc);
                }
                else if(msg.lb){
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
                }
                else if(msg.dc){
                    //remove player from players
                    for (let i = 0; i < this.players.length; i++) {
                        if (this.players[i].id === msg.dc.id) {
                            this.game.scene.remove(this.game.scene.getObjectByName(this.players[i].id));
                            this.players.splice(i,1);
                        }
                    }
                }
            };
        };
        // Log errors
        this.ws.onerror = error => {
            console.log('WebSocket Error ' + error);
        };
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
        });;
    }
}