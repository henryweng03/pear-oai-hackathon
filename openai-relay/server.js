const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// OpenAI WebSocket URL
const OPENAI_WS_URL = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';

wss.on('connection', (clientSocket) => {
    console.log('Client connected to relay server.');

    // Establish connection to OpenAI's WebSocket API
    const openaiSocket = new WebSocket(OPENAI_WS_URL, {
        headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'realtime=v1',
        },
    });

    // Forward messages from client to OpenAI
    clientSocket.on('message', (message) => {
        const sessionPrompt = JSON.parse(message);
        console.log("Message from client to OpenAI:", sessionPrompt);  // Log the message sent to OpenAI

        // Send to OpenAI if connection is open
        if (openaiSocket.readyState === WebSocket.OPEN) {
            openaiSocket.send(JSON.stringify({
                role: "user",
                content: `Given this session data: ${JSON.stringify(sessionPrompt)}`
            }));
        }
    });

    // Forward messages from OpenAI to client
    openaiSocket.on('message', (message) => {
        console.log("Message from OpenAI:", message);
        clientSocket.send(message);  // Send OpenAI response to Python client
    });

    // Handle errors and disconnections
    openaiSocket.on('error', (error) => {
        console.error('OpenAI WebSocket error:', error);
        clientSocket.close();
    });

    openaiSocket.on('close', () => {
        console.log('OpenAI connection closed.');
        clientSocket.close();
    });

    clientSocket.on('close', () => {
        console.log('Client disconnected.');
        openaiSocket.close();
    });
});

const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
    console.log(`Relay server listening on port ${PORT}`);
});
