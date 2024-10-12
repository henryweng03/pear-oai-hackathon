import os
import asyncio
import websockets
import json
from pymongo import MongoClient

# WebSocket server (Node.js server)
WS_SERVER_URL = "ws://localhost:8081"

# MongoDB connection setup
mongo_client = MongoClient('mongodb+srv://willyli3609:S7w385j6K4BwmMWw@openai-hackathon.qsmig.mongodb.net/?retryWrites=true&w=majority&appName=openAI-hackathon')
db = mongo_client['your_database']

user_id = "will"

# Fetch user info
user_info = db.user_info.find_one({"user_id": user_id})

# Check if user_info exists
if user_info is None:
    raise ValueError(f"No user found with user_id: {user_id}")

# Fetch recent session history
recent_sessions = list(db.session_history.find({"user_id": user_id}).sort("date", -1).limit(5))

# Fetch relationship info
relationships = list(db.relationships.find({"user_id": user_id}))

# Convert ObjectId to string
if '_id' in user_info:
    user_info['_id'] = str(user_info['_id'])

for session in recent_sessions:
    if '_id' in session:
        session['_id'] = str(session['_id'])

for relationship in relationships:
    if '_id' in relationship:
        relationship['_id'] = str(relationship['_id'])

# Simulated session transcript
transcript = """
Therapist: Welcome back, Sarah. It's good to see you again. How have you been since our last session?
Sarah: Hi Dr. Johnson. I've been... better, actually. I've been trying that mindfulness thing we talked about...
"""

# Data to send to the WebSocket server
session_prompt = {
    "user_basic_info": user_info,
    "recent_sessions": recent_sessions,
    "relationships": relationships,
    "transcript": transcript
}

# Async function to handle WebSocket communication
async def communicate_with_server():
    async with websockets.connect(WS_SERVER_URL) as websocket:
        # Send the session prompt as a JSON-encoded message to the WebSocket server
        await websocket.send(json.dumps(session_prompt))
        print(f"Sent to WebSocket server: {session_prompt}")

        # Wait for the response from the WebSocket server
        response = await websocket.recv()
        print(f"Response from server: {response}")

        # Process the response (e.g., update MongoDB, print output)
        result = json.loads(response)
        updated_user_info = result.get("updated_user_info")
        updated_session_summary = result.get("updated_session_summary")
        updated_relationships = result.get("updated_relationships")

        # === Update MongoDB ===
        # Update user info in MongoDB
        db.user_info.update_one({"user_id": user_id}, {"$set": {"updated_info": updated_user_info}})

        # Append session summary to session history in MongoDB
        session_record = {
            "user_id": user_id,
            "date": "session_date",  # Replace with actual session date
            "summary": updated_session_summary,
            "transcript": transcript
        }
        db.session_history.insert_one(session_record)

        # Update relationships in MongoDB
        db.relationships.update_one(
            {"user_id": user_id},
            {"$set": {"updated_relationships": updated_relationships}},
            upsert=True
        )

        print("MongoDB updated successfully.")

# Run the asyncio event loop for the WebSocket communication
asyncio.run(communicate_with_server())
