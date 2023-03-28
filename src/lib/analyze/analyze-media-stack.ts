import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ITopic } from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import path = require('path');

export class AnalyzeMediaStack extends cdk.Stack {
    constructor(scope: Construct, id: string, uploadMediaTopic: ITopic, props?: cdk.StackProps) {
      super(scope, id, props);


        var analyzeFunction = new lambda.Function(this, 'AnalizeFunction', {
            runtime: lambda.Runtime.PYTHON_3_8,
            handler: 'analyze_with_textract.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/analyze'))
        });

        uploadMediaTopic.addSubscription(new subscriptions.LambdaSubscription(analyzeFunction));
    }
}