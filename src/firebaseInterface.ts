import { getDatabase, ref, set } from "firebase/database";
import admin from "firebase-admin";
import { initializeApp, applicationDefault } from 'firebase-admin/app';

export default class FirebaseInterface {
    firebaseApp: any;
    firebaseDB: any;

    constructor(pathToCredentials: string, databaseURL: string, projectId: string) {
        const serviceAccount = require(pathToCredentials);
        this.firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: databaseURL,
            projectId: projectId,
        });
        this.firebaseDB = admin.database();
    }

    async persistScore(address: string, score: number) {
        const path = '/score/' + address;
        console.log(`Assigning to eo_address ${address} -> ${score} in Firebase using the path: ${path}`)
        set(ref(this.firebaseDB, path), {
            "address": address,
            "score": score,
            "last_updated": new Date().toISOString()
        });
    }

}






