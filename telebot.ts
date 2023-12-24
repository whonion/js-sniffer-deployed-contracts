// telebot.ts

import { Telegraf, Context } from 'telegraf';
import dotenv from 'dotenv';
import detectNewContracts, { eventEmitter } from './main';
import { getTokenInfo, TokenInfo } from './dexapi';

dotenv.config();

const expUrl = process.env.EXP_URL || 'https://arbiscan.io'
const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  console.error('🛠 Telegram bot token is missing. Add TELEGRAM_BOT_TOKEN to your environment variables.');
  process.exit(1);
}

const bot = new Telegraf(botToken);

// Listen for the 'newContract' event
// Listen for the 'newContract' event
eventEmitter.on('newContract', async ({ userId, chainName, contractAddress }) => {
  console.log(`Received newContract event: ${chainName}, ${contractAddress}`);

  try {
    const tokenInfo: TokenInfo = await getTokenInfo(contractAddress);
    
    // Check if pairs array is not null and has at least one element
    if (tokenInfo.pairs && tokenInfo.pairs.length > 0) {
      const pair = tokenInfo.pairs[0];

      // Check if Liquidity is not null and greater than 0
      if (pair.liquidity && pair.liquidity.usd !== null && pair.liquidity.usd > 0) {
        // Prepare the message with additional information
        const message = `
          🧾 New contract found on chain ${chainName}:
          - Address: [${contractAddress}](https://dexscreener.com/${chainName}/${contractAddress})
          - Liquidity (USD): ${pair.liquidity.usd}
          - Price (USD): ${pair.priceUsd}
          - Price Change: ${pair.priceChange.h24}%
        `;

        // Send the message to the user
        bot.telegram.sendMessage(userId, message, { parse_mode: 'Markdown' });
      } else {
        // Liquidity is null or 0, send a different message
        const simpleMessage = `🧾 New contract found on chain ${chainName} with no liquidity: [${contractAddress}](${expUrl}/address/${contractAddress})`;
        bot.telegram.sendMessage(userId, simpleMessage, { parse_mode: 'Markdown' });
      }
    } else {
      // Pairs array is null or empty, send a different message
      const errorMessage = `🛑 No information available for contract: [${contractAddress}](${expUrl}/address/${contractAddress})`;
      bot.telegram.sendMessage(userId, errorMessage, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error('Error processing newContract event:', error);
  }
});

// Command handler for the /run command
async function handleRunCommand(ctx: Context) {
  try {
    console.log('♻️ Received /run command');

    // Reply to the user indicating that the check is complete
    ctx.reply('✅ Checking for new contracts...');

    // Run the logic to detect new contracts
    await detectNewContracts(ctx.from?.id);

    // Send a message to the user about the completion
    ctx.reply('✅ Check complete!');

  } catch (error) {
    console.error('❌ Error in handleRunCommand:', error);
    ctx.reply('❗️Error checking new contracts.');
  }
}

// Command handler for the /stop command
function handleStopCommand(ctx: Context) {
  console.log('⛔ Received /stop command');

  // Stop the logic to detect new contracts for the user
  // You need to implement a mechanism to stop the ongoing process for a specific user
  // For simplicity, we'll just send a message indicating that stopping is not implemented
  ctx.reply('⛔ Stopping is not implemented.');
}

// Register the command handlers
bot.command('run', handleRunCommand);
bot.command('stop', handleStopCommand);

console.log('🌐 Server is running');

// Launch the bot
bot.launch().then(() => {
  console.log('🤖 Telegram bot is running');
});
