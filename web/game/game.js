class Game {

    constructor(loader) {
        this.loader = loader;
    }

    async start() {
        //start websocket
        await this.loader.load("util/ws");
        this.ws = new Ws();
        this.loader.addClientId(await this.ws.connect());

        //load ui
        await this.loader.load("ui/ui");
        this.ui = new Ui(this);

        //login
        // await this.loader.load("ui/login/login", 1);
        // await new Login(this).login();
        // await this.loader.unload("ui/login/login");

        //Auto login
        await this.ws.request("login", { username: '123', password: '123' });

        //mainmenu
        await this.loader.load("ui/mainmenu/mainmenu", 1);

        this.mainmenu = new Mainmenu(this);
        await this.mainmenu.start();
    }

    async joinMap(mapId) {
        document.body.innerHTML = "";
        //load Three
        await this.loader.load("engine/three");
        await this.loader.load("engine/stats");
        await this.loader.load("engine/engine", 1);
        await this.loader.load("engine/self");
        await this.loader.load("engine/controls");
        await this.loader.load("maps/mountainwaters/water");
        await this.loader.load("maps/mountainwaters/map");
        const settings = await this.ws.request("settings", { action: "get" })
        this.engine = new Engine(this, settings.settings);
    }
} 