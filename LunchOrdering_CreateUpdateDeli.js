const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({ region: "ap-southeast-1" });
const MENU_TABLE = "LunchOrder_Info";

const createUpdateDeli = async ({my_deli_id,deli_township,deli_fee,shop}) => {

  var params = {
    TableName: MENU_TABLE,
    Item: {
      id:my_deli_id,
      shop:shop,
      deli_township:deli_township,
      deli_fee:deli_fee
    },
  };
   return db.put(params).promise();
};

exports.handler = async (event,context) => {
   try {
    const {id,deli_township,deli_fee,shop} = event;
   var my_deli_id;
    if(id==null || id=='null') my_deli_id='Delivery'+context.awsRequestId;
    else my_deli_id=id;
    
    await createUpdateDeli({my_deli_id,deli_township,deli_fee,shop});
    context.done(null);
  } catch (err) {
    context.done(err, null);
  }
};

// {
//   "shop": "Shop0001",
//   "id": null,
//   "deli_township": "Hlaing Township",
//   "deli_fee": 2000
// }
// menu_id = null? ==> new deli
// menu_id = value ==> update deli 