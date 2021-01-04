class Database {
    constructor(creds) {
        this.mongodb = require('mongodb');
        this.mongodb.MongoClient.connect(creds.url, (err, db) => {
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

    handleError(err) {
        console.log("DB:", err);
        return err;
    }

    // ######################### ClientId #########################

    addUserClientId(user, clientId) {
        return new Promise((res, rej) => {
            this.users.updateOne(user, { $set: { clientId: clientId } }, (err, data) => {
                err ? rej(this.handleError(err)) : res(true);
            });
        });
    }

    removeUserClientId(clientId) {
        return new Promise((res, rej) => {
            this.users.updateOne({ clientId: clientId }, { $unset: { clientId: 1 } }, (err, data) => {
                err ? rej(this.handleError(err)) : res(true)
            });
        });
    }

    // ######################### User #########################

    addUser(user) {
        return new Promise((res, rej) => {
            this.users.insertOne(user, (err, data) => {
                err ? rej(this.handleError(err)) : res(true)
            });
        });
    }

    async getUser(user) {
        return new Promise((res, rej) => {
            this.users.find(user).toArray((err, data) => {
                err ? rej(this.handleError(err)) : res(data)
            });
        });
    }

    deleteUser(clientId) {
        return new Promise((res, rej) => {
            this.users.deleteMany({ clientId: clientId }, (err, data) => {
                err ? rej(this.handleError(err)) : res(true)
            });
        });
    }

    // ######################### Maps #########################

    addMap(map) {
        return new Promise((res, rej) => {
            this.maps.insertOne(map, (err, data) => {
                err ? rej(this.handleError(err)) : res(data)
            });
        });
    }

    getMaps() {
        return new Promise((res, rej) => {
            this.maps.find({}).toArray((err, data) => {
                err ? rej(this.handleError(err)) : res(data)
            });
        });
    }

    //######################### Characters #########################

    addCharacter(clientId, charId) {
        return new Promise((res, rej) => {
            this.users.updateOne({ clientId: clientId },
                { $set: { [`characters.${charId}`]: "" } }, (err, data) => {
                    err ? rej(this.handleError(err)) : res(true)
                });
        });
    }

    getCharacters(clientId) {
        return new Promise((res, rej) => {
            this.users.findOne({ clientId: clientId }, { fields: { _id: 0, characters: 1 } }, (err, data) => {
                err ? rej(this.handleError(err)) : res(data)
            });
        });
    }

    // ######################### Settings #########################

    setSettings(clientId, settings) {
        return new Promise((res, rej) => {
            this.users.updateOne({ clientId: clientId },
                { $set: { [`settings.${settings.category}.${settings.name}`]: settings.value } }, (err, data) => {
                    err ? rej(this.handleError(err)) : res(true)
                });
        });
    }

    getSettings(clientId) {
        return new Promise((res, rej) => {
            this.users.findOne({ clientId: clientId }, { fields: { _id: 0, settings: 1 } }, (err, data) => {
                err ? rej(this.handleError(err)) : res(data)
            });
        });
    }

}

module.exports = Database;