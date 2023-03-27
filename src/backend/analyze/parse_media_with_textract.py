import boto3
import json
import os

s3 = boto3.client('s3')
textract = boto3.client('textract')
dynamodb = boto3.client('dynamodb')

bucket_name = os.environ['BUCKET_NAME']
table_name = os.environ['TABLE_NAME']

def lambda_handler(event, context):
    try:
        # Retrieve the ID from the SNS message
        id = event['id']

        # Retrieve the file from S3 using the ID
        file_key = f'{id}.jpg'
        response = s3.get_object(Bucket=bucket_name, Key=file_key)
        file_content = response['Body'].read()

        # Analyze the file using AWS Textract's AnalyzeExpense API
        response = textract.analyze_expense(Document={'Bytes': file_content})
        expense_fields = response['ExpenseFields']

        # Map the expense information to DynamoDB JSON format
        expense_info = {}
        for field in expense_fields:
            field_value = {'S': field['ValueDetection']['StringValue']}
            expense_info[field['Type']] = field_value

        # Save the results in a DynamoDB table
        item = {
            'id': {'S': id},
            'expense_info': {'M': expense_info},
        }
        dynamodb.put_item(TableName=table_name, Item=item)

        return {
            'statusCode': 200,
            'body': json.dumps('Analysis complete'),
        }
    except Exception as e:
        print(f'Error analyzing file: {e}')
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error analyzing file: {e}'),
        }
