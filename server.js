//Load config file
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json'));

//Database start
const Database = require("./server/database.js");
const db = new Database(config.database_settings);

//Server start
const express = require('express');
const app = express();
const port = process.env.PORT || config.express_settings.port;

const server = app.listen(port, () => {
  require('dns').lookup(require('os').hostname(), (err, add, fam) => {
    console.log('Webserver started on ' + add + ':' + port);
  });
});

//Host files
app.use('/', async (req, res) => {

  let path = req.originalUrl.split('?')[0];
  path = path === '/' ? '/main/index.html' : path;

  console.log("EX: requested file ", req.query.client_id, " ", path);

  if (config.file_settings.public_files.includes(path)) {
    res.sendFile(path, { root: __dirname + config.file_settings.root_dir });
  }
  else if (req.query.client_id) {
    //Check message
    const valRes = Joi.validate(req.query.client_id, Joi.string().alphanum().required());
    if (valRes.error !== null) { res.status(403).send('Invalid Message'); return; }

    //Check if WSServer knows Client
    if (!wss.clients[req.query.client_id]) { res.status(403).send('Sorry! You cant see that.'); return; }

    //Check if DB knows Client
    const dbRes = await db.getUser({ client_id: req.query.client_id });
    if (dbRes.length !== 1) { res.status(403).send('Sorry! You cant see that.'); return; }
    res.sendFile(path, { root: __dirname + config.file_settings.root_dir });
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

//Handle Ping to keep websockets open
wss.on("ping", (msg, client) => {
  msg.serverHandeled = Date.now();
  wss.send(client, msg);
})

//Handle login
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

  //close connection if same client is logged in //doesnt work on heroku
  await wss.closeConnection(dbRes[0].client_id);

  //Add client_id to db
  const dbRes2 = await db.addUserClientId(dbRes[0].id, client.id);
  if (dbRes2 !== true) { wss.send(client, { err: { msg: "Could not add client_id to user" } }); return; }

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
    client_id: client.id,
    characters: {
      John: {}
    }
  }
  user.password = await argon2.hash(user.salt + user.password + pepper);

  // Add user to db
  const dbRes2 = await db.addUser(user);
  if (dbRes2 !== true) { wss.send(client, { err: { msg: "Could not add user" } }); return; }

  // Add default settings to db
  const dbRes3 = await db.addSettings(client.id, config.user_default_settings);
  if (dbRes3 !== true) { wss.send(client, { err: { msg: "Could not add settings" } }); return; }

  // // Add default characters to db
  const dbRes4 = await db.addCharacter(client.id, config.user_default_character);
  if (dbRes4 !== true) { wss.send(client, { err: { msg: "Could not add character" } }); return; }

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
  //console.log("removed client_id from db");
});

const Simulator = require("./server/simulator.js");
const { settings } = require('cluster');
const sim = new Simulator();

// Main Menu

wss.on("maps", async (msg, client) => {

  //verification neccessary!

  if (msg.action === "create") {
    const dbRes = await db.addMap({ type: msg.type, max_players: 10 });
    if (dbRes.length !== 1) { wss.send(client, { err: { msg: "error creating map" } }); return; }
    sim.addMap(dbRes[0].id);
    wss.send(client, { message: "created map successfully" }); return;
  } else if (msg.action === "get") {
    const dbRes = await db.getMaps();
    if (typeof (dbRes) === "object") {
      //is bs
      //dbRes.forEach(map => { console.log(map); map.players = sim.getPlayersIdsOfMap(map.id) });
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

  //better verification neccessary!

  if (msg.action === "get") {
    const settings = await db.getSettings(client.id);

    //fill template with values
    let template = [];
    config.user_settings_template.forEach(category => {
      let newCategory = { display_name: category.display_name, children: [] }
      category.children.forEach(setting => {
        newCategory.children.push({
          display_name: setting.display_name,
          name: setting.name,
          type: setting.type,
          value: settings[setting.name]
        })
      })
      template.push(newCategory);
    })

    if (typeof (settings) === "object") { wss.send(client, template); return; }
    else { wss.send(client, { err: { msg: "error getting map" } }); return; }

  } else if (msg.action === "getRaw") {
    const settings = await db.getSettings(client.id);
    if (typeof (settings) === "object") { wss.send(client, settings); return; }
    else { wss.send(client, { err: { msg: "error getting map" } }); return; }
  } else if (msg.action === "set") {

    const dbRes = await db.setSettings(client.id, msg.name, msg.value, msg.type);
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

/*
//Anti Cheat System
setInterval(() => {
  const offenders = sim.removeOffenders();
  offenders.forEach(offender => {
    wss.send(wss.clients[offender.id], { offences: offender.offences})
    wss.closeConnection(offender.id);
  })
}, 10000);

//On Close
const exitHandler = () => {
  db.end();
  process.exit();
}
//so the program will not close instantly
process.stdin.resume();
//do something when app is closing
process.on('exit', exitHandler);
//catches ctrl+c event
process.on('SIGINT', exitHandler);
// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler);
process.on('SIGUSR2', exitHandler);
//catches uncaught exceptions
process.on('uncaughtException', exitHandler);
*/