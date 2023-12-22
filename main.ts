import { ethers } from "ethers";
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const rpcUrl = process.env.RPCURL || 'https://rpc.ankr.com/arbitrum';
const expUrl = process.env.EXP_URL || 'https://arbiscan.io';
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

// Define the ABI
const abiFile = require("./abi/abi.json");

interface CustomTransactionResponse extends ethers.providers.TransactionResponse {
  creates?: string;
}

async function main() {
  try {
    const network = await provider.getNetwork();
    const chainId: number = network.chainId;

    console.log(`📶 Connected to chainId: ${chainId}`);
    
    // Subscribe to new block events
    provider.on("block", async (blockNumber: number) => {
      try {
        const block = await provider.getBlockWithTransactions(blockNumber);

        console.log(`🔍 Analyzing block ${blockNumber}...`);

        const contractCreationTxs: CustomTransactionResponse[] = block.transactions
          .filter((tx: CustomTransactionResponse) => tx.creates !== null && tx.creates !== undefined);

        await Promise.all(contractCreationTxs.map(async (tx) => {
          const contractAddress = tx.creates!;
          
          console.log("🧾 Deployed contract: ", expUrl + '/address/' + contractAddress);
          await analyzeContract(contractAddress, abiFile);
          saveContractToFile(chainId, contractAddress);
        }));

      } catch (err) {
        //console.error(err);
      }
    });

  } catch (err) {
    //console.error(err);
  }
}

async function analyzeContract(contractAddress: string, abi: any) {
  console.log("☑️ Analyzing contract:", contractAddress);
  const contract = new ethers.Contract(contractAddress, abi, provider);

  const [name, symbol, owner, totalSupply] = await Promise.all([
    contract.name(),
    contract.symbol(),
    contract.owner(),
    contract.totalSupply(),
  ]);
  const formattedTotalSupply = ethers.utils.parseUnits(totalSupply, 18); // Assuming 18 decimal places
  console.log("Contract Name:", name);
  console.log("Contract Symbol:", symbol);
  console.log(`Contract Owner:, https://debank.com/profile/${owner}`);
  console.log("Contract TotalSupply:", `${formattedTotalSupply} ${symbol}`);
}

function saveContractToFile(chainId: number, contractAddress: string) {
  try {
    const filename: string = `${chainId}_new_contracts.txt`;

    // Append the new contract address to the file
    fs.appendFileSync(filename, `${expUrl}/address/${contractAddress}\n`, "utf-8");

    console.log(`💾 Contract address saved to ${filename}`);
  } catch (error:any) {
    console.error(`❌ Error saving contract address to file: ${error.message}`);
  }
}

main().catch(console.error);
