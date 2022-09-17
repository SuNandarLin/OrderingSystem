const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({ region: "ap-southeast-1" });
const TABLE = "LunchOrder_Info";

const getDeliAndCate = async ({type,shop}) => {
 
 if(type=='Category and DeliTime'){
    console.log("here here");
    var params = {
     TableName: TABLE,
    Key: {
        "shop": shop,
        "id": type
    }
  }; 
   let scanResults = [];
     let items;
     do{
         items =  await db.get(params).promise();
     }while(typeof items.LastEvaluatedKey != "undefined");
     
    return items.Item;
 }else if(type=='Delivery'){
    var params = {
    TableName: TABLE,
    KeyConditionExpression: 'shop = :shop and begins_with(id,:idType)',
    ExpressionAttributeValues: {
      ':shop' :shop,
      ':idType':type
    }
  }; 
  let queryResults = [];
     let items;
     try{
     do{
         items =  await db.query(params).promise();
         items.Items.forEach((item) => queryResults.push(item));
     }while(typeof items.LastEvaluatedKey != "undefined");
     }catch(e){
        console.log(e);    
     }
     return queryResults;
 }
};
exports.handler = async (event,context) => {
   var result ;
try{
   const {type,shop} = event;
    result = await getDeliAndCate({type,shop});

} catch (err) {
    //context.done(err, null);
  }
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
};

// {
//   "shop": "Shop0001",
//   "type": "Delivery"
// }
//menu_id != null ==> Get by menu_id?
//menu_id == null ==> Get type = Delivery,DeliTime,Category?


