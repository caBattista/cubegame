class Settings extends Mainmenu {

    constructor(game, parent) {
        super();
        this.game = game;
        this.parent = parent;
        this.createPage();
    }

    async createPage() {
        const res = await this.game.ws.request("settings", { action: "get" });
        const settings = res.settings;

        //create form
        const formEl = this.createHTML(`<form class="settings"></form>`, this.parent);
        Object.keys(settings).forEach(category => {
            const catEl = this.createHTML(`<h2>${this.keyToHR(category)}</h2><div></div>`, formEl, 1);
            Object.keys(settings[category]).forEach(setting => {
                this.createHTML(`<div>${this.keyToHR(setting)}
                    <input class="js-${category}" type="text" name="${setting}" value="${settings[category][setting]}">
                    </div>`, catEl);
            })
        })

        //Add listeners
        formEl.addEventListener("click", ev => {
            if (ev.target.classList.contains("js-gameplay")) {

            } else if (ev.target.classList.contains("js-controls")) {
                ev.target.readOnly = true;
                ev.target.value = "Press a Key...";
                const keyListener = async ev2 => {
                    ev2.preventDefault();
                    document.removeEventListener("keydown", keyListener);
                    await this.saveSetting("controls", ev.target.name, ev2.code);
                    ev.target.value = ev2.code;
                }
                document.addEventListener("keydown", keyListener);
            } else if (ev.target.classList.contains("js-graphics")) {

            }
        })
        // const account = this.createHTML(`
        //     <h2>Account</h2>
        //     <div>
        //     <div>
        //     <button type="button">Delte Account</button>
        //     </div>
        //     </div>
        // `, settings[0]);
        // account[1].children[0].addEventListener('click', async ev => {
        //     await this.game.ws.request("deleteUser", {});
        //     this.game.ws.close();
        //     location.reload();
        // })
    }
    saveSetting(category, name, value) {
        return new Promise(async (res, rej) => {
            res(await this.game.ws.request("settings",
                { action: "set", category: category, name: name, value: value }));
        });
    }
}
