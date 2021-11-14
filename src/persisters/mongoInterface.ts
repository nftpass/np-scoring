import * as mongoDB from "mongodb";

export default class MongoInterface {
    client: mongoDB.MongoClient;
    db_name: string;
    historicalRecordsCol: mongoDB.Collection | undefined;
    nftCollectionScoreCol: mongoDB.Collection | undefined;
    nftPiecesRankCol: mongoDB.Collection | undefined;
    db: mongoDB.Db | undefined;

    constructor(mongo_uri: string, db_name: string) {
        this.client = new mongoDB.MongoClient(mongo_uri);
        this.db_name = db_name;
        this.db = undefined;
        this.historicalRecordsCol = undefined;
        this.nftCollectionScoreCol = undefined;
        this.nftPiecesRankCol = undefined;
    }

    async init(){
        await this.client.connect();
        this.db = this.client.db(this.db_name);
        this.historicalRecordsCol = this.db.collection('historicalRecords');
        this.nftCollectionScoreCol = this.db.collection('nftCollectionScore');
        this.nftPiecesRankCol = this.db.collection('nftPieces');
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

    async insertAddressScore(address: string, score: number, score_components: any): Promise<any> {
        console.log(`Attempting to save ${address} in Mongo`)
        if (this.historicalRecordsCol){
            return await this.historicalRecordsCol.insertOne({
                'address': address,
                'score': score,
                'score_components': score_components,
                'inserted_at': new Date(),
                'updated_at': new Date()
            })
        }
    }

    async updateAddressScore(address: string, score: number, score_components: any): Promise<any> {
        console.log(`Updating ${address} in Mongo with new score: ${score}`)
        if (this.historicalRecordsCol){
            let updateDict: any = {
                'score': score,
                'updated_at': new Date(),
            }
            if(score_components){
                updateDict['score_component'] = score_components;
            }
            return await this.historicalRecordsCol.updateOne({
                'address': address
            }, {
                '$set': updateDict
            }, {})
        }
    }

    async getNFTPieceRankInCollection(contract_address: string, token_id: number): Promise<any> {
        if (this.nftPiecesRankCol){
            return await this.nftPiecesRankCol.findOne({
                'contract_address': contract_address,
                'token_id': token_id
            })
        }
    }
}





