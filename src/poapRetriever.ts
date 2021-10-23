const axios = require('axios').default;

export default class PriceRetriever {

    POAP_API_HOST: string;

    constructor() {
        this.POAP_API_HOST = "https://api.poap.xyz/"
    }

    async getPoapEvents(address: string) {
        const path = "actions/scan/"
        const poapList = await this.requestPOAP(path, address);
        let metaverseEvents = 0;
        let realWorldEvents = 0;
        for (let i=0; i<poapList.length; i++) {
            const event = poapList[i]['event'];
            if (event.country === "" || event.city === "" ) {
                metaverseEvents++;
            } else {
                realWorldEvents++;
            }
        }
        let events = {
            realworld : realWorldEvents,
            metaverse : metaverseEvents,
            total : poapList.length
        }
        console.log(events);
        return events;
    }

    async requestPOAP(path: string, address: string){
        try {
            const url = `${this.POAP_API_HOST}${path}${address}`;
            console.log(url);
            const response = await axios.get(url);
            return response.data;
        } catch (error: any) {
            return error.response && error.response.data;
        }
    };
}






