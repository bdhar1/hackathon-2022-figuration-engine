// import pkg from 'pg';
// const { Client, Pool } = pkg;
//import { v4 as uuidv4 } from 'uuid';
import currency from 'currency.js';
import { Evaluate } from './ruleEngine.js';

export const worker = async (receiver, pool) => {
  console.log("Worker starting.");

  let continueLoop = true;

  const subscription = receiver.subscribe({
    processMessage: async (brokeredMessage) => {
      try {
        await processTransaction(pool, brokeredMessage.body);
        await receiver.completeMessage(brokeredMessage);
      } catch (error) {
        await receiver.abandonMessage(brokeredMessage);
        console.log("Error received:");
        console.log(error);
        console.log("Retrying after 1s.");
        await delay(1000);
      }
    },
    processError: async (args) => {
      switch (args.error.code) {
        case "MessagingEntityDisabled":
        case "MessagingEntityNotFound":
        case "UnauthorizedAccess":
          console.log(`An unrecoverable error occurred. Stopping processing. ${args.error.code}`,
            args.error);
          await subscription.close();
          continueLoop = false;
          break;
        default:
          console.log("Waiting for 1s before retrying");
          await delay(1000);
          break;
      }
    }
  })

  while (continueLoop) {
    console.log("Waiting 10s.");
    await delay(10000);
  }
  console.log("Worker Ending.");
}

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
} 

async function processTransaction(pool, tran) {

  const client = await pool.connect();

  try {
    const start = new Date();

    const tradeDateTime = new Date(tran.tradeDateTime);

    // adjust 0 before single digit date
    const date = ("0" + tradeDateTime.getDate()).slice(-2);
    let month = ("0" + (tradeDateTime.getMonth() + 1)).slice(-2);
    let year = tradeDateTime.getFullYear();

    let hours = tradeDateTime.getHours();
    let minutes = tradeDateTime.getMinutes();
    let seconds = tradeDateTime.getSeconds();

    const dateString = "".concat(year, "-", month, "-", date);
    const timeString = "".concat(hours, ":", minutes, ":", seconds);

    await client.query('BEGIN')
    
    let queryText = `SELECT amount, brokerage, balance, trans_count
                     FROM trading.transaction_summary
                     WHERE client_code = $1`;
    const resSummary = await client.query(queryText, [ tran.clientid ]);

    let sum_amount = currency(0);
    let sum_balance = currency(0);
    let sum_tran_count = 0;
    let sum_brokerage = currency(0);

    if (resSummary.rows.length !== 0) {
      sum_amount = currency(resSummary.rows[0].amount);
      sum_balance = currency(resSummary.rows[0].balance);
      sum_tran_count = isNaN(resSummary.rows[0].trans_count) ? 0 : resSummary.rows[0].trans_count;
      sum_brokerage = currency(resSummary.rows[0].brokerage);
    }

    const tran_amount = currency(tran.quantity * tran.price);

    const brokerage = currency(await Evaluate(sum_amount.value, tran_amount.value));

    const amount = tran.trantype === "BUY" ? (brokerage.add(tran.quantity * tran.price)) : (brokerage.subtract(tran.quantity * tran.price));

    if (resSummary.rows.length === 0) {
      queryText = `INSERT INTO trading.transaction_summary 
                   (client_code, amount, brokerage, balance, trans_count)
                   VALUES ($1, $2, $3, $4, $5)`

      await client.query(queryText, [
        tran.clientid, tran_amount, brokerage, amount, 1
      ]);
    }
    else {
      queryText = `
        UPDATE trading.transaction_summary 
        SET amount = $2, 
            brokerage = $3, 
            balance = $4, 
            trans_count = $5
        WHERE client_code = $1`      

      await client.query(queryText, [
        tran.clientid, 
        (sum_amount.add(tran_amount)), 
        (sum_brokerage.add(brokerage)), 
        (sum_balance.add(amount)), 
        (sum_tran_count + 1)
      ]);
    }

    queryText = `
          INSERT INTO trading.transaction 
            (transaction_date, transaction_time, client_code, scrip_code, type, quantity, price, brokerage, amount) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
    const res = await client.query(queryText, [
      dateString, timeString, tran.clientid, tran.scrip, tran.trantype.substring(0, 1), 
      tran.quantity, tran.price, brokerage, (amount.value < 0 ? amount.multiply(-1) : amount)]);
   
    await client.query('COMMIT')

    const end = new Date() - start;
    console.log("".concat("Processed transaction for ", tran.clientid, " in ", end, "ms."));
    await UpdateStatistics(pool, end);

  } catch (errors) {
    await client.query('ROLLBACK')
    throw errors
  } finally {
    client.release()
  }

//  console.log(uuidv4());
}

async function UpdateStatistics(pool, elapsedTime) {
  const tranTimeText = "Average transaction time in ms";
  const noTranText = "No. of transactions";

  const resTranTime = await pool.query("SELECT value FROM trading.stats WHERE parameter = $1", [ tranTimeText ]);
  const resTranCount = await pool.query("SELECT value FROM trading.stats WHERE parameter = $1", [ noTranText ]);

  let tranTime = 0;
  let noTrans = 0;

  if (resTranTime.rows.length > 0) {
    tranTime = resTranTime.rows[0].value;
  }

  if (resTranCount.rows.length > 0) {
    noTrans = resTranCount.rows[0].value;
  }

  noTrans++;
  tranTime = (((noTrans - 1) * tranTime) + elapsedTime) / noTrans;

  if (resTranTime.rows.length > 0) {
    await pool.query("UPDATE trading.stats SET value = $2 WHERE parameter = $1", [ tranTimeText, tranTime ]);
  } else {
    await pool.query("INSERT INTO trading.stats (parameter, value) VALUES ($1, $2)", [ tranTimeText, tranTime ]);
  }

  if (resTranCount.rows.length > 0) {
    await pool.query("UPDATE trading.stats SET value = $2 WHERE parameter = $1", [ noTranText, noTrans ]);
  } else {
    await pool.query("INSERT INTO trading.stats (parameter, value) VALUES ($1, $2)", [ noTranText, noTrans ]);
  }
}