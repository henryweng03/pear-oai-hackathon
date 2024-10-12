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

// Relay WebSocket Server
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
        if (openaiSocket.readyState === WebSocket.OPEN) {
            try {
                // Log and verify the message format before sending it to OpenAI
                console.log("Raw message from client:", message);

                // Parse the message to verify if it's valid JSON
                const parsedMessage = JSON.parse(message);
                console.log("Parsed message from client to OpenAI:", parsedMessage);

                // Send the valid message to OpenAI
                openaiSocket.send(JSON.stringify(parsedMessage));
                console.log("Message sent to OpenAI:", JSON.stringify(parsedMessage));
            } catch (error) {
                console.error('Error parsing client message:', error);
            }
        } else {
            console.log("OpenAI WebSocket is not ready.");
        }
    });

    // Forward messages from OpenAI to client
    openaiSocket.on('message', (message) => {
        if (Buffer.isBuffer(message)) {
            // Convert the Buffer to a string and try to parse it as JSON
            const decodedMessage = message.toString('utf-8');
            try {
                const jsonMessage = JSON.parse(decodedMessage);
                console.log("Decoded message from OpenAI to client:", jsonMessage);
                clientSocket.send(decodedMessage);  // Forward the decoded message to the client
            } catch (error) {
                console.log("Error parsing message from OpenAI:", decodedMessage);
                clientSocket.send(decodedMessage);  // Forward the decoded message even if not JSON
            }
        } else {
            console.log("Message from OpenAI to client:", message);
            clientSocket.send(message);
        }
    });
    

    // Handle OpenAI WebSocket errors
    openaiSocket.on('error', (error) => {
        console.error('OpenAI WebSocket error:', error);
        clientSocket.close();
    });

    // Handle OpenAI WebSocket close
    openaiSocket.on('close', () => {
        console.log('OpenAI connection closed.');
        clientSocket.close();
    });

    // Handle client disconnect
    clientSocket.on('close', () => {
        console.log('Client disconnected.');
        openaiSocket.close();
    });
});

const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
    console.log(`Relay server listening on port ${PORT}`);
});