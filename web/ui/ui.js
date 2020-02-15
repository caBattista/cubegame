class Ui{

    constructor(game){
        this.game = game;
    }

    createHTML(htmlString, parent, siblings = 0) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        const children = Array.from(div.children);
        if (parent) {
            children.forEach(child => {
                parent.appendChild(child);
            });
        }
        return siblings === "all" ? children : children[siblings];
    }

    formToJSON(form) {
        const formToJSON2 = elements => [].reduce.call(elements, (data, element) => {
            data[element.name] = element.value;
            return data;
        }, {});
        return formToJSON2(form.elements);
    }

    keyToHR(key){
        //Add Space before every uppercase char and remove Space at beginning and end
        key = key.replace(/([A-Z])/g, ' $1').trim();
        //Make first char uppercase
        key = key.charAt(0).toUpperCase() + key.slice(1);
        return key;
    }
}