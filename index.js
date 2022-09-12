const ethers = require("ethers");
const axios = require("axios");
require("dotenv").config();

const rpcUrl = process.env.RPCURL;

//ORDINARY ABI FILE
const abiFile = require("./abi/abi.json");

//etherscan.io api key required for internally deployed contracts
const etherscanApiKey = process.env.ETHERSCANKEY;

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  let currentBlock = await provider.getBlockNumber();

  while (1) {
    try {
      let liveBlock = await provider.getBlockNumber();
      while (liveBlock >= currentBlock) {
        let block = await provider.getBlockWithTransactions(currentBlock);
        let txs = block.transactions;
        currentBlock++;

        for (let i = 0; i < txs.length; i++) {
          let response;

          //GET INTERNAL CONTRACT DEPLOYEMENT TXS
          while (1) {
            //RATE LIMITING
            await new Promise((resolve) => setTimeout(resolve, 200));
            response = await axios.get(
              "https://api.etherscan.io/api?module=account&action=txlistinternal&txhash=" + txs[i].hash + "&apikey=" + etherscanApiKey + '"'
            );
            if (response.statusText === "OK") {
              if (response.data.message === "NOTOK") {
                console.log(response.data.result);
                continue;
              } else {
                break;
              }
            }
          }

          for (let j = 0; j < response.data.result.length; j++) {
            if (response.data.result[j].type === "create" && response.data.result[j].isError === "0") {
              console.log("Created: " + response.data.result[j].contractAddress);
              await spoofContract(response.data.result[j].contractAddress, provider);
            }
          }

          //GET CONTRACT DEPLOYEMENT TXS
          if (txs[i].creates != null) {
            console.log("Created: " + txs[i].creates);
            await spoofContract(txs[i].creates, provider);
          }
        }
      }
    } catch (err) {}
  }
}

async function spoofContract(adr, provider, bot) {
  let p1, p2, p3, p4, p5;

  try {
    const contract = new ethers.Contract(adr, abiFile, provider);
    p1 = contract.name();
    p1.then((a, b) => {
      console.log("  Contract Name: " + a);
    });
    p2 = contract.symbol();
    p2.then((a, b) => {
      console.log("  Contract Symbol:  " + a);
    });
    p3 = contract.owner();
    p3.then((a, b) => {
      console.log("  Contract Owner: " + a);
    });
    p4 = contract.totalSupply();
    p4.then((a, b) => {
      console.log("  Contract TotalSupply: " + a);
    });
  } catch (err) {
    console.log(err);
  }
  return Promise.allSettled([p1, p2, p3, p4, p5]);
}

main().catch((a) => {
  console.log(a);
});
