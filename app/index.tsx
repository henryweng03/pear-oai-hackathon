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

// import React, { useState } from 'react';
// import { View, Text, Button } from 'react-native';
// import AudioRecorderPlayer from 'react-native-audio-recorder-player';
// import { Buffer } from 'buffer'; // Needed for encoding PCM16 data to base64

// const audioRecorderPlayer = new AudioRecorderPlayer();

// export default function App() {
//   const [isRecording, setIsRecording] = useState(false);
//   const [recordedAudioPath, setRecordedAudioPath] = useState(null);
//   const [ws, setWs] = useState<WebSocket | null>(null);
//   const [isConnected, setIsConnected] = useState(false);

//   // Start recording audio
//   const startRecording = async () => {
//     try {
//       console.log('Starting recording...');
//       const result = await audioRecorderPlayer.startRecorder();
//       setRecordedAudioPath(result); // Store the audio file path
//       setIsRecording(true);
//       console.log('Recording started:', result);
//     } catch (error) {
//       console.error('Error starting recording:', error);
//     }
//   };
  
//   // Stop recording audio
//   const stopRecording = async () => {
//     const result = await audioRecorderPlayer.stopRecorder();
//     setIsRecording(false);
//     console.log('Recording stopped:', result);
    
//     // Once recording is stopped, convert and send the audio
//     if (result) {
//       await processAndSendAudio(result);
//     }
//   };

//   // Function to process the recorded audio file and send it
//   const processAndSendAudio = async (filePath) => {
//     try {
//       // Fetch the audio file data
//       const response = await fetch(filePath);
//       const audioData = await response.arrayBuffer(); // Get raw audio data as ArrayBuffer

//       // Convert ArrayBuffer to PCM16 and Base64 encode it
//       const float32Array = new Float32Array(audioData);
//       const base64AudioData = base64EncodeAudio(float32Array);

//       // Create the WebSocket message event
//       const event = {
//         type: 'conversation.item.create',
//         item: {
//           type: 'message',
//           role: 'user',
//           content: [
//             {
//               type: 'input_audio',
//               audio: base64AudioData
//             }
//           ]
//         }
//       };

//       // Send the event to OpenAI
//       if (ws && isConnected) {
//         ws.send(JSON.stringify(event));
//         ws.send(JSON.stringify({ type: 'response.create' }));
//         console.log('Audio message sent to OpenAI');
//       }
//     } catch (error) {
//       console.error('Error processing audio file:', error);
//     }
//   };

//   // WebSocket connection
//   const connectWebSocket = () => {
//     const websocket = new WebSocket('ws://localhost:8081');  // Use your proxy server URL

//     websocket.onopen = () => {
//       console.log('Connected to WebSocket server.');
//       setIsConnected(true);
//       setWs(websocket);
//     };

//     websocket.onerror = (error) => {
//       console.error('WebSocket error:', error);
//     };

//     websocket.onclose = () => {
//       console.log('WebSocket closed.');
//       setIsConnected(false);
//     };
//   };

//   const closeWebSocket = () => {
//     if (ws) {
//       ws.close();
//       setWs(null);
//       setIsConnected(false);
//     }
//   };

//   // Utility to convert Float32Array to PCM16 and then base64 encode
//   const floatTo16BitPCM = (float32Array) => {
//     const buffer = new ArrayBuffer(float32Array.length * 2);
//     const view = new DataView(buffer);
//     let offset = 0;
//     for (let i = 0; i < float32Array.length; i++, offset += 2) {
//       let s = Math.max(-1, Math.min(1, float32Array[i]));
//       view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
//     }
//     return buffer;
//   };

//   const base64EncodeAudio = (float32Array) => {
//     const arrayBuffer = floatTo16BitPCM(float32Array);
//     let binary = '';
//     let bytes = new Uint8Array(arrayBuffer);
//     const chunkSize = 0x8000; // 32KB chunk size
//     for (let i = 0; i < bytes.length; i += chunkSize) {
//       let chunk = bytes.subarray(i, i + chunkSize);
//       binary += String.fromCharCode.apply(null, chunk);
//     }
//     return Buffer.from(binary, 'binary').toString('base64');
//   };

//   return (
//     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//       <Text>WebSocket Audio Recorder</Text>

//       <Button title={isConnected ? 'Disconnect' : 'Connect'} onPress={isConnected ? closeWebSocket : connectWebSocket} />

//       {isConnected && (
//         <View style={{ marginTop: 20 }}>
//           <Button title={isRecording ? 'Stop Recording' : 'Start Recording'} onPress={isRecording ? stopRecording : startRecording} />
//         </View>
//       )}
//     </View>
//   );
// }
