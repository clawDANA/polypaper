# PolyPaper - Polymarket Paper Trading Agent Swarm

## Overview

PolyPaper is an experimental multi-agent system designed to analyze Polymarket events, aggregate diverse signals (News, Sentiment, Technicals), and execute "paper trades" to validate strategies before risking real capital.

## Architecture

The system follows a "Council of Experts" architecture:

1.  **Orchestrator (alephBeth):**
    *   Fetches active markets from Polymarket API.
    *   Delegates analysis tasks to specialized Sub-Agents.
    *   Synthesizes reports into a `Trade Decision` (Buy/Sell/Hold).
    *   Logs performance to `polypaper/data/pnl.json`.

2.  **Sub-Agents (Gemini Swarm):**
    *   **NewsHawk:** Qualitative analysis of news/events related to the market.
    *   **SentimentSurfer:** Crowd sentiment analysis (Twitter/Reddit proxy).
    *   **ProbCalc:** Probability estimator based on historical base rates.
    *   **RiskManager:** Portfolio sizing and "Veto" power.

## Directory Structure

*   `agents/`: Prompts and logic for sub-agents.
*   `data/`: Market data snapshots and PnL logs.
*   `logs/`: Verbose execution logs.
*   `main.js`: Entry point.

## Status

*   [x] Initial Setup
*   [ ] Market Fetcher (Polymarket API)
*   [ ] Sub-Agent Integration (sessions_spawn)
*   [ ] Paper Trading Logic
*   [ ] Reporting
