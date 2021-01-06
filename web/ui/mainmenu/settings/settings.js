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
                    <input class="js-${category.display_name}" type="${setting.type}" name="${setting.name}" value="${setting.value}">
                    </div>`, catEl);
            })
        })

        //Add listeners
        formEl.addEventListener("click", async ev => {
            console.log(ev.target.classList);
            if (ev.target.classList.contains("js-Gameplay")) {

            } else if (ev.target.classList.contains("js-Controls")) {
                ev.target.readOnly = true;
                ev.target.value = "Press a Key...";
                const keyListener = async ev2 => {
                    ev2.preventDefault();
                    document.removeEventListener("keydown", keyListener);
                    await this.saveSetting(ev.target.name, ev2.code, ev.target.type);
                    ev.target.value = ev2.code;
                }
                document.addEventListener("keydown", keyListener);
            } else if (ev.target.classList.contains("js-Graphics")) {

            } else if (ev.target.classList.contains("js-Acount")) {
                await this.game.ws.request("deleteUser", {});
                this.game.ws.close(4000, "Deleted User");
                location.reload();
            }
        })
    }
    saveSetting(name, value, type) {
        return new Promise(async (res, rej) => {
            res(await this.game.ws.request("settings",
                { action: "set", name: name, value: value, type: type }));
        });
    }
}
