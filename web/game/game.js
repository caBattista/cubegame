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
        //await this.ws.request("user", "login", { username: '123', password: '123' });

        //mainmenu
        await this.loader.load("ui/mainmenu/mainmenu", 1);

        this.mainmenu = new Mainmenu(this);
        await this.mainmenu.start();
    }

    //Maps

    createMap() { return this.ws.request("maps", "create", { type: "mountainwaters" }); }

    getMaps() { return this.ws.request("maps", "get"); }

    //Characters

    createCharacter(name) { return this.ws.request("characters", "create", { name: name }); }

    getCharacters() { return this.ws.request("characters", "get"); }

    editCharacter(data) { return this.ws.request("characters", "edit", { id: data.id, name: data.name, value: data.value }); }

    deleteCharacter(id) { return this.ws.request("characters", "delete", { id: id }); }

    //Settings

    //needs to Move here

    //join a map

    async joinMap(mapId) {
        this.currentMap = mapId;
        await this.ws.request("map", "join", { mapId: mapId });
        document.body.innerHTML = "";
        //load Three
        await this.loader.load("ui/ingameui/ingameui", 1);
        this.ingameui = new Ingameui(this);
        await this.loader.load("engine/three");
        await this.loader.load("engine/stats");
        await this.loader.load("engine/engine");
        await this.loader.load("engine/self");
        await this.loader.load("engine/controls");
        await this.loader.load("engine/physics");
        await this.loader.load("maps/mountainwaters/water");//needs to be according to mapid
        await this.loader.load("maps/mountainwaters/map");
        const settings = await this.ws.request("settings", "get");
        const characters = await this.ws.request("characters", "get");
        this.engine = new Engine(this, settings, characters);
    }

    async leaveMap() {
        this.engine.dispose();
        delete this.ingamemenu;
        delete this.engine;
        document.body.innerHTML = "";
        await this.ws.request("map", "leave", { mapId: this.currentMap });
        await this.mainmenu.start();
    }
} 