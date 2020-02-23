class Database {
    constructor(creds) {
        this.creds = creds;
        this.client = require('mongodb').MongoClient;
        this.client.connect(this.creds.url, (err, db) => {
            if (err) throw err;
            else {
                this.db = db;
                this.users = db.db("cubegame").collection("users");
                this.users.updateMany({}, { $unset: { clientId: 1 } });
                this.maps = db.db("cubegame").collection("maps");
                this.maps.deleteMany({})
            }
        })
    }

    close() { this.db.close(); }

    //User

    addUser(user) {
        return new Promise((res, rej) => {
            this.users.insertOne(user, (dbErr, dbRes) => {
                dbErr ? rej(dbErr) : res(true)
            });
        });
    }

    getUser(user) {
        return new Promise((res, rej) => {
            this.users.find(user).toArray((dbErr, dbRes) => {
                dbErr ? rej(dbErr) : res(dbRes)
            });
        });
    }

    deleteUser(clientId) {
        return new Promise((res, rej) => {
            this.users.deleteMany({ clientId: clientId }, (dbErr, dbRes) => {
                dbErr ? rej(dbErr) : res(true)
            });
        });
    }

    //ClientId

    addUserClientId(user, clientId) {
        return new Promise((res, rej) => {
            this.users.updateOne(user, { $set: { clientId: clientId } }, (dbErr, dbRes) => {
                dbErr ? rej(dbErr) : res(true)
            });
        });
    }

    removeUserClientId(clientId) {
        return new Promise((res, rej) => {
            this.users.updateOne({ clientId: clientId }, { $unset: { clientId: 1 } }, (dbErr, dbRes) => {
                dbErr ? rej(dbErr) : res(true)
            });
        });
    }

    //Maps
    addMap(map) {
        return new Promise((res, rej) => {
            this.maps.insertOne(map, (dbErr, dbRes) => {
                dbErr ? rej(dbErr) : res(dbRes)
            });
        });
    }

    getMaps() {
        return new Promise((res, rej) => {
            this.maps.find({}).toArray((dbErr, dbRes) => {
                dbErr ? rej(dbErr) : res(dbRes)
            });
        });
    }

    setSettings(clientId, settings) {
        return new Promise((res, rej) => {
            this.users.updateOne({ clientId: clientId },
                { $set: { [`settings.${settings.category}.${settings.name}`]: settings.value } }, (dbErr, dbRes) => {
                    dbErr ? rej(dbErr) : res(true)
                });
        });
    }

    getSettings(clientId) {
        return new Promise((res, rej) => {
            this.users.findOne({ clientId: clientId }, { fields: { _id: 0, settings: 1 } }, (dbErr, dbRes) => {
                dbErr ? rej(dbErr) : res(dbRes)
            });
        });
    }

}

module.exports = Database;