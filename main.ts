// main.ts

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { promises as fsPromises } from 'fs';
import EventEmitter from 'events';

dotenv.config();

const rpcUrl = process.env.RPCURL || 'https://rpc.ankr.com/arbitrum';
const expUrl = process.env.EXP_URL || 'https://arbiscan.io'
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

const abiFile = require('./abi/abi.json');

interface CustomTransactionResponse extends ethers.providers.TransactionResponse {
  creates?: string;
}

export const eventEmitter = new EventEmitter();

// Keep track of ongoing processes for each user
const userProcesses: Record<number, { running: boolean, stop: boolean }> = {};

export async function detectNewContracts(userId: number | undefined) {
  if (!userId) {
    console.error('User ID is missing.');
    return;
  }

  if (userProcesses[userId] && userProcesses[userId].running) {
    console.log('Already running for user', userId);
    return;
  }

  try {
    const network = await provider.getNetwork();
    const chainId: number = network.chainId;
    const chainName: string = network.name;

    console.log(`📶 Connected to ${chainName}`);

    userProcesses[userId] = { running: true, stop: false };

    // Subscribe to new block events after a short delay
    setTimeout(() => {
      const blockHandler = async function blockHandler(blockNumber: number) {
        try {
          if (userProcesses[userId] && userProcesses[userId].stop) {
            console.log('Stopping for user', userId);
            // Remove the event listener to stop further processing
            provider.off('block', blockHandler);
            userProcesses[userId].running = false;
            return;
          }

          const block = await provider.getBlockWithTransactions(blockNumber);

          console.log(`🔍 Analyzing block ${blockNumber}...`);

          const contractCreationTxs: CustomTransactionResponse[] = block.transactions
            .filter((tx: CustomTransactionResponse) => tx.creates !== null && tx.creates !== undefined);

          await Promise.all(contractCreationTxs.map(async (tx) => {
            const contractAddress = tx.creates!;

            console.log("🧾 Deployed contract: ", expUrl + '/address/' + contractAddress);
            await analyzeContract(contractAddress, abiFile);
            saveContractToFile(chainId, contractAddress);

            // Emit an event when a new contract is found
            eventEmitter.emit('newContract', { userId, chainName, contractAddress });
          }));

        } catch (err) {
          console.error(err);
        }
      };

      provider.on('block', blockHandler);
    }, 1000); // 1000 milliseconds delay
  } catch (err) {
    console.error(err);
  }
}

async function analyzeContract(contractAddress: string, abi: any) {
  console.log("☑️ Analyzing contract:", contractAddress);
  const contract = new ethers.Contract(contractAddress, abi, provider);

  try {
    const [name, symbol, owner, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.owner(),
      contract.totalSupply(),
    ]);

    console.log("Contract Name:", name);
    console.log("Contract Symbol:", symbol);
    console.log(`Contract Owner:, https://debank.com/profile/${owner}`);
    const formattedTotalSupply = ethers.utils.parseUnits(totalSupply, 18);
    console.log("Contract TotalSupply:", `${formattedTotalSupply} ${symbol}`);
  } catch (error:any) {
    console.error("Error retrieving contract information:", error.message);
  }
}

async function saveContractToFile(chainId: number, contractAddress: string) {
  try {
    const filename: string = `${chainId}_new_contracts.txt`;

    await fsPromises.appendFile(filename, `${expUrl}/address/${contractAddress}\n`, "utf-8");

    console.log(`💾 Contract address saved to ${filename}`);
  } catch (error:any) {
    console.error(`❌ Error saving contract address to file: ${error.message}`);
  }
}

export default detectNewContracts;
