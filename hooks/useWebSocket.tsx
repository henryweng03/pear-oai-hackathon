import { useState, useCallback, useEffect, useRef } from "react";

const useWebSocket = (url: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [stringResponse, setStringResponse] = useState<string | null>(null);
  const [byteResponse, setByteResponse] = useState<ArrayBuffer | null>(null);
  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    console.log("Attempting to connect to WebSocket:", url);
    socket.current = new WebSocket(url);

    socket.current.onopen = () => {
      console.log("open websocket connection");
      setIsConnected(true);
    };

    socket.current.onclose = () => {
      console.log("close websocket connection");
      setIsConnected(false);
    };

    socket.current.onmessage = (event) => {
      if (typeof event.data === "string") {
        setStringResponse(event.data);
        console.log(
          "Received new audio chunk at time (websocket)",
          new Date().toISOString(),
          event.data.slice(0, 6)
        );
      } else if (event.data instanceof ArrayBuffer) {
        setByteResponse(event.data);
      }
    };

    return () => {
      if (socket.current) {
        socket.current.close();
      }
    };
  }, [url]);

  const sendMessage = useCallback((data: string | ArrayBuffer) => {
    if (socket.current && socket.current.readyState === WebSocket.OPEN) {
      socket.current.send(data);
    }
  }, []);

  return {
    isConnected,
    sendMessage,
    stringResponse,
    byteResponse,
  };
};

export default useWebSocket;
