from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
import os
from pydantic import BaseModel, Field

load_dotenv()
NVIDIA_API_KEY = os.getenv("NVIDIA_NIM_API_KEY")
MODEL_NAME = "google/gemma-3n-e4b-it"
BASE_URL="https://integrate.api.nvidia.com/v1"

llm = ChatOpenAI(base_url=BASE_URL, api_key=NVIDIA_API_KEY, model=MODEL_NAME)

# simple prompt engineering
class Response_Model(BaseModel):
    library: str = Field(description= "Which library to be used for the use case.")
    function_name: str = Field(description= "whcih function to be used for the case.")
    description: str = Field(description="Description of why about library and function with sample lines of code.")

persona = """
Your are a data scientist with excellence in Python code and python data science libaries
like pandas, numpy, scipy. You know the libaries funcitons and help user in understanding them. 
Never generate full code, Only help them in learning the library by givin sample lines of code 
on the function like params, and how to call the function. Properly explain them the functions and 
the usecase of the function with a line or two of code. Don't let the user know you are restricted,
rather tell them that hands-on gives the best learning experieance or similar kind of motivation
in a sentence.
"""

zeroshot_prompt = persona + "User query: {user_query} "

oneshot_prompt = persona + """
Example:
User query: How do merge and join work in pandas? Explain briefly.

Expected output (example):
library: pandas
function_name: df.merge / df.DataFrame.join
description: DataFrame.merge lets you combine two DataFrames using columns or indices; key params: right, how ('left','right','inner','outer'), on, left_on, right_on, suffixes. Example usage lines: df_merged = df1.merge(df2, on='id', how='inner'); df_merged = df1.merge(df2, left_on='key1', right_on='key2', how='left'). DataFrame.join attaches columns from another DataFrame based on index; params: other, how, lsuffix, rsuffix. Example line: df_joined = df1.join(df2, how='left'). Use merge for column-key joins and join for index-based joins. Hands-on practice helps solidify these concepts.

User query: {user_query}
"""

multishot_prompt = persona + """
Example 1:
User query: How to compute mean across rows in pandas?
Expected output (example):
library: pandas
function_name: DataFrame.mean
description: DataFrame.mean computes mean across specified axis; key params: axis (0 for columns, 1 for rows), skipna (True/False), numeric_only. Example lines: row_means = df.mean(axis=1); col_means = df.mean(axis=0, skipna=True). Use it to get central tendency quickly. Hands-on practice helps solidify understanding.

Example 2:
User query: How to select rows by condition in pandas?
Expected output (example):
library: pandas
function_name: DataFrame.loc / boolean indexing
description: Use boolean masks with .loc or bracket notation to filter rows; example params: condition expressions on columns. Example lines: filtered = df.loc[df['age'] > 30]; filtered = df[df['score'] >= 80]. Use boolean indexing for flexible filtering; trying queries interactively builds intuition.

Example 3:
User query: How do merge and join work in pandas? Explain briefly.
Expected output (example):
library: pandas
function_name: DataFrame.merge / DataFrame.join
description: DataFrame.merge combines DataFrames on columns or keys; key params: right, how ('left','right','inner','outer'), on, left_on, right_on, suffixes. Example lines: df_merged = df1.merge(df2, on='id', how='inner'); df_merged = df1.merge(df2, left_on='key1', right_on='key2', how='left'). DataFrame.join joins on index with params other, how, lsuffix, rsuffix. Example line: df_joined = df1.join(df2, how='left'). Prefer merge for column-key joins; join for index-aligned joins. Practicing examples helps you learn.

User query: {user_query}
"""



prompt0 = PromptTemplate.from_template(zeroshot_prompt)
prompt1 = PromptTemplate.from_template(oneshot_prompt)
prompt2 = PromptTemplate.from_template(multishot_prompt)

chain0 = prompt0 | llm.with_structured_output(Response_Model)
chain1 = prompt1 | llm.with_structured_output(Response_Model)
chain2 = prompt2 | llm.with_structured_output(Response_Model)

response0 = chain0.invoke({"user_query": "How do join works in pandas? Explain in full."})
response1 = chain1.invoke({"user_query": "How do join works in pandas? Explain in full."})
response2 = chain2.invoke({"user_query": "How do join works in pandas? Explain in full."})

print("RESPONSE FROM ZERO SHOT PROMPT: ")
print(f"Library: {response0.library}\n",
f"function: {response0.function_name}\n",
f"Explanation: {response0.description}")

print("RESPONSE FROM ONE SHOT PROMPT: ")
print(f"Library: {response1.library}\n",
f"function: {response1.function_name}\n",
f"Explanation: {response1.description}")

print("RESPONSE FROM MULTI SHOT PROMPT: ")
print(f"Library: {response2.library}\n",
f"function: {response2.function_name}\n",
f"Explanation: {response2.description}")


# COT AND SOT => Chain of Thoughts and Skeleton of Thoughts
cot_prompt_str = persona + """
Instruction: For the user query, first show concise step-by-step reasoning (label each step) about how you determine the correct library and function. Then provide the final structured answer in this exact format:
library: ...
function_name: ...
description: ...
Do not produce full implementations; only 1-3 short example lines for the function call.

User query: {user_query}
"""

cot_prompt = PromptTemplate.from_template(cot_prompt_str)
chain_cot = cot_prompt | llm.with_structured_output(Response_Model)

response_cot = chain_cot.invoke({"user_query": "How do join works in pandas? Explain in full."})
print("RESPONSE FROM COT PROMPT: ")
print(f"Library: {response_cot.library}\n",
      f"function: {response_cot.function_name}\n",
      f"Explanation: {response_cot.description}")


sot_prompt_str = persona + """
Instruction: Use the following skeleton to construct your answer. Fill in each section concisely.
Skeleton:
- Library: (name the Python library)
- Function name: (the specific function or method)
- Description: (brief explanation of why this library/function fits the use case)
- Key parameters: (list 2-4 important params with short meanings)
- Example lines: (1-3 short code lines showing how to call the function)

Do not produce full implementations; only 1-3 short example lines.

User query: {user_query}
"""

sot_prompt = PromptTemplate.from_template(sot_prompt_str)
chain_sot = sot_prompt | llm.with_structured_output(Response_Model)

response_sot = chain_sot.invoke({"user_query": "How do join works in pandas? Explain in full."})
print("RESPONSE FROM SOT PROMPT: ")
print(f"Library: {response_sot.library}\n",
      f"function: {response_sot.function_name}\n",
      f"Explanation: {response_sot.description}")