# 3308

Team Number: `012-2`

App Name: `Pillarboxd`

Team Members:

| **Name**         | **Email**               | **GitHub**  |
|------------------|-------------------------|------------ |
| Ahmed Alrubeh    | <ahal8899@colorado.edu> | artfork     |
| Alexandra Ivanova| <aliv6583@colorado.edu> | Inline-Nova |
| Melody Kuoch     | <meku5835@colorado.edu> | mkuoch      |
| Cameron Malinis  | <cama3062@colorado.edu> | CamCM4      |
| Max Malkin       | <mama5162@colorado.edu> | maxmalkin   |
| Kordell Schneider| <kosc1973@colorado.edu> | Kordell-Sch |

---

## Application Description

Our application is a cross-platform TV show tracking and discovery tool designed to help users organize, analyze and discover television content across multiple streaming services. While existing platforms like Letterboxd focus primarily on movies and most streaming platforms only track viewing activity within their own ecosystems, our application bridges these gaps by allowing users to track their progress on TV shows regardless of where they are streaming them. 

A large functionality of our application centers around recommendations. We focus on two primary buckets to provide these recommendations: user activity and rating systems filtered by the streaming services the user is subscribed to. Users will be able to mark episodes as watched, keep track of where they left off in a series, and view their watching history in one centralized location, eliminating the need to manually remember progress across multiple platforms. The platform will provide personalized recommendations based on viewing history, episode ratings, and the streaming services a user subscribes to. By incorporating a user’s past reviews and their available streaming platforms, the system can suggest shows that are both relevant to their tastes and accessible to them immediately. This makes the application not only a tracking tool but also a discovery engine that helps users find new shows to watch without needing to search through multiple streaming services individually.

---

## Running the Project

Prerequisites:

- [ ] Node.js
- [ ] pnpm

```bash
cd ProjectSourceCode
pnpm install
# Create server/.env with needed keys
pnpm migrate:apply     # optionally apply migrations 
pnpm dev               # runs server and client together
```

Other useful scripts:

- `pnpm server` / `pnpm client` — run one side only
- `pnpm test:server` — Jest tests
- `pnpm lint` / `pnpm format` — Biome check/format
- `pnpm migrate:create` — scaffold a new migration
