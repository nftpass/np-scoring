import * as mongoDB from "mongodb";

export default class MongoInterface {
    client: mongoDB.MongoClient;
    db_name: string;
    col_name: string;
    historicalRecordsCol: mongoDB.Collection | undefined;
    nftCollectionScoreCol: mongoDB.Collection | undefined;
    db: mongoDB.Db | undefined;

    constructor(mongo_uri: string, db_name: string, col_name: string) {
        this.client = new mongoDB.MongoClient(mongo_uri);
        this.db_name = db_name;
        this.col_name = col_name;
        this.db = undefined;
        this.historicalRecordsCol = undefined;
        this.nftCollectionScoreCol = undefined;
    }

    async init(){
        await this.client.connect();
        this.db = this.client.db(this.db_name);
        this.historicalRecordsCol = this.db.collection('historicalRecords');
        this.nftCollectionScoreCol = this.db.collection('nftCollectionScore');
    }

    async getAddressHistoricalScore(address: string): Promise<any> {
        if (this.historicalRecordsCol){
            return await this.historicalRecordsCol.findOne({'address': address})
        }
    }

    async getNFTCollectionScore(contract_address: string): Promise<any> {
        if (this.nftCollectionScoreCol){
            return await this.nftCollectionScoreCol.findOne({'address': contract_address})
        }
    }

    async getNFTCollectionsScoreInBulk(contract_addresses: string[]): Promise<any> {
        if (this.nftCollectionScoreCol){
            return await this.nftCollectionScoreCol.find({'address': {'$in': contract_addresses}}).sort({'grade': 1}).toArray()
        }
    }

    async setNFTCollectionGrade(contract_address: string, grade: number, name: string): Promise<any> {
        if (this.nftCollectionScoreCol){
            return await this.nftCollectionScoreCol.insertOne({
                'address': contract_address,
                'grade': grade,
                'name': name,
                'inserted_at': new Date(),
                'updated_at': new Date()
            })
        }
    }

    async insertAddressScore(address: string, score: number): Promise<any> {
        console.log(`Attempting to save ${address} in Mongo`)
        if (this.historicalRecordsCol){
            return await this.historicalRecordsCol.insertOne({
                'address': address,
                'score': score,
                'inserted_at': new Date(),
                'updated_at': new Date()
            })
        }
    }

    async updateAddressScore(address: string, score: number): Promise<any> {
        console.log(`Updating ${address} in Mongo with new score: ${score}`)
        if (this.historicalRecordsCol){
            return await this.historicalRecordsCol.updateOne({
                'address': address
            }, {
                '$set': {
                    'score': score,
                    'updated_at': new Date()
                }
            }, {})
        }
    }
}





