import os
import sys
import argparse
import json
from openai import OpenAI

# ----------------------------------------------------------------------
# Configuration – you can add any model that NIM exposes here.
# ----------------------------------------------------------------------
BUILT_IN_MODELS = {
    # Friendly name → model identifier used by NIM
    "llama2-70b":      "meta/llama-2-70b",
    "llama2-13b":      "meta/llama-2-13b",
    "mixtral-8x7b":    "mistralai/mixtral-8x7b-instruct",
    "mixtral-8x22b":   "mistralai/mixtral-8x22b-instruct",
    "gpt-neox-20b":    "eleutherai/gpt-neox-20b",
}

# ----------------------------------------------------------------------
# Helper: load extra model mappings from a JSON file (optional)
# ----------------------------------------------------------------------
def load_extra_models(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        extra = json.load(f)
    # Validate that all entries are strings
    for k, v in extra.items():
        if not isinstance(v, str):
            raise ValueError(f"Model mapping for '{k}' must be a string, got {type(v)}.")
    return extra

# ----------------------------------------------------------------------
# Core chat function – returns a generator that yields text chunks.
# ----------------------------------------------------------------------
def stream_chat(
    client: OpenAI,
    model: str,
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 1024,
    stream: bool = True,
):
    """
    Send a chat‑completion request to NVIDIA NIM and yield results.
    If `stream=True` the function yields text as it arrives; otherwise
    it returns a single string with the whole reply.
    """
    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=stream,
        )
    except Exception as exc:
        print(f"[ERROR] Could not reach NIM: {exc}", file=sys.stderr)
        return  # caller will see an empty iterator

    if stream:
        for chunk in response:
            # chunk = openai.APIEventChunk (OpenAI‑compatible)
            delta = chunk.choices[0].delta
            if delta and delta.content:
                yield delta.content
    else:
        # Non‑streaming: just take the first completion
        reply = response.choices[0].message.content
        yield reply

# ----------------------------------------------------------------------
# Interactive loop – keeps the conversation history in memory
# ----------------------------------------------------------------------
def chat_loop(
    client: OpenAI,
    model_id: str,
    system_prompt: str = "You are a helpful assistant.",
    temperature: float = 0.7,
    max_tokens: int = 1024,
    stream: bool = True,
):
    """
    Simple REPL that continuously reads user input, sends it to the model,
    and prints the model's reply. The full conversation (including system
    prompt) is maintained across turns.
    """
    messages = [{"role": "system", "content": system_prompt}]
    print(f"🤖  Using model: {model_id}  (temperature={temperature}, max_tokens={max_tokens})")
    print("Type your messages. Press Ctrl‑C or enter 'exit' to quit.\n")

    while True:
        try:
            user_text = input("You: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\n👋  Goodbye!")
            break

        if user_text.lower() in {"exit", "quit"}:
            print("👋  Goodbye!")
            break

        if not user_text:
            continue

        # Add user turn
        messages.append({"role": "user", "content": user_text})

        # Request a reply
        print("Assistant: ", end="", flush=True)
        assistant_reply = ""
        for token in stream_chat(
            client,
            model_id,
            messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=stream,
        ):
            if token is None:          # error case – we already printed it
                break
            if stream:
                print(token, end="", flush=True)
            assistant_reply += token

        print()   # newline after the response

        # Append assistant turn to history (if we got a reply)
        if assistant_reply:
            messages.append({"role": "assistant", "content": assistant_reply})
        else:
            # If something went wrong, drop the last user turn to avoid infinite loops
            messages.pop()
            print("Assistant: (no response received – try again)\n")

# ----------------------------------------------------------------------
# CLI entry point
# ----------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description="Simple NVIDIA NIM chat client with continuous conversation."
    )
    parser.add_argument(
        "--model", "-m",
        choices=list(BUILT_IN_MODELS.keys()),
        default="llama2-70b",
        help="Pick a built‑in model.",
    )
    parser.add_argument(
        "--model-file", "-f",
        help="Path to a JSON file with additional model mappings (key = friendly name, value = NIM model id).",
    )
    parser.add_argument(
        "--system-prompt", "-s",
        default="You are a helpful assistant.",
        help="System‑level instruction used for the model.",
    )
    parser.add_argument(
        "--temperature", "-t",
        type=float,
        default=0.7,
        help="Sampling temperature (higher = more random).",
    )
    parser.add_argument(
        "--max-tokens", "-M",
        type=int,
        default=1024,
        help="Maximum number of tokens the model may generate.",
    )
    parser.add_argument(
        "--no-stream",
        action="store_true",
        help="Disable streaming (wait for the whole answer before printing).",
    )
    args = parser.parse_args()

    # ------------------------------------------------------------------
    # Build final model table (built‑ins + optional file)
    # ------------------------------------------------------------------
    models = BUILT_IN_MODELS.copy()
    if args.model_file:
        models.update(load_extra_models(args.model_file))

    model_id = models.get(args.model)
    if not model_id:
        print(
            f"[ERROR] Model '{args.model}' not found. Available: {', '.join(models.keys())}",
            file=sys.stderr,
        )
        sys.exit(1)

    # ------------------------------------------------------------------
    # Create the OpenAI‑compatible client pointing at NVIDIA NIM
    # ------------------------------------------------------------------
    client = OpenAI(
        api_key=os.environ.get("NVIDIA_NIM_API_KEY"),
        base_url="https://integrate.api.nvidia.com/v1",  # <-- NIM endpoint
    )

    # ------------------------------------------------------------------
    # Run the chat loop
    # ------------------------------------------------------------------
    chat_loop(
        client,
        model_id,
        system_prompt=args.system_prompt,
        temperature=args.temperature,
        max_tokens=args.max_tokens,
        stream=not args.no_stream,
    )


if __name__ == "__main__":
    main()















###################################################################################
# from openai import OpenAI
# from dotenv import load_dotenv  
# load_dotenv()
# NVIDIA_API_KEY = os.getenv("NVIDIA_NIM_API_KEY")
# client = OpenAI(
#   base_url = "https://integrate.api.nvidia.com/v1",
#   api_key = NVIDIA_API_KEY
# )

# completion = client.chat.completions.create(
#   model="stepfun-ai/step-3.7-flash",
#   messages=[{"role":"user","content":"Hi Give me a simple chat code using nvidia nim and langchain_openai where I can configure different models and do a continuos chat."}],
#   temperature=1,
#   top_p=0.95,
#   max_tokens=8192,
#   stream=False
# )

# print(completion.choices[0].message.content)