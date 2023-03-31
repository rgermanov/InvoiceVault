import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BlockPublicAccess, Bucket, EventType, IBucket } from 'aws-cdk-lib/aws-s3';
import { ITopic, Topic } from 'aws-cdk-lib/aws-sns';
import { SnsDestination } from 'aws-cdk-lib/aws-s3-notifications';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import path = require('path');
import { Duration } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class UploadMediaStack extends cdk.Stack {
  
  public topic: ITopic;

  public bucket: IBucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucketName = 'bucket';
    const topicName = 'fileUploadedTopic';
    const uploadContentFunctionName = 'uploadFunction';
    const createUploadDetailsFunctionName = 'createUploadDetailsFunction';
    const apiName = 'api';

    this.bucket = new Bucket(this, bucketName, {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL
    });

    this.topic = new Topic(this, topicName);

    this.bucket.addEventNotification(EventType.OBJECT_CREATED, new SnsDestination(this.topic))

    const uploadTable = new dynamodb.Table(this, 'uploadTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });

    const uploadContentFunction = new lambda.Function(this, uploadContentFunctionName, {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'upload_function.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/upload')),
      environment: {
        BUCKET_NAME: this.bucket.bucketName,
        TABLE_NAME: uploadTable.tableName
      },
      timeout: Duration.minutes(1)
    });   

    this.bucket.grantPut(uploadContentFunction);
    uploadTable.grantReadData(uploadContentFunction);


    const createUploadDetailsFunction = new lambda.Function(this, createUploadDetailsFunctionName, {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'create_upload_details.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/upload')),
      environment: {
        TABLE_NAME: uploadTable.tableName
      }
    });

    uploadTable.grantReadWriteData(createUploadDetailsFunction);


    const api = new apigateway.RestApi(this, apiName, {
      binaryMediaTypes: ['application/pdf', 'image/jpg', 'image/png']
    });
    api.root.addMethod('ANY');

    const invoices = api.root.addResource('invoices');
    const uploadFileContentResource = invoices.addResource('upload');
    const uploadIdResource = uploadFileContentResource.addResource('{uploadId}')
    uploadIdResource.addMethod('POST', new apigateway.LambdaIntegration(uploadContentFunction));
    uploadFileContentResource.addMethod('PUT', new apigateway.LambdaIntegration(createUploadDetailsFunction));


    new cdk.CfnOutput(this, 'UploadTable', { value: uploadTable.tableName });
    new cdk.CfnOutput(this, 'Api', { value: api.url });
  }
}
