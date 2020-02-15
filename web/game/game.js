class Game {

    constructor(loader){
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
        await this.loader.load("ui/login/login", 1);

        await new Login(this).login();
        this.loader.unload("ui/login/login");

        //mainmenu
        await this.loader.load("ui/mainmenu/mainmenu", 1);

        this.mainmenu = new Mainmenu(this);
        await this.mainmenu.start();
    }

    async joinMap(mapId){
        document.body.innerHTML = "";
        //load Three
        await this.loader.load("engine/three");
        await this.loader.load("engine/water");
        await this.loader.load("engine/stats");
        await this.loader.load("engine/engine", 1);
        this.engine = new Engine(this);
    }
} 