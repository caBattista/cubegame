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
  '/ui/ui.css',
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

//Request handeling
wss.on("login", async (msg, client) => {

  //Check message
  const valRes = Joi.validate(msg, Joi.object().keys({
    username: Joi.string().alphanum().min(3).max(30),
    password: Joi.string().alphanum().min(3).max(30),
  }), { presence: "required", stripUnknown: true });
  if (valRes.error !== null) { wss.send(client, { err: { msg: "Validation failed" } }); return; }

  //Check db for user
  const dbRes = await db.getUser({ username: msg.username });
  if (dbRes.length !== 1) { wss.send(client, { err: { msg: "User not found" } }); return; }

  //Check password
  const pswRes = await argon2.verify(dbRes[0].password, dbRes[0].salt + msg.password + pepper)
  if (pswRes !== true) { wss.send(client, { err: { msg: "Password verification failed" } }); return; }

  //close connection if same client is logged in
  await wss.closeConnection(dbRes[0].clientId);

  //Add clientId to db
  const dbRes2 = await db.addUserClientId({ username: msg.username }, client.id);
  if (dbRes2 !== true) { wss.send(client, { err: { msg: "Could not add clientId to user" } }); return; }

  wss.send(client, { succ: { msg: "Loged in successfully" } });
});

wss.on("register", async (msg, client) => {

  //Check message
  const valRes = Joi.validate(msg, Joi.object().keys({
    username: Joi.string().alphanum().min(3).max(30),
    password: Joi.string().alphanum().min(3).max(30),
  }), { presence: "required", stripUnknown: true });
  if (valRes.error !== null) { wss.send(client, { err: { msg: "Validation failed" } }); return; }

  //Check DB for user (prevent two users with same username)
  const dbRes = await db.getUser({ username: msg.username });
  if (dbRes.length !== 0) { wss.send(client, { err: { msg: "User alredy exists" } }); return; }

  //Create default User
  const user = {
    username: msg.username,
    password: msg.password,
    salt: crypto.randomBytes(16).toString('hex'),
    clientId: client.id,
    settings: {
      gameplay: {

      },
      sound: {
        globalVolume: 100
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
    },
    characters: {
      John: {}
    }
  }
  user.password = await argon2.hash(user.salt + user.password + pepper);

  //Add user to db
  const dbRes2 = await db.addUser(user);
  if (dbRes2 !== true) { wss.send(client, { err: { msg: "Could not add user" } }); return; }

  wss.send(client, { succ: { msg: "Registered user successfully" } });
});

wss.on("deleteUser", async (msg, client) => {
  const dbRes = await db.deleteUser(client.id);
  if (dbRes !== true) { wss.send(client, { err: { msg: "Could not delete user" } }); return; }
  wss.send(client, { message: "deleted user" });
  //console.log("deleted User from db");
});

wss.on("disconnect", async (msg, client) => {
  sim.removePlayer(client.id);
  const dbRes = await db.removeUserClientId(client.id);
  if (dbRes !== true) { return; }
  //console.log("removed clientId from db");
});

const Simulator = require("./server/simulator.js");
const sim = new Simulator();

// Main Menu

wss.on("maps", async (msg, client) => {

  //verification neccessary!

  if (msg.action === "create") {
    const dbRes = await db.addMap({ type: msg.type, maxPlayers: 10 });
    if (dbRes.insertedCount !== 1) { wss.send(client, { err: { msg: "error creating map" } }); return; }
    sim.addMap(dbRes.insertedId);
    wss.send(client, { message: "created map successfully" }); return;
  } else if (msg.action === "get") {
    const dbRes = await db.getMaps();
    if (typeof (dbRes) === "object") {
      dbRes.forEach(map => { map.players = sim.getPlayersIdsOfMap(map._id) });
      wss.send(client, dbRes);
      return;
    }
  }
  wss.send(client, { err: { msg: "error with maps" } }); return;
});

wss.on("characters", async (msg, client) => {

  //verification neccessary!

  if (msg.action === "create") {
    const dbRes = await db.addCharacter(client.id, msg.name);
    if (dbRes.insertedCount !== 1) { wss.send(client, { err: { msg: "error creating character" } }); return; }
    wss.send(client, { succ: { msg: "created character successfully" } }); return;
  } else if (msg.action === "get") {
    const dbRes = await db.getCharacters(client.id);
    if (typeof (dbRes) === "object") {
      wss.send(client, dbRes);
      return;
    }
  }
  wss.send(client, { merr: { msg: "error with maps" } }); return;
});

wss.on("settings", async (msg, client) => {

  //verification neccessary!

  if (msg.action === "get") {

    const dbRes = await db.getSettings(client.id);
    if (typeof (dbRes) === "object") { wss.send(client, dbRes); return; }
    else { wss.send(client, { err: { msg: "error getting map" } }); return; }

  } else if (msg.action === "set") {

    const dbRes = await db.setSettings(client.id, msg);
    if (dbRes !== true) { wss.send(client, { err: { msg: "error changing settings" } }); return; }
    wss.send(client, { message: "changed settings successfully" }); return;

  }
  else { wss.send(client, { err: { msg: "error with settings" } }); return; }
});

//In game
wss.on("map", async (msg, client) => {

  //verification neccessary!

  if (msg.action === "join") {
    sim.addPlayerToMap(client.id, msg.mapId);
    wss.send(client, { access: true });
  } else if (msg.action === "change") {

    if (msg.changes.self) {
      const res = sim.changePlayer(client.id, msg.changes.self);
      if (res === true) {
        await wss.closeConnection(client.id);
      }
    }

  } else if (msg.action === "leave") {
    sim.removePlayer(client.id);
    wss.send(client, { message: "left map sucessfully" });
  }
});

// //Anti Cheat System
// setInterval(() => {
//   const offenders = sim.removeOffenders();
//   offenders.forEach(offender => {
//     wss.send(wss.clients[offender.id], { offences: offender.offences})
//     wss.closeConnection(offender.id);
//   })
// }, 10000);

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