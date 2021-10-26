import  {Consumer} from "sqs-consumer";
import Scorer from "./scorer";
import AWS from "aws-sdk";
import MockMongoInterface from "./persisters/mock/mockMongoInterface";
import MockFirebaseInterface from "./persisters/mock/mockFirebaseInterface";
import MockCovalentDataRetriever from "./retrievers/mock/mockCovalentDataRetriever";
import MockOpenSeaDataRetriever from "./retrievers/mock/mockOpenSeaDataRetriever";
import MockPoapRetriever from "./retrievers/mock/mockPoapRetriever";

require("dotenv").config();

AWS.config.update({
    region: 'eu-west-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const mongoURI = process.env.MONGO_URL || '';
const dbName = process.env.MONGO_DB_NAME || '';
const mongo = new MockMongoInterface(mongoURI, dbName, 'HistoricalScores')

const databaseURL = process.env.FIREBASE_DATABASE_URL || '';
const projectId = process.env.FIREBASE_PROJECT_ID || '';
const pathToCredentails = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
const firebase = new MockFirebaseInterface(pathToCredentails, databaseURL, projectId);


const covalentRetriever = new MockCovalentDataRetriever(process.env.COVALENT_API_KEY || '');
const openSeaDataRetriever = new MockOpenSeaDataRetriever();
const poapRetriever = new MockPoapRetriever();

const scorer = new Scorer(mongo, firebase, covalentRetriever, openSeaDataRetriever, poapRetriever);


const start = () => {
    const testAddresses = [
        '0x7261d367F382FCD04a116E18883EBFe68BE64EE3',
        '0x7261d367F382FCD04a116E18883EBFe68BE64EE4',
        '0x7261d367F382FCD04a116E18883EBFe68BE64EE5',
        '0x7261d367F382FCD04a116E18883EBFe68BE64EE6',
        '0x7261d367F382FCD04a116E18883EBFe68BE64EE7'
    ];
    testAddresses.forEach((address, index)=>{
        setTimeout(() => {
            console.log('***Mock New message received***')
            scorer.computeAndStoreScore(address.toLowerCase());
        }, index * 3000)
    })

}

scorer.init(start);