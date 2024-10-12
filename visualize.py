import pandas as pd
from pymongo import MongoClient

# MongoDB connection setup
mongo_client = MongoClient('mongodb+srv://willyli3609:S7w385j6K4BwmMWw@openai-hackathon.qsmig.mongodb.net/?retryWrites=true&w=majority&appName=openAI-hackathon')
db = mongo_client['your_database']

# Fetch data from the collections
user_info_data = list(db.user_info.find())
session_history_data = list(db.session_history.find())
relationships_data = list(db.relationships.find())

# Convert to Pandas DataFrames for easier visualization
user_info_df = pd.DataFrame(user_info_data)
session_history_df = pd.DataFrame(session_history_data)
relationships_df = pd.DataFrame(relationships_data)

# Display the DataFrames
print("User Info:")
print(user_info_df)

print("\nSession History:")
print(session_history_df)

print("\nRelationships:")
print(relationships_df)
