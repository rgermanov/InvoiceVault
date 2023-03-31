import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ITopic } from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import path = require('path');
import { IBucket } from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Duration } from 'aws-cdk-lib';

export class AnalyzeMediaStack extends cdk.Stack {
    constructor(
        scope: Construct,
        id: string,
        uploadMediaTopic: ITopic,
        bucket: IBucket,
        props?: cdk.StackProps) {
        super(scope, id, props);


        const analyzeTable = new dynamodb.Table(this, 'analyzeTable', {
            partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
        });

        var analyzeFunction = new lambda.Function(this, 'AnalizeFunction', {
            runtime: lambda.Runtime.PYTHON_3_8,
            handler: 'analyze_with_textract.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/analyze')),
            environment: {
                BUCKET_NAME: bucket.bucketName,
                TABLE_NAME: analyzeTable.tableName
            },
            timeout: Duration.minutes(1)
        });

        const allowTextractPolicyStatement = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['textract:AnalyzeExpense'],
            resources: ["*"],
        });
        analyzeFunction.addToRolePolicy(allowTextractPolicyStatement);

        uploadMediaTopic.addSubscription(new subscriptions.LambdaSubscription(analyzeFunction));
        analyzeTable.grantReadWriteData(analyzeFunction);
        bucket.grantRead(analyzeFunction);
    }
}