class Characters extends Mainmenu {

    constructor(game, parent) {
        super();
        this.game = game;
        this.createPage(parent);
    }

    async createPage(parent) {
        parent.innerHTML = "";
        const elements = this.createHTML(`
            <div class="header">
                <h1>Select a Character</h1>
                <input type="submit" value="Add Character">
            </div>
            <div class="list"></div>`, parent, "all");

        elements[0].children[1].addEventListener("click", async ev => {
            const els = this.createToolTip(`
                <h1>Name</h1>
                <input type="text" value="John">
                <input type="submit" value="Add">
            `, document.body);
            els.content[2].addEventListener("click", async ev => {
                await this.game.createCharacter(els.content[1].value);
                this.createPage(parent);
                els.tt.remove();
            });
        });

        const res = await this.game.getCharacters();
        res.forEach(character => {
            console.log(character);
            const el = this.createHTML(`<div>
                <div title="${character}">${character.name}</div>
                <input type="submit" value="Edit">
                </div>`, elements[1]);
            el.children[1].addEventListener("click", async ev => {
                this.game.editCharacter();
            });
        });
    }
}