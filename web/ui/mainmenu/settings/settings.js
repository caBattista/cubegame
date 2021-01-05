class Settings extends Mainmenu {

    constructor(game, parent) {
        super();
        this.game = game;
        this.parent = parent;
        this.createPage();
    }

    async createPage() {
        const res = await this.game.ws.request("settings", { action: "get" });

        //create form
        const formEl = this.createHTML(`<form class="settings"></form>`, this.parent);
        res.forEach(category => {
            let catEl = this.createHTML(`<h1>${category.display_name}</h1><div class="list"></div>`, formEl, 1);
            category.children.forEach(setting => {
                this.createHTML(`<div>${setting.display_name}
                    <input class="js-${category.display_name}} type="${setting.type}" name="${setting.name}" value="${setting.value}">
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
                    await this.saveSetting(ev.target.name, ev2.code, ev.target.type);
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
    saveSetting(name, value, type) {
        return new Promise(async (res, rej) => {
            res(await this.game.ws.request("settings",
                { action: "set", name: name, value: value, type: type }));
        });
    }
}
