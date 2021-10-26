import * as mongoDB from "mongodb";

export default class MockMongoInterface {

    constructor(mongo_uri: string, db_name: string, col_name: string) {
        console.log('Creating mock Mongo instance')
    }

    async init(){
        console.log('Init mock Mongo instance')
    }

    async getAddressHistoricalScore(address: string): Promise<any> {
        if(Math.random() > 0.5){
            return
        }
        return {
            'address': address,
            'score': 100,
            'inserted_at': new Date(),
            'updated_at': new Date()
        }
    }

    async getNFTCollectionScore(contract_address: string): Promise<any> {
        if(Math.random() > 0.5){
            return
        }
        return {
            'address': contract_address,
            'grade': 100,
            'name': 'MockCollection',
            'inserted_at': new Date(),
            'updated_at': new Date()
        }

    }

    async getNFTCollectionsScoreInBulk(contract_addresses: string[]): Promise<any> {
        return contract_addresses.map((address, index) => {
            return {
                'address': address,
                'grade': 100,
                'name': 'MockCollection' + index,
                'inserted_at': new Date(),
                'updated_at': new Date()
            }

        })
    }

    async setNFTCollectionGrade(contract_address: string, grade: number, name: string): Promise<any> {
        console.log(`MOCK: saved collection grade of ${contract_address} with grade: ${grade}`)
    }

    async setAddressScore(address: string, score: number): Promise<any> {
        console.log(`MOCK: Saved ${address} in Mongo`)
    }
}





