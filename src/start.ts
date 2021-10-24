import  {Consumer} from "sqs-consumer";
import Scorer from "./scorer";
import AWS from "aws-sdk";
import MongoInterface from "./mongoInterface";
import FirebaseInterface from "./firebaseInterface";
import CovalentDataRetriever from "./covalentDataRetriever";
import OpenSeaDataRetriever from "./openSeaDataRetriever";

require("dotenv").config();

AWS.config.update({
    region: 'eu-west-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const mongoURI = process.env.MONGO_URL || '';
const dbName = process.env.MONGO_DB_NAME || '';
const mongo = new MongoInterface(mongoURI, dbName, 'HistoricalScores')

const databaseURL = process.env.FIREBASE_DATABASE_URL || '';
const projectId = process.env.FIREBASE_PROJECT_ID || '';
const pathToCredentails = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
const firebase = new FirebaseInterface(pathToCredentails, databaseURL, projectId);

const covalentRetriever = new CovalentDataRetriever(process.env.COVALENT_API_KEY || '');
const openSeaDataRetriever = new OpenSeaDataRetriever();

const scorer = new Scorer(mongo, firebase, covalentRetriever, openSeaDataRetriever);

// const re = '0x[a-fA-F0-9]{40}'
// const ethRegex = new RegExp(re, 'g')

const start = () => {
    const app = Consumer.create({
        queueUrl: process.env.SQS_QUEUE_URL,
        handleMessage: async (message: any) => {
            console.log('***New message received***')
            const address = message.Body;
            scorer.computeAndStoreScore(address.toLowerCase());
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