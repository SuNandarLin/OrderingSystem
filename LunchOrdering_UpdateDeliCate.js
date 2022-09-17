const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({ region: "ap-southeast-1" });
const TABLE = "LunchOrder_Info";
var s3 = new AWS.S3();

const deleteMenu = async (id,image_url,shop) => {
     if(image_url!=null){
         const filePath=image_url.replace('https://lunchbox-menu-photos.s3-ap-southeast-1.amazonaws.com/','');
         var params = {
            "Bucket": "lunchbox-menu-photos",
            "Key": filePath  
         };
     await s3.deleteObject(params).promise();
     }
    var deleteparams = {
        TableName:TABLE,
            Key:{
                shop:shop,
                id:id
            }
        };
    await db.delete(deleteparams).promise();  
}

const deleteMenuWithoutCate = async (value,shop) => {
    var params = {
    TableName: TABLE,
    ProjectionExpression:'category,id,image_url',
    KeyConditionExpression: 'shop = :shop and begins_with(id, :idForMenu)',
    ExpressionAttributeValues: {
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
     var i;var j;
     for(i=0;i<queryResults.length;i++){
         var k=0;
         for(j=0;j<value.length;j++){
             if(queryResults[i].category==value[j])
             k++;
         }
         if(k==0){
            await deleteMenu(queryResults[i].id,queryResults[i].image_url,shop);
         }
        
     }
}

const updateDeliAndCate = async ({type,value,shop}) => {
    const id='Category and DeliTime';
    if(type=='Category'){ 
        type='category';
        await deleteMenuWithoutCate(value,shop);
    }
    else if(type=='DeliTime') type='deli_time';
    var params = {
        TableName: TABLE,
        Key: {
            shop:shop,
            id: id
        },
        UpdateExpression: "SET #uinfo= :vals",

        ExpressionAttributeNames: {
        "#uinfo": type,
         },
        ExpressionAttributeValues: {
        ":vals": value,
         },
         ReturnValues: "UPDATED_NEW",
    };

    return await db.update(params).promise();
};


exports.handler = async (event,context) => {
    
try{
   const {type,value,shop} = event;
   const result = await updateDeliAndCate({type,value,shop});
    const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,PUT,GET",
            "Access-Control-Allow-Credentials": true
        },
        body: result,
    };
  return response.body;
    //context.done(null, result);
} catch (err) {
    context.done(err, null);
  }
};
// {
//      "shop": "Shop0001",
//      "type": "DeliTime",
//      "value": [1602297000000,1602300600000,1602304200000,1602307800000,1602311400000,1602320580000,1602322200000]
//  }
// type == DeliTime ? Category

