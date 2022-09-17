const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({ region: "ap-southeast-1" });
const TABLE = "LunchOrder_Info";

const GetUser = async (id,shop) => {
    id="User"+id;
    
 var params = {
    TableName: TABLE,
    KeyConditionExpression: 'shop = :shop and id = :idForUser',
    ExpressionAttributeValues: {
      ':idForUser' :  id,
      ':shop' :shop
    }
  };

  let items=[]; 
  items= await db.query(params).promise();
     
  return items.Items[0];
};
exports.handler = async (event,context) => {
    
try{
    const {id,shop} = event;
   const result = await GetUser(id,shop);

    context.done(null, result);
} catch (err) {
    context.done(err, null);
  }
};

// {
//   "shop": "Shop0001",
//   "id": "0101"
// }