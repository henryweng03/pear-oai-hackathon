import Sound from 'react-native-sound';

// Inside the WebSocket `onmessage` handler
webSocket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received message:', message);
  
  // Assuming you receive audio in a base64 format
  const base64Audio = message.audio; // Adjust according to the API response structure
  
  if (base64Audio) {
    const sound = new Sound(base64Audio, null, (error) => {
      if (error) {
        console.log('Failed to load sound', error);
        return;
      }
      sound.play(); // Play the audio response
    });
  }
};
