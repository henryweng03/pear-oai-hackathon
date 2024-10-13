const WebSocket = require("ws");
const express = require("express");
const http = require("http");
const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// OpenAI WebSocket URL
const OPENAI_WS_URL =
  "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";

// MongoDB connection setup
const mongoClient = new MongoClient(
  "mongodb+srv://willyli3609:S7w385j6K4BwmMWw@openai-hackathon.qsmig.mongodb.net/?retryWrites=true&w=majority&appName=openAI-hackathon"
);

let db;
let user_id = "will";

// Function to fetch user data from MongoDB
async function fetchUserData() {
  try {
    await mongoClient.connect();
    db = mongoClient.db("your_database");

    const userInfo = await db
      .collection("user_info")
      .findOne({ user_id: user_id });
    if (!userInfo) throw new Error(`No user found with user_id: ${user_id}`);

    const recentSessions = await db
      .collection("session_history")
      .find({ user_id: user_id })
      .sort({ date: -1 })
      .limit(5)
      .toArray();

    const relationships = await db
      .collection("relationships")
      .find({ user_id: user_id })
      .toArray(); // Simulated session transcript

    const transcript = `
            Therapist: Welcome back, Sarah. It's good to see you again. How have you been since our last session?
            Sarah: Hi Dr. Johnson. I've been... better, actually. I've been trying that mindfulness thing we talked about...
        `; // Prepare session data

    const sessionPrompt = {
      user_basic_info: userInfo,
      recent_sessions: recentSessions,
      relationships: relationships,
      transcript: transcript,
    };

    return sessionPrompt;
  } catch (error) {
    console.error("Error fetching data from MongoDB:", error);
  }
}

// Function to communicate with OpenAI WebSocket
async function communicateWithOpenAI(sessionPrompt, clientSocket) {
  const openaiSocket = new WebSocket(OPENAI_WS_URL, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "OpenAI-Beta": "realtime=v1",
    },
  });

  openaiSocket.on("open", () => {
    console.log("Connected to OpenAI WebSocket");
    openaiSocket.send(JSON.stringify(sessionPrompt)); // Send data to OpenAI
    console.log("Sent session prompt to OpenAI:", sessionPrompt);
  });

  openaiSocket.on("message", async (data) => {
    const response = JSON.parse(data);
    console.log("Response from OpenAI:", response);

    const {
      updated_user_info,
      updated_session_summary,
      updated_relationships,
    } = response; // === Update MongoDB ===

    try {
      await db
        .collection("user_info")
        .updateOne(
          { user_id: user_id },
          { $set: { updated_info: updated_user_info } }
        );

      const sessionRecord = {
        user_id: user_id,
        date: new Date(), // Set actual session date
        summary: updated_session_summary,
        transcript: sessionPrompt.transcript,
      };
      await db.collection("session_history").insertOne(sessionRecord);

      await db
        .collection("relationships")
        .updateOne(
          { user_id: user_id },
          { $set: { updated_relationships: updated_relationships } },
          { upsert: true }
        );

      console.log("MongoDB updated successfully."); // Notify the client that the session is completed and updated

      clientSocket.send(
        JSON.stringify({ status: "Session complete", data: response })
      );
    } catch (error) {
      console.error("Error updating MongoDB:", error);
    }
  });

  openaiSocket.on("error", (error) => {
    console.error("OpenAI WebSocket error:", error);
    clientSocket.send(JSON.stringify({ status: "Error", error }));
  });

  openaiSocket.on("close", () => {
    console.log("OpenAI connection closed.");
  });
}

// WebSocket Server logic
wss.on("connection", (clientSocket) => {
  console.log("Client connected to relay server.");

  clientSocket.on("message", async (message) => {
    try {
      console.log(message.toString("utf-8"));
      if (message.toString("utf-8") === "start_session") {
        console.log("Received start_session command from client");
        const sessionPrompt = await fetchUserData(); // Fetch user data and create session prompt

        if (sessionPrompt) {
          // Communicate with OpenAI WebSocket and update MongoDB
          await communicateWithOpenAI(sessionPrompt, clientSocket);
        } else {
          clientSocket.send(
            JSON.stringify({
              status: "Error",
              message: "Failed to fetch session data.",
            })
          );
        }
      } else {
        console.log("Unknown message", message);
      }
    } catch (error) {
      console.error("Error processing client message:", error);
      clientSocket.send(
        JSON.stringify({ status: "Error", error: "Invalid message format." })
      );
    }
  });

  clientSocket.on("close", () => {
    console.log("Client disconnected.");
  });
});

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Relay server listening on port ${PORT}`);
});
