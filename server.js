//Server start
const express = require('express');
const app = express();
const port = process.env.PORT || 1337;

const server = app.listen(port, () => {
  require('dns').lookup(require('os').hostname(), (err, add, fam) => {
    console.log('Webserver started on ' + add + ':' + port);
  });
});

//Database start
const Database = require("./server/database.js");
const db = new Database({ url: "mongodb://localhost:27017/cubegame" });

//Host files
const sfo = { root: __dirname + '/web/' }

const publicFiles = [
  '/main/index.html',
  '/main/favicon.png',
  '/util/loader.js',
  '/game/game.js',
  '/util/ws.js',
  '/ui/ui.js',
  '/ui/login/login.js',
  '/ui/login/login.css'
]

app.use('/', async (req, res) => {

  let path = req.originalUrl.split('?')[0];
  path = path === '/' ? '/main/index.html' : path;

  console.log("EX: requested file ", req.query.clientId, " ", path);

  if (publicFiles.includes(path)) { res.sendFile(path, sfo); }
  else if (req.query.clientId) {
    //Check message
    const valRes = Joi.validate(req.query.clientId, Joi.string().alphanum().required());
    if (valRes.error !== null) { res.status(403).send('Invalid Message'); return; }

    //Check if WSServer knows Client
    if (!wss.clients[req.query.clientId]) { res.status(403).send('Sorry! You cant see that.'); return; }

    //Check if DB knows Client
    const dbRes = await db.getUser({ clientId: req.query.clientId });
    if (dbRes.length !== 1) { res.status(403).send('Sorry! You cant see that.'); return; }

    res.sendFile(path, sfo);
  }
  else { res.status(404).send('404'); }
});

//Websocket start
const WSServer = require("./server/wsserver.js");
const wss = new WSServer(server);

//Request Validation
const Joi = require('joi');

//Native csprng
const crypto = require('crypto');

//Modern Hashing
const argon2 = require('argon2');
const pepper = "|>3|>|>3|2";

// var os = require('os');
// setInterval(() => {
//   //console.log("WS: ", wss.listClients());
//   //console.log(os.cpus());
//   console.log("free mem ",Math.round(os.freemem() / 1024 / 1024 / 1024 * 10) / 10);
// }, 100);

//Request handeling
wss.on("login", async (msg, client) => {

  //Check message
  const valRes = Joi.validate(msg, Joi.object().keys({
    username: Joi.string().alphanum().min(3).max(30),
    password: Joi.string().alphanum().min(3).max(30),
  }), { presence: "required", stripUnknown: true });
  if (valRes.error !== null) { wss.send(client, { access: false }); return; }
  //console.log("checked message");

  //Check db for user
  const dbRes = await db.getUser({ username: msg.username });
  if (dbRes.length !== 1) { wss.send(client, { access: false }); return; }
  //console.log("checked db for user",dbRes );

  //Check password
  const pswRes = await argon2.verify(dbRes[0].password, dbRes[0].salt + msg.password + pepper)
  if (pswRes !== true) { wss.send(client, { access: false }); return; }
  //console.log("checked password");

  //close connection if same client is logged in
  await wss.closeConnection(dbRes[0].clientId);
  //console.log("removed ther client", dbRes[0].clientId);

  //Add clientId to db
  const dbRes2 = await db.addUserClientId({ username: msg.username }, client.id);
  if (dbRes2 !== true) { wss.send(client, { access: false }); return; }
  //console.log("added clientId to db");

  wss.send(client, { access: true });
});

wss.on("register", async (msg, client) => {

  //Check message
  const valRes = Joi.validate(msg, Joi.object().keys({
    username: Joi.string().alphanum().min(3).max(30),
    password: Joi.string().alphanum().min(3).max(30),
  }), { presence: "required", stripUnknown: true });
  if (valRes.error !== null) { wss.send(client, { access: false }); return; }
  //console.log("checked message");

  //Check db for user (prevent two users with same username)
  const dbRes = await db.getUser({ username: msg.username });
  if (dbRes.length !== 0) { wss.send(client, { access: false }); return; }
  //console.log("checked db for user");

  //Create salt, password, client id
  msg.salt = crypto.randomBytes(16).toString('hex');
  msg.password = await argon2.hash(msg.salt + msg.password + pepper);
  msg.clientId = client.id;
  //console.log("created salt, password, client id");

  //create default settings
  msg.settings = {
    gameplay: {

    },
    controls: {
      moveForward: "KeyW",
      moveBackward: "KeyS",
      moveLeft: "KeyA",
      moveRight: "KeyD",
      jump: "Space",
      sprint: "ShiftLeft",
      crouch: "AltLeft",
      interact: "KeyE",
      melee: "KeyF",
      granade: "KeyG"
    },
    graphics: {
      quality: "High"
    }
  }

  //Add user to db
  const dbRes2 = await db.addUser(msg);
  if (dbRes2 !== true) { wss.send(client, { access: false }); return; }
  //console.log("added user to db");

  wss.send(client, { access: true });
});

wss.on("deleteUser", async (msg, client) => {
  const dbRes = await db.deleteUser(client.id);
  if (dbRes !== true) { return; }
  wss.send(client, { message: "deleted User from db" });
  //console.log("deleted User from db");
});

wss.on("disconnect", async (msg, client) => {
  const dbRes = await db.removeUserClientId(client.id);
  if (dbRes !== true) { return; }
  //console.log("removed clientId from db");
});

// Main Menu
wss.on("maps", async (msg, client) => {
  if (msg.action === "create") {
    const dbRes = await db.addMap({ type: "map1", maxPlayers: 10, players: [] });
    if (dbRes !== true) { wss.send(client, { message: "error creating map" }); return; }
    wss.send(client, { message: "created map successfully" }); return;
  } else if (msg.action === "get") {
    const dbRes = await db.getMaps();
    if (typeof (dbRes) === "object") { wss.send(client, dbRes); return; }
    else { wss.send(client, { message: "error getting map" }); return; }
  } else { wss.send(client, { message: "error with maps" }); return; }
});

wss.on("settings", async (msg, client) => {
  if (msg.action === "get") {
    const dbRes = await db.getSettings(client.id);
    if (typeof (dbRes) === "object") { wss.send(client, dbRes); return; }
    else { wss.send(client, { message: "error getting map" }); return; }
  } else if (msg.action === "set") {
    const dbRes = await db.setSettings(client.id, msg);
    if (dbRes !== true) { wss.send(client, { message: "error changing settings" }); return; }
    wss.send(client, { message: "changed settings successfully" }); return;
  }

  else { wss.send(client, { message: "error with settings" }); return; }
});

// //On Close
// const exitHandler = () => {
//   db.close();
//   process.exit();
// }
// //so the program will not close instantly
// process.stdin.resume();
// //do something when app is closing
// process.on('exit', exitHandler);
// //catches ctrl+c event
// process.on('SIGINT', exitHandler);
// // catches "kill pid" (for example: nodemon restart)
// process.on('SIGUSR1', exitHandler);
// process.on('SIGUSR2', exitHandler);
// //catches uncaught exceptions
// process.on('uncaughtException', exitHandler);