const moment = require('moment');
import MongoInterface from "./persisters/mongoInterface";
import FirebaseInterface from "./persisters/firebaseInterface";
import SQSInterface from "./pusher/sqsInterface";
import MockMongoInterface from "./persisters/mock/mockMongoInterface";
import MockFirebaseInterface from "./persisters/mock/mockFirebaseInterface";

import CovalentDataRetriever from "./retrievers/covalentDataRetriever";
import OpenSeaDataRetriever from "./retrievers/openSeaDataRetriever";
import PoapRetriever from "./retrievers/poapRetriever";
import MockCovalentDataRetriever from "./retrievers/mock/mockCovalentDataRetriever";
import MockOpenSeaDataRetriever from "./retrievers/mock/mockOpenSeaDataRetriever";
import MockPoapRetriever from "./retrievers/mock/mockPoapRetriever";

import CollectionGrade from "./interfaces/collectionGradeType";
import ScoreComponent from "./interfaces/scoreComponentType";

import ScorerBreakdownTracker from "./scoreBreakdownTracker";


class Scorer {
    mongo: MongoInterface | MockMongoInterface;
    firebase: FirebaseInterface | MockFirebaseInterface;
    covalentDataRetriever: CovalentDataRetriever | MockCovalentDataRetriever;
    openSeaDataRetriever: OpenSeaDataRetriever | MockOpenSeaDataRetriever;
    poapRetriever: PoapRetriever | MockPoapRetriever;
    sqsPusher: SQSInterface
    constructor(mongo: MongoInterface | MockMongoInterface,
                firebase: FirebaseInterface | MockFirebaseInterface,
                sqsPusher: SQSInterface,
                covalentDataRetriever: CovalentDataRetriever | MockCovalentDataRetriever,
                openSeaDataRetriever: OpenSeaDataRetriever | MockOpenSeaDataRetriever,
                poapRetriever: PoapRetriever | MockPoapRetriever) {
        this.mongo = mongo;
        this.firebase = firebase;
        this.sqsPusher = sqsPusher;
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

        // Apply cache if possible to avoid wasting cycles
        if (cachedScore && typeof cachedScore == 'object' && timeDeltaInHours < 2) {
            console.log(`Cached score is less than 2 hours`)
            console.log(`Cached score for eo_address ${address} is ${cachedScore.score}`)
            this.firebase.persistScore(address, cachedScore.score);
            this.firebase.persistScoreComponents(address, cachedScore.score_components);
            return cachedScore;
        }

        const computedScore = await this.computeScore(address);
        const totalScore = computedScore.totalScore;
        const scoreComponents = computedScore.scoreComponents;

        this.firebase.persistScore(address, totalScore);
        this.firebase.persistScoreComponents(address, scoreComponents);

        if(cachedScore){
            this.mongo.updateAddressScore(address, totalScore, scoreComponents);
        } else {
            this.mongo.insertAddressScore(address, totalScore, scoreComponents);
        }

        this.firebase.updateScoringProcessStatus(address, 'Done');
        return computedScore;
    }

    async computeScore(address: string, chain_id: number = 1): Promise<any> {
        console.log(`Computing score for eo_address: ${address}`)
        this.firebase.updateScoringProcessStatus(address, 'Starting');
        let totalScore = 0;
        const scoreBreakdown = new ScorerBreakdownTracker(address);
        let collectionsWithoutPieceRanking = new Set();
        this.firebase.updateScoringProcessStatus(address, 'Obtaining your NFTs');
        let data = await this.covalentDataRetriever.getNFTOverviewForAddress(address, chain_id, true);
        const collections = data['collections'];
        const contractAddresses = collections.map((col: any) => {return col.contract_address})
        const collGrades = await this.mongo.getNFTCollectionsScoreInBulk(contractAddresses);
        this.firebase.updateScoringProcessStatus(address, 'Verifying all your NFT Collections');

        // Creating a map for fast retrieval
        const collGradesMap = new Map<string, CollectionGrade>();
        collGrades.forEach((coll:CollectionGrade) => {
            collGradesMap.set(coll.address, coll);
        })

        //All collections retrieved from Covalent
        let collectionsToComputeRarity = [];
        for (let i = 0; i < collections.length; i++) {
            const collContractAddress = collections[i].contract_address;
            const collGradeObj = collGradesMap.get(collContractAddress);
            let collGrade = 1;

            //compute collection grade on the fly if we don't have it
            if (!collGradeObj){
                console.log(`Collection grade not available for ${collContractAddress}`)
                this.firebase.updateScoringProcessStatus(address, 'Computing score for collections');
                collGrade = await this.computeAndStoreCollectionScore(collContractAddress, address);
            } else {
                console.log(`Collection grade for ${collContractAddress} is ${collGradeObj['grade']}`)
                collGrade = collGradeObj ? collGradeObj['grade'] : 1;
            }

            let collName = collGradeObj ? collGradeObj['name'] : collections[i]['contract_name'];
            let collAddress = collGradeObj ? collGradeObj['address'] : collections[i]['contract_address'];
            let collAreTokensRanked = collGradeObj ? collGradeObj['are_tokens_ranked'] : false;
            let collRankedSupply = collGradeObj ? collGradeObj['ranked_supply'] : 10000;

            // if the collection has not been ranked, adding to set to be sent later for processing
            if(!collAreTokensRanked){
                collectionsWithoutPieceRanking.add(collContractAddress)
            }

            totalScore += collGrade;
            scoreBreakdown.addCollectionScoreComponent(collGrade, collName, collAddress);

            this.firebase.updateScoringProcessStatus(address, 'Computing score for individual pieces');
            const pieces = collections[i].nft_data;
            if(pieces){
                for (let j = 0; j < pieces.length; j++) {
                    // piece score is defaulted to collection grade
                    let pieceScore = collGrade * 1;
                    const piece = pieces[j];
                    if(piece){
                        const imageURI = piece.external_data && piece.external_data.image_512
                        const tokenId = piece.token_id
                        let otherData = {
                            'rank': undefined,
                            'supply': undefined
                        }
                        // if piece in collection is ranked, then use rank in computation of pieceScore
                        if(collAreTokensRanked){
                            let rank = await this.mongo.getNFTPieceRankInCollection(collContractAddress.toLowerCase(), parseInt(tokenId));
                            rank = rank.token_rank;
                            console.log(` ${tokenId} - ${collContractAddress} rank is ${rank}`)
                            pieceScore = rank ? Math.round(collGrade * collRankedSupply / rank) : pieceScore;
                            console.log(pieceScore)
                            otherData = {
                                'rank': rank,
                                'supply': collRankedSupply
                            }
                        }
                        scoreBreakdown.addIndividualPieceScoreComponent(pieceScore, collName, collAddress,
                            tokenId, imageURI, otherData);
                    }
                    // @todo: if minted, then dobule piece score
                    totalScore += pieceScore
                }
            }
        }

        this.firebase.updateScoringProcessStatus(address, 'Checking your POAP collectibles');
        //All POAP scoring
        let poapScore = 0;
        let realWorldScore = 0;
        let virtualWorldScore = 0;
        const poapRealWorldCollScore = 10;
        const poapVitualWorldCollScore = 3;
        const realWorldBadgePoints = 20;
        const virtualWorldBadgePoints = 1;
        const poapEvents = await this.poapRetriever.getPoapEvents(address);
        if(poapEvents) {
            if (poapEvents.realworld > 0){
                realWorldScore = realWorldBadgePoints * poapEvents.realworld;
                scoreBreakdown.addPiecesScoreComponent(realWorldScore, 'POAP - Real World', '');
                scoreBreakdown.addCollectionScoreComponent(poapRealWorldCollScore, 'POAP - Real World', '');
                realWorldScore+=poapRealWorldCollScore;
            }
            if (poapEvents.metaverse > 0){
                virtualWorldScore = virtualWorldBadgePoints * poapEvents.metaverse;
                scoreBreakdown.addPiecesScoreComponent(virtualWorldScore, 'POAP - Virtual World', '');
                scoreBreakdown.addCollectionScoreComponent(poapVitualWorldCollScore, 'POAP - Virtual World', '');
                virtualWorldScore+=poapVitualWorldCollScore;
            }
            poapScore = realWorldScore + virtualWorldScore;

        }
        this.firebase.updateScoringProcessStatus(address, 'Finalizing');

        console.log(`Total Poapscore is ${poapScore} for ${address}`)
        console.log(`realWorldScore: ${realWorldScore} virtualWorldScore: ${virtualWorldScore}`)
        totalScore+=poapScore


        console.log(`Total score computed ${totalScore} and asssigned to eo_address: ${address}`)

        //sending all collections without piece ranking to be computed
        let arrCollectionsWithoutPieceRanking = [...collectionsWithoutPieceRanking];
        arrCollectionsWithoutPieceRanking.forEach((collectionAddress: any) => {
            console.log(`Attempting to send message to rarity queue: ${collectionAddress}`);
            this.sqsPusher.sendMessage({}, collectionAddress.toLowerCase(), (success: any) => {
                console.log(`Sent message to rarity queue for contact: ${collectionAddress}`);
            })
        })
        return {
            'totalScore': totalScore,
            'scoreComponents': scoreBreakdown.getScoreBreakdown()
        }
    }

    async computeAndStoreCollectionScore(contract_address: string, owner_address: string, chain_id: number = 1){

        // computing time component
        const now = moment.now();
        const nftsStart = moment(new Date(2016, 6, 1))
        let covalentData = await this.covalentDataRetriever.getEarliestTransactionForNFT(contract_address, chain_id, 1);
        let nftFirstTransactionDate = covalentData.earliestDate;
        nftFirstTransactionDate = nftFirstTransactionDate? nftFirstTransactionDate : now;
        const timeComponent = (now - moment(nftFirstTransactionDate))/(now - nftsStart)

        // computing sales component
        // no way to get collection data through the contract_address... so we need to do this hack
        let openSeaData = await this.openSeaDataRetriever.getNFTCollectionStats(contract_address, owner_address);
        let colVolume = 0;
        if(openSeaData && openSeaData.stats && openSeaData.stats.total_volume){
            colVolume = openSeaData.stats.total_volume;
        }
        //@todo: need to create a way to select the volume to compare against (for now hardcoded to volume of crypto punk)
        const maxVolumeCryptoPunk = 560936.65/30;
        const volumeComponent = colVolume/maxVolumeCryptoPunk;

        // total grade
        const grade = Math.min(Math.max(Math.round(3*timeComponent + 6*volumeComponent + 1)*10, 10), 100);

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