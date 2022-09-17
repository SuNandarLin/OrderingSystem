const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({ region: "ap-southeast-1" });
const TABLE = "LunchOrder_Info";

const checkUser = async (id,shop) => {
  
var params = {
    TableName: TABLE,
    KeyConditionExpression: 'shop = :shop and id = :idForUser',
    ExpressionAttributeValues: {
      ':idForUser' :  id,
      ':shop' : shop
    }
  };
     let items;
     do{
         items =  await db.query(params).promise();
     }while(typeof items.LastEvaluatedKey != "undefined");
     //console.log(items);
     
     return items.Items;
};

const createUser = async ({id,user_name,address,phone,shop}) => {
 id="User"+id; 
 let userExist=await checkUser(id,shop);
  if((userExist.length)==0){
  console.log("User does not exist");
  var params = {
    TableName: TABLE,
    Item: {
      id:id,
      shop:shop,
      user_name:user_name,
      address:address,
      phone:phone
    },
  };
  return db.put(params).promise();
  }else{
     console.log("User exists");
    return null;
  }
};

exports.handler = async (event,context) => {
   try {
    const {id,user_name,address,phone,shop}  = event;

    await createUser({id,user_name,address,phone,shop});
    context.done(null);
  } catch (err) {
    context.done(err, null);
  }
};

// {
//   "shop": "Shop0001",
//   "id": "0707",
//   "user_name": "John",
//   "address": [
//     "Yangon"
//   ],
//   "phone": [
//     "+959123456"
//   ]
// }