const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({ region: "ap-southeast-1" });
const TABLE = "LunchOrder_Info";

const GetUser = async (id,shop) => {
  
var params = {
    TableName: TABLE,
    KeyConditionExpression: 'shop = :shop and id = :idForUser',
    ExpressionAttributeValues: {
      ':idForUser' :  id,
      ':shop' :shop
    }
  };
  let scanResults = [];
     let items;
     do{
         items =  await db.query(params).promise();
         items.Items.forEach((item) => scanResults.push(item));
     }while(typeof items.LastEvaluatedKey != "undefined");
     
     return scanResults;
};

const updateUserInfo = async ({id,update_info,add_or_ph,shop}) => {
    id="User"+id;
    
    
    //if add_or_ph is "address" else if "phone" , "address" "phone" attribute name
    var params = {
        TableName: TABLE,
        Key: {
            shop:shop,
            id: id
        },
        UpdateExpression: "SET #uinfo= :vals",

        ExpressionAttributeNames: {
        "#uinfo": add_or_ph,
         },
        ExpressionAttributeValues: {
        ":vals": update_info,
         },
         ReturnValues: "UPDATED_NEW",
    };

    await db.update(params).promise();
    const result = await GetUser(id,shop);
    return result;
};


exports.handler = async (event,context) => {
    
try{
   const {id,update_info,add_or_ph,shop} = event;
   const result = await updateUserInfo({id,update_info,add_or_ph,shop});

    context.done(null, result);
} catch (err) {
    context.done(err, null);
  }
};

// {
//      "shop": "Shop0001",
//      "id": "0202",
//      "update_info": [
//          "No.003/3,Anyang,Korea",
//          "No.005/5,Gyeonggi,Korea"
//       ],
//       "add_or_ph": "address"
//  }