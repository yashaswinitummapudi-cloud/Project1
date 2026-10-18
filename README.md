# NEXUS-OPS // Autonomous Agentic AI Workflow Engine
### *Autonomous Multi-Agent AI Solution for Enterprise Exception Resolution & Fragmented Workflow Automation*

[![Architecture: Frontend + Backend](https://img.shields.io/badge/Architecture-Frontend%20%2B%20Backend-06B6D4?style=flat-square)](#architecture-separation)
[![LLM: Google Gemini](https://img.shields.io/badge/AI%20LLM-Google%20Gemini%202.5%20Flash-8B5CF6?style=flat-square)](#ai-llm-integration)
[![Agents: 6 Autonomous Swarm](https://img.shields.io/badge/Agents-6%20Specialized%20Roles-10B981?style=flat-square)](#the-agent-swarm)
[![Security: Human--In--The--Loop](https://img.shields.io/badge/Guardrails-Human--In--The--Loop%20(HITL)-F43F5E?style=flat-square)](#human-in-the-loop-hitl-guardrails)

---

## 1. Real-World Business Problem Solved

Modern enterprises across supply chain, eCommerce, and SaaS handle thousands of operational exceptions each week:
* **Vendor Invoice vs Warehouse Receiving Discrepancies** (e.g. 80 units billed, 72 received on dock)
* **SLA Uptime & Outage Penalty Calculations** (e.g. 99.12% actual uptime vs 99.95% committed)
* **High-Risk Financial Routing Changes & BEC Wire Fraud Anomalies**

### Core Inefficiencies
1. **Repetitive Decision-Making**: Human operators repeat identical cognitive steps: extracting IDs, verifying PO quantities against dock logs, checking weight variance across freight waybills, calculating mathematical penalties, and applying Delegation of Authority (DoA) limits.
2. **Fragmented Workflows**: Data resides in 5+ disconnected enterprise silos:
   * **SAP / NetSuite ERP** (Purchase Orders, Line Items, Dock Scans)
   * **DHL / FedEx Freight Telemetry** (Weight tracking, bills of lading, in-transit incident logs)
   * **Stripe & Corporate Bank Ledgers** (Vendor master records, routing updates, wire history)
   * **Contract & Policy Handbooks** (SLA penalty clauses, auto-approval thresholds)
   * **Zendesk / CRM Ticketing** (Dispute emails and customer claims)

**Nexus-Ops** replaces slow, error-prone manual triage (averaging 35–45 minutes per ticket) with an autonomous, guardrailed multi-agent swarm that resolves cases in **under 3 seconds**.

---

## 2. Architecture & Clear Separation of Concerns

```
Project1/
├── package.json              # Unified root scripts (npm run dev)
│
├── backend/                  # === SERVER & AGENTIC LOGIC ===
│   ├── server.js             # Express REST & Server-Sent Events (SSE) streaming API
│   ├── agents/
│   │   └── agentSwarm.js     # Swarm Orchestrator (Planning, Deliberation, State transitions)
│   ├── tools/
│   │   └── enterpriseTools.js# Real tools for SAP ERP, DHL Telemetry, Banking, & Policies
│   ├── services/
│   │   └── llmService.js     # Google Gemini LLM API integration with cognitive simulation fallback
│   └── data/
│       ├── enterpriseDb.js   # Simulated enterprise silos (SAP, DHL, Stripe, Policies)
│       └── cases.js          # Pre-configured enterprise test scenarios
│
└── frontend/                 # === USER INTERFACE & VISUALIZATION ===
    ├── index.html            # Semantic HTML5 layout (Glassmorphism Dark UI)
    ├── vite.config.js        # Vite dev server with proxy to backend (/api -> localhost:5000)
    └── src/
        ├── main.js           # Client orchestrator (SSE stream listener, state, modals)
        └── styles/
            ├── design-tokens.css # Curated HSL color palette, typography, shadows, gradients
            └── components.css    # Interactive DAG, Swarm Arena chat, Reasoning terminal, Modals
```

### 🔹 Backend Responsibilities
* **Autonomous Orchestration**: Manages the multi-agent lifecycle (Plan $\rightarrow$ Ingest $\rightarrow$ Audit $\rightarrow$ Risk $\rightarrow$ Policy $\rightarrow$ Deliberate $\rightarrow$ Settle).
* **Executable Tool Calling**: Interacts with simulated and live enterprise systems (`queryPurchaseOrder`, `fetchCarrierTelemetry`, `verifyVendorBanking`, `calculateSlaPenalty`, `createCreditMemo`).
* **AI LLM Integration**: Generates structured reasoning and cognitive plans using Google Gemini (`gemini-2.5-flash`), backed by a built-in zero-latency cognitive engine for turnkey demonstration.
* **Real-time Event Streaming**: Broadcasts live thoughts, tool calls, and DAG node states over Server-Sent Events (SSE).
* **State & Guardrail Persistence**: Enforces enterprise safety thresholds and freezes execution when Human-In-The-Loop review is required.

### 🔹 Frontend Responsibilities
* **Visual Directed Acyclic Graph (DAG)**: Live-rendering nodes that change color and pulse through `PENDING`, `RUNNING`, `COMPLETED`, and `PAUSED_HITL` states.
* **Cognitive Reasoning Stream**: Terminal-style live feed displaying internal agent monologues, tool execution arguments, results, and confidence scores.
* **Multi-Agent Collaboration Arena**: Interactive mesh communication window where agents challenge assumptions, exchange telemetry, and achieve consensus.
* **Human-In-The-Loop (HITL) Modal**: Clean executive decision interface allowing managers to review risk triggers, adjust directives, and authorize/reject settlements.
* **Enterprise Silos Explorer**: Tabbed inspector revealing raw records across SAP ERP, DHL Tracking, Stripe, and Policies before and after reconciliation.

---

## 3. The Multi-Agent Swarm

| Agent Role | Persona & Responsibility | Executable Tools Called |
| :--- | :--- | :--- |
| **🧠 OrchestratorAgent** | Lead Planner; deconstructs exceptions into an adaptive dependency graph. | `dispatch_dag_plan` |
| **📥 TriageAgent** | Ingestion & Entity Normalizer; parses unstructured tickets and extracts PO/Invoice IDs. | `normalize_entities` |
| **🔍 AuditMatcherAgent** | ERP & Logistics Detective; verifies receiving dock counts against carrier weight telemetry. | `queryPurchaseOrder`, `getDockReceipt`, `fetchCarrierTelemetry` |
| **🛡️ RiskSentinelAgent** | Fraud & Financial Security Sentinel; checks bank routing updates, IP origin, and BEC vectors. | `verifyVendorBanking` |
| **⚖️ PolicyArbiterAgent** | Governance & SLA Arbiter; evaluates DoA spending limits, penalty formulas, and compliance rules. | `calculateSlaPenalty`, `checkPolicyGuardrails` |
| **⚡ SettlementAgent** | Financial Execution Agent; issues SAP credit memos and dispatches formal CRM resolutions. | `createCreditMemo`, `dispatchStakeholderResolution` |

---

## 4. Pre-Configured Enterprise Scenarios

1. **`CASE-1205` — Damaged Transit Carton Auto-Credit ($1,450)**:
   * *Status*: 100% Fully Autonomous Settlement (Zero Human Intervention).
   * Amount is below the $2,500 DoA limit; agent automatically matches the receiving scan, generates SAP Credit Memo, and posts to ledger.
2. **`CASE-8902` — Short-Shipment Discrepancy ($11,600)**:
   * *Status*: Pauses for Manager / VP Signoff.
   * Vendor billed for 80 laptops; warehouse dock scanner logged 72. Carrier weight telemetry confirms 19.8kg loss in transit at Indianapolis hub. Exceeds $2,500 threshold $\rightarrow$ triggers HITL review.
3. **`CASE-4119` — Cloud Infrastructure SLA Outage Claim ($7,062)**:
   * *Status*: Contract Clause Extraction & Penalty Formula Calculation.
   * 6.2 hours outage (99.12% actual uptime vs 99.95% committed). Swarm applies 10x contractual penalty formula and structures credit adjustment.
4. **`CASE-7721` — High-Risk Banking Routing Change ($42,000)**:
   * *Status*: Critical BEC Fraud Quarantine.
   * Vendor bank routing changed 4 days prior to invoice submission; invoice uploaded from a Tor exit node. Swarm halts execution, flags composite risk score 0.94, and requires executive security signoff.
5. **➕ Custom Case**:
   * Users can enter any arbitrary business dispute or procurement invoice directly in the UI to watch the swarm plan, reason, and reconcile it live.

---

## 5. Quickstart & Running Locally

### Prerequisites
* Node.js (v18+ or v24+)
* npm (v9+)

### Installation & Launch
From the project root:

```bash
# 1. Install root dependencies (concurrently)
npm install

# 2. Run both Backend & Frontend with a single command
npm run dev
```

* **Frontend UI**: [http://localhost:5173/](http://localhost:5173/)
* **Backend API**: [http://localhost:5000/](http://localhost:5000/)

*(Alternatively, you can run them in separate terminals via `npm run dev:backend` and `npm run dev:frontend`)*.

---

## 6. Supabase Database Integration

Nexus-Ops uses **Supabase** for enterprise data persistence, audit trails, and live case synchronization across the agentic swarm.

### Dual-Layer Supabase Architecture
1. **Backend Database Layer** (`backend/services/supabaseService.js`):
   - Secure server-side connection via Service Role / Anon key.
   - Fetches and stores exception cases (`nexus_cases`).
   - Persists audited settlement memos (`nexus_settlement_memos`) with official SAP Credit Memo IDs.
   - Streams forensic agent execution traces (`nexus_audit_logs`).
2. **Frontend Realtime Layer** (`frontend/src/services/supabaseClient.js`):
   - Direct browser connection via `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   - Realtime channel listener for `postgres_changes` on `nexus_cases` (auto-refreshes queue without page reload).
3. **Resilient Local Fallback**:
   - If Supabase credentials are placeholder or pending, the system seamlessly runs in local resilient memory mode with zero crashes.

### Environment Files Setup
* **`backend/.env`**:
  ```env
  PORT=5000
  NODE_ENV=development

  SUPABASE_URL=https://your-project-id.supabase.co
  SUPABASE_ANON_KEY=your-supabase-anon-key
  SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
  SUPABASE_SCHEMA=public

  GEMINI_API_KEY=
  LLM_MODEL=gemini-2.5-flash
  ```

* **`frontend/.env`**:
  ```env
  VITE_SUPABASE_URL=https://your-project-id.supabase.co
  VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
  VITE_API_BASE_URL=/api
  VITE_APP_ENV=development
  ```

### Database Schema Setup (1-Click SQL)
Run the bundled `supabase_schema.sql` in your **Supabase Dashboard $\rightarrow$ SQL Editor**:
* Creates `nexus_cases`, `nexus_settlement_memos`, `nexus_audit_logs`, and `nexus_enterprise_silos`.
* Configures Row Level Security (RLS) policies for secure reads/writes.
* Pre-seeds initial real-world test cases.

---

## 7. AI LLM Integration (Google Gemini)

* **Out-of-the-box Ready**: If no API key is supplied, Nexus-Ops runs the high-fidelity **Cognitive Simulation Engine**, reproducing realistic multi-step deliberation, tool calls, and DAG transitions without requiring an API key.
* **Live Gemini Calls**:
  1. Click the **"🤖 Gemini 2.5 Flash"** badge in the top navbar.
  2. Paste your Google Gemini API Key (`AIzaSy...`).
  3. Select your model (`gemini-2.5-flash`, `gemini-1.5-flash`, or `gemini-1.5-pro`).
  4. Click **Save Settings** (persisted in browser storage and passed to backend).

---

## 8. Key Features Checklist

- [x] **Autonomous Planning**: Dynamically decomposes cases into structured DAG nodes.
- [x] **Cognitive Reasoning**: Step-by-step internal monologues with confidence scores.
- [x] **Multi-Agent Collaboration**: Specialized agents deliberate in an interactive swarm arena.
- [x] **Multi-Step Tool Execution**: Direct simulated tool calls to ERP, Logistics, Banking, and Policy APIs.
- [x] **Supabase Database Persistence**: Dual-layer PostgreSQL integration with realtime client listeners and audit logging.
- [x] **Clear Frontend / Backend Separation**: Dedicated `backend/` (Express, SSE, Agents) and `frontend/` (Vite, Vanilla CSS, DAG visualizer).
- [x] **Human-In-The-Loop Guardrails**: Safety thresholds halt dangerous actions for executive review.
- [x] **Fragmented Silo Explorer**: Tabbed inspector for SAP, DHL, Stripe, and Policy records.
