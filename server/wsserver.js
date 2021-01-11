const { error } = require('console');

class WSServer {
  constructor(server) {
    //For client identification
    this.crypto = require('crypto');
    this.clients = {};
    this.handlers = {};

    const WebSocket = require('ws');
    //same port as express
    this.wss = new WebSocket.Server({ server: server, clientTracking: false });
    console.log("WS: started");

    //Handle Ping to keep websockets open
    this.on("websocket", "ping", (data, client, send) => {
      data.serverHandeled = Date.now();
      console.log("WS: started");
      send("success", data);
    })

    this.wss.on('connection', (ws, req) => {

      //add client
      const client = {
        id: this.crypto.randomBytes(16).toString("hex"),
        ws: ws
      };
      this.clients[client.id] = client;

      //send client id
      this.send(client, "websocket", "connect", "success", client.id);

      //on message
      ws.on('message', RawData => {
        RawData = JSON.parse(RawData);
        console.log("WS: recieved from ", client.id, RawData);
        const handler = this.handlers[RawData.topic][RawData.action];
        if (handler) {
          handler(RawData.data, client, (status, data) => {
            this.send(client, RawData.topic, RawData.action, status, data);
          });
        }
        else {
          const errMsg = `Message handler for topic "${RawData.topic}" and action "${RawData.action}" not found`
          this.send(client, RawData.topic, RawData.action, "error", errMsg);
          console.log(`WS: ${errMsg}`);
        }
      });

      //on close
      ws.on('close', RawData => {
        RawData = JSON.parse(RawData);
        console.log(`WS: client ${client.id} disconnected: ${RawData}`);
        const handler = this.handlers["disconnect"];
        if (typeof handler === 'function') { handler(RawData.msg, client); }
        delete this.clients[client.id];
      });

    });
  }

  on(topic, action, handler) {
    if (!this.handlers[topic]) { this.handlers[topic] = {}; }
    this.handlers[topic][action] = handler;
  }

  closeConnection(id, code, reason) {
    return new Promise((res, rej) => {
      if (!this.clients[id]) { res(0); return; }
      this.clients[id].closedByServer = true;
      this.clients[id].ws.close(code, reason);
    });
  }

  send(client, topic, action, status, data) {

    const response = { topic: topic, action: action, status: status };
    if (data) { response.data = data; }
    client.ws.send(JSON.stringify(response));
    console.log("WS: send to ", client.id, response);
  }

  // broadcast(msgObj, clients) {
  //   for (var key in this.clients) {
  //     if (this.clients[key].ws.readyState === WebSocket.OPEN && key != dontBCId) {
  //       this.send(this.clients[key].ws, data);
  //     }
  //   }
  //   clients.forEach(client => this.send(client, msgObj));
  // }

}
module.exports = WSServer;