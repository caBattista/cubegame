class Ws {

    async connect() {
        return new Promise((res, rej) => {
            this.ws = new WebSocket(
                location.protocol === "https:" ? "wss://" : "ws://" + location.host);
            this.ws.onopen = () => {
                this.ws.onmessage = e => {
                    const data = JSON.parse(e.data);
                    console.log("WS: ", data.client_id);
                    res(data.client_id);
                };
                this.ws.onclose = e => {
                    document.body.innerHTML = "It seems a though your connection was closed.\n" +
                        "Possible reasosns could be you have logged into another device.\n" +
                        "The server has been shutdown or you have been hacked.";
                };
            };
        });
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

    close() {
        this.ws.close();
    }
}