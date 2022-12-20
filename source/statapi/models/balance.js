const { Client } = require('pg');

exports.getBalance = async () => {
  const client = new Client();
  client.connect();

  const res = await client.query('SELECT client_code as name,amount,brokerage,balance FROM trading.transaction_summary');
  
  client.end();
  return res.rows;
}