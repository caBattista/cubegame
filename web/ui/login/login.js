class Login extends Ui {

    constructor(game) {
        super();
        this.game = game;
    }

    async login(ws) {
        return new Promise((resolve, reject) => {
            const el = this.createHTML(`
            <h1>Please log in</h1>
            <div class="login">
                <h3>Username</h3>
                <input type="text" name="username">
                <h3>Password</h3>
                <input type="password" name="password">
                <br>
                <input type="submit" value="Log In">
                <input type="submit" value="Register">
            </div>
            `, document.body, 1);
            const handleSubmit = async ev => {
                const res = await this.game.ws.request("login", this.formToJSON(el));
                if (res.access === true) {
                    document.body.innerHTML = "";
                    resolve();
                }
            }
            el.addEventListener("keyup", ev => {
                if (ev.keyCode !== 13) { return; }
                ev.preventDefault();
                handleSubmit();
            });
            el.children[5].addEventListener("click", handleSubmit)
            el.children[6].addEventListener("click", async ev => {
                const res = await this.game.ws.request("register", this.formToJSON(el));
                if (res.access === true) {
                    document.body.innerHTML = "";
                    resolve();
                }
            })
        });
    }
}