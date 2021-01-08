class Game {

    constructor(loader) {
        this.loader = loader;
    }

    async start() {
        //load ui
        await this.loader.load("ui/ui", 1);
        this.ui = new Ui(this);

        //login
        await this.loader.load("ui/login/login", 1);
        await new Login(this).login();
        await this.loader.unload("ui/login/login");

        //Auto login
        //await this.ws.request("login", { username: '123', password: '123' });

        //mainmenu
        await this.loader.load("ui/mainmenu/mainmenu", 1);

        this.mainmenu = new Mainmenu(this);
        await this.mainmenu.start();
    }

    //Maps

    createMap() {
        return new Promise(async (res, rej) => {
            res(await this.ws.request("maps", { action: "create", type: "mountainwaters" }));
        });
    }

    getMaps() {
        return new Promise(async (res, rej) => {
            const wsRes = await this.ws.request("maps", { action: "get" });
            res(wsRes);
        });
    }

    async joinMap(mapId) {
        this.currentMap = mapId;
        const res = await this.ws.request("map", { action: "join", mapId: mapId });
        if (res.access !== true) { alert("Can't join map"); return; }
        document.body.innerHTML = "";
        //load Three
        await this.loader.load("ui/ingameui/ingameui", 1);
        this.ingamemenu = new Ingamemenu(this);
        await this.loader.load("engine/three");
        await this.loader.load("engine/stats");
        await this.loader.load("engine/engine");
        await this.loader.load("engine/self");
        await this.loader.load("engine/controls");
        await this.loader.load("engine/physics");
        await this.loader.load("maps/mountainwaters/water");//needs to be according to mapid
        await this.loader.load("maps/mountainwaters/map");
        const settings = await this.ws.request("settings", { action: "get" });
        const characters = await this.ws.request("characters", { action: "get" });
        this.engine = new Engine(this, settings, characters);
    }

    async leaveMap(mapId) {
        this.engine.dispose();
        delete this.ingamemenu;
        delete this.engine;
        document.body.innerHTML = "";
        await this.ws.request("map", { action: "leave", mapId: this.currentMap });
        await this.mainmenu.start();
    }

    //Characters

    createCharacter(name) {
        return new Promise(async (res, rej) => {
            res(await this.ws.request("characters", { action: "create", name: name }));
        });
    }

    getCharacters() {
        return new Promise(async (res, rej) => {
            res(await this.ws.request("characters", { action: "get" }));
        });
    }

    editCharacter(id, values) {
        return new Promise(async (res, rej) => {
            res(await this.ws.request("characters", { action: "edit", id: values.id, name: values.name }));
        });
    }

    deleteCharacter(id) {
        return new Promise(async (res, rej) => {
            res(await this.ws.request("characters", { action: "delete", id: id }));
        });
    }

    //Settings

    //needs to Move here
} 