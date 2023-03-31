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
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as nodejslambda from 'aws-cdk-lib/aws-lambda-nodejs';

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

        
        var getInvoiceFunction = new nodejslambda.NodejsFunction(this, 'GetInvoiceFunction', {
            runtime: lambda.Runtime.NODEJS_16_X,
            entry: path.join(__dirname, '../../backend/analyze/api_get_invoices.js'),
            handler: 'handler',
            environment: {                
                TABLE_NAME: analyzeTable.tableName
            },
            bundling: {
                nodeModules: ['dynamodb-data-types']
                // externalModules: ['dynamodb-data-types']
            }
        });
        // var getInvoiceFunction = new lambda.Function(this, 'GetInvoiceFunction', {
        //     runtime: lambda.Runtime.NODEJS_16_X,
        //     handler: 'api_get_invoices.handler',
        //     code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/analyze')),
        //     environment: {                
        //         TABLE_NAME: analyzeTable.tableName
        //     },            
        // });

        analyzeTable.grantReadData(getInvoiceFunction);

        const api = new apigateway.RestApi(this, 'api');
        api.root.addMethod('ANY');
    
        const invoices = api.root.addResource('invoices');
        invoices.addMethod('GET');
        const getInvoicesResource = invoices.addResource('{invoiceId}');
        getInvoicesResource.addMethod('GET', new apigateway.LambdaIntegration(getInvoiceFunction));        
            
        new cdk.CfnOutput(this, 'Api', { value: api.url });
    }
}