import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BlockPublicAccess, Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { SnsDestination } from 'aws-cdk-lib/aws-s3-notifications';

export class UploadMediaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucketName = 'upload-media';
    const topicName = 'upload-media-topic'

    const bucket = new Bucket(this, bucketName, {      
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL
    });    

    const topic = new Topic(this, topicName);

    bucket.addEventNotification(EventType.OBJECT_CREATED, new SnsDestination(topic))
  }
}
