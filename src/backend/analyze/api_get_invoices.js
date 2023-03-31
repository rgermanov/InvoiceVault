
import DynamoDB from "aws-sdk/clients/dynamodb"
const documentClient = new DynamoDB.DocumentClient();

exports.handler = async (event, context) => {

    console.info("The event from apigateway.");
    console.info(event);

    const tableName = process.env.TABLE_NAME;        

    const params = {
        TableName: tableName,
        Limit: 20,
        ScanIndexForward: false        
    };

    const data = await documentClient.scan(params).promise();    
    console.info(data.Items);

    const invoicesList = [];
    data.Items.map((invoice) => {
        invoicesList.push(
            {
                id: invoice.id,
                data: invoice.expense_info
            }
        );
    });
    
    const invoiceData = {        
        invoices: invoicesList
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
