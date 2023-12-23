// test.ts

import { spawn } from 'child_process';

const MAX_TEST_DURATION_MS = 120000; // Test duration in milliseconds (e.g., 120 seconds)
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
runMainScriptForDuration()
  .then(() => {
    console.log('Test completed successfully.');
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1); // Terminate with a non-zero exit code to indicate failure
  });
