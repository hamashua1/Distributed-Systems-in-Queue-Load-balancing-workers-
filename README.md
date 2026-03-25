# Distributed-Systems-in-Queue-Load-balancing-workers-

1️⃣ Client → API
2️⃣ Nginx forwards to Express instance
3️⃣ Express → pushes job into Redis
4️⃣ Express → responds immediately to client
5️⃣ Worker → pulls job from Redis
6️⃣ Worker → processes job
7️⃣ Worker → stores final result in Redis
8️⃣ Client → checks for job result


 ┌──────────────────────────────────────────────┐
 │                  CLIENTS                     │
 │  (Web, Mobile, Other Apps, API Consumers)    │
 └──────────────────────────────────────────────┘
                     │
                     ▼
 ┌──────────────────────────────────────────────┐
 │                   NGINX                      │
 │    Load Balancer / Reverse Proxy             │
 │    - Handles 1M+ requests                    │
 │    - Distributes to multiple Express apps    │
 └──────────────────────────────────────────────┘
      │                │                │
      ▼                ▼                ▼
 ┌──────────┐   ┌──────────┐    ┌──────────┐
 │ EXPRESS  │   │ EXPRESS  │    │ EXPRESS  │
 │ 3001     │   │ 3002     │    │ 3003     │
 └──────────┘   └──────────┘    └──────────┘
      │                │                │
      └────────────┬───┴───────────────┘
                   ▼
            ┌─────────────┐
            │   REDIS     │
            │   QUEUE     │
            │ - Stores jobs
            │ - Stores job state
            │ - Stores job result
            └─────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
 ┌─────────────┐     ┌─────────────┐
 │  WORKER 1   │     │  WORKER 2   │
 │ - Pulls job │     │ - Pulls job │
 │ - Processes │     │ - Processes │
 │ - Saves     │     │ - Saves     │
 │   result    │     │   result    │
 └─────────────┘     └─────────────┘
                   │
                   ▼
          ┌────────────────┐
          │ EXPRESS API    │
          │  /status/:id   │
          │  returns job   │
          │  result to     │
          │  client        │
          └────────────────┘
