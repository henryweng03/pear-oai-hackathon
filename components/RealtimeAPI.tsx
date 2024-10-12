import React, { useEffect, useState } from 'react';
import { View, Button, Text } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { PermissionsAndroid, Platform } from 'react-native';
import WebSocket from 'react-native-websocket';

const OpenAIRealtimeAudio = () => {
  const [audioRecorderPlayer] = useState(new AudioRecorderPlayer());
  const [isRecording, setIsRecording] = useState(false);
  const [ws, setWs] = useState(null);
  const [apiResponse, setApiResponse] = useState("");

  useEffect(() => {
    // Setup WebSocket
    const webSocket = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
      headers: {
        Authorization: `Bearer YOUR_API_KEY`, // Replace with your OpenAI API key
        'OpenAI-Beta': 'realtime=v1',
      },
    });

    webSocket.onopen = () => {
      console.log('WebSocket connected');
      setWs(webSocket);
    };

    webSocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Received message:', message);
      // Handle the response, potentially play audio here
    };

    webSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    webSocket.onclose = () => {
      console.log('WebSocket closed');
    };

    // Cleanup WebSocket on component unmount
    return () => {
      if (webSocket) {
        webSocket.close();
      }
    };
  }, []);

  const startRecording = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'App needs access to your microphone',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    setIsRecording(true);

    // Start recording audio and streaming to WebSocket
    const result = await audioRecorderPlayer.startRecorder();

    audioRecorderPlayer.addRecordBackListener((e) => {
      // Send audio chunks to the WebSocket API
      const audioChunk = e.current_position; // Get audio chunk (you may need to adjust this)
      if (ws) {
        ws.send(audioChunk); // Sending audio data to OpenAI API
      }
      return;
    });

    console.log(result);
  };

  const stopRecording = async () => {
    setIsRecording(false);
    await audioRecorderPlayer.stopRecorder();
    audioRecorderPlayer.removeRecordBackListener();
    console.log('Recording stopped');
  };

  return (
    <View>
      <Text>{apiResponse}</Text>
      <Button title={isRecording ? 'Stop Recording' : 'Start Recording'} onPress={isRecording ? stopRecording : startRecording} />
    </View>
  );
};

export default OpenAIRealtimeAudio;
