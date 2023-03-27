import logging
import uuid
import json
import os
import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

TABLE_NAME = os.environ.get('TABLE_NAME')
dynamodb = boto3.client('dynamodb')


def handler(event, context):

    try:
        body = json.loads(event['body'])
        id = uuid.uuid4()

        logger.info(body)

        dynamodb.put_item(
            TableName=TABLE_NAME,
            Item={
                'id': {'S': str(id)},
                'fileName': {'S': body['fileName']},
                'contentType': {'S': body['contentType']},
                'size': {'S': body['size']},
                'user_id': {'S': 'me'}
            }
        )

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'id': str(id)
            })
        }

    except Exception as e:
        logger.error(e)

        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'Internal server error.'
            })
        }
