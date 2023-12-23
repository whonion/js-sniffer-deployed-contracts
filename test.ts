// test.ts

import { spawn } from 'child_process';

const MAX_TEST_DURATION_MS = 60000; // Test duration in milliseconds (e.g., 120 seconds)
const SCRIPT_FILE = 'main.ts'; // Change this to match your main.ts filename

// Function to run the main.ts script for a specific duration
function runMainScriptForDuration() {
  return new Promise<void>((resolve, reject) => {
    const process = spawn('ts-node', [SCRIPT_FILE], {
      stdio: 'inherit', // Inherit stdio from the parent process
    });

    setTimeout(() => {
      process.kill(); // Terminate the script after the specified duration
      resolve();
    }, MAX_TEST_DURATION_MS);

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(`main.ts exited with code ${code}`);
      }
    });
  });
}

// Run the test
(async () => {
  try {
    await runMainScriptForDuration();
    console.log('Test completed successfully.');
  } catch (error:any) {
    if (error.message === 'The operation was canceled.') {
      console.log('Test was canceled due to timeout.');
    } else {
      console.error('Test failed:', error);
    }
  }
})();
