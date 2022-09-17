const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({ region: "ap-southeast-1" });
const TABLE = "LunchOrder_Info";

const getMenu = async ({order_type,shop}) => {

   var params = {
    TableName: TABLE,
    KeyConditionExpression: 'shop = :shop and begins_with(id, :idForMenu)',
    FilterExpression:'order_type = :ordertype',
    ExpressionAttributeValues: {
      ':ordertype' :  order_type,
      ':shop' :shop,
      ':idForMenu':'Menu'
    }
  }; 

  let queryResults = [];
     let items;
     do{
         items =  await db.query(params).promise();
         items.Items.forEach((item) => queryResults.push(item));
     }while(typeof items.LastEvaluatedKey != "undefined");
     
     return queryResults;
};
exports.handler = async (event,context) => {
    
var result;
try{
   const {order_type,shop } = event;
   result = await getMenu({order_type,shop});

    //context.done(null, result);

   const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
            "Access-Control-Allow-Credentials": true
        },
        body: result,
    };
     return response.body; 
    } catch (err) {
     context.done(err, null);
  }
};
// {
//   "shop": "Shop0001",
//   "order_type": "Preorder"
// }
// Preorder,Todayorder
