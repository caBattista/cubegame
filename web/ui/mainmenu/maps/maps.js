class Maps extends Mainmenu {

    constructor(game, parent) {
        super();
        this.game = game;
        this.parent = parent;
        this.createPage();
    }

    async createPage() {
        this.parent.innerHTML = "";
        const elements = this.createHTML(`<h1>Select a Playground</h1><div class="mapList"></div>`, this.parent, "all");
        elements[0].addEventListener("click", async ev => {
            const res = await this.game.ws.request("maps", { action: "create" });
            this.createPage(this.parent);
        })
        const res = await this.game.ws.request("maps", { action: "get" })
        res.forEach(map => {
            const el = this.createHTML(`<div>
                    <div>${map._id}</div>
                    <div>${map.players.length}/${map.maxPlayers}</div>
                    <div>Join</div>
                    </div>`, elements[1]);
            el.children[2].addEventListener("click", ev => {
                this.game.joinMap(map._id);
            })
        })
    }
}
