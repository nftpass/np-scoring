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

    async getHistoricalScore(address: string): Promise<any> {
        if (this.historicalRecordsCol){
            return await this.historicalRecordsCol.findOne({'address': address})
        }
    }

    async getNFTCollectionScore(contract_address: string): Promise<any> {
        if (this.nftCollectionScoreCol){
            return await this.nftCollectionScoreCol.findOne({'contract_address': contract_address})
        }
    }

    async getNFTCollectionsScoreInBulk(contract_addresses: string[]): Promise<any> {
        if (this.nftCollectionScoreCol){
            return await this.nftCollectionScoreCol.find({'contract_address': {'$in': contract_addresses}}).sort({'grade': 1}).toArray()
        }
    }

    async setNFTCollectionGrade(contract_address: string, grade: number, name: string): Promise<any> {
        if (this.nftCollectionScoreCol){
            return await this.nftCollectionScoreCol.insertOne({
                'address': contract_address,
                'grade': grade,
                'name': name
            })
        }
    }
}





