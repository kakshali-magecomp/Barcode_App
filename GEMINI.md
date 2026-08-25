# GEMINI.md | Universal Antigravity Optimization Guide

## 🛑 Context & Model Optimization
* **Direct Execution:** Skip all introductory prose, conversational filler, and concluding summaries. Output only code, commands, or answers.
* **Maximize Prompt Caching:** Keep responses concise. Short, structured interactions allow the engine to cache the system prompt and code state efficiently, lowering token costs.
* **Incremental Edits:** Present changes using minimal, highly targeted code blocks or diffs. Avoid reprinting long, unmodified sections of a file.

## 🤖 Orchestration & Subagent Economy
* **Minimize Dynamic Subagents:** Do not automatically delegate to child agents or spawn subagents for minor task loops, local debugging, or single-file editing. Execute directly in the main thread.
* **Shallow Traversal:** Use targeted search or file inspection instead of dumping entire directory states. Never execute recursive file reads if specific paths are known.
* **No Redundant Inspects:** Do not re-examine or `cat` code files that have already been loaded into the active environment history unless a tool execution has modified them.

## ⚙️ Execution Flow & Tool Safety
* **Silent Command Execution:** Run required build, test, and shell tools cleanly. Do not explain the terminal command beforehand unless explicitly asked or if the action is highly destructive.
* **Pivot on Error:** If a terminal tool or compiler returns an error, halt further execution blocks immediately. Fix the specific error trace before proposing broader logic modifications.
* **Atomic /goal Progress:** When executing a multi-file task via automated execution, progress incrementally. Verify each file modification before proceeding to subsequent modules.
