import MongoInterface from "./persisters/mongoInterface";
import ScoreComponent from "./interfaces/scoreComponentType";

export default class ScorerBreakdownTracker {
    address: string;
    tracker: Array<ScoreComponent>;
    constructor(address: string){
        this.address = address
        this.tracker = [];
    }

    getScoreBreakdown(): Array<ScoreComponent>{
        return this.tracker;
    }

    addCollectionScoreComponent(score: number, colName: string, colAddress: string): Array<ScoreComponent>{
        this.tracker.push({
            'type': 'collection',
            'collectionName': colName,
            'points': score,
            'contractAddress': colAddress,
        })
        return this.tracker;
    }

    addIndividualPieceScoreComponent(score: number, colName: string, colAddress: string, pieceId: string, mediaURI: string): Array<ScoreComponent>{
        this.tracker.push({
            'type': 'piece',
            'pieceID': pieceId || '',
            'collectionName': colName,
            'points': score,
            'contractAddress': colAddress,
            'mediaURI': mediaURI || process.env.DEFAULT_IMAGE || ''
        })
        return this.tracker;
    }

    addPiecesScoreComponent(score: number, colName: string, colAddress: string): Array<ScoreComponent>{
        this.tracker.push({
            'type': 'all_pieces',
            'collectionName': colName,
            'points': score,
            'contractAddress': colAddress,
        })
        return this.tracker;
    }
}