import os
import logging
import boto3
import base64
import json

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client('s3')
BUCKET_NAME = os.environ.get('BUCKET_NAME')

def handler(event, context):

    logger.info(event)
    
    try:
        body = json.loads(event['body'])
        filename = body['filename']
        content_type = body['contentType']
        content = base64.b64decode(body['content'])
        
        # upload
        response = s3.put_object(
            Bucket = BUCKET_NAME,
            Key = filename,
            Body = content,
            content_type = content_type,
            ACL = 'private'
        )
        
        return {
            'statusCode': 201,
            'headers': {
                'Location': response['ResponseMetadata']['HTTPHeaders']['location']
            },
            'body': json.dumps({
                'location': response['ResponseMetadata']['HTTPHeaders']['location']
            })
        }
    except Exception as e:
        logger.error(e)
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Internal server error'
            })
        }