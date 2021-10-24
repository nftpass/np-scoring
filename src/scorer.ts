import MongoInterface from "./mongoInterface";
import FirebaseInterface from "./firebaseInterface";
import CovalentDataRetriever from "./covalentDataRetriever";
import OpenSeaDataRetriever from "./openSeaDataRetriever";
import PoapRetriever from "./poapRetriever";
const moment = require('moment');


type ScoreComponent = {
    collectionName: string;
    points: number;
    contractAddress: string;
};


class Scorer {
    mongo: MongoInterface;
    firebase: FirebaseInterface;
    covalentDataRetriever: CovalentDataRetriever;
    openSeaDataRetriever: OpenSeaDataRetriever;
    poapRetriever: PoapRetriever;

    constructor(mongo: MongoInterface, firebase: FirebaseInterface,
                covalentDataRetriever: CovalentDataRetriever, openSeaDataRetriever: OpenSeaDataRetriever, poapRetriever: PoapRetriever) {
        this.mongo = mongo;
        this.firebase = firebase;
        this.covalentDataRetriever = covalentDataRetriever;
        this.openSeaDataRetriever = openSeaDataRetriever;
        this.poapRetriever = poapRetriever;
    }

    async init(callback: any){
        await this.mongo.init();
        callback();
    }

    getCachedScore(address: string): any{
        return this.mongo.getAddressHistoricalScore(address);
    }

    async computeAndStoreScore(address: string): Promise<number> {
        const cachedScore = await this.getCachedScore(address);
        const now = moment();
        const timeDeltaInHours = cachedScore ? now.diff(moment(cachedScore.updated_at), 'hours'): 0;

        if (cachedScore && timeDeltaInHours < 2) {
            console.log(`Cached score is less than 2 hours`)
            console.log(`Cached score for eo_address ${address} is ${cachedScore.score}`)
            return cachedScore;
        }
        const computedScore = await this.computeScore(address);
        const totalScore = computedScore.totalScore;
        const scoreComponents = computedScore.scoreComponents;
        this.firebase.persistScore(address, totalScore);
        this.firebase.persistScoreComponents(address, scoreComponents);
        this.mongo.setAddressScore(address, totalScore);
        return computedScore;
    }

    async computeScore(address: string, chain_id: number = 1): Promise<any> {
        console.log(`Computing score for eo_address: ${address}`)
        let totalScore = 0;
        let data = await this.covalentDataRetriever.getNFTOverviewForAddress(address, chain_id, true);
        const collections = data['collections'];
        const contract_addresses = collections.map((col: any) => {return col.contract_address})
        const collGrades = await this.mongo.getNFTCollectionsScoreInBulk(contract_addresses);


        //let keeping track of how we got to the score
        let scoreComponentsArr: Array<ScoreComponent> = [];

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

        //All collections retrieved from Covalent
        for (let i = 0; i < collections.length; i++) {
            const collContractAddress = collections[i].contract_address;
            const collGradeObj = collGradesMap.get(collContractAddress);
            let collGrade = collGradeObj ? collGradeObj['grade'] : 1;
            let collName = collGradeObj ? collGradeObj['name'] : '';
            let collAddress = collGradeObj ? collGradeObj['address'] : '';

            //compute collection grade on the fly if we don't have it
            if (!collGrade){
                console.log(`Collection grade not available for ${collContractAddress}`)
                collGrade = await this.computeAndStoreCollectionScore(collContractAddress, address);
            }

            totalScore += collGrade;
            scoreComponentsArr = this.addScoreComponentToArr(scoreComponentsArr, collGrade, collName, collAddress);

            const pieces = collections[i].nft_data;
            if(pieces){
                for (let j = 0; j < pieces.length; j++) {
                    // piece score = collectior_score * price component
                    // @todo: add the individual piece price
                    let pieceScore = collGrade * 1
                    // @todo: if minted, then dobule piece score
                    totalScore += pieceScore
                }
            }
        }


        //All POAP scoring
        let poapScore = 0;
        const realWorldBadgePoints = 50;
        const virtualWorldBadgePoints = 5;
        const poapEvents = await this.poapRetriever.getPoapEvents(address);
        if(poapEvents) {
            let realWorldScore = realWorldBadgePoints * poapEvents.realworld;
            let virtualWorldScore = virtualWorldBadgePoints * poapEvents.metaverse;
            poapScore = realWorldScore + virtualWorldScore;
            scoreComponentsArr = this.addScoreComponentToArr(scoreComponentsArr, realWorldScore, 'POAP - Real World', '');
            scoreComponentsArr = this.addScoreComponentToArr(scoreComponentsArr, virtualWorldScore, 'POAP - Virtual World', '');
        }

        console.log(`Poapscore is ${poapScore} for ${address}`)
        totalScore+=poapScore


        console.log(`Total score computed ${totalScore} and asssigned to eo_address: ${address}`)
        return {
            'totalScore': totalScore,
            'scoreComponents': scoreComponentsArr
        }
    }

    async computeAndStoreCollectionScore(contract_address: string, owner_address: string, chain_id: number = 1){

        // computing time component
        const now = moment.now();
        const nftsStart = moment(new Date(2016, 6, 1))
        let covalentData = await this.covalentDataRetriever.getEarliestTransactionForNFT(contract_address, chain_id, 1);
        let nftFirstTransactionDate = covalentData.earliestDate;
        console.log(`First transaction for collection detected at ${nftFirstTransactionDate}`)
        nftFirstTransactionDate = nftFirstTransactionDate? nftFirstTransactionDate : now;
        const timeComponent = (now - moment(nftFirstTransactionDate))/(now - nftsStart)

        // computing sales component
        // no way to get collection data through the contract_address? so we need to do this hack
        let openSeaData = await this.openSeaDataRetriever.getNFTCollectionStats(contract_address, owner_address);
        let colVolume = 0;
        if(openSeaData && openSeaData.stats && openSeaData.stats.total_volume){
            colVolume = openSeaData.stats.total_volume;
        }
        const maxVolumeCryptoPunk = 560936.65/30;
        const volumeComponent = colVolume/maxVolumeCryptoPunk;

        // total grade
        const grade = Math.min(Math.max(Math.round(3*timeComponent + 6*volumeComponent + 1)*10,1), 100);

        console.log(`colVolume: ${colVolume} \nmaxVolume: ${maxVolumeCryptoPunk} \nnftFirstTransactionDate: ${nftFirstTransactionDate}`)
        console.log(`${contract_address} grade is ${grade}`);
        this.mongo.setNFTCollectionGrade(contract_address, grade, covalentData.contract_name);

        return grade;
    }

    addScoreComponentToArr(arr: Array<ScoreComponent>, score: number, colName: string, colAddress: string): Array<ScoreComponent>{
        arr.push({
            'collectionName': colName,
            'points': score,
            'contractAddress': colAddress,
        })
        return arr;
    }

}

export default Scorer;