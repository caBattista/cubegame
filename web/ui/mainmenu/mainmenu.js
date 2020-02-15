class Mainmenu extends Ui {

    constructor(game){
        super();
        this.game = game;
    }

    async start() {
        return new Promise((resolve, reject) => {
            this.state = { selectedPage: "" };
            const lels = this.createLayout(document.body);
            this.stage = lels[1];
            const menuElements = this.createMenu(lels);
            this.loadPage("Playgrounds", menuElements);
        });
    }

    createLayout(parent) {
        const elements = this.createHTML(`
            <div class="side"></div>
            <div class="stage"></div>
            `, parent, "all");
        return elements;
    }

    createMenu(parents) {
        const elements = this.createHTML(`
                <h1>Main Menu</h1>
                <ul>
                    <li><input type="submit" value="Playgrounds"></li>
                    <li><input type="submit" value="Character"></li>
                    <li><input type="submit" value="Settings"></li>
                    <li><input type="submit" value="Logout"></li>
                </ul>
            `, parents[0], "all");
        Array.from(elements[1].getElementsByTagName("input")).forEach(child => {
            child.addEventListener("click", ev => {
                this.loadPage(ev.target.value, elements);
            });
        });
        elements[1].children[3].addEventListener("click", ev => {
            this.game.ws.close();
            location.reload();

        });
        return elements;
    }

    async loadPage(pageName, menuElements) {
        if (this.state.selectedPage === pageName) return;
        else this.state.selectedPage = pageName
        Array.from(menuElements[1].getElementsByTagName("input")).forEach(child => {
            if (child.value === this.state.selectedPage) child.classList.add("active");
            else child.classList.remove("active");
        });
        this.stage.innerHTML = "";
        switch (pageName) {
            case "Playgrounds":
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
