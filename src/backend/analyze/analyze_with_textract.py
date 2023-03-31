import boto3
import json
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client('s3')
textract = boto3.client('textract')
dynamodb = boto3.client('dynamodb')

bucket_name = os.environ.get('BUCKET_NAME')
table_name = os.environ.get('TABLE_NAME')


def handler(event, context):
    try:
        logger.info(event)

        # Retrieve the ID from the SNS message
        message = json.loads(event['Records'][0]['Sns']['Message'])
        logging.info(message)
        keyId = message['Records'][0]['s3']['object']['key']
        logging.info('key: ' + keyId)

        # Retrieve the file from S3 using the ID
        s3_response = s3.get_object(Bucket=bucket_name, Key=keyId)
        file_content = s3_response['Body'].read()

        # Analyze the file using AWS Textract's AnalyzeExpense API
        analyze_response = textract.analyze_expense(
            Document={'Bytes': file_content})
        logger.info(analyze_response)

        expense_docs_to_save = []
        expense_documents = analyze_response['ExpenseDocuments']
        for expense_document in expense_documents:
            expense_fields = expense_document['SummaryFields']

            # Map the expense information to DynamoDB JSON format
            expense_info = {}
            for field in expense_fields:
                field_value = {'S': field['ValueDetection']['Text']}
                expense_info[field['Type']['Text']] = field_value

            expense_docs_to_save.append({'M': expense_info})

        logger.info(expense_docs_to_save)

        # Save the results in a DynamoDB table
        item = {
            'id': {'S': keyId},
            'expense_info': {'L': expense_docs_to_save},
            'raw_result': {'S': json.dumps(analyze_response)}
        }
        dynamodb.put_item(TableName=table_name, Item=item)

        return {
            'statusCode': 200,
            'body': json.dumps('Analysis complete'),
        }
    except Exception as e:
        logger.error(f'Error analyzing file: {e}')
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error analyzing file: {e}'),
        }
