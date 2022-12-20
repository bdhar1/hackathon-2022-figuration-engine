const { Client } = require('pg');

exports.getStats = async () => {
  const client = new Client();
  client.connect();

  const res = await client.query('SELECT parameter, value FROM trading.stats');
  const reply = [];
    
  for (let row of res.rows) {
    reply.push({parameter: row.parameter, value: row.value});
  }
  
  client.end();
  return reply;
}