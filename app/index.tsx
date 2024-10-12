import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput } from 'react-native';

export default function App() {
  const [message, setMessage] = useState('');  // To display server response
  const [inputText, setInputText] = useState('');  // To capture user input
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Function to handle incoming WebSocket messages
  const handleWebSocketMessage = (event) => {
    const data = event.data;

    if (typeof data === 'string') {
      // Handle JSON data
      try {
        const response = JSON.parse(data);
        console.log('Received JSON message:', response);
        setMessage(JSON.stringify(response, null, 2));  // Display the response
      } catch (error) {
        console.error('Error parsing message:', error);
        setMessage('Error parsing message');
      }
    } else {
      console.log('Unknown message type received:', data);
    }
  };

  // Connect to the WebSocket server (your proxy server)
  const connectWebSocket = () => {
    const websocket = new WebSocket('ws://localhost:8081');  // Use your proxy server URL

    websocket.onopen = () => {
      console.log('Connected to WebSocket server.');
      setIsConnected(true);
      setWs(websocket);
    };

    websocket.onmessage = handleWebSocketMessage;

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket closed.');
      setIsConnected(false);
    };
  };

  const closeWebSocket = () => {
    if (ws) {
      ws.close();
      setWs(null);
      setIsConnected(false);
    }
  };

  // Function to send a message to the server
  const sendMessage = () => {
    if (ws && isConnected && inputText.trim().length > 0) {
      const messageToSend = {
        type: 'response.create',
        response: {
          modalities: ['text'],
          instructions: inputText,  // The input text from the user
        },
      };
      ws.send(JSON.stringify(messageToSend));  // Send the message as JSON
      setInputText('');  // Clear input field after sending
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18 }}>WebSocket Connection to OpenAI Proxy</Text>
      
      <TextInput
        style={{
          height: 40,
          borderColor: 'gray',
          borderWidth: 1,
          width: '100%',
          marginBottom: 20,
          paddingHorizontal: 10,
        }}
        placeholder="Enter your message"
        value={inputText}
        onChangeText={setInputText}
      />

      <Button title={isConnected ? 'Disconnect' : 'Connect'} onPress={isConnected ? closeWebSocket : connectWebSocket} />

      {isConnected && (
        <View style={{ marginTop: 20 }}>
          <Button title="Send Message" onPress={sendMessage} />
        </View>
      )}

      <Text style={{ marginTop: 20, fontSize: 16 }}>Response from server:</Text>
      <Text
        style={{
          marginTop: 10,
          padding: 10,
          backgroundColor: '#f0f0f0',
          borderRadius: 5,
          maxHeight: 100,  // Restrict height if necessary
          overflow: 'hidden',
        }}
        numberOfLines={3}  // Set the maximum number of lines
        ellipsizeMode="tail"  // Show ellipsis at the end
      >
        {message || 'No messages received yet.'}
      </Text>

    </View>
  );
}
