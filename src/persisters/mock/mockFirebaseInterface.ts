import { getDatabase, ref, set } from "firebase/database";
import admin from "firebase-admin";
import { initializeApp, applicationDefault } from 'firebase-admin/app';

type ScoreComponent = {
    collectionName: string;
    points: number;
    contractAddress: string;
};

export default class MockFirebaseInterface {
    constructor(pathToCredentials: string, databaseURL: string, projectId: string) {
        console.log('Creating mock Firebase instance')
    }

    async persistScore(address: string, score: number) {
        const path = '/score/' + address;
        console.log(`MOCK: Assigning to eo_address ${address} -> ${score} in Firebase using the path: ${path}`)

    }

    async persistScoreComponents(address: string, scoreComponents: Array<ScoreComponent>) {
        const path = '/scoreBreakdown/' + address;
        console.log(`MOCK: Assigning score breakdown to eo_address ${address} in Firebase using the path: ${path}`)
    }

}






