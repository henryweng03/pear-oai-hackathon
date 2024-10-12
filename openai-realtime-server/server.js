// server.js
const WebSocket = require('ws'); // Use require instead of import
const dotenv = require('dotenv'); // Use require for dotenv

dotenv.config();

const OPENAI_API_URL = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
const PORT = process.env.PORT || 8080;

// Start WebSocket server
const wss = new WebSocket.Server({ port: PORT }, () => {
  console.log(`Server started on port ${PORT}`);
});

// Relay server client connects to OpenAI Realtime API
wss.on('connection', (clientSocket) => {
  console.log('Client connected');

  const openAiSocket = new WebSocket(OPENAI_API_URL, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'OpenAI-Beta': 'realtime=v1',
    },
  });

  openAiSocket.on('open', () => {
    console.log('Connected to OpenAI Realtime API');

    clientSocket.on('message', (data) => {
      const message = JSON.parse(data);
      console.log('Received message from client:', message);

      // Send message to OpenAI
      openAiSocket.send(JSON.stringify(message));
    });
  });

  openAiSocket.on('message', (message) => {
    // Relay the OpenAI response to the client
    console.log('Received response from OpenAI:', message);
    clientSocket.send(message);
  });

  openAiSocket.on('error', (error) => {
    console.error('OpenAI WebSocket error:', error);
  });

  openAiSocket.on('close', () => {
    console.log('OpenAI WebSocket closed');
  });

  clientSocket.on('close', () => {
    console.log('Client disconnected');
    openAiSocket.close();
  });
});
