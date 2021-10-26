const axios = require('axios').default;
const querystring = require('querystring');

export default class MockCovalentDataRetriever {
    COVALENT_API_KEY: string;
    COVALENT_API_HOST: string;

    constructor(api_key: string) {
        this.COVALENT_API_KEY = api_key
        this.COVALENT_API_HOST = "https://api.covalenthq.com/v1"
    }

    async getTokenBalancesForAddress(address: string, chain_id: number, get_nft: boolean = true){
        console.log('NOT MOCKED YET:getTokenBalancesForAddress')
    }

    async getNFTCollectionsForAddress(address: string, chain_id: number, get_nft: boolean = true){
        const collections = [{
                "contract_decimals": 0,
                "contract_name": "CryptoMutts",
                "contract_ticker_symbol": "CMUTT",
                "contract_address": "0x25c65721e26fa5f3c97f129f4e24972482327bc9",
                "supports_erc": [
                    "erc20",
                    "erc721"
                ],
                "logo_url": "https://logos.covalenthq.com/tokens/1/0x25c65721e26fa5f3c97f129f4e24972482327bc9.png",
                "last_transferred_at": "2021-09-21T18:20:35Z",
                "type": "nft",
                "balance": "2",
                "balance_24h": null,
                "quote_rate": 0.0,
                "quote_rate_24h": null,
                "quote": 0.0,
                "quote_24h": null,
                "nft_data": [
                    {
                        "token_id": "6572",
                        "token_balance": "1",
                        "token_url": "https://ipfs.io/ipfs/QmNxxm7oNwd8bLkoTKHyqdGTvYTnNKpeC8krUrghWME8ug/6590",
                        "supports_erc": [
                            "erc20",
                            "erc721"
                        ],
                        "token_price_wei": null,
                        "token_quote_rate_eth": null,
                        "original_owner": "0x2b95713ec1b2a840826e354e88ac0890de344f1",
                        "external_data": {
                            "name": "CryptoMutts #6590",
                            "description": "CryptoMutts is a collection of 10,000 randomly generated NFT's on the Ethereum blockchain. Each CryptoMutt is entirely unique and features characteristics inspired by the current market at large. Ownership includes access to our members-only community and future NFT and token airdrops exclusive to holders.",
                            "image": "https://ipfs.io/ipfs/QmRa3eBHTkwPxpKpfW8Wi7BCWwkhayoXgGhBiVpRDau7px",
                            "image_256": "https://image-proxy.svc.prod.covalenthq.com/256,fit,png,sce1F8jiF5SR-ecMhe0sU8vIgzhLDsKcF9LfWzAbdExY=/https://ipfs.io/ipfs/QmRa3eBHTkwPxpKpfW8Wi7BCWwkhayoXgGhBiVpRDau7px",
                            "image_512": "https://image-proxy.svc.prod.covalenthq.com/512,fit,png,slpM0eQkuSBCuWKQFYg1mUKMCnHOSUKBb6V0nwJcwj84=/https://ipfs.io/ipfs/QmRa3eBHTkwPxpKpfW8Wi7BCWwkhayoXgGhBiVpRDau7px",
                            "image_1024": "https://image-proxy.svc.prod.covalenthq.com/1024,fit,png,sQ7ba7YwKFc31NUJ_8AOH4vSBfpwHf8wWWXGlhbWPxNM=/https://ipfs.io/ipfs/QmRa3eBHTkwPxpKpfW8Wi7BCWwkhayoXgGhBiVpRDau7px",
                            "animation_url": null,
                            "external_url": "https://cryptomutts.io",
                            "attributes": [
                                {
                                    "value": "Pink",
                                    "trait_type": "Background"
                                },
                                {
                                    "value": "Light",
                                    "trait_type": "Body Color"
                                },
                                {
                                    "value": "Grey T-Shirt",
                                    "trait_type": "Body"
                                },
                                {
                                    "value": "Light",
                                    "trait_type": "Head Color"
                                }
                            ],
                            "owner": null
                        },
                        "owner": "0x2b95713ec1b2a840826e354e88ac0890de344f1",
                        "owner_address": null,
                        "burned": null
                    },
                    {
                        "token_id": "541",
                        "token_balance": "1",
                        "token_url": "https://ipfs.io/ipfs/QmNxxm7oNwd8bLkoTKHyqdGTvYTnNKpeC8krUrghWME8ug/3001",
                        "supports_erc": [
                            "erc20",
                            "erc721"
                        ],
                        "token_price_wei": null,
                        "token_quote_rate_eth": null,
                        "original_owner": "0x2b95713ec1b2a840826e354e88ac0890de344f1",
                        "external_data": {
                            "name": "CryptoMutts #3001",
                            "description": "CryptoMutts is a collection of 10,000 randomly generated NFT's on the Ethereum blockchain. Each CryptoMutt is entirely unique and features characteristics inspired by the current market at large. Ownership includes access to our members-only community and future NFT and token airdrops exclusive to holders.",
                            "image": "https://ipfs.io/ipfs/QmVNz8PmXoLTdZ2UgqziRzao6HK7aDfEhSYErYjKA4cPzW",
                            "image_256": "https://image-proxy.svc.prod.covalenthq.com/256,fit,png,se0NJCuS6adOkoJEq-m-tgIzsbUMYuUuuRt_bJ3heH7o=/https://ipfs.io/ipfs/QmVNz8PmXoLTdZ2UgqziRzao6HK7aDfEhSYErYjKA4cPzW",
                            "image_512": "https://image-proxy.svc.prod.covalenthq.com/512,fit,png,s_MiDWJnQcEkFpu-n3JFUiCB-TwY1i6CTj75zGhn39H0=/https://ipfs.io/ipfs/QmVNz8PmXoLTdZ2UgqziRzao6HK7aDfEhSYErYjKA4cPzW",
                            "image_1024": "https://image-proxy.svc.prod.covalenthq.com/1024,fit,png,soO3C3ScgU6qRMLfLkF3tmtluUoWMdnzrTSgo4tYik20=/https://ipfs.io/ipfs/QmVNz8PmXoLTdZ2UgqziRzao6HK7aDfEhSYErYjKA4cPzW",
                            "animation_url": null,
                            "external_url": "https://cryptomutts.io",
                            "attributes": [
                                {
                                    "value": "Sky Blue",
                                    "trait_type": "Background"
                                },
                                {
                                    "value": "Light",
                                    "trait_type": "Body Color"
                                }
                            ],
                            "owner": null
                        },
                        "owner": "0x2b95713ec1b2a840826e354e88ac0890de344f1",
                        "owner_address": null,
                        "burned": null
                    }
                ]
            }]

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
        console.log('NOT MOCKED YET: getTransactionsForNFT')
    }

    async getEarliestTransactionForNFT(address: string, chain_id: number, token_id: number) {
        console.log('MOCK: getEarliestTransactionForNFT')
        return {
            earliestDate: new Date(2019,1,1),
            contract_name: "MockCollection",
            contract_address: "0xmock",
            contract_ticker_symbol: 'MC'
        };
    }

    async requestForCovalent(path: string, query: any = {}){
        console.log('NOT MOCKED YET: requestForCovalent')
    };


}






