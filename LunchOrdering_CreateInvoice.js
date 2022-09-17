const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({ region: "ap-southeast-1" });
const ORDER_TABLE = "LunchOrder_Invoice";
const myanmarOffSetTime=-390;

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
  
const createOrderInvoice = async ({order_id,user_id,deli_date,deli_time,deli_address,deli_phone,deli_township,total_bill,order_details,comment,shop}) => {
  const packed=0;
  const delivered=0;
  const deli_fee=0;
  const admin_confirm=null;
  const customer_confirm=null;
  const order_date=Date.now();
  var time_to_live=Math.round(Date.now()/1000);
  const deny_reason=null;
  const second_deli_date=0;
  
  if(deli_date==null || deli_date=='null') deli_date=order_date;
  const order_no=await getOrderNo({deli_date,shop});
  
  var params = {
    TableName: ORDER_TABLE,
    Item: {
      shop:shop,
      order_id:order_id,
      user_id:user_id,
      order_no:order_no,
      order_date:order_date,
      deli_date:deli_date,
      deli_address:deli_address,
      deli_phone:deli_phone,
      deli_township:deli_township,
      deli_fee:deli_fee,
      order_details:order_details,
      total_bill:total_bill,
      packed:packed,
      delivered:delivered,
      admin_confirm:admin_confirm,
      customer_confirm:customer_confirm,
      time_to_live:time_to_live,
      comment:comment,
      deny_reason:deny_reason,
      second_deli_date:second_deli_date
    },
  };
   await db.put(params).promise();
   return order_id;
};

exports.handler = async (event,context) => {
   try {
    const {user_id,deli_date,deli_address,deli_phone,deli_township,total_bill,order_details,comment,shop}  = event;
    const order_id=context.awsRequestId;
    const result =await createOrderInvoice({order_id,user_id,deli_date,deli_address,deli_phone,deli_township,total_bill,order_details,comment,shop});
    
    context.done(null,result);
  } catch (err) {
    context.done(err, null);
  }
};
// {
//   "shop": "Shop0001",
//   "user_id": "212f925c-af5f-47aa-b3c4-039b6b0030f0",
//   "deli_date": "null",
//   "deli_address": "တိုက် ၁၈၊ အခန်း ၂၀၈၊ အေးရိပ်မွန် ၁ လမ်း၊ ၄ရပ်ကွက်၊ အေးရိပ်မွန်အိမ်ယာ၊ လှိုင်မြို့နယ် ။",
//   "deli_phone": "09250153949",
//   "deli_township": "လှိုင်မြို့နယ်",
//   "order_details": [
//     {
//       "menu_id": "Todayorder_Dish_1",
//       "menu_name": "ဗမာကြက်ဆီပြန်",
//       "count": 3,
//       "price": 1500
//     },
//     {
//       "menu_id": "Todayorder_Dish_11",
//       "menu_name": "ငါးကြင်းပေါင်း",
//       "count": 1,
//       "price": 1500
//     }
//   ],
//   "total_bill": 6000,
//   "comment": ""
// }
// Today order ? ==> GIVE deli_date = null 