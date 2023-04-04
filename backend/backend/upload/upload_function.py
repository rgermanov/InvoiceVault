import os
import logging
import boto3
import json
import base64
from boto3.dynamodb.types import TypeDeserializer

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client('s3')
dynamodb = boto3.client('dynamodb')
deserializer = TypeDeserializer()

BUCKET_NAME = os.environ.get('BUCKET_NAME')
TABLE_NAME = os.environ.get('TABLE_NAME')

def handler(event, context):
    try:
        id = event["pathParameters"]["uploadId"]
        logger.info({'uploadId': id})

        # get upload details
        upload_details_response = dynamodb.get_item(
            TableName=TABLE_NAME,
            Key={
                'id': {'S': id}
            }
        )
        upload_details = upload_details_response.get('Item', {})
        upload_details = {key: deserializer.deserialize(val) for key, val in upload_details.items()}
        logger.info(upload_details)

        # get upload content
        file_content = base64.b64decode(event['body'])

        # upload
        response = s3.put_object(
            Bucket=BUCKET_NAME,
            Key=id,
            Body=file_content,
            ContentType=upload_details['contentType'],
            ACL='private',

        )

        return {
            'statusCode': 201
        }
        
    except Exception as e:
        logger.error(e)

        return {
            'statusCode': 500,
            'Content-Type': 'application/json',
            'body': json.dumps({
                'message': 'Internal server error'
            })
        }
