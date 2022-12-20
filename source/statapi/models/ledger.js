const { Client } = require('pg');

exports.getClientIds = async () => {
  const client = new Client();
  client.connect();

  const res = await client.query('SELECT DISTINCT client_code FROM trading.transaction');
  const reply = [];
    
  for (let row of res.rows) {
    console.log(row.client_code);
    reply.push(row.client_code);
  }
  
  client.end();
  console.log(reply);
  return reply;
}

exports.getLedger = async (clientId) => {
  const client = new Client();
  client.connect();

  const res = await client.query(`
    SELECT transaction_date as date,
           transaction_time as time,
           scrip_code as scrip, quantity,
           case when type = 'S'then 'Sell' when type = 'B' then 'Buy' else 'unknown' end as operation, 
           price, brokerage, amount 
    FROM trading.transaction
    WHERE client_code = '${clientId}'`);
  
  client.end();
  return res.rows;
}