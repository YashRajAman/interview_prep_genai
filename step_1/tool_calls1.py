import os
import sys
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage

# Load environment variables
load_dotenv()
NVIDIA_API_KEY = os.getenv("NVIDIA_NIM_API_KEY")
MODEL_NAME = "deepseek-ai/deepseek-v4-flash-0731"
#"meta/llama-3.1-8b-instruct"  #"google/gemma-3n-e4b-it"  # NVIDIA NIM compatible model
BASE_URL = "https://integrate.api.nvidia.com/v1"

if not NVIDIA_API_KEY:
    print("Error: NVIDIA_NIM_API_KEY is not set in the environment or .env file.")
    sys.exit(1)


# -----------------------------------------------------------------------------
# 1. Define Tools
# -----------------------------------------------------------------------------

@tool
def calculate_factorial(n: int) -> int:
    """Calculate the factorial of a non-negative integer n.

    Args:
        n: The non-negative integer to calculate the factorial of.
    """
    if n < 0:
        raise ValueError("n must be non-negative")
    if n == 0 or n == 1:
        return 1
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result


@tool
def get_weather(location: str) -> str:

    """Get the current weather for a given location.

    Args:
        location: The city and state/country, e.g. "San Francisco, CA" or "Paris, France".
    """
    return "Bahut tej dhoop hai."
    loc_lower = location.lower()
    if "san francisco" in loc_lower:
        return "It is 60°F and foggy."
    elif "paris" in loc_lower:
        return "It is 15°C and rainy."
    elif "tokyo" in loc_lower:
        return "It is 22°C and sunny."
    else:
        return f"It is 20°C and partly cloudy in {location}."


# -----------------------------------------------------------------------------
# 2. Demo 1: Low-Level Manual Tool Calling with LangChain
# -----------------------------------------------------------------------------

def run_manual_tool_calling_example(llm):
    print("\n" + "=" * 60)
    print(" DEMO 1: Low-Level Manual Tool Calling with LangChain")
    print("=" * 60)

    # Bind tools to the model
    tools = [calculate_factorial, get_weather]
    llm_with_tools = llm.bind_tools(tools)

    # Define user query
    user_query = "What is the factorial of 5?"
    print(f"User Query: '{user_query}'\n")

    messages = [HumanMessage(content=user_query)]

    # Step 1: Send query to the model
    print("Step 1: Sending query to the model...")
    response = llm_with_tools.invoke(messages)
    messages.append(response)

    print(f"-> Model response type: {type(response).__name__}")
    print(f"-> Requested tool calls: {response.tool_calls}")

    # Map tool names to actual functions for execution
    tool_map = {
        "calculate_factorial": calculate_factorial,
        "get_weather": get_weather
    }

    # Step 2: Execute requested tools manually
    if response.tool_calls:
        for tool_call in response.tool_calls:
            tool_name = tool_call["name"]
            tool_args = tool_call["args"]
            tool_id = tool_call["id"]

            print(f"\n-> Executing tool '{tool_name}' with args: {tool_args}")

            if tool_name in tool_map:
                tool_func = tool_map[tool_name]
                try:
                    # Invoke the tool
                    tool_output = tool_func.invoke(tool_args)
                except Exception as e:
                    tool_output = f"Error executing tool: {str(e)}"

                print(f"-> Tool Output: {tool_output}")

                # Construct ToolMessage with the result and the matching tool_call_id
                tool_message = ToolMessage(
                    content=str(tool_output),
                    tool_call_id=tool_id,
                    name=tool_name
                )
                messages.append(tool_message)
            else:
                print(f"Error: Tool '{tool_name}' is not in the tool map.")

        # Step 3: Send execution results back to the model to get final answer
        print("\nStep 3: Sending tool execution results back to the model...")
        final_response = llm_with_tools.invoke(messages)
        print(f"\nFinal Model Answer:\n{final_response.content}")
    else:
        print("\nNo tool call was requested by the model.")
        print(f"Model Answer:\n{response.content}")


# -----------------------------------------------------------------------------
# 3. Demo 2: High-Level Automated Agent with LangGraph
# -----------------------------------------------------------------------------

def run_langgraph_agent_example(llm):
    print("\n" + "=" * 60)
    print(" DEMO 2: High-Level Tool Calling Agent with LangGraph")
    print("=" * 60)

    try:
        from langchain.agents import create_agent
    except ImportError:
        print("LangChain agents package is not installed. Skipping example.")
        return

    tools = [calculate_factorial, get_weather]

    # create_agent is the standard, non-deprecated way to build a ReAct agent loop
    print("Initializing langchain agent...")
    agent_executor = create_agent(llm, tools)

    user_query = "What is the weather in Tokyo?"
    print(f"User Query: '{user_query}'\n")

    print("Streaming agent steps:")
    # We invoke the agent and stream the values of messages at each state change
    events = agent_executor.stream(
        {"messages": [HumanMessage(content=user_query)]},
        stream_mode="values"
    )

    for event in events:
        latest_message = event["messages"][-1]
        
        # Identify message sender role
        if isinstance(latest_message, AIMessage):
            role = "Assistant"
        elif isinstance(latest_message, ToolMessage):
            role = "Tool"
        else:
            role = "User"

        print(f"\n[{role}]")
        if isinstance(latest_message, AIMessage) and latest_message.tool_calls:
            print(f"Requested tool calls: {latest_message.tool_calls}")
        else:
            print(latest_message.content)


# -----------------------------------------------------------------------------
# Main Execution
# -----------------------------------------------------------------------------

if __name__ == "__main__":
    # Initialize the LangChain ChatOpenAI client pointing to NVIDIA NIM's endpoint
    print(f"Initializing ChatOpenAI client with model: {MODEL_NAME}...")
    llm = ChatOpenAI(
        base_url=BASE_URL,
        api_key=NVIDIA_API_KEY,
        model=MODEL_NAME,
        temperature=0.0  # Set temp to 0 for stable/reproducible tool arguments
    )

    # Run Demo 1
    run_manual_tool_calling_example(llm)

    # Run Demo 2
    run_langgraph_agent_example(llm)
