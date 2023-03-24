import os
import logging
import boto3
import base64
import json
import uuid

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client('s3')
BUCKET_NAME = os.environ.get('BUCKET_NAME')


def handler(event, context):
    try:
        file_content = bytes(event['body'], 'utf-8')

        # upload
        response = s3.put_object(
            Bucket=BUCKET_NAME,
            Key=str(uuid.uuid4()),
            Body=file_content,
            ACL='private'
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
