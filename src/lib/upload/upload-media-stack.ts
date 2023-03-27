import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BlockPublicAccess, Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { SnsDestination } from 'aws-cdk-lib/aws-s3-notifications';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import path = require('path');
import { Duration } from 'aws-cdk-lib';
import { Timeout } from 'aws-cdk-lib/aws-stepfunctions';

export class UploadMediaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucketName = 'bucket';
    const topicName = 'fileUploadedTopic';
    const uploadContentFunctionName = 'uploadFunction';
    const createUploadDetailsFunctionName = 'createUploadDetailsFunction';
    const apiName = 'api';

    const bucket = new Bucket(this, bucketName, {      
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL
    });    

    const topic = new Topic(this, topicName);

    bucket.addEventNotification(EventType.OBJECT_CREATED, new SnsDestination(topic))

    const uploadContentFunction = new lambda.Function(this, uploadContentFunctionName, {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'upload_function.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/upload')),
      environment: {
        BUCKET_NAME: bucket.bucketName
      },
      timeout: Duration.minutes(1)
    });

    const createUploadDetailsFunction = new lambda.Function(this, createUploadDetailsFunctionName, {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'create_upload_details.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/upload'))      
    });

    bucket.grantPut(uploadContentFunction);
    
    const api = new apigateway.RestApi(this, apiName);

    api.root.addMethod('ANY');

    const invoices = api.root.addResource('invoices');
    const uploadFileContentResource = invoices.addResource('upload');
    const uploadIdResource = uploadFileContentResource.addResource('{uploadId}')
    uploadIdResource.addMethod('POST', new apigateway.LambdaIntegration(uploadContentFunction));
    uploadFileContentResource.addMethod('PUT', new apigateway.LambdaIntegration(createUploadDetailsFunction));


    // const createUploadDetailsResource = invoices.addResource('upload');
  }  
}
