class Ingamemenu extends Ui {
    constructor(game) {
        super();
        this.game = game;
        this.createMenu();
    }

    createMenu() {
        const button = this.createHTML(`
            <div class="ingamemenu">
            <input type="submit" value="Back To Main Menu">
            </div>
            `, document.body);
        button.addEventListener("click", ev => {
            this.game.leaveMap();
        })
    }
}
