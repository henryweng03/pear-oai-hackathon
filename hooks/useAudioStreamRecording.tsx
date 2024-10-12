import { useState, useRef, useCallback } from "react";
import { Audio } from "expo-av";
import { IOSOutputFormat } from "expo-av/build/Audio";

interface StreamAudioRecordingOptions {
  onRecordingStatusUpdate?: (status: Audio.RecordingStatus) => void;
  streamIntervalMs: number;
  updateIntervalMs: number;
  sendMessage: (data: ArrayBuffer) => void;
}

const useStreamAudioRecording = ({
  onRecordingStatusUpdate,
  streamIntervalMs,
  updateIntervalMs,
  sendMessage,
}: StreamAudioRecordingOptions) => {
  const recording = useRef<Audio.Recording | null>(null);
  const lastPosition = useRef(0);
  const lastSentTime = useRef(Date.now());

  const handleRecordingStatusUpdate = useCallback(
    async (status: Audio.RecordingStatus) => {
      // Call the user's onRecordingStatusUpdate if provided
      if (onRecordingStatusUpdate) {
        onRecordingStatusUpdate(status);
      }

      // Handle streaming logic
      if (status.isRecording && recording.current) {
        const currentTime = Date.now();
        if (currentTime - lastSentTime.current >= streamIntervalMs) {
          const uri = recording.current.getURI();
          if (uri) {
            const recordingData = await fetch(uri).then((r) => r.arrayBuffer()); // must use ArrayBuffer instead of Blob because Deepgram API doesn't support Blob
            const newData = recordingData.slice(lastPosition.current);
            lastPosition.current = recordingData.byteLength;

            console.debug(`Sending audio chunk: ${newData.byteLength} bytes`);
            sendMessage(newData);
            lastSentTime.current = currentTime;
          }
        }
      }
    },
    [onRecordingStatusUpdate, streamIntervalMs, sendMessage]
  );

  const startStreamingRecording = useCallback(async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create a new recording object
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        ios: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
          extension: ".wav",
          outputFormat: IOSOutputFormat.LINEARPCM,
          sampleRate: 16000,
          numberOfChannels: 1,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      });
      newRecording.setProgressUpdateInterval(updateIntervalMs);
      newRecording.setOnRecordingStatusUpdate(handleRecordingStatusUpdate);

      // Start recording
      await newRecording.startAsync();
      recording.current = newRecording;
    } catch (error) {
      console.error("Failed to start recording", error);
    }
  }, [updateIntervalMs, handleRecordingStatusUpdate]);

  const stopStreamingRecording = useCallback(async () => {
    if (recording.current) {
      await recording.current.stopAndUnloadAsync();
      recording.current = null;
      lastPosition.current = 0;
    }
  }, []);

  // Some data is still left in the recording object after calling stop, so we need to send it
  const sendRemainingRecordingData = useCallback(async () => {
    if (recording.current) {
      const uri = recording.current.getURI();
      if (uri) {
        const recordingData = await fetch(uri).then((r) => r.arrayBuffer());
        const newData = recordingData.slice(lastPosition.current);
        if (newData.byteLength > 0) {
          console.debug(
            `Sending final audio chunk: ${newData.byteLength} bytes`
          );
          sendMessage(newData);
          lastPosition.current = recordingData.byteLength;
        }
      }
    }
  }, [sendMessage]);

  return {
    startStreamingRecording,
    stopStreamingRecording,
    sendRemainingRecordingData,
  };
};

export default useStreamAudioRecording;
