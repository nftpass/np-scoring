const axios = require('axios').default;
const querystring = require('querystring');

export default class OpenSeaDataRetriever {
    API_HOST: string;

    constructor() {
        this.API_HOST = "https://api.opensea.io/api/v1"
    }

    async getNFTCollectionsForAddress(owner_address: string) {
        const path = `/collections`;
        const query = {
            asset_owner: owner_address,
            offset: 0,
            limit: 300
        }
        return this.requestForOpenSea(path, query);
    }

    async getNFTCollectionStats(contract_address: string, owner_address: string){
        const collections = await this.getNFTCollectionsForAddress(owner_address);
        let wantedCollection = {'stats':{'total_volume': 0}};
        collections && collections.forEach((col: any) => {
            const contract = col.primary_asset_contracts[0]
            if(contract && contract.address == contract_address){
                console.log('matches')
                wantedCollection = col;
            }
        })
        return wantedCollection;
    }

    async requestForOpenSea(path: string, query: any = {}){
        try {
            const url = `${this.API_HOST}${path}?${querystring.stringify(query)}`;
            console.log(url)
            const response = await axios.get(url);
            return response.data;
        } catch (error: any) {
            return error.response && error.response.data;
        }
    };
}