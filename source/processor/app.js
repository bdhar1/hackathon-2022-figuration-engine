import { ServiceBusClient } from '@azure/service-bus';
import pkg from 'pg';
const { Pool } = pkg;
import { worker } from './worker.js';

//const worker = require('./worker');

let sbc = null;
let receiver = null;
let pool = null;

async function main() {
  process.on("SIGINT", async function () {
    // Close connections when closing.
    if (pool) {
      await pool.end();
    }

    if (receiver) {
      await receiver.close();
      console.log("Closed Receiver");
    }

    if (sbc) {
      await sbc.close();
      console.log("Closed service bus client");
    }

    console.log("Cleaning complete");
    process.exit();
  });

  const sbConnectionString = process.env.SERVICEBUS_CONNECTION_STRING;
  const topicName = process.env.TOPIC_NAME;
  const queueName = process.env.QUEUE_NAME;
  
  sbc = new ServiceBusClient(sbConnectionString);
  receiver = sbc.createReceiver(topicName, queueName, {receiveMode: "peekLock"});

  pool = new Pool();

  await worker(receiver, pool);

  if (receiver) {
    await receiver.close();
    console.log("Closed Receiver");
  }

  if (sbc) {
    await sbc.close();
    console.log("Closed service bus client");
  }
}

main();