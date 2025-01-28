Don't mind this project - renamed to Gitsum. It's a draft dump but I'll incorporate some other APIs into a separate repo and service it live sometime soon.


remember to join developer program once MVP built
https://docs.github.com/en/get-started/exploring-integrations/github-developer-program

# GRAKKEN Github-Repo-Analyser (v0.1) (Beta)


A lightweight, user-friendly platform that analyzes GitHub repositories, generates summaries of key files, and makes the repository easy to understand

name ideas?:
grakken
gitme
gitty
gitsum


(Landing Page Design)

"Git made easy and readable. Grakken helps you understand repositories right away with AI summary and analysis."

```plaintext
[Headline] 
"Git made easy and readable. Grakken helps you understand repositories right away with AI summary and analysi"

[Input Field]  
Paste your repository URL here: [____________________] [Analyse]
```

## How to use

Visit the link below:
[]
Paste the GitHub repository URL and click 'Analyze'.
Our backend then fetches repository data via GitHub API and ranks files by importance.
Our AI (GPT 4.0) summarizes key files, and the results are displayed in an organized, easy-to-navigate layout.
You can now view the summaries of the code, with the option to explore each summary in more detail.

(How to Use Video)

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

Using: viteJS, React, TailwindCSS (see package.json for more dependencies), [Preline UI](https://preline.co/index.html)
Hosted: https://app.netlify.com/teams/in-c0/sites
Domain: https://resonant-starburst-ce7ed2.netlify.app
Thanks to: https://dub.co/ and https://github.com/RiteshKumarShukla/AI-Summarizer/tree/main  for website design inspiration


To pull the latest changes and update submodules:

```bash
git pull --recurse-submodules
git submodule update --remote
```
This ensures that the submodule is updated to the latest commit as per the parent repository.

If the submodule isn’t initialized yet:
```bash
git submodule init
git submodule update --remote
```

In `services/article.js`, the current setup is using **Redux Toolkit Query** (createApi and fetchBaseQuery) to make API requests to a service hosted on RapidAPI. 
The API will extract repository data from URL and summarise the key files.

--

What other features would you like to see? Got any feedback / bug report? Send message at ___

FINALLY! Frontend and backend are connected on vercel deployment! (separate repo, each has its own deployment, backend is a submodule, vercel.json is used to refer to the backend URL)
