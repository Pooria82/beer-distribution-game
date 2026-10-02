# System Architecture & Technical Design

## 1. Architectural Philosophy: Clean / Hexagonal (Ports & Adapters)

The Beer Distribution Game application is engineered using strict **Hexagonal Architecture (Ports and Adapters)** principles combined with **Domain-Driven Design (DDD)**. The system is partitioned into concentric layers with strict inward-pointing dependency rules:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Presentation Layer (Client)                     │
│  - React 19 SPA (Vite + TypeScript)                                    │
│  - Multi-Tab Isolation (sessionStorage + URL tokens)                  │
│  - SCADA Ergonomics: Live Supply Chain Canvas, Bullwhip Oscilloscope   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ WebSocket (ws) + REST API
┌───────────────────────────────────▼────────────────────────────────────┐
│                    Infrastructure Adapters (Server)                    │
│  - Web Server: Express (Single-port static bundle + API)               │
│  - Realtime: WebSocketGateway (ws, 30s heartbeat keepalive)            │
│  - Persistence: SqliteGameRepository (better-sqlite3 with WAL mode)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Ports (Interfaces)
┌───────────────────────────────────▼────────────────────────────────────┐
│                       Application Services Layer                       │
│  - GameService (Room lifecycle, AsyncMutex, turn advancement)          │
│  - RoomManager (In-memory socket registry, graceful takeover)          │
│  - Ports: IGameRepository, PlayerSession                              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Pure Domain
┌───────────────────────────────────▼────────────────────────────────────┐
│                    Domain Core (src/core/)                             │
│  - Zero runtime dependencies, pure TypeScript                         │
│  - Entities: SupplyChainRole                                          │
│  - Aggregate Root: BeerGameEngine                                     │
│  - Fog-of-War: StateSanitizer                                         │
│  - Mathematical Invariants & Cost Model                               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Supply Chain Topology & Bidirectional Flow

The classic MIT Beer Distribution Game models a 4-tier decentralized serial supply chain:

```mermaid
flowchart LR
    Customer([End Customer]) -->|Orders| Retailer[Retailer Node]
    Retailer -->|Orders| Wholesaler[Wholesaler Node]
    Wholesaler -->|Orders| Distributor[Distributor Node]
    Distributor -->|Orders| Factory[Factory Node]
    Factory -->|Orders| BreweryRaw[Unlimited Raw Material]

    BreweryRaw -.->|Shipments| Factory
    Factory -.->|2-Round Delay| Distributor
    Distributor -.->|2-Round Delay| Wholesaler
    Wholesaler -.->|2-Round Delay| Retailer
    Retailer -.->|Instant Fulfillment| Customer

    classDef node fill:#1e293b,stroke:#06b6d4,stroke-width:2px,color:#f8fafc;
    classDef edge fill:none,stroke:#f59e0b,stroke-width:2px;
    class Retailer,Wholesaler,Distributor,Factory node;
```

### Flow Directionality Invariants:
1. **Demand / Orders Flow UPSTREAM (Left to Right):**
   - End Consumer $\to$ Retailer $\to$ Wholesaler $\to$ Distributor $\to$ Factory.
2. **Goods / Shipments Flow DOWNSTREAM (Right to Left):**
   - Factory $\to$ Distributor $\to$ Wholesaler $\to$ Retailer $\to$ End Consumer.
3. **Pipeline Delays (2-Round Lag):**
   - Shipped orders travel through a 2-round shipping delay pipeline queue (`shippingQueue: [round_n_minus_2, round_n_minus_1]`).
   - The Factory's upstream supplier is infinite and unrestricted, always fulfilling the Factory's previous order with standard 2-round delay.

---

## 3. Concurrency Model & Lockstep Barrier Synchronization

In multiplayer turn-based games, the primary concurrency hazard is the **Atomic 4th Order Race Condition**: when all four players submit orders simultaneously, multiple socket handlers might concurrently attempt to advance the round, resulting in duplicate cost assessments, skipped rounds, or corrupted history.

To guarantee complete race-condition safety, `GameService` implements a room-level asynchronous mutex (`AsyncMutex`):

```mermaid
sequenceDiagram
    autonumber
    actor P1 as Player 1 (Retailer)
    actor P2 as Player 2 (Wholesaler)
    actor P3 as Player 3 (Distributor)
    actor P4 as Player 4 (Factory)
    participant S as Server Gateway
    participant M as Room Mutex
    participant E as BeerGameEngine
    participant DB as SQLite WAL

    Note over P1,P4: Round 1 (All nodes occupied)
    P1->>S: SUBMIT_ORDER(4)
    S->>M: runExclusive()
    M->>E: submitOrder('retailer', 4)
    M->>DB: save(engine)
    S-->>P1: Broadcast: Ready status updated

    P2->>S: SUBMIT_ORDER(4)
    P3->>S: SUBMIT_ORDER(4)

    Note over P4: Player 4 submits 4th order
    P4->>S: SUBMIT_ORDER(4)
    S->>M: runExclusive()
    M->>E: submitOrder('factory', 4)
    Note over E: Barrier Satisfied! All 4 submitted.<br/>1. Shipments arrive<br/>2. Orders arrive<br/>3. Shipments dispatched<br/>4. Costs assessed<br/>5. Advance round: currentRound = 2
    M->>DB: save(engine) (Atomic Write-Through)
    S-->>P1: Broadcast ROUND_ADVANCED (Round 2)
    S-->>P2: Broadcast ROUND_ADVANCED (Round 2)
    S-->>P3: Broadcast ROUND_ADVANCED (Round 2)
    S-->>P4: Broadcast ROUND_ADVANCED (Round 2)
    S-->>P1: Broadcast STATE_SYNC (Sanitized PlayerView)
    S-->>P2: Broadcast STATE_SYNC (Sanitized PlayerView)
    S-->>P3: Broadcast STATE_SYNC (Sanitized PlayerView)
    S-->>P4: Broadcast STATE_SYNC (Sanitized PlayerView)
```

### Mutex Guarantees:
- **Lock Acquisition:** `mutex.runExclusive(async () => { ... })` ensures that only one socket event can mutate a specific room's state at any instant.
- **Idempotency Lock:** `hasSubmittedThisRound` boolean lock prevents the same player from submitting multiple orders within the same round.
- **Write-Through Persistence:** The game state is written to SQLite inside the mutex lock before the round broadcast is transmitted, guaranteeing 100% durable consistency.

---

## 4. Information Hiding & Server-Side Fog of War

In compliance with the MIT Beer Distribution Game design, players must never possess real-time intelligence regarding other nodes' inventories, backlogs, costs, or order amounts.

### Fog-of-War Enforcement Architecture:
The boundary is enforced at the server domain boundary by `StateSanitizer.ts`:
1. **Raw State Isolation:** The complete `GameState` entity is strictly confined to the backend server process and database. It is **never** serialized over the network.
2. **Individualized Projection:** When a state sync is required, `StateSanitizer.sanitize(rawState, role, connectedRoles)` projects an individualized `PlayerView` for that specific role.
3. **Redaction Matrix:**
   - **Own Node:** Full visibility into inventory, backlog, arriving shipment, incoming order, shipped amount, round cost, total cost, and past history.
   - **Opponent Nodes:** Redacted to a simple `PeerSummary` revealing ONLY `{ role, isOccupied, hasSubmittedThisRound, isConnected }`.
   - **End Game Reveal:** Full aggregate metrics and comparative cost breakdowns are only transmitted once `status === 'completed'` (Round 20 finalized).

---

## 5. Session Isolation & Multi-Tab Reviewer UX

Evaluators typically inspect multi-player systems by opening 4 browser tabs on the same computer (`localhost:3000`). Traditional web applications store sessions in `localStorage` or root cookies, causing tab collisions where each new tab overwrites the identity of the previous one.

### Multi-Tab Scoping Architecture:
1. **`sessionStorage` Partitioning:** Each browser tab maintains an isolated `sessionStorage` scope. Opening a new tab creates a fresh storage container.
2. **URL Parameter Fallback:** Room links and 1-Click Launch links encode context parameters (e.g. `http://localhost:3000/?room=GAME-XYZ&role=retailer`), allowing seamless direct station initialization.
3. **Session Reconnection:** When a tab is refreshed, `useGameSocket` retrieves the cryptographic token (`tok_...`) from `sessionStorage` and sends `{ type: "RECONNECT", playerToken }`, immediately restoring station control.
