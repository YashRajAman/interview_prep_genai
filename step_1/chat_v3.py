
### Step 1: Prerequisites
# 1. Get an NVIDIA API key from the [NVIDIA Build Portal](https://build.nvidia.com) (free tier available)
# 2. Install required packages:
#    ```bash
#    pip install langchain langchain-openai python-dotenv
#    ```

# ---

### Step 2: Full Chat Code
# Import required libraries

import time
import os
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv  # Optional: for loading API key from a .env file

# -------------------------- CONFIGURE THESE VALUES --------------------------
# Load API key from .env file (optional: create a .env file with NVIDIA_API_KEY=your_key)
load_dotenv()
NVIDIA_API_KEY = os.getenv("NVIDIA_NIM_API_KEY")

# Choose a model from the [NVIDIA NIM Model Catalog](https://build.nvidia.com/models)
# Popular options:
# - "meta/llama-3.1-70b-instruct" (Llama 3.1 70B)
# - "meta/llama-3.1-8b-instruct" (Llama 3.1 8B, faster)
# - "nvidia/mistral-7b-instruct-v0.2" (Mistral 7B)
# - "google/gemma-2-9b-it" (Gemma 2 9B)
MODEL_NAME = "google/gemma-3n-e4b-it" #"stepfun-ai/step-3.7-flash" #"google/gemma-4-31b-it"   #

# Adjust model behavior
TEMPERATURE = 0.7  # 0 = deterministic/factual, 1 = more creative/random
MAX_TOKENS = 6024  # Max length of the model's response

# Optional: Set the assistant's personality/behavior
SYSTEM_PROMPT = "You are a helpful, friendly assistant. Answer questions clearly and concisely."
# -----------------------------------------------------------------------------

# Initialize the LangChain ChatOpenAI client pointing to NVIDIA NIM's endpoint
llm = ChatOpenAI(
    base_url="https://integrate.api.nvidia.com/v1",  # NVIDIA NIM's OpenAI-compatible API endpoint
    api_key=NVIDIA_API_KEY,
    model=MODEL_NAME
)

# Initialize chat history (starts with your system prompt)
chat_history = [{"role": "system", "content": SYSTEM_PROMPT}]

# Print startup info
print("=" * 60)
print(f"🚀 NVIDIA NIM Chat | Model: {MODEL_NAME}")
print("💡 Commands: Type 'exit'/'quit'/'bye' to end, '/clear' to reset chat history")
print("=" * 60 + "\n")

# Continuous chat loop
while True:
    # Get user input
    user_input = input("You: ").strip()

    # Handle exit command
    if user_input.lower() in ["exit", "quit", "bye"]:
        print("\nAssistant: Goodbye! Feel free to come back anytime.")
        break

    # Handle history clear command
    if user_input.lower() == "/clear":
        chat_history = [{"role": "system", "content": SYSTEM_PROMPT}]
        print("\nAssistant: Chat history cleared!\n")
        continue

    # Skip empty input
    if not user_input:
        continue

    # Add user message to chat history
    chat_history.append({"role": "user", "content": user_input})

    try:
        # Send full chat history to the model to maintain context
        stime = time.time()
        response = llm.invoke(chat_history)
        assistant_reply = response.content

        # Print the model's response
        print(f"\nAssistant: {assistant_reply}\n")

        print("Replied in : ", time.time() - stime, "seconds")
        # Add assistant's response to history for future context
        chat_history.append({"role": "assistant", "content": assistant_reply})

    except Exception as e:
        # Handle API/network errors gracefully
        print(f"\n❌ Error: {str(e)}\n")
        # Remove the failed user message from history to keep it consistent
        chat_history.pop()


### Optional: Add Streaming Responses
# print("\nAssistant: ", end="", flush=True)
# full_response = ""
# for chunk in llm.stream(chat_history):
#     print(chunk.content, end="", flush=True)
#     full_response += chunk.content
# print("\n")

# # Add full response to history
# chat_history.append({"role": "assistant", "content": full_response})