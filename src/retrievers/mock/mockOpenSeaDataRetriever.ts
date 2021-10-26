const axios = require('axios').default;
const querystring = require('querystring');

export default class MockOpenSeaDataRetriever {
    API_HOST: string;

    constructor() {
        this.API_HOST = "https://api.opensea.io/api/v1"
    }

    async getNFTCollectionsForAddress(owner_address: string) {
        console.log('NOT MOCKED YET: getNFTCollectionsForAddress')
    }

    async getNFTCollectionStats(contract_address: string, owner_address: string){
        return {
            'stats': {
                'total_volume': 1000
            }
        };
    }

    async requestForOpenSea(path: string, query: any = {}){
        console.log('NOT MOCKED YET: requestForOpenSea')
    };
}