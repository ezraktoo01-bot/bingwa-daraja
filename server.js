
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const CONSUMER_KEY = "WEKA_KEY_HAPA";
const CONSUMER_SECRET = "WEKA_SECRET_HAPA";
const TILL = "1767515";
const SHORTCODE = "1767515";
const PASSKEY = "WEKA_PASSKEY_HAPA";

const BUNDLES = {
  "55": "1GB Till Midnight","20":"250MB 24Hrs","19":"1GB 1Hour","21":"1GB 1Hour",
  "49":"400MB 7Days","99":"2GB 24Hrs","999":"8GB + 400Mins","1001":"21GB Monthly",
  "22":"45 Mins","51":"60 Mins","200":"250 Mins","5":"20 SMS","10":"200 SMS","30":"1000 SMS","101":"1500 SMS"
};

async function getToken(){
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const res = await axios.get('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',{
    headers:{Authorization:`Basic ${auth}`}
  });
  return res.data.access_token;
}

app.post('/api/stkpush', async (req,res)=>{
  const {phone, amount} = req.body;
  try{
    const token = await getToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g,'').slice(0,14);
    const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');
    const stkRes = await axios.post('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',{
      BusinessShortCode: SHORTCODE, Password: password, Timestamp: timestamp,
      TransactionType: "CustomerBuyGoodsOnline", Amount: amount,
      PartyA: phone, PartyB: TILL, PhoneNumber: phone,
      CallBackURL: `https://${req.get('host')}/api/callback`,
      AccountReference: `Bingwa ${amount}`, TransactionDesc: `Buy ${BUNDLES[amount]}`
    },{headers:{Authorization:`Bearer ${token}`}});
    res.json({success:true, data:stkRes.data});
  }catch(e){ res.json({success:false, error:e.response?.data||e.message}); }
});

app.post('/api/callback', (req,res)=>{
  console.log("CALLBACK",JSON.stringify(req.body));
  const result = req.body?.Body?.stkCallback;
  if(result?.ResultCode===0){
    console.log("LIPA IMEFANIKIWA - TUMA BUNDLE");
  }
  res.json({ResultCode:0, ResultDesc:"Accepted"});
});

app.get('/', (req,res)=> res.send('Bingwa Sokoni Daraja Running - Till 1767515'));
app.listen(process.env.PORT||3000);
