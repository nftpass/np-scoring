const axios = require('axios').default;

export default class MockPoapRetriever {

    POAP_API_HOST: string;

    constructor() {
        this.POAP_API_HOST = "https://api.poap.xyz/"
    }

    async getPoapEvents(address: string) {
        let events = {
            realworld : 2,
            metaverse : 4,
            total : 6
        }
        console.log(events);
        return events;
    }

    async requestPOAP(path: string, address: string){
        console.log('NOT MOCKED YET: requestPOAP')
    };
}






