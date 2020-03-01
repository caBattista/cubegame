class Mainmenu extends Ui {

    constructor(game) {
        super();
        this.game = game;
    }

    async start() {
        return new Promise((resolve, reject) => {
            this.state = { selectedPage: "" };
            const lels = this.createLayout(document.body);
            this.stage = lels[1];
            this.createMenu(lels);
        });
    }

    createLayout(parent) {
        const elements = this.createHTML(`
            <div class="mainMenuWrapper">
                <div class="side"></div>
                <div class="stage"></div>
            </div>
            `, parent).children;
        return elements;
    }

    createMenu(parents) {
        const ul = this.createHTML(`
            <h1>Menu</h1>
            <ul>
                <li><input type="submit" value="Lobby" class="selected"></li>
                <li><input type="submit" value="Character"></li>
                <li><input type="submit" value="Settings"></li>
                <li><input type="submit" value="Logout"></li>
            </ul>
            `, parents[0], 1);
        this.loadPage("Lobby");
        ul.addEventListener("click", ev => {
            if (ev.target.tagName !== "INPUT") { return; }
            const input = ev.target;
            if (input.value === "Logout") {
                this.game.ws.close();
                location.reload();
            } else if (this.state.selectedPage !== input.value) {
                Array.from(ul.getElementsByTagName("input")).forEach(input => {
                    input.classList.remove("selected");
                });
                input.classList.add("selected");
                this.stage.innerHTML = "";
                this.state.selectedPage = input.value;
                this.loadPage(input.value);
            }
        })
    }

    async loadPage(pageName) {
        switch (pageName) {
            case "Lobby":
                await this.game.loader.load("ui/mainmenu/maps/maps", 1);
                this.maps = new Maps(this.game, this.stage);
                break;
            case "Character":
                break;
            case "Settings":
                await this.game.loader.load("ui/mainmenu/settings/settings", 1);
                this.settings = new Settings(this.game, this.stage);
                break;
        }
    }
}
