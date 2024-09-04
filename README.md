# GRAKKEN Github-Repo-Analyser

## What it does:
Gives an overview of a Github repository, providing summaries of the important-looking codes.


## How it does:
#### Main Feature:
1. GRAKKEN reads through the directory structure.
2. GRAKKEN ranks files by importance based on factors like file name and contents (e.g. classes, functions, README, main code files).
3. GRAKKEN then uses an LLM (like GPT-4 via LangChain) to summarize the most important files.

#### Additional Features: 
- optional query / further analyses and summarises each file in the repo in the order of importance
- Recursive Code Analysis: analysis version of `recursive install` (git submodules) Allowing deeper analysis based on user queries, such as analyzing a specific file in detail or following dependencies between files.

## Components:
**GitHub API** to pull the repo structure.
**Heuristics** to rank files (e.g., README, main.py, file size, and LOC).
**OpenAI GPT API** for file content summarization.
**Custom Query Interface** to dive deeper into specific files based on ranking.

