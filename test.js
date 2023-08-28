const childProcess = require("child_process");

const MAX_TEST_DURATION_MS = 120000; // Test duration in milliseconds (e.g., 60 seconds)
const SCRIPT_FILE = "main.js"; // Change this to match your main.js filename

// Function to run the main.js script for a specific duration
function runMainScriptForDuration() {
  return new Promise((resolve, reject) => {
    const process = childProcess.spawn("node", [SCRIPT_FILE]);

    setTimeout(() => {
      process.kill(); // Terminate the script after the specified duration
      resolve();
    }, MAX_TEST_DURATION_MS);

    process.stdout.on("data", data => {
      console.log(data.toString());
    });

    process.stderr.on("data", data => {
      console.error(data.toString());
      reject("Error occurred while running main.js");
    });

    process.on("close", code => {
      if (code === 0) {
        resolve();
      } else {
        reject(`main.js exited with code ${code}`);
      }
    });
  });
}

// Run the test
runMainScriptForDuration()
  .then(() => {
    console.log("Test completed successfully.");
  })
  .catch(error => {
    console.error("Test failed:", error);
    process.exit(1);
  });
