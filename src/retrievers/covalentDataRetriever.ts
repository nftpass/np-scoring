const axios = require('axios').default;
const querystring = require('querystring');

export default class CovalentDataRetriever {
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
        let collections = [];
        if (data && data.data){
            collections = data['data']['items'].filter((item: any) => {
                //if NFT or it's an ENS (0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85) which doesn't have NFT_DATA unfortunately
                return item.nft_data || item.contract_address == "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85"
            })
        } else {
            console.log(`No data return from Covalent for token balance address ${address}`)
        }
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

    async getTransactionsForNFT(address: string, chain_id: number, token_id: number){
        const path = `/${chain_id}/tokens/${address}/nft_transactions/${token_id}/`;
        const query = {};
        return this.requestForCovalent(path, query);
    }

    async getEarliestTransactionForNFT(address: string, chain_id: number, token_id: number) {
        const transactions = await this.getTransactionsForNFT(address, chain_id, token_id);
        let earliestDate = new Date();
        let contract_name = '', contract_address = '', contract_ticker_symbol='';

        if (transactions && transactions.data){
            transactions.data.items[0].nft_transactions.forEach((transaction: any) => {
                const blockSignedDate = new Date(transaction.block_signed_at);
                console.log(blockSignedDate)
                if (earliestDate > blockSignedDate) {
                    earliestDate = blockSignedDate
                }
            })
            contract_name = transactions.data.items[0]['contract_name'];
            contract_ticker_symbol = transactions.data.items[0]['contract_ticker_symbol']
            contract_address = transactions.data.items[0]['contract_address']
        } else {
            console.log(`No transactions available for contract: ${address} and token id: ${token_id}`)
        }
        return {
            earliestDate,
            contract_name,
            contract_address,
            contract_ticker_symbol
        };
    }

    async requestForCovalent(path: string, query: any = {}){
        query.key = this.COVALENT_API_KEY;
        try {
            const url = `${this.COVALENT_API_HOST}${path}?${querystring.stringify(query)}`;
            console.log(url)
            const response = await axios.get(url);
            return response.data;
        } catch (error: any) {
            return error.response && error.response.data;
        }
    };


}






