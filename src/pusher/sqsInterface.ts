import AWS from "aws-sdk";

export default class SQSInterface {
    SQS_QUEUE_URL: string;
    sqs:any;
    constructor(aws_access_key_id: string, aws_secret_access_key: string, sqs_queue_url: string) {
        if(AWS && AWS.config && AWS.config.credentials){
            AWS.config.credentials.accessKeyId = aws_access_key_id;
            AWS.config.credentials.secretAccessKey = aws_secret_access_key;
            AWS.config.update({region: 'REGION'});
        }
        this.SQS_QUEUE_URL = sqs_queue_url ;
        this.sqs = new AWS.SQS({apiVersion: '2012-11-05'});
    }

    sendMessage(msgAttributes: any, msgBody: any, callback: any){
        const params = {
            MessageAttributes: msgAttributes,
            MessageBody: msgBody,
            QueueUrl: this.SQS_QUEUE_URL
        };
        this.sqs.sendMessage(params, (err: any, data: any) => {
            if (err) {
                console.log("Error", err);
                callback(false);
            } else {
                console.log("Success", data.MessageId);
                callback(true);
            }
        });
    }
}
