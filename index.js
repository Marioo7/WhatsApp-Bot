const wppconnect = require("@wppconnect-team/wppconnect");
const fs = require("fs");
const path = require("path");

let logs = ""; // Initialize an empty string to store logs
const logRecipients = ["201111536975@c.us", "201271172090@c.us"]; // Array of WhatsApp numbers of the recipients

// Utility function to convert Arabic numerals to English numerals
function convertArabicToEnglishNumber(number) {
  const arabicToEnglishMap = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
  };
  return number
    .split("")
    .map((char) => arabicToEnglishMap[char] || char)
    .join("");
}

// Utility function to normalize the key
function normalizeKey(key) {
  return key.replace(/\s+/g, "").toLowerCase();
}

// Function to normalize all keys in an object
function normalizeKeys(obj) {
  const normalizedObj = {};
  for (const key in obj) {
    const normalizedKey = normalizeKey(key);
    normalizedObj[normalizedKey] = obj[key];
    if (typeof obj[key] === "object" && obj[key] !== null) {
      normalizedObj[normalizedKey] = normalizeKeys(obj[key]);
    }
  }
  return normalizedObj;
}

// Load and normalize file mappings from JSON
const rawFileMappings = JSON.parse(fs.readFileSync(path.join(__dirname, "db.json")));
const fileMappings = normalizeKeys(rawFileMappings);

// Initialize and start the client
wppconnect
  .create({
    session: "test",
    onLoadingScreen: (percent, message) => {
      console.log("LOADING_SCREEN", percent, message);
    },
  })
  .then((client) => start(client))
  .catch((error) => {
    console.log("Error during session creation:", error);
  });

// Main bot function
function start(client) {
  console.log("Starting bot...");

  client.onMessage(async (msg) => {
    try {
      const { body, from, id } = msg;

      // Convert message body from Arabic numerals to English numerals
      const convertedBody = convertArabicToEnglishNumber(body);

      // Normalize the message body
      const normalizedBody = normalizeKey(body);
      const normalizedConvertedBody = normalizeKey(convertedBody);

      console.log(`Received message: ${body}`);
      console.log(`Normalized body: ${normalizedBody}`);
      console.log(`Normalized converted body: ${normalizedConvertedBody}`);

      // Send Received message
      logMessage("Received message: ");
      logMessage(body)

      // Find the file data based on the received message
      const data = findFileData(normalizedBody, normalizedConvertedBody);

      if (normalizedBody === "!ping" || normalizedConvertedBody === "!ping") {
        await client.sendText(from, "pong");
      } else if (
        normalizedBody === "!ping reply" ||
        normalizedConvertedBody === "!ping reply"
      ) {
        await client.reply(from, "pong", id.toString());
      } else if (data) {
        console.log(`Found data: ${JSON.stringify(data)}`);
        await handleFileData(client, from, data);
        sendLogs(client);
      } else {
        console.log("No matching data found.");
        sendLogs(client);
      }
    } catch (error) {
      handleError(error);
      sendLogsImmediately(client);
    }
  });
}

// Function to find file data based on message
function findFileData(normalizedBody, normalizedConvertedBody) {
  for (const [team, files] of Object.entries(fileMappings)) {
    if (files[normalizedBody] || files[normalizedConvertedBody]) {
      return files[normalizedBody] || files[normalizedConvertedBody];
    }
  }
  return null;
}

// Function to handle file data
async function handleFileData(client, from, data) {
  if (data.pdf && data.image) {
    // Send PDF first, then image
    await sendFile(client, from, data.image);
    await sendFile(client, from, data.pdf);
  } else if (data.path) {
    await sendFile(client, from, data);
  } else if (data.text) {
    const textMessage = `${data.text}\n\n${data.caption}`;
    await client.sendText(from, textMessage);
    logMessage("Text message sent successfully");
  } else if (data.voices && typeof data.voices === "object") {
    // Send each voice file
    for (const key in data.voices) {
      if (data.voices.hasOwnProperty(key)) {
        await sendFile(client, from, data.voices[key]);
      }
    }
    logMessage("Voice messages sent successfully");
  }
}

// Function to send a file
async function sendFile(client, from, data) {
  const filePath = path.join(__dirname, data.path);

  if (
    data.path.endsWith(".jpg") ||
    data.path.endsWith(".jpeg") ||
    data.path.endsWith(".png")
  ) {
    await client.sendImage(
      from,
      filePath,
      path.basename(filePath),
      data.caption
    );
    logMessage("Image sent successfully");
  } else if (data.path.endsWith(".mp3") || data.path.endsWith(".m4a")) {
    await client.sendFile(
      from,
      filePath,
      path.basename(filePath),
      data.caption,
      "audio/mpeg"
    );
    logMessage("Voice message sent successfully");
  } else {
    await client.sendFile(
      from,
      filePath,
      path.basename(filePath),
      data.caption
    );
    logMessage("File sent successfully");
  }
}

// Function to log messages
function logMessage(message) {
  console.log(message);
  logs += `${message}\n`;
}

// Function to handle errors
function handleError(error) {
  console.error("Error handling message:", error);
  logs += `Error: ${error}\n`;
}

// Function to send logs immediately
function sendLogsImmediately(client) {
  if (logs) {
    logRecipients.forEach((recipient) => {
      sendLogToRecipient(client, recipient);
    });
    logs = ""; // Clear logs after sending
  }
}

// Function to send logs
function sendLogs(client) {
  if (logs) {
    logRecipients.forEach((recipient) => {
      sendLogToRecipient(client, recipient);
    });
    logs = ""; // Clear logs after sending
  }
}

// Function to send logs to a specific recipient
function sendLogToRecipient(client, recipient) {
  client
    .sendText(recipient, logs)
    .then((result) => {
      console.log(`Logs sent successfully to ${recipient}`, result);
    })
    .catch((error) => {
      console.error(`Error sending logs to ${recipient}`, error);
    });
}
