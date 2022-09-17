const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({ region: "ap-southeast-1" });
const TABLE = "LunchOrder_Info";
var s3 = new AWS.S3();

const getImageUrlForUpdate = async ({id,shop}) => {
     var paramsPhoto = {
            TableName: TABLE,
            ProjectionExpression: 'image_url',
            KeyConditionExpression: 'shop = :shop and id = :menuId',
            ExpressionAttributeValues: {
              ':menuId' :  id,
              ':shop' : shop
            }
        };
        let items=[]; 
        items= await db.query(paramsPhoto).promise();
        return items==null?null:items.Items[0].image_url;
}

const deleteMenuAndInfo = async (id,shop) => {
    
  if(id.includes("Menu")){
      var filePath = await getImageUrlForUpdate({id,shop});
      if(filePath!=null){
          filePath=filePath.replace('https://lunchbox-menu-photos.s3-ap-southeast-1.amazonaws.com/','');
          var params = {
            "Bucket": "lunchbox-menu-photos",
            "Key": filePath  
          };
        await s3.deleteObject(params).promise();
      }
    }  
     var deleteparams = {
     TableName:TABLE,
     Key:{
        shop:shop,
        id:id
     }
    };
  await db.delete(deleteparams).promise();
};

exports.handler = async (event,context) => {
    
try{
   const {id,shop} = event;
   const result = await deleteMenuAndInfo(id,shop);

    context.done(null);
} catch (err) {
    context.done(err, null);
  }
};
// {
//   "shop": "Shop0001",
//   "id": "c04b44e4-dd6b-4433-8160-27102ee6cf2a"
// }

