class Login extends Ui {

    constructor(game) {
        super();
        this.game = game;
        console.log("login");
    }

    async login(ws) {
        return new Promise((resolve, reject) => {
            const el = this.createHTML(`
            <div>
                <form>
                    Uername <input type="text" name="username"><br>
                    Password <input type="password" name="password"><br>
                </form>
                <input type="submit" value="Submit">
                <input type="submit" value="Register">
            </div>
            `, document.body);
            const handleSubmit = async ev => {
                const res = await this.game.ws.request("login", this.formToJSON(el.children[0]));
                if (res.access === true) {
                    document.body.innerHTML = "";
                    resolve();
                }
            }
            el.children[0].addEventListener("keyup", function (event) {
                if (event.keyCode === 13) {
                    event.preventDefault();
                    handleSubmit();
                }
            });
            el.children[1].addEventListener("click", handleSubmit)
            el.children[2].addEventListener("click", async ev => {
                const res = await this.game.ws.request("register", this.formToJSON(el.children[0]));
                if (res.access === true) {
                    document.body.innerHTML = "";
                    resolve();
                }
            })
        });
    }
}