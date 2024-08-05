# WhatsApp Bot

A WhatsApp bot built using Node.js and the `@wppconnect-team/wppconnect` package. This bot handles incoming messages, processes various types of data (voice messages, images, PDFs, QR codes), and sends responses based on predefined rules.

## Features

- **Message Handling**: Converts Arabic numerals to English, normalizes message content, and responds to specific commands.
- **File Handling**: Sends images, voice messages, PDFs, and QR codes based on the received message.
- **Logging**: Maintains logs of message interactions and errors, and sends logs to predefined recipients.
- **Error Handling**: Handles and logs errors effectively, with immediate feedback to the bot operators.

## Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Marioo7/WhatsApp-Bot.git
   cd malaki-bot
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run the bot:**
   ```bash
   node index.js
   ```
