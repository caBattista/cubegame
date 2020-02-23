class Stats {
    constructor(rd = 0, udInt = 100, opt = 0) {
        this.rd = rd;
        this.vals = [];
        this.msFr = 0;
        this.msBtFr = 0;
        this.interv = setInterval(() => {
            let avMsFr = 0;
            let avMsBtFr = 0;
            for (var i = 0; i < this.vals.length; i++) {
                avMsFr += this.vals[i].msFr;
                avMsBtFr += this.vals[i].msBtFr;
            }
            avMsFr /= i;
            avMsBtFr /= i;

            const fps = Number((1000 / avMsBtFr).toFixed(rd));
            const msBtFr = Number(avMsBtFr.toFixed(rd));
            const msFr = Number(avMsFr.toFixed(rd));

            this.textCont.textContent = `fps: ${fps} msBtFr: ${msBtFr} msFr: ${msFr}`;
            this.barCont.style.width = msBtFr * 5 + "px";
            this.bar.style.width = msFr * 5 + "px";

        }, udInt);

        //Add to Dom
        this.statsCont = document.createElement("div");
        this.statsCont.id = "stats";
        this.statsCont.style.top = (40 * opt) + "px";
        document.body.appendChild(this.statsCont);

        this.textCont = document.createElement("div");
        this.statsCont.appendChild(this.textCont);

        this.barCont = document.createElement("div");
        this.statsCont.appendChild(this.barCont);

        this.bar = document.createElement("div");
        this.barCont.appendChild(this.bar);
    }
    start() {
        this.t0 = window.performance.now();
    }
    end() {
        let now = window.performance.now();
        this.vals.push({ msFr: (now - this.t0), msBtFr: (now - this.t1) });
        if (this.vals.length > 10) {
            this.vals.shift();
        }
        this.t1 = now;
    }
    stop() {
        clearInterval(this.interv);
    }
}