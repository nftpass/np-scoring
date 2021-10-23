const axios = require('axios').default;
const querystring = require('querystring');

export default class DataRetriever {
    COVALENT_API_KEY: string;
    COVALENT_API_HOST: string;

    constructor(api_key: string) {
        this.COVALENT_API_KEY = api_key
        this.COVALENT_API_HOST = "https://api.covalenthq.com/v1"
    }

    async getTokenBalancesForAddress(address: string, chain_id: number, get_nft: boolean = true){
        const path = `/${chain_id}/address/${address}/balances_v2/`;
        const query = { nft: get_nft }
        return this.requestForCovalent(path, query);
    }

    async getNFTCollectionsForAddress(address: string, chain_id: number, get_nft: boolean = true){
        const data = await this.getTokenBalancesForAddress(address, chain_id, get_nft);
        const collections = data['data']['items'].filter((item: any) => {
            return item.nft_data
        })
        return collections;
    }

    async getNFTOverviewForAddress(address: string, chain_id: number, get_nft: boolean = true){
        const collections = await this.getNFTCollectionsForAddress(address, chain_id, get_nft);
        let pieces:any[] = [];
        collections.forEach((col: any) => {
            pieces = pieces.concat(col.nft_data);
        })
        return {
            collections,
            number_of_collections: collections.length,
            all_pieces: pieces,
            number_of_pieces: collections.length,
        }
    }

    async requestForCovalent(path: string, query: any = {}){
        query.key = this.COVALENT_API_KEY;
        try {
            const url = `${this.COVALENT_API_HOST}${path}?${querystring.stringify(query)}`;
            const response = await axios.get(url);
            return response.data;
        } catch (error: any) {
            return error.response && error.response.data;
        }
    };


}






