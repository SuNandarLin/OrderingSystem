const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({ region: "ap-southeast-1" });
const TABLE = "LunchOrder_Info";
var s3 = new AWS.S3();

const getImageUrlForUpdate = async ({my_menu_id,shop}) => {
     var paramsPhoto = {
            TableName: TABLE,
            ProjectionExpression: 'image_url',
            KeyConditionExpression: 'shop = :shop and id = :menuId',
            ExpressionAttributeValues: {
              ':menuId' :  my_menu_id,
              ':shop' : shop
            }
        };
    
        let items=[]; 
        items= await db.query(paramsPhoto).promise();
        return items==null?null:items.Items[0].image_url;
}

const CreateUpdateMenu = async ({my_menu_id,menu_name,category,order_type,price,description,photo_value,active,shop,type}) => {
  
  var image_url;  
  if(photo_value==null || photo_value=='null'){
    if(type=='Add')image_url=null;  
    else if(type=='Update'){
       image_url=await getImageUrlForUpdate({my_menu_id,shop});
    }
 }else{
    let encodedImage =photo_value;
     let decodedImage = Buffer.from(encodedImage, 'base64');
     var s3FolderName=shop;
     var filePath = s3FolderName+"/"+my_menu_id+'_'+Date.now().toString()+'.jpg';
       image_url="https://lunchbox-menu-photos.s3-ap-southeast-1.amazonaws.com/"+filePath;
     
    if(type=='Update'){
      var old_image_url=await getImageUrlForUpdate({my_menu_id,shop});

        if(old_image_url!=null){
         var deletephotoparams = {
          "Bucket": "lunchbox-menu-photos",
          "Key": old_image_url.replace('https://lunchbox-menu-photos.s3-ap-southeast-1.amazonaws.com/','')  
         };
        await s3.deleteObject(deletephotoparams).promise();
        }
    }
   
    var paramsPhoto = {
       "Body": decodedImage,
       "Bucket": "lunchbox-menu-photos",
       "Key": filePath  
    }; 
    await s3.upload(paramsPhoto).promise();
  }
  
   var params = {
    TableName: TABLE,
    Item: {
      id:my_menu_id,
      shop:shop,
      menu_name:menu_name,
      category:category,
      order_type:order_type,
      price:price,
      description:description,
      image_url:image_url,
      active:active
    },
  };
  return await db.put(params).promise();
   
};

exports.handler = async (event,context) => {
   try {
    const {id,menu_name,category,order_type,price,description,photo_value,active,shop} = event;
      var my_menu_id;
      var type;
        if(id==null || id=='null'){ 
            type='Add';
            my_menu_id="Menu"+context.awsRequestId;
        }
        else{ 
            type='Update';
            my_menu_id=id;
        }
    await CreateUpdateMenu({my_menu_id,menu_name,category,order_type,price,description,photo_value,active,shop,type});
    let response = {
        "statusCode": 200,
        "headers": {
            "my_header": "my_value",
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
            "Access-Control-Allow-Credentials": true
        },
        "body": "",
        "isBase64Encoded": false
    };
    return response;
  } catch (err) {
    context.done(err, null);
  }
};

// {
//   "menu_id": "7d2cf57a-a037-4453-bb72-43f128605e89",
//   "menu_name": "ဆေးဘဲဥသုပ်",
//   "category": "Dish",
//   "order_type":"Preorder",
//   "description":"",
//   "price": 1000,
//   "photo_value": "",
//   "active": 1,
//   "shop": "Shop0001"
// }
// menu_id = null? ==> new menu
// menu_id = value ==> update menu