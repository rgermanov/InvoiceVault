
import DynamoDB from "aws-sdk/clients/dynamodb"
const documentClient = new DynamoDB.DocumentClient();
// const attr = require('dynamodb-data-types').AttributeValue;

exports.handler = async (event, context) => {

    console.info("The event from apigateway.");
    console.info(event);

    const tableName = process.env.TABLE_NAME;    
    const invoiceId = event.pathParameters.invoiceId;

    const params = {
        TableName: tableName,
        Key: {
            id: invoiceId
        }
    };

    const data = await documentClient.get(params).promise();    
    console.info(data.Item.expense_info);

    // Convert the DynamoDB JSON to pure JSON    
    // const pureJson = attr.unwrap(data.Item.expense_info);

    const invoiceData = {
        id: invoiceId,
        data: {
            'documents': data.Item.expense_info
        }
    };

    const response = {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(invoiceData)
    };

    return response;
};
