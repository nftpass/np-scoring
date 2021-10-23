import MongoInterface from "./mongoInterface";
import FirebaseInterface from "./firebaseInterface";
import DataRetriever from "./dataRetriever";
import * as moment from 'moment';

class Scorer {
    mongo: MongoInterface;
    firebase: FirebaseInterface;
    dataRetriever: DataRetriever;

    constructor(mongo: MongoInterface, firebase: FirebaseInterface, dataRetriever: DataRetriever) {
        this.mongo = mongo;
        this.firebase = firebase;
        this.dataRetriever = dataRetriever;
    }

    async init(callback: any){
        await this.mongo.init();
        callback();
    }

    getCachedScore(address: string): any{
        return this.mongo.getHistoricalScore(address);
    }

    async computeAndStoreScore(address: string): Promise<number> {
        const cachedScore = await this.getCachedScore(address);
        console.log(`Cached score for ${address} is ${cachedScore}`)
        if (cachedScore) { //@todo: when was it cached?
            return cachedScore;
        }
        const computedScore = await this.computeScore(address);
        this.firebase.persistScore(address, computedScore)
        return computedScore;
    }

    async computeScore(address: string, chain_id: number = 1): Promise<number> {
        console.log(`Computing score for ${address}`)
        let totalScore = 0;
        let data = await this.dataRetriever.getNFTOverviewForAddress(address, chain_id, true);
        const collections = data['collections'];
        const contract_addresses = collections.map((col: any) => {return col.contract_address})
        const collGrades = await this.mongo.getNFTCollectionsScoreInBulk(contract_addresses);

        // Creating a map for fast retrieval
        type CollectionGrade = {
            grade: number;
            address: string;
            name: string;
            _id: string;
        };
        const collGradesMap = new Map<string, CollectionGrade>();
        collGrades.forEach((coll:CollectionGrade) => {
            collGradesMap.set(coll.address, coll);
        })

        for (let i = 0; i < collections.length; i++) {
            const collContractAddress = collections[i].address;
            const collGradeObj = collGradesMap.get(collContractAddress);
            let collGrade = collGradeObj ? collGradeObj['grade'] : undefined;

            //compute collection grade on the fly if we don't have it
            if (!collGrade){
                collGrade = await this.computeAndStoreCollectionScore(collContractAddress)
            }

            totalScore += collGrade;
            const pieces = collections[i].nft_data;
            for (let j = 0; j < pieces.length; j++) {
                // piece score = collectior_score * price component
                let pieceScore = collGrade * 1
                // if minted, then dobule piece score (?)
                totalScore += pieceScore
            }

        }
        console.log(totalScore)
        return totalScore
    }

    async computeAndStoreCollectionScore(contract_address: string){
        //@todo: we need to finish this
        return 1
    }

}

export default Scorer;