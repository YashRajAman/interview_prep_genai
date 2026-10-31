# 🚀 Generative AI Engineering: Master Learning Path & Checklist

This document serves as your structured, hands-on tracker for transitioning from a Prompt Engineer to a **Production-Grade Generative AI Engineer**. It covers the end-to-end spectrum from model mechanics, programmatic integrations, advanced RAG pipelines, agentic orchestration, open-source models, evaluation systems, to security guardrails.

---

## 🗺️ Path Overview
```
[Phase 1: Core Mechanics] ──► [Phase 2: APIs & Structured Output] ──► [Phase 3: Tool Calling & Agents]
                                                                                │
[Phase 6: Evaluation & Safety] ◄── [Phase 5: Multi-Agent Systems] ◄── [Phase 4: Advanced RAG (Knowledge)]
              │
              ▼
[Phase 7: Local Models & Finetuning] ──► [Phase 8: Enterprise Capstone Project]
```

---

## 🎯 Phase 1: Core LLM Mechanics & Parameter Control
*Learn how models parse text, compute attention, and control randomness.*

### 📚 Core Concepts
* **Tokenization (BPE):** Text is split into sub-word tokens using Byte-Pair Encoding.
* **Attention Mechanism:** Attention determines how much weight the model puts on other parts of the text when predicting a token.
* **The Attention Horizon ("Lost in the Middle"):** LLMs have a harder time recalling information situated in the middle of long context windows compared to the beginning and end.
* **Generation Parameters:** 
  * `Temperature`: Scale of probability distribution (stochasticity).
  * `Top-p` (Nucleus): Limits tokens to cumulative probability mass.
  * `Top-k`: Hard-caps candidate tokens to the $k$ most likely.
  * `Penalties`: `Frequency` (disincentivizes repeating specific words) and `Presence` (disincentivizes repeating general topics).

### 🗂️ Categorized Files & Todo Tasks
* 📁 **Target Directory:** `step_1/`
* 📝 **Target Files:** `step_1/prompt_engineering_1.py`

#### ✅ Tasks
- [x] **Task 1.1:** Write basic prompts using Roles, Context, Instructions, Constraints, and Output indicators.
- [x] **Task 1.2:** Experiment with `Temperature`, `Top-p`, `Presence Penalty`, and `Frequency Penalty` to see behavioral changes.
- [x] **Task 1.3:** Test the "Lost in the Middle" phenomenon by placing a key fact at the beginning, middle, and end of a 10k-token prompt.

---

## 🎯 Phase 2: Programmatic Integration & Structured Outputs
*Transition from web chat wrappers to building backend applications with OpenAI/Anthropic/Google APIs and Pydantic.*

### 📚 Core Concepts
* **Structured Outputs:** Forcing models to return data that conforms strictly to a programmatic schema (like JSON Schema), preventing parsing errors.
* **Context Budgeting:** Calculating token counts before sending requests to avoid context length overflows and control cost.
* **Streaming Responses:** Emitting tokens as they are generated to decrease Time-to-First-Token (TTFT) and improve user experience.

### 🗂️ Categorized Files & Todo Tasks
* 📁 **Target Directory:** `step_1/`
* 📝 **Target Files:** `step_1/chat_v1.py`, `step_1/chat_v2.py`, `step_1/chat_v3.py`

#### ✅ Tasks
- [x] **Task 2.1:** Implement standard API calls using the Chat Completions endpoint.
- [x] **Task 2.2:** Enable streaming completions and output tokens to the terminal in real-time.
- [x] **Task 2.3:** Integrate Pydantic schemas with `.with_structured_output` (or JSON mode) to ensure response formatting.

---

## 🎯 Phase 3: Tool Calling & Basic Agent Loops
*Empower models to execute code, query databases, and interact with the external world.*

### 📚 Core Concepts
* **Tool Calling (Function Calling):** The model doesn't execute functions; it generates JSON arguments specifying which function to run and with what inputs.
* **ReAct (Reason-Act):** A cycle where the model thinks about a query, chooses a tool, receives the output, and iterates until it can formulate a final answer.

### 🗂️ Categorized Files & Todo Tasks
* 📁 **Target Directory:** `step_1/`
* 📝 **Target Files:** `step_1/tool_calls1.py`

#### ✅ Tasks
- [x] **Task 3.1:** Define custom Python functions decorated as `@tool` in LangChain/LangGraph.
- [x] **Task 3.2:** Build a manual low-level tool execution loop (extracting tool calls, invoking them, and feeding `ToolMessage`s back).
- [x] **Task 3.3:** Initialize and stream outputs using a high-level ReAct agent loop framework (`create_agent`).

---

## 🎯 Phase 4: Retrieval-Augmented Generation (RAG)
*Connect LLMs to external document knowledge stores to reduce hallucinations and access private data.*

### 📚 Core Concepts
* **Recursive Chunking:** Splitting documents into smaller, overlapping segments to preserve semantic context.
* **Vector Embeddings:** Converting text chunks into high-dimensional numerical vectors capturing semantic meaning.
* **Vector Search vs. Keyword Search (BM25):** Distance-based similarity (vector) vs. keyword matches (BM25).
* **Hybrid Search:** Fusing Keyword and Vector search outputs using Reciprocal Rank Fusion (RRF).
* **Reranking:** Passing retrieved chunks through a Cross-Encoder model to score actual document-query relevance before feeding them to the LLM.
* **HyDE (Hypothetical Document Embeddings):** Prompting the LLM to generate a hypothetical answer first, embedding that answer, and using it to retrieve actual documents.

### 🗂️ Categorized Files & Todo Tasks
* 📁 **Target Directory:** `step_2/`
* 📝 **Target Files:** `step_2/rag_naive.py`, `step_2/rag_advanced.py`

#### 🟩 Tasks
- [ ] **Task 4.1 (Naive RAG):** Load a local PDF, split it using `RecursiveCharacterTextSplitter`, embed it using `HuggingFaceEmbeddings` (or OpenAI), store it in `ChromaDB`, and implement retrieval.
- [ ] **Task 4.2 (Advanced - Query expansion):** Implement a HyDE pipeline or a multi-query expander to generate multiple query variants.
- [ ] **Task 4.3 (Advanced - Hybrid + Rerank):** Combine BM25 search with vector search, and apply a Cohere or Hugging Face Cross-Encoder reranker (`Flashrank` or `bge-reranker`) to select top 3 chunks.
- [ ] **Task 4.4 (Advanced - Parent-Child Chunking):** Implement a chunking strategy that retrieves smaller sub-chunks for vector matching but sends larger parent chunks to the LLM.

---

## 🎯 Phase 5: Stateful Agents & Orchestration
*Build complex, multi-step, cyclic agentic workflows using state machines.*

### 📚 Core Concepts
* **State Management:** Maintaining a single, centralized dict/pydantic state that is modified as nodes in a graph execute.
* **Conditional Edges:** Dynamic routing decisions made by the graph depending on the current state.
* **Human-in-the-Loop (HITL):** Pausing graph execution to request human input or confirmation (e.g., before writing to database or calling payment API).
* **Short & Long-term Memory:** Session state variables vs. database-persisted profiles across chat threads.

### 🗂️ Categorized Files & Todo Tasks
* 📁 **Target Directory:** `step_3/`
* 📝 **Target Files:** `step_3/agent_langgraph.py`, `step_3/human_in_the_loop.py`

#### 🟩 Tasks
- [ ] **Task 5.1:** Build a custom stateful graph using `StateGraph` in LangGraph with an agent node, a tool node, and a conditional router.
- [ ] **Task 5.2:** Implement session memory persistence using a SQLite or in-memory Checkpointer.
- [ ] **Task 5.3:** Set up a breakpoint in LangGraph that interrupts execution when a certain node is hit, waiting for human approval (`interrupt_before`).

---

## 🎯 Phase 6: Multi-Agent Systems & Collaborations
*Scale single agents into collaborative, specialized multi-agent networks.*

### 📚 Core Concepts
* **Orchestrator-Workers:** A primary agent splits a task into sub-tasks, delegates to specialized agents, and compiles their inputs.
* **Supervisor Pattern:** A central supervisor decides which agent should take action next, terminating when the goal is achieved.
* **Hierarchical Teams:** Nesting multi-agent graphs inside other graphs as subgraph nodes.

### 🗂️ Categorized Files & Todo Tasks
* 📁 **Target Directory:** `step_4/`
* 📝 **Target Files:** `step_4/multi_agent_supervisor.py`, `step_4/multi_agent_collaboration.py`

#### 🟩 Tasks
- [ ] **Task 6.1 (Supervisor Routing):** Implement a LangGraph supervisor that delegates user queries dynamically (e.g., routing math queries to a Coder agent, and text queries to a Writer agent).
- [ ] **Task 6.2 (Collaboration):** Build a two-agent system (Researcher and Editor) that co-write a report. They must share a state and pass control back and forth.

---

## 🎯 Phase 7: Evaluation, Observability & Guardrails
*Shift from subjective testing ("vibe checks") to rigorous automated quality and safety metrics.*

### 📚 Core Concepts
* **LLM-as-a-Judge:** Using a frontier model to grade outputs against specific rubrics.
* **Ragas Evaluation Metrics:**
  * *Faithfulness:* Is the answer based strictly on the retrieved context? (Fact-checking).
  * *Answer Relevance:* Does the answer match the question?
  * *Context Recall:* Did the retriever find all the necessary info?
* **Adversarial Defenses:** Preventing jailbreaking, prompt injections, and data leakage.
* **Moderation & Guardrail Frameworks:** Intercepting inputs and outputs (e.g., Llama Guard or custom regex classification).

### 🗂️ Categorized Files & Todo Tasks
* 📁 **Target Directory:** `step_5/`
* 📝 **Target Files:** `step_5/eval_ragas.py`, `step_5/guardrails_defense.py`

#### 🟩 Tasks
- [ ] **Task 7.1:** Instrument your LLM pipeline with `LangSmith` (or Arize Phoenix) to trace call stacks, latencies, and token costs.
- [ ] **Task 7.2:** Construct an evaluation dataset of 20 Q&A pairs and use `Ragas` to measure faithfulness and answer relevance.
- [ ] **Task 7.3:** Write defensive wrapper functions implementing XML Tag Shielding and Sandwiching to block prompt injection attempts.

---

## 🎯 Phase 8: Local Inference, Quantization & Fine-Tuning
*Reduce dependencies on commercial APIs by running, optimizing, and fine-tuning open-weights models.*

### 📚 Core Concepts
* **Local Engines (Ollama / vLLM):** Systems optimized for running LLMs on local hardware or dedicated cloud servers.
* **Quantization:** Lowering numerical precision (e.g., FP16 to INT4/INT8) to reduce model VRAM footprint (GGUF, AWQ formats).
* **PEFT (LoRA / QLoRA):** Parameter-Efficient Fine-Tuning. Freezes base weights and trains low-rank adapter matrices, requiring far less compute.
* **Instruction Fine-Tuning:** Training a base model to follow commands and act as a conversational assistant.

### 🗂️ Categorized Files & Todo Tasks
* 📁 **Target Directory:** `step_6/`
* 📝 **Target Files:** `step_6/local_inference.py`, `step_6/finetuning_pipeline.ipynb`

#### 🟩 Tasks
- [ ] **Task 8.1:** Download and run a model locally using Ollama, and connect to it using LangChain's `ChatOllama`.
- [ ] **Task 8.2:** Set up a local text generation pipeline using Hugging Face `transformers` and a quantized model (e.g., Llama-3-8B-Instruct-GGUF).
- [ ] **Task 8.3:** Write a script or Jupyter Notebook implementing a PEFT/LoRA fine-tuning training loop on a custom Q&A dataset using TRL (`SFTTrainer`).

---

## 🎯 Phase 9: Enterprise Capstone Project
*Build a fully realized corporate application integrating all components.*

### 🚀 Project Goal: "The Collaborative Enterprise Knowledge Engine"
Build a system that parses multiple document types, collaborates across specialized agents, self-corrects on failure, and offers a clean UI.

#### 🏗️ Architecture Requirements
1. **Frontend:** Build a clean dashboard interface using **Streamlit** or **FastAPI + React**.
2. **Ingestion Engine:** A pipeline that ingests CSV datasets and PDF manuals.
3. **Agent 1 (SQL Database Agent):** Converts text queries to SQL commands, runs them against a database, and returns results.
4. **Agent 2 (RAG Search Agent):** Queries the PDF vector store using hybrid search and reranking.
5. **Supervisor Agent:** Orchestrates incoming tasks between SQL and RAG agents, checking their outputs for accuracy.
6. **Observability:** Track all executions in real-time on LangSmith.

#### 📁 Target Directory
* 📁 `capstone/`