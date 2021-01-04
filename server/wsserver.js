class WSServer {
  constructor(server) {
    //For client identification
    this.crypto = require('crypto');
    this.clients = {};
    this.handlers = {};

    const WebSocket = require('ws');
    //same port as express
    this.wss = new WebSocket.Server({ server: server, clientTracking: false });
    this.wss.on('connection', (ws, req) => {
      const client = this.addClient(ws);
      this.send(client, { client_id: client.id });

      this.onMessage(ws, msg => {
        console.log("WS: recieved from ", client.id, msg);
        const handlers = this.handlers[msg.rqType];
        if (handlers) handlers.forEach(handler => { handler.handler(msg.msg, client) });
      })

      this.onClose(ws, msg => {
        if (client.closedByServerCallback) {
          delete this.clients[client.id];
          client.closedByServerCallback();
        } else {
          const handlers = this.handlers["disconnect"];
          if (handlers) handlers.forEach(handler => { handler.handler(msg.msg, client) });
          delete this.clients[client.id];
        }
      })

    });
  }

  on(rqType, handler) {
    this.handlers[rqType] = [{ handler: handler, active: true }];
  }

  onMessage(ws, callback) {
    ws.on('message', msg => callback(JSON.parse(msg)));
  }

  onClose(ws, callback) {
    ws.on('close', msg => callback(JSON.parse(msg)));
  }

  addClient(ws) {
    const client = {
      id: this.crypto.randomBytes(16).toString("hex"),
      ws: ws
    };
    this.clients[client.id] = client;
    return client;
  }

  closeConnection(id) {
    return new Promise((res, rej) => {
      if (!this.clients[id]) { res(0); return; }
      this.clients[id].closedByServer = true;
      this.clients[id].closedByServerCallback = () => { res(0) };
      this.clients[id].ws.close();
    });
  }

  send(client, msg) {
    console.log("WS: send to ", client.id, msg);
    client.ws.send(JSON.stringify(msg));
  }

  broadcast(msgObj, clients) {
    for (var key in this.clients) {
      if (this.clients[key].ws.readyState === WebSocket.OPEN && key != dontBCId) {
        this.send(this.clients[key].ws, data);
      }
    }
    clients.forEach(client => this.send(client, msgObj));
  }

}
module.exports = WSServer;