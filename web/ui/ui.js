class Ui {

    constructor(game) {
        this.game = game;
    }

    createHTML(htmlString, parent, siblings = 0) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.replace(/(\r\n|\n|\r)/gm, "").replace(/  +/g, ' ').trim();
        const children = Array.from(div.children);
        if (parent) {
            children.forEach(child => {
                parent.appendChild(child);
            });
        }
        return siblings === "all" ? children : children[siblings];
    }

    formToJSON(parent) {
        let res = {};
        parent.querySelectorAll('[name]').forEach(el => {
            res[el.name] = el.value;
        })
        return res;
    }

    keyToHR(key) {
        //Add Space before every uppercase char and remove Space at beginning and end
        key = key.replace(/([A-Z])/g, ' $1').trim();
        //Make first char uppercase
        key = key.charAt(0).toUpperCase() + key.slice(1);
        return key;
    }
}