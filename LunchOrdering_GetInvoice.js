const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({ region: "ap-southeast-1" });
const ORDER_TABLE = "LunchOrder_Invoice";
const myanmarTimeZone='+06:30';//12:00:00 AM
let scanResults = [];
const myanmarOffSetTime=-390;

function sortByDeliDate(scanResults,ascendingOrDescending){
    if(ascendingOrDescending=="Ascending"){ //less to great
        scanResults.sort((a, b) => parseFloat(a.deli_date) - parseFloat(b.deli_date));
    }else if(ascendingOrDescending=="Descending"){//great to less
        scanResults.sort((a, b) => parseFloat(b.deli_date) - parseFloat(a.deli_date));
    }
}

function sortByOrderDate(scanResults,ascendingOrDescending){
    if(ascendingOrDescending=="Ascending"){ //less to great
        scanResults.sort((a, b) => parseFloat(a.order_date) - parseFloat(b.order_date));
    }else if(ascendingOrDescending=="Descending"){//great to less
        scanResults.sort((a, b) => parseFloat(b.order_date) - parseFloat(a.order_date));
    }
}

function GetAnyTimeOfToday (time) {
 const tdy_date_with_offset=new Date().getTime()-(myanmarOffSetTime*60000); 
 const tdy_date=new Date(tdy_date_with_offset); 
 const tdy_date_fmt = (tdy_date.getMonth()+1)+'/'+tdy_date.getDate()+'/'+tdy_date.getFullYear();
 const timestamp_todaytime_str=tdy_date_fmt+', '+time+' '+myanmarTimeZone;
 var timestamp_todaytime = Date.parse(timestamp_todaytime_str);
 return timestamp_todaytime;
}

const GetOrderInvoiceByUser= async (user_id,shop) => {
    var params = {
        TableName: ORDER_TABLE,
        KeyConditionExpression: 'shop = :shop',
        FilterExpression: 'user_id = :user_id',
        ExpressionAttributeValues: {
            ':shop' :shop,
            ':user_id' :  user_id
        }
    };
    let queryResults=[];
    let items;
     do{
         items =  await db.query(params).promise();
         items.Items.forEach((item) => queryResults.push(item));
     }while(typeof items.LastEvaluatedKey != "undefined");
     

     
     sortByOrderDate(queryResults,"Descending");
     return queryResults;
}
const GetOrderInvoiceByAdmin = async (type,shop) => {
    const startTime='12:00:00 AM';
    const endTime='11:59:59 PM';
    const startTimeToday=GetAnyTimeOfToday(startTime);
    const endTimeToday=GetAnyTimeOfToday(endTime);
    
    if(type=="today"){
        var params = {
        TableName: ORDER_TABLE,
        KeyConditionExpression: 'shop = :shop',
        FilterExpression: 'attribute_exists(order_date) and deli_date between :startTimeToday and :endTimeToday',
        ExpressionAttributeValues: {
            ':shop' :shop,
            ':startTimeToday' :startTimeToday,
            ':endTimeToday' :endTimeToday
        }
    };
    }else if(type=="todayandpre"){
        var params = {
        TableName: ORDER_TABLE,
        KeyConditionExpression: 'shop = :shop',
        FilterExpression: 'attribute_exists(order_date) and deli_date > :startTimeToday',
        ExpressionAttributeValues: {
            ':shop' :shop,
            ':startTimeToday' :startTimeToday
        }
    };
    }else if(type=="history"){
        
        var params = {
        TableName: ORDER_TABLE,
        KeyConditionExpression: 'shop = :shop',
        FilterExpression: 'attribute_not_exists(order_date)',
        ProjectionExpression: 'order_id,deli_date,total_bill',
        ExpressionAttributeValues: {
            ':shop' :shop
        }
    }; 
    }
     let queryResults=[];
     let items;
     do{
         items =  await db.query(params).promise();
         items.Items.forEach((item) => queryResults.push(item));
     }while(typeof items.LastEvaluatedKey != "undefined");
    
     if(type=="todayandpre")sortByOrderDate(queryResults,"Descending");
     else if(type=="today")sortByDeliDate(queryResults,"Ascending");
     else if(type=="history")sortByDeliDate(queryResults,"Descending");
     
     return queryResults;
}
const GetOrderInvoice = async (typeOrId,userOrAdmin,shop) => {
 if(userOrAdmin=="Admin"){
   return await GetOrderInvoiceByAdmin(typeOrId,shop);   
  }else if(userOrAdmin=="User"){
   return await GetOrderInvoiceByUser(typeOrId,shop);  
  }
}

exports.handler = async (event) => {

      
try{
  const {userOrAdmin,typeOrId,shop } = event;
 const result= await GetOrderInvoice(typeOrId,userOrAdmin,shop);
  
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
//   "userOrAdmin": "Admin",
//   "typeOrId": "today"
// }
// typeOrId=today? hsitory? todayandpre? user_id value
// userOrAdmin=Admin? User?