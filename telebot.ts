// telebot.ts

import { Telegraf, Context } from 'telegraf';
import dotenv from 'dotenv';
import detectNewContracts, { eventEmitter } from './main';

dotenv.config();

const expUrl = process.env.EXP_URL || 'https://arbiscan.io'
const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  console.error('🛠 Telegram bot token is missing. Add TELEGRAM_BOT_TOKEN to your environment variables.');
  process.exit(1);
}

const bot = new Telegraf(botToken);

// Listen for the 'newContract' event
eventEmitter.on('newContract', ({ userId, chainName, contractAddress }) => {
  console.log(`Received newContract event: ${chainName}, ${contractAddress}`);
  
  // Send a message to the user about the new contract
  bot.telegram.sendMessage(
    userId,
    `🧾 New contract found on chain ${chainName}: [contract](${expUrl}/address/${contractAddress})`,
    { parse_mode: 'Markdown' }
  )
    .then(() => {
      console.log(`Message sent: 🧾 New contract found on chain ${chainName}: ${expUrl}/address/${contractAddress}`);
    })
    .catch((error) => {
      console.error('❌ Error sending message:', error);
    });
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
