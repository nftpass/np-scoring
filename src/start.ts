import  {Consumer} from "sqs-consumer";
import Scorer from "./scorer";
import AWS from "aws-sdk";
import MongoInterface from "./persisters/mongoInterface";
import FirebaseInterface from "./persisters/firebaseInterface";
import SQSInterface from "./pusher/sqsInterface";
import CovalentDataRetriever from "./retrievers/covalentDataRetriever";
import OpenSeaDataRetriever from "./retrievers/openSeaDataRetriever";
import PoapRetriever from "./retrievers/poapRetriever";

require("dotenv").config();


const aws_access_key_id = process.env.AWS_ACCESS_KEY_ID || '';
const aws_secret_access_key = process.env.AWS_SECRET_ACCESS_KEY || '';
const rarity_scoring_queue = process.env.RARITY_SCORE_SQS_QUEUE_URL || '';
AWS.config.update({
    region: 'eu-west-1',
    accessKeyId: aws_access_key_id,
    secretAccessKey: aws_secret_access_key
});
const sqsPusher = new SQSInterface(aws_access_key_id, aws_secret_access_key, rarity_scoring_queue);

const mongoURI = process.env.MONGO_URL || '';
const dbName = process.env.MONGO_DB_NAME || 'NFTPASS-TEST';
const mongo = new MongoInterface(mongoURI, dbName)

const databaseURL = process.env.FIREBASE_DATABASE_URL || '';
const projectId = process.env.FIREBASE_PROJECT_ID || '';
const pathToCredentails = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
const firebase = new FirebaseInterface(pathToCredentails, databaseURL, projectId);

const covalentRetriever = new CovalentDataRetriever(process.env.COVALENT_API_KEY || '');
const openSeaDataRetriever = new OpenSeaDataRetriever();
const poapRetriever = new PoapRetriever();

const scorer = new Scorer(mongo, firebase, sqsPusher, covalentRetriever, openSeaDataRetriever, poapRetriever);

const reg = new RegExp(/^0x[a-fA-F0-9]{40}$/);

const start = () => {
    const app = Consumer.create({
        queueUrl: process.env.SQS_QUEUE_URL,
        handleMessage: async (message: any) => {
            console.log('***New message received***')
            const address = message.Body;
            if(reg.test(address)){
                scorer.computeAndStoreScore(address.toLowerCase());
            } else {
                console.log(`${address} does not follow the ETH address regex`)
            }

        },
        sqs: new AWS.SQS()
    });

    app.on('error', (err: any) => {
        console.error(err.message);
    });

    app.on('processing_error', (err: any) => {
        console.error(err.message);
    });

    app.on('timeout_error', (err: any) => {
        console.error(err.message);
    });

    app.start();
}

scorer.init(start);