# 🛡️ Modiva Argus
Argus is the codename for a series of microservices working together to keep [Modiva Launcher](https://modiva-launcher.xyz/) safe and easier to maintain. It combines a series of AI and Rule-Based features for moderation, monitoring, and ease of development.

We've made this system open source to show what it takes to keep a Minecraft Launcher safe and functional, while showing how we've implemented AI to simplify repetitive tasks that would take time.

## Overview
As of right now Argus handles basic server moderation, and monitoring. More features are set to come in the future.

### Server Moderation
To keep our server list safe we are running a cron job to check for obviously spam or private servers that should not be available to the public. This is the basic logic we are using:
```
┌──────────────────────────────────────────────────────────┐
│                  CRON JOB (Every 10 Mins)                │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                  INGESTION & HYDRATION                   │
│         (Fetch Newly Edited / Updated Servers)           │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                   AI ANALYSIS LAYER                      │
│        (LLM Evaluation of Metadata & Content)            │
└───────────┬────────────────┬────────────────────┬────────┘
            │                │                    │
            │                │                    │
            ▼                ▼                    ▼
    ┌──────────────┐  ┌──────────────┐    ┌──────────────┐
    │  LABEL: SPAM │  │LABEL: PRIVATE│    │ LABEL: SAFE  │
    └──────┬───────┘  └──────┬───────┘    └──────┬───────┘
           │                 │                   │
           ▼                 ▼                   ▼
    ┌──────────────┐  ┌──────────────┐    ┌──────────────┐
    │    ACTION:   │  │    ACTION:   │    │    ACTION:   │
    │   SUSPEND    │  │ SET PRIVATE  │    │    IGNORE    │
    └──────────────┘  └──────────────┘    └──────────────┘
```

Even though this system is mostly accurate, we still keep an eye on our Server List to make sure that every server is safe enough to be displayed. This is just the first layer of moderation (which is enough for most spam servers made in Modiva)

### Stats Monitoring
We've also built a simple monitoring service so we can track live stats & growth. Here is all the info we are currently fetching:
We've also built a simple monitoring service so we can track live stats & growth. Here is all the info we are currently fetching:
| Category | Metric | Description |
| :--- | :--- | :--- |
| **Connection** | Status | Current operational state (Online/Offline). |
| | Latency | Network response time in milliseconds. |
| | Uptime | Continuous system run-time. |
| **Moderation** | Next Scan | Time remaining until the next AI audit. |
| | Interval | Frequency of the automated scan (10m). |
| **Inventory** | Total Servers | Total count of servers in the database. |
| | Listed Servers | Servers approved and visible to the public. |
| | Maintenance | Servers that are accessible only with a private code. |
| | Suspended | Servers flagged as SPAM. |

### Technologies Used
Argus is using [Bun](https://bun.com/) under the hood for performance and low resources usage. We are also relying on other libraries such as [Discord.JS](https://discord.js.org/docs/packages/discord.js/14.25.1) for communicating with the Discord API and [Google GenAI SDK](https://ai.google.dev/gemini-api/docs/migrate) for our AI features.

## Modiva Launcher
This entire project is meant to serve the needs of the [Modiva Launcher](https://modiva-launcher.xyz/) Launcher. Make sure to check it out before starting your next Minecraft Server!
