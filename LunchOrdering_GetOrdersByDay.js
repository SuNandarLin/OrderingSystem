const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({ region: "ap-southeast-1" });
const ORDER_TABLE = "LunchOrder_Invoice";
const myanmarTimeZone='+06:30';
const myanmarOffSetTime=-390;

function sortByDeliDate(scanResults,ascendingOrDescending){
    if(ascendingOrDescending=="Ascending"){ //less to great
        scanResults.sort((a, b) => parseFloat(a.deli_date) - parseFloat(b.deli_date));
    }else if(ascendingOrDescending=="Descending"){//great to less
        scanResults.sort((a, b) => parseFloat(b.deli_date) - parseFloat(a.deli_date));
    }
}

function GetAnyTimeOfDday (time,date) {
 const tdy_date=new Date(date-(myanmarOffSetTime*60000));
 const tdy_date_fmt = (tdy_date.getMonth()+1)+'/'+tdy_date.getDate()+'/'+tdy_date.getFullYear();
 const timestamp_todaytime_str=tdy_date_fmt+', '+time+' '+myanmarTimeZone;
 const timestamp_todaytime = Date.parse(timestamp_todaytime_str);
 return timestamp_todaytime;
}

const GeOrdesbyDay = async (deli_date,shop)=>{
  const startTime='12:00:00 AM';
  const endTime='11:59:59 PM';
  const startTimeDay=GetAnyTimeOfDday(startTime,deli_date);
  const endTimeDay=GetAnyTimeOfDday(endTime,deli_date);
  const delivered=1;
  
     var params = {
      TableName: ORDER_TABLE,
      KeyConditionExpression: 'shop = :shop',
      FilterExpression: 'delivered = :delivered and attribute_exists(order_date) and deli_date between :startTimeToday and :endTimeToday ',
      ExpressionAttributeValues: {
        ':shop' :shop,
        ':startTimeToday' :  startTimeDay,
        ':endTimeToday' :  endTimeDay,
        ':delivered' : delivered
      }
    };
    let queryResults=[];
    let items;
     do{
         items =  await db.query(params).promise();
         items.Items.forEach((item) => queryResults.push(item));
     }while(typeof items.LastEvaluatedKey != "undefined");
    
    sortByDeliDate(queryResults,"Ascending");
  return queryResults;
}
exports.handler = async (event,context) => {
   try {
    const{deli_date,shop}=event;
    const result=await GeOrdesbyDay(deli_date,shop);
   // context.done(null,result);
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
//  "shop": "Shop0001",
//  "deli_date": 1606125321982
//}
