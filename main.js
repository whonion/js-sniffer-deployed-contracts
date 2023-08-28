const ethers = require("ethers");
const axios = require("axios");
require("dotenv").config();

const rpcUrl = process.env.RPCURL;
const etherscanApiKey = process.env.ETHERSCANKEY;
const expUrl = process.env.EXP_URL;
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

// Define the ABI
const abiFile = require("./abi/abi.json");

async function main() {
  let currentBlock = await provider.getBlockNumber();

  console.log("Starting script for analyzing deployed contracts...");

  while (true) {
    try {
      const liveBlock = await provider.getBlockNumber();
      if (liveBlock > currentBlock) {
        const block = await provider.getBlockWithTransactions(currentBlock);
        console.log(`Analyzing block ${currentBlock}...`);
        currentBlock++;

        const contractCreationTxs = block.transactions.filter(tx => tx.creates !== null);

        await Promise.all(contractCreationTxs.map(async tx => {
          const contractAddress = tx.creates;
          
          console.log("Deployed contaract: ",expUrl+'/address/'+contractAddress);
          await analyzeContract(contractAddress, abiFile); // Pass abiFile as a parameter
        }));
      }
    } catch (err) {
      console.error(err);
    }
    await sleep(200); // Rate limit
  }
}

async function analyzeContract(contractAddress, abi) { // Receive abiFile as a parameter
  console.log("Analyzing contract:", contractAddress);
  const contract = new ethers.Contract(contractAddress, abi, provider); // Use abi parameter

  const [name, symbol, owner, totalSupply] = await Promise.all([
    contract.name(),
    contract.symbol(),
    contract.owner(),
    contract.totalSupply()
  ]);

  console.log("Contract Name:", name);
  console.log("Contract Symbol:", symbol);
  console.log("Contract Owner:", owner);
  console.log("Contract TotalSupply:", totalSupply);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(console.error);
