class Ws {

    async connect() {
        return new Promise((res, rej) => {
            this.ws = new WebSocket(location.origin.replace(/^http/, 'ws'));
            this.ws.onopen = () => {
                this.ws.onmessage = e => {
                    const data = JSON.parse(e.data);
                    console.log("WS: ", data.client_id);
                    res(data.client_id);
                };
                this.ws.onclose = ev => {
                    clearInterval(this.pingInterv);
                    if (ev.code < 4000) {
                        document.body.innerHTML = `<h1>Your websocket connection has closed.</h1>
                        <h1>Status Code: ${ev.code} ${ev.reason ? ", Reason: " + ev.reason : ""}</h1>
                        <h1><input style="vertical-align: center" type="submit" value="Reload" onclick="location.reload()"/></h1>`;
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
            })
    }
    onPingUpdate(callback) {
        this.pingCallbacks.push(callback);
        this.ping();
    }

    request(rqType, msg) {
        return new Promise((res, rej) => {
            this.ws.send(JSON.stringify({ rqType: rqType, msg: msg }));
            this.ws.onmessage = e => {
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