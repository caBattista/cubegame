class Stats {
    constructor(option = "fps", rd = 0, udInt = 100) {
        this.option = option;
        this.rd = rd;
        this.vals = [];
        this.msFr = 0;
        this.msBtFr = 0;
        this.interv = setInterval(() => {
            let avMsFr  = 0;
            let avMsBtFr = 0;
            for (var i = 0; i < this.vals.length; i++) {
                avMsFr += this.vals[i].msFr;
                avMsBtFr += this.vals[i].msBtFr;
            }
            avMsFr /= i;
            avMsBtFr /= i;
            switch(this.option) {
                case "fps":
                    this.domEl.textContent = Number((1000/avMsBtFr).toFixed(rd));
                    break;
                case "msBtFr":
                    this.domEl.textContent = Number(avMsBtFr.toFixed(rd));
                    break;
                case "msFr":
                    this.domEl.textContent = Number(avMsFr.toFixed(rd));
                    break;
            }
        }, udInt);
        //Add to Dom
        this.domElCont = document.getElementById("stats");
        if (!this.domElCont) {
            this.domElCont = document.createElement("div");
            this.domElCont.id = "stats";
            document.body.appendChild(this.domElCont);
        }
        this.domEl = document.createElement("div");
        this.domElCont.appendChild(this.domEl);
    }
    start(){
        this.t0 = window.performance.now();
    }
    end(){
        let now = window.performance.now();
        this.vals.push({msFr:(now-this.t0), msBtFr:(now-this.t1)});
        if(this.vals.length > 10){
            this.vals.shift();
        }
        this.t1 = now;
    }
    stop(){
        clearInterval(this.interv); 
    }
}