class Loader {
    constructor() {
        this.loadedFiles = {}
    }

    // load(pathWOE, withStyle) {
    //     return new Promise((resolve, reject) => {
    //         if (this.checkAlreadyLoaded(pathWOE) === true) { resolve(0); return; }
    //         fetch(pathWOE + '.js', this.fetchArgs).then(async (response) => {
    //             var script = document.createElement("script");
    //             script.innerHTML = await response.text();
    //             script.type = 'text/javascript';
    //             script.async = false;
    //             document.head.appendChild(script);
    //             this.loadedFiles[pathWOE + '.js'] = { pathWOE: pathWOE, ext: 'js', htmlEl: script };
    //             if (withStyle === 1) {
    //                 fetch(pathWOE + '.css', this.fetchArgs).then(async (response) => {
    //                     var style = document.createElement("style");
    //                     style.innerHTML = await response.text();
    //                     style.async = false;
    //                     document.head.appendChild(style);
    //                     this.loadedFiles[pathWOE + '.css'] = { pathWOE: pathWOE, ext: 'js', htmlEl: style };
    //                     resolve(0);
    //                 })
    //             } else { resolve(0); }
    //         })
    //     });
    // }

    async load(pathWOE, option = 0) {
        return new Promise((resolve, reject) => {
            if (this.checkAlreadyLoaded(pathWOE) === true) { resolve(0); }
            else {
                if (option === 0 || option === 1) {
                    let htmlEl = document.createElement("script");
                    htmlEl.src = pathWOE + '.js' + (this.client_id ? `?client_id=${this.client_id}` : '');
                    htmlEl.addEventListener("load", () => {
                        this.loadedFiles[pathWOE + '.js'] = { pathWOE: pathWOE, ext: 'js', htmlEl: htmlEl };
                        if (option === 0 || this.loadedFiles[pathWOE + '.css']) { resolve(0); }
                    });
                    document.head.appendChild(htmlEl);
                }
                if (option === 1) {
                    let htmlEl = document.createElement("link");
                    htmlEl.href = pathWOE + '.css' + (this.client_id ? `?client_id=${this.client_id}` : '');
                    htmlEl.rel = "stylesheet";
                    htmlEl.addEventListener("load", () => {
                        this.loadedFiles[pathWOE + '.css'] = { pathWOE: pathWOE, ext: 'js', htmlEl: htmlEl };
                        if (this.loadedFiles[pathWOE + '.js']) { resolve(0); }
                    });
                    document.head.appendChild(htmlEl);
                }
            }
        });
    }

    checkAlreadyLoaded(pathWOE) {
        let res = false;
        Object.keys(this.loadedFiles).forEach(key => {
            const file = this.loadedFiles[key];
            if (file.pathWOE === pathWOE) { res = true }
        });
        return res;
    }

    unload(pathWOE) {
        Object.keys(this.loadedFiles).forEach(key => {
            const file = this.loadedFiles[key];
            if (file.pathWOE === pathWOE) {
                document.head.removeChild(file.htmlEl);
                delete this.loadedFiles[key];
            }
        });
    }

    addClientId(client_id) {
        this.client_id = client_id;
    };
}