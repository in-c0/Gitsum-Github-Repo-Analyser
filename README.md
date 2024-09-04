# GRAKKEN Github-Repo-Analyser (v0.1) (Beta)

(Landing Page Design)

"Git made easy and readable. Grakken helps you understand repositories right away with AI summary and analysis."

```plaintext
[Headline] 
"Git made easy and readable. Grakken helps you understand repositories right away with AI summary and analysi"

[Input Field]  
Paste your repository URL here: [____________________] [Analyse]
```




## What it does:
Gives an overview of a Github repository, providing summaries of important files.

## How to use:
List of Features


---
# Roadmap:

## Features to add
List of features

## How it currently works:
#### Main Feature:
1. GRAKKEN reads through the directory structure.
2. GRAKKEN ranks files by importance based on factors like file name and contents (e.g. classes, functions, README, main code files).
3. GRAKKEN uses GPT3.5 to summarize the most important files.

## Pipeline changes:
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


Hosted: https://app.netlify.com/teams/in-c0/sites
Domain: https://resonant-starburst-ce7ed2.netlify.app
Thanks to: https://dub.co/ and https://github.com/RiteshKumarShukla/AI-Summarizer/tree/main  for website design inspiration


--

What other features would you like to see? Got any feedback / bug report? Send message at ___
