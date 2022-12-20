import chalk from 'chalk';
import figlet from 'figlet';
import { createSpinner } from 'nanospinner'
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import { ServiceBusClient } from '@azure/service-bus';
import { parse } from 'csv-parse';

let connString = "";
let topic = "";
let fileName = "";

function Welcome() {
  console.log(chalk.blue(figlet.textSync("Trade Importer")));
  console.log(chalk.gray("Usage: tradecli <filename>"));
  console.log(chalk.gray(`A config.json file must be present in the same location:
  {
    "connstring": "<Connection String>",
    "topic": "<Topic or Queue Name>"
  }
  `));
  console.log(chalk.gray("Where <Connection String> is the connection string of the service bus"));
  console.log(chalk.gray("---------------------------------------------------------------------"));
}

async function ReadConfiguration() {
  const spinner1 = createSpinner('Checking Configuration file').start();

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  if (fs.existsSync(path.join(__dirname, "config.json"))) {
    spinner1.success();
  }
  else
  {
    spinner1.error();
    process.exit(1);
  }

  const spinner2 = createSpinner('Reading Configuration file').start();

  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json")));    
    if (typeof data.connstring === "undefined" || !data.connstring) {
      spinner2.error({text: "Connection string not found!"});
      process.exit(1);
    }

    connString = data.connstring;

    if (typeof data.topic === "undefined" || !data.topic) {
      spinner2.error({text: "Topic not found!"});
      process.exit(1);
    }

    topic = data.topic;

  } catch (error) {
    spinner2.error({text: "config.json format error!"});
    process.exit(1);
  }

  spinner2.success();
}

async function CheckDataFile() {
  const spinner1 = createSpinner('Checking data file file').start();
  fileName = process.argv.slice(2)[0];

  if (!fileName) {
    spinner1.error({text: "File name argument missing."});
    process.exit(1);
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  if (!fs.existsSync(path.join(__dirname, fileName))) {
    spinner1.error({text: "Given file name is not present."});
    process.exit(1);
  }

  spinner1.success();
}

async function LoadData() {

  const spinner1 = createSpinner("Initializing for loading data").start();

  const sbc = new ServiceBusClient(connString);
  const sender = sbc.createSender(topic);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  spinner1.success();
  let rownum = 0;
  const promises = [];

  fs.createReadStream(path.join(__dirname, fileName))
    .pipe(parse({ delimiter: "," }))
    .on("data", (row) => {
      rownum++;
      const innerSpinner = createSpinner("Loading row " + rownum).start();
      
      //Validation
      const tradeDateTime = Date.parse("".concat(row[0], " ", row[1]));
      if (isNaN(tradeDateTime)) {
        innerSpinner.error({text: "Row " + rownum + " date/time format error."});
        return;
      }

      if (!row[2] || !row[3] || !row[4]) {
        innerSpinner.error({text: "Row " + rownum + " client code or buy/sell or scrip code missing."});
        return;
      }

      if (isNaN(row[5]) || isNaN(row[6])) {
        innerSpinner.error({text: "Row " + rownum + " quantity or price is missing or format error."});
        return;
      }

      //Pushing to topic
      promises.push(sender.sendMessages({body: {
        tradeDateTime: tradeDateTime, 
        clientid: row[2],
        trantype: row[3],
        scrip: row[4],
        quantity: parseInt(row[5]),
        price: parseFloat(row[6])
      }}));

      innerSpinner.success({text: "".concat("Row: ", rownum, ", Scrip: ", row[4], ", Quantity: ", row[5], " -- Pushed successfully.")});
    })
    .on("end", () => {
      console.log("finished");

      // Wait for all pushes to complete before closing the connections
      Promise.all(promises).then(() => {
        sender.close();
        sbc.close();  
      });
  });
}

async function main() {
  Welcome();
  await ReadConfiguration();
  await CheckDataFile();
  await LoadData();
}

await main();
//console.log(connString);