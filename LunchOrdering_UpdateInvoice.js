const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({ region: "ap-southeast-1" });
const ORDER_TABLE = "LunchOrder_Invoice";
const myanmarOffSetTime=-390;
const myanmarTimeZone='+06:30';

function timeStampToDateFmt(date){
  const myDate = new Date(date-(myanmarOffSetTime*60000));
  const myDateFmt = myDate.getDate()+'/'+(myDate.getMonth()+1)+'/'+myDate.getFullYear();
  return myDateFmt;
}

const getOrderNo = async ({deli_date,shop})=>{
  const deli_date_fmt=timeStampToDateFmt(deli_date);
  console.log("deli_date_fmt : "+deli_date_fmt);
  var params = {
        TableName: ORDER_TABLE,
        KeyConditionExpression: 'order_id = :orderid and shop = :shop',
        ExpressionAttributeValues: {
            ':orderid' :  deli_date_fmt,
            ':shop' : shop
        }
  };
    let items1=[]; 
    items1= await db.query(params).promise();
    const order_id=deli_date_fmt;
    if(items1.Items.length==0){
       const order_no=0;
        const time_to_live=Math.round(Date.now()/1000);
        const total_bill=0;
        var params1 = {
            TableName: ORDER_TABLE,
            Item: {
                shop:shop,
                order_id:order_id,
                deli_date:deli_date,
                total_bill:total_bill,
                time_to_live:time_to_live,
                order_no:order_no
            },
        };
        await db.put(params1).promise(); 
    }
  var params2 = {
    TableName:ORDER_TABLE,
    Key:{
        "shop": shop,
        "order_id": order_id
    },
    UpdateExpression: "set order_no = order_no + :val",
    ExpressionAttributeValues:{
        ":val": 1
    },
    ReturnValues:"UPDATED_NEW"
  };
  
  const order_no=await db.update(params2).promise();
  console.log("order_no");
  console.log(order_no.Attributes.order_no);
  return order_no.Attributes.order_no;
}

const addDailyTotal = async ({order_id,shop}) => {
    var params = {
        TableName: ORDER_TABLE,
        ProjectionExpression: 'deli_date,total_bill',
        KeyConditionExpression: 'order_id = :orderid and shop = :shop',
        ExpressionAttributeValues: {
            ':orderid' :  order_id,
            ':shop' :shop
        }
    };
    let items=[]; 
    items= await db.query(params).promise();
    const tdy_date=timeStampToDateFmt(items.Items[0].deli_date);  
    console.log(tdy_date);

    var params1 = {
        TableName: ORDER_TABLE,
        KeyConditionExpression: 'order_id = :orderid and shop = :shop',
        ExpressionAttributeValues: {
            ':orderid' :  tdy_date,
            ':shop' :shop
        }
    };
    let items1=[]; 
    items1= await db.query(params1).promise();
    order_id=tdy_date;
    
      const dailyTotalBill=items1.Items[0].total_bill+items.Items[0].total_bill;
      const update_field='total_bill';
      const update_value=dailyTotalBill;
      await updateOrder({order_id,update_field,update_value,shop});
   
}

const updateOrder = async ({order_id,update_field,update_value,shop}) => {
    
     var params = {
        TableName: ORDER_TABLE,
        Key: {
            shop:shop,
            order_id: order_id
        },
        UpdateExpression: "SET #field= :value",

        ExpressionAttributeNames: {
        "#field": update_field,
         },
        ExpressionAttributeValues: {
        ":value": update_value,
         },
         ReturnValues: "UPDATED_NEW",
    };
    
   await db.update(params).promise();
}

const updateOrderInfo = async ({order_id,update_field,update_value,shop}) => {
    
    if(update_field=='customer_confirm' && update_value==0){
         var deleteparams = {
             TableName:ORDER_TABLE,
             Key:{
                order_id:order_id,
                shop:shop
             }
        };
        await db.delete(deleteparams).promise();
        
    }else if(update_field=='deli_fee'){
        await updateOrder({order_id,update_field,update_value,shop}); // for deli fee update
       
         var params = {
            TableName: ORDER_TABLE,
            ProjectionExpression: 'total_bill',
            KeyConditionExpression: 'order_id = :orderid and shop = :shop',
            ExpressionAttributeValues: {
              ':orderid' :  order_id,
              ':shop' : shop
            }
        };
        let items=[]; 
        items= await db.query(params).promise();
        const TotalBill=items.Items[0].total_bill+update_value;
        update_field='total_bill';
        update_value=TotalBill;
        await updateOrder({order_id,update_field,update_value,shop});
        update_field='admin_confirm'; 
        update_value=1;
        await updateOrder({order_id,update_field,update_value,shop});
        
    }else if(update_value==2){
        update_value=update_field;
        update_field='deny_reason';
        await updateOrder({order_id,update_field,update_value,shop});
        update_field='admin_confirm';
        update_value=0;
        await updateOrder({order_id,update_field,update_value,shop});
        
    }else if(update_field=='delivered'){
        await updateOrder({order_id,update_field,update_value,shop});
        await addDailyTotal({order_id,shop});
        
    }else if(update_field=='deli_date'){
        const deli_date=update_value;
        update_value=1;
        update_field='customer_confirm';
        await updateOrder({order_id,update_field,update_value,shop});
        const order_no=await getOrderNo({deli_date,shop});
        update_value=order_no;
        update_field='order_no';
        await updateOrder({order_id,update_field,update_value,shop});
        update_value=deli_date;
        update_field='deli_date';
        await updateOrder({order_id,update_field,update_value,shop});
        
    }else{
        await updateOrder({order_id,update_field,update_value,shop});
    }
};


exports.handler = async (event,context) => {
    
try{
   const {order_id,update_field,update_value,shop} = event;
   const result = await updateOrderInfo({order_id,update_field,update_value,shop});

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
//   "order_id": "0004",
//   "update_field": "delivered",
//   "update_value": 1
// } 
///delivered,packed,admin_confirm,customer_confirm,deli_fee