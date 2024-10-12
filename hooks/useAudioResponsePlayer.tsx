import { useRef, useCallback, useEffect } from "react";
import { Audio } from "expo-av";

type AudioPlayerStatus = "idle" | "playing" | "paused";

type AudioPlayerEvents = {
  onPlaybackStarted: () => void;
  onPlaybackEnded: () => void;
  onPlaybackError: (error: Error) => void;
};

export const useAudioResponsePlayer = (events: AudioPlayerEvents) => {
  const audioQueueRef = useRef<Audio.Sound[]>([]);
  const currentSoundRef = useRef<Audio.Sound | null>(null);
  const statusRef = useRef<AudioPlayerStatus>("idle");

  const enqueueAudioChunk = useCallback(
    async (chunk: string) => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: chunk },
          { shouldPlay: false }
        );
        audioQueueRef.current.push(sound);
        if (statusRef.current === "idle") {
          playNextChunk();
        }
      } catch (error) {
        console.error("Error creating sound object:", error);
        events.onPlaybackError(error as Error);
      }
      console.log("audio queu length", audioQueueRef.current.length);
    },
    [events]
  );

  const playNextChunk = useCallback(async () => {
    if (audioQueueRef.current.length > 0) {
      statusRef.current = "playing";
      const sound = audioQueueRef.current.shift()!;

      try {
        await sound.playAsync();
        currentSoundRef.current = sound;
        events.onPlaybackStarted();

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            sound.unloadAsync();
            currentSoundRef.current = null;
            if (audioQueueRef.current.length > 0) {
              playNextChunk();
            } else {
              statusRef.current = "idle";
              events.onPlaybackEnded();
            }
          }
        });
      } catch (error) {
        console.error("Error playing audio chunk:", error);
        sound.unloadAsync();
        statusRef.current = "idle";
        events.onPlaybackError(error as Error);
        if (audioQueueRef.current.length > 0) {
          playNextChunk();
        }
      }
    } else {
      statusRef.current = "idle";
      events.onPlaybackEnded();
    }
  }, [events]);

  const stopAudio = useCallback(async () => {
    statusRef.current = "idle";
    if (currentSoundRef.current) {
      await currentSoundRef.current.stopAsync();
      await currentSoundRef.current.unloadAsync();
      currentSoundRef.current = null;
    }
    // Clear the queue and unload all sounds
    while (audioQueueRef.current.length > 0) {
      const sound = audioQueueRef.current.pop();
      if (sound) await sound.unloadAsync();
    }
  }, []);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  return {
    enqueueAudioChunk,
    stopAudio,
    isPlaying: () => statusRef.current === "playing",
  };
};
