class Ws {

    constructor(game) {
        this.game = game;
    }

    async connect() {
        return new Promise((res, rej) => {
            this.ws = new WebSocket(location.origin.replace(/^http/, 'ws'));
            this.blocked = true;
            this.ws.onopen = () => {
                this.ws.onmessage = e => {
                    this.blocked = false;
                    const data = JSON.parse(e.data);
                    console.log("WSOPEN: ", data.client_id);
                    res(data.client_id);
                };
                this.ws.onclose = ev => {
                    try { this.game.engine.dispose(); } catch (e) { }
                    clearInterval(this.pingInterv);
                    if (ev.code !== 4000) {
                        document.body.innerHTML = `
                        <style>body{ text-align: center; }</style>
                        <h1>Your websocket connection has closed.</h1>
                        <h1>Status Code: ${ev.code} ${ev.reason ? ", Reason: " + ev.reason : ""}</h1>
                        <h1><input type="submit" value="Reload" onclick="location.reload()"/></h1>`;
                    }
                };
                this.pingCallbacks = [];
                this.pingInterv = setInterval(() => { this.ping(); }, 50000);
            };
        });
    }

    ping() {
        const timeSent = Date.now();
        this.request("ping", {})
            .then(res => {
                const now = Date.now();
                this.currentPing = {
                    lastPingRecieved: now,
                    roundTrip: now - timeSent,
                    toServer: res.serverHandeled - timeSent,
                    toClient: now - res.serverHandeled
                }
                this.pingCallbacks.forEach(callback => {
                    callback(this.currentPing);
                })
                console.log(this.currentPing);
            })
    }

    request(rqType, msg) {
        return new Promise((res, rej) => {
            this.blocked = true;
            this.ws.send(JSON.stringify({ rqType: rqType, msg: msg }));
            this.ws.onmessage = e => {
                this.blocked = false;
                console.log("WS: ", e.data);
                res(JSON.parse(e.data));
            };
        });
    }

    sendJSON(json) {
        this.ws.send(JSON.stringify(json));
    }

    close(code, reason) {
        clearInterval(this.pingInterv);
        this.ws.close(code, reason);
    }
}