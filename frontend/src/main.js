/**
 * main.js
 * Frontend application orchestrator for Nexus-Ops Autonomous Multi-Agent AI Swarm.
 * Manages Server-Sent Events (SSE) streaming, DAG visualization, swarm arena chat,
 * Human-In-The-Loop (HITL) authorizations, and fragmented enterprise silo inspections.
 */

import { testSupabaseConnection, isSupabaseConfigured, subscribeToRealtimeCases } from "./services/supabaseClient.js";

// Application State
const state = {
  cases: [],
  selectedCaseId: null,
  activeEventSource: null,
  isExecuting: false,
  executionStartTime: null,
  timerInterval: null,
  apiKey: localStorage.getItem("nexus_gemini_api_key") || "",
  model: localStorage.getItem("nexus_llm_model") || "gemini-2.5-flash",
  silosData: null,
  currentHitlDetails: null,
  totalAutonomousToolActions: 0,
  supabaseBackendStatus: null
};

// DOM Elements
const elements = {
  // Navigation & Status
  swarmStatusDot: document.getElementById("swarmStatusDot"),
  swarmStatusText: document.getElementById("swarmStatusText"),
  llmEngineBadge: document.getElementById("llmEngineBadge"),
  btnRunActiveCase: document.getElementById("btnRunActiveCase"),
  execTimer: document.getElementById("execTimer"),
  dagProgressBadge: document.getElementById("dagProgressBadge"),

  // Metrics Ribbon
  metricTimeSaved: document.getElementById("metricTimeSaved"),
  metricDiscrepancy: document.getElementById("metricDiscrepancy"),
  metricCompliance: document.getElementById("metricCompliance"),
  metricTasksExecuted: document.getElementById("metricTasksExecuted"),

  // Containers
  caseListContainer: document.getElementById("caseListContainer"),
  caseCountBadge: document.getElementById("caseCountBadge"),
  dagFlowContainer: document.getElementById("dagFlowContainer"),
  reasoningTerminal: document.getElementById("reasoningTerminal"),
  swarmChatContainer: document.getElementById("swarmChatContainer"),
  settlementSection: document.getElementById("settlementSection"),

  // Modals & Triggers
  btnOpenLlmModal: document.getElementById("btnOpenLlmModal"),
  llmModal: document.getElementById("llmModal"),
  btnCloseLlm: document.getElementById("btnCloseLlm"),
  inputGeminiApiKey: document.getElementById("inputGeminiApiKey"),
  selectLlmModel: document.getElementById("selectLlmModel"),
  btnSaveLlm: document.getElementById("btnSaveLlm"),
  btnTestLlm: document.getElementById("btnTestLlm"),

  btnOpenSilos: document.getElementById("btnOpenSilos"),
  silosModal: document.getElementById("silosModal"),
  btnCloseSilos: document.getElementById("btnCloseSilos"),
  btnCloseSilosFooter: document.getElementById("btnCloseSilosFooter"),
  siloJsonViewer: document.getElementById("siloJsonViewer"),

  btnOpenCustomCase: document.getElementById("btnOpenCustomCase"),
  customCaseModal: document.getElementById("customCaseModal"),
  btnCloseCustomCase: document.getElementById("btnCloseCustomCase"),
  btnCancelCustomCase: document.getElementById("btnCancelCustomCase"),
  btnSubmitCustomCase: document.getElementById("btnSubmitCustomCase"),

  // HITL Modal
  hitlModal: document.getElementById("hitlModal"),
  btnCloseHitl: document.getElementById("btnCloseHitl"),
  hitlRoleRequired: document.getElementById("hitlRoleRequired"),
  hitlSummaryText: document.getElementById("hitlSummaryText"),
  hitlReasonsList: document.getElementById("hitlReasonsList"),
  hitlCaseId: document.getElementById("hitlCaseId"),
  hitlProposedAmount: document.getElementById("hitlProposedAmount"),
  hitlRiskScore: document.getElementById("hitlRiskScore"),
  hitlReviewerName: document.getElementById("hitlReviewerName"),
  hitlDecisionNote: document.getElementById("hitlDecisionNote"),
  btnHitlApprove: document.getElementById("btnHitlApprove"),
  btnHitlReject: document.getElementById("btnHitlReject"),
  btnHitlEscalate: document.getElementById("btnHitlEscalate"),

  btnRefreshCases: document.getElementById("btnRefreshCases"),

  // Supabase Modal & Badges
  btnOpenSupabaseModal: document.getElementById("btnOpenSupabaseModal"),
  supabaseModal: document.getElementById("supabaseModal"),
  btnCloseSupabase: document.getElementById("btnCloseSupabase"),
  btnCloseSupabaseFooter: document.getElementById("btnCloseSupabaseFooter"),
  btnTestSupabase: document.getElementById("btnTestSupabase"),
  backendDbStatusText: document.getElementById("backendDbStatusText"),
  frontendDbStatusText: document.getElementById("frontendDbStatusText"),
  targetSupabaseUrl: document.getElementById("targetSupabaseUrl"),
  supabaseStatusBadge: document.getElementById("supabaseStatusBadge")
};

// ==========================================================================
// Initialization
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initLlmConfig();
  initSupabaseStatus();
  loadCases();
  setupEventListeners();
  checkBackendHealth();
  setupRealtimeSubscriptions();
});

function initLlmConfig() {
  if (state.apiKey) {
    elements.inputGeminiApiKey.value = state.apiKey;
  }
  if (state.model) {
    elements.selectLlmModel.value = state.model;
    elements.llmEngineBadge.textContent = state.model;
  }
}

// ==========================================================================
// API Calls & Case Management
// ==========================================================================
async function loadCases() {
  try {
    const res = await fetch("/api/cases");
    const data = await res.json();
    if (data.success && data.cases) {
      state.cases = data.cases;
      elements.caseCountBadge.textContent = `${data.cases.length} Active`;
      renderCaseList();
      if (!state.selectedCaseId && data.cases.length > 0) {
        selectCase(data.cases[0].id);
      }
    }
  } catch (err) {
    console.error("Failed to load enterprise cases:", err);
  }
}

function renderCaseList() {
  elements.caseListContainer.innerHTML = "";
  state.cases.forEach(item => {
    const card = document.createElement("div");
    card.className = `case-card ${item.id === state.selectedCaseId ? "active" : ""}`;
    card.id = `case-card-${item.id}`;
    card.onclick = () => selectCase(item.id);

    const amount = item.inputPayload?.claimedDiscrepancyAmount || item.inputPayload?.monthlyBillingUSD || 0;

    card.innerHTML = `
      <div class="case-top">
        <span class="case-id">${item.id}</span>
        <span class="tag-urgency ${item.urgency}">${item.urgency.replace(/_/g, " ")}</span>
      </div>
      <div class="case-title">${escapeHtml(item.title)}</div>
      <div class="case-summary">${escapeHtml(item.summary)}</div>
      <div class="case-meta">
        <span>${escapeHtml(item.category)}</span>
        <span class="case-amount">$${amount.toLocaleString()}</span>
      </div>
    `;
    elements.caseListContainer.appendChild(card);
  });
}

function selectCase(caseId) {
  state.selectedCaseId = caseId;
  const target = state.cases.find(c => c.id === caseId);
  if (!target) return;

  // Update card active classes
  document.querySelectorAll(".case-card").forEach(el => el.classList.remove("active"));
  const card = document.getElementById(`case-card-${caseId}`);
  if (card) card.classList.add("active");

  // Update metrics preview
  const amount = target.inputPayload?.claimedDiscrepancyAmount || target.inputPayload?.monthlyBillingUSD || 11600;
  elements.metricDiscrepancy.textContent = `$${amount.toLocaleString()}`;
  elements.metricTasksExecuted.textContent = "0 / 7";
  elements.dagProgressBadge.textContent = "Ready";

  // Reset DAG preview
  renderInitialDag([
    { id: "node-plan", label: "Autonomous Planning", agent: "OrchestratorAgent", status: "PENDING" },
    { id: "node-triage", label: "Ingestion & Entity Normalization", agent: "TriageAgent", status: "PENDING" },
    { id: "node-audit", label: "Multi-Silo ERP & Logistics Match", agent: "AuditMatcherAgent", status: "PENDING" },
    { id: "node-risk", label: "Fraud & Security Sentinel", agent: "RiskSentinelAgent", status: "PENDING" },
    { id: "node-policy", label: "Contractual SLA & DoA Compliance", agent: "PolicyArbiterAgent", status: "PENDING" },
    { id: "node-deliberate", label: "Swarm Consensus Deliberation", agent: "All Agents", status: "PENDING" },
    { id: "node-execute", label: "ERP Ledger Settlement & Notice", agent: "SettlementAgent", status: "PENDING" }
  ]);

  // Reset Terminal and Chat view
  elements.reasoningTerminal.innerHTML = `
    <div style="color: var(--text-muted); font-size: 0.78rem; padding: 0.75rem 0;">
      Case <strong style="color: var(--accent-cyan);">${target.id}</strong> loaded. Ready to deploy autonomous agent swarm.
    </div>
  `;
  elements.swarmChatContainer.innerHTML = `
    <div style="color: var(--text-muted); font-size: 0.78rem; padding: 0.75rem 0; text-align: center;">
      Swarm communication standby. Click "Execute Swarm" to observe agent collaboration.
    </div>
  `;
  elements.settlementSection.style.display = "none";
}

// ==========================================================================
// DAG Visualization
// ==========================================================================
function renderInitialDag(nodes) {
  elements.dagFlowContainer.innerHTML = "";
  nodes.forEach(node => {
    const el = document.createElement("div");
    el.className = `dag-node ${node.status}`;
    el.id = `dag-${node.id}`;

    let icon = "⚙️";
    if (node.id === "node-plan") icon = "🧠";
    if (node.id === "node-triage") icon = "📥";
    if (node.id === "node-audit") icon = "🔍";
    if (node.id === "node-risk") icon = "🛡️";
    if (node.id === "node-policy") icon = "⚖️";
    if (node.id === "node-deliberate") icon = "🤝";
    if (node.id === "node-execute") icon = "⚡";

    el.innerHTML = `
      <div class="dag-node-left">
        <div class="dag-node-icon">${icon}</div>
        <div class="dag-node-info">
          <div class="dag-node-title">${node.label}</div>
          <div class="dag-node-agent">${node.agent}</div>
        </div>
      </div>
      <div class="dag-node-status" id="dag-status-${node.id}">${node.status}</div>
    `;
    elements.dagFlowContainer.appendChild(el);
  });
}

function updateDagNodeStatus(nodeId, status) {
  const nodeEl = document.getElementById(`dag-${nodeId}`);
  const statusEl = document.getElementById(`dag-status-${nodeId}`);
  if (nodeEl && statusEl) {
    nodeEl.className = `dag-node ${status}`;
    statusEl.textContent = status;
  }
}

// ==========================================================================
// Autonomous Swarm Execution (Server-Sent Events)
// ==========================================================================
function executeActiveCase() {
  if (!state.selectedCaseId) {
    alert("Please select a business exception case first.");
    return;
  }

  if (state.isExecuting) {
    if (state.activeEventSource) {
      state.activeEventSource.close();
    }
  }

  // Clear previous execution state
  state.isExecuting = true;
  state.totalAutonomousToolActions = 0;
  elements.metricTasksExecuted.textContent = `0 / 7`;
  elements.btnRunActiveCase.disabled = true;
  elements.btnRunActiveCase.innerHTML = `<span>⏳</span> Deliberating...`;

  elements.swarmStatusDot.className = "status-dot active";
  elements.swarmStatusText.textContent = "Swarm Deliberation Active";

  elements.reasoningTerminal.innerHTML = "";
  elements.swarmChatContainer.innerHTML = "";
  elements.settlementSection.style.display = "none";

  // Start execution timer
  state.executionStartTime = Date.now();
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.timerInterval = setInterval(() => {
    const elapsedSec = ((Date.now() - state.executionStartTime) / 1000).toFixed(1);
    elements.execTimer.textContent = `${elapsedSec}s`;
  }, 100);

  // Connect to SSE Endpoint
  const sseUrl = `/api/orchestrate/stream?caseId=${encodeURIComponent(state.selectedCaseId)}&apiKey=${encodeURIComponent(state.apiKey)}`;
  const eventSource = new EventSource(sseUrl);
  state.activeEventSource = eventSource;

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleSwarmEvent(data);
    } catch (err) {
      console.error("Error parsing SSE event data:", err);
    }
  };

  eventSource.onerror = (err) => {
    console.warn("SSE connection closed or encountered error:", err);
    eventSource.close();
    finishExecution();
  };
}

function handleSwarmEvent(evt) {
  switch (evt.type) {
    case "WORKFLOW_INITIALIZED":
      elements.dagProgressBadge.textContent = "Executing";
      if (evt.dag) {
        renderInitialDag(evt.dag);
      }
      break;

    case "DAG_UPDATED":
      updateDagNodeStatus(evt.nodeId, evt.status);
      break;

    case "AGENT_THOUGHT":
      appendReasoningThought(evt);
      break;

    case "TOOL_START":
      appendToolCallStart(evt);
      state.totalAutonomousToolActions++;
      elements.metricTasksExecuted.textContent = `${state.totalAutonomousToolActions} / 7`;
      break;

    case "TOOL_RESULT":
      appendToolCallResult(evt);
      break;

    case "SWARM_MESSAGE":
      appendSwarmMessage(evt);
      break;

    case "CONSENSUS_REACHED":
      appendConsensusCard(evt);
      break;

    case "HITL_PAUSE":
      triggerHitlModal(evt.hitlDetails);
      break;

    case "WORKFLOW_COMPLETED":
      renderFinalSettlement(evt.resolution);
      finishExecution();
      break;

    case "FATAL_ERROR":
      alert(`Swarm execution halted with error: ${evt.error}`);
      finishExecution();
      break;
  }
}

function finishExecution() {
  state.isExecuting = false;
  elements.btnRunActiveCase.disabled = false;
  elements.btnRunActiveCase.innerHTML = `<span>▶</span> Execute Swarm`;
  elements.swarmStatusDot.className = "status-dot completed";
  elements.swarmStatusText.textContent = "Swarm Reconciled";
  elements.dagProgressBadge.textContent = "Completed";
  if (state.timerInterval) clearInterval(state.timerInterval);
}

// ==========================================================================
// Reasoning & Tool Feed Rendering
// ==========================================================================
function appendReasoningThought(thought) {
  const card = document.createElement("div");
  card.className = "reasoning-entry";

  const timeStr = new Date(thought.timestamp || Date.now()).toLocaleTimeString();

  card.innerHTML = `
    <div class="entry-header">
      <div class="entry-agent">
        <span>${thought.avatar || "🤖"}</span>
        <span>${escapeHtml(thought.agent)}</span>
        <span style="font-size: 0.68rem; color: var(--text-muted); font-weight: normal;">(${escapeHtml(thought.role || "")})</span>
      </div>
      <div class="entry-time">${timeStr}</div>
    </div>
    <div class="entry-thought">${escapeHtml(thought.thought)}</div>
    ${thought.plan ? `<div style="font-size: 0.74rem; color: var(--accent-cyan); font-family: var(--font-mono); margin-top: 0.2rem;"><strong>Next Plan:</strong> ${escapeHtml(thought.plan)}</div>` : ""}
    <div style="display: flex; justify-content: flex-end; align-items: center; gap: 0.4rem; font-size: 0.68rem; color: var(--text-muted);">
      <span>Confidence:</span>
      <span style="color: var(--accent-emerald); font-weight: 700;">${Math.round((thought.confidence || 0.95) * 100)}%</span>
    </div>
  `;

  elements.reasoningTerminal.appendChild(card);
  elements.reasoningTerminal.scrollTop = elements.reasoningTerminal.scrollHeight;
}

function appendToolCallStart(toolEvt) {
  const pill = document.createElement("div");
  pill.className = "entry-tool-pill";
  pill.innerHTML = `
    <span>⚡</span>
    <span><strong>Tool Call:</strong> ${escapeHtml(toolEvt.tool)}</span>
    <span style="opacity: 0.7;">${escapeHtml(JSON.stringify(toolEvt.args))}</span>
  `;
  elements.reasoningTerminal.appendChild(pill);
  elements.reasoningTerminal.scrollTop = elements.reasoningTerminal.scrollHeight;
}

function appendToolCallResult(resultEvt) {
  const resBox = document.createElement("pre");
  resBox.className = "entry-tool-result";
  resBox.textContent = `✓ [${resultEvt.tool} Result]:\n${JSON.stringify(resultEvt.result, null, 2)}`;
  elements.reasoningTerminal.appendChild(resBox);
  elements.reasoningTerminal.scrollTop = elements.reasoningTerminal.scrollHeight;
}

function appendSwarmMessage(msg) {
  const bubble = document.createElement("div");
  bubble.className = "swarm-bubble";

  let avatar = "🤖";
  if (msg.from === "TriageAgent") avatar = "📥";
  if (msg.from === "AuditMatcherAgent") avatar = "🔍";
  if (msg.from === "RiskSentinelAgent") avatar = "🛡️";
  if (msg.from === "PolicyArbiterAgent") avatar = "⚖️";
  if (msg.from === "OrchestratorAgent") avatar = "🧠";
  if (msg.from === "SettlementAgent") avatar = "⚡";

  const timeStr = new Date(msg.timestamp || Date.now()).toLocaleTimeString();

  bubble.innerHTML = `
    <div class="swarm-avatar">${avatar}</div>
    <div class="swarm-content">
      <div class="swarm-author">
        <span>${escapeHtml(msg.from)} → ${escapeHtml(msg.to || "Swarm")}</span>
        <span style="color: var(--text-muted); font-size: 0.68rem;">${timeStr}</span>
      </div>
      <div class="swarm-text">${escapeHtml(msg.message)}</div>
    </div>
  `;

  elements.swarmChatContainer.appendChild(bubble);
  elements.swarmChatContainer.scrollTop = elements.swarmChatContainer.scrollHeight;
}

function appendConsensusCard(evt) {
  const box = document.createElement("div");
  box.style.background = "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)";
  box.style.border = "1px solid rgba(139, 92, 246, 0.4)";
  box.style.borderRadius = "var(--radius-sm)";
  box.style.padding = "0.85rem";
  box.style.display = "flex";
  box.style.flexDirection = "column";
  box.style.gap = "0.3rem";

  box.innerHTML = `
    <div style="font-size: 0.76rem; font-weight: 700; color: var(--accent-violet); text-transform: uppercase;">
      🤝 Swarm Consensus Reached
    </div>
    <div style="font-size: 0.8rem; color: #fff;">${escapeHtml(evt.consensusSummary || "Agents aligned on execution path.")}</div>
  `;
  elements.swarmChatContainer.appendChild(box);
  elements.swarmChatContainer.scrollTop = elements.swarmChatContainer.scrollHeight;
}

// ==========================================================================
// Settlement & Reconciled Memo Card
// ==========================================================================
function renderFinalSettlement(resolution) {
  if (!resolution) return;

  elements.settlementSection.style.display = "block";
  elements.settlementSection.innerHTML = `
    <div class="settlement-card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span class="settlement-badge">✓ SAP ERP Ledger Posted</span>
        <span style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">
          ${new Date(resolution.auditTimestamp || Date.now()).toLocaleTimeString()}
        </span>
      </div>

      <div class="settlement-memo-id">
        SAP Credit Memo: ${escapeHtml(resolution.memoId || "CM-SAP-AUTO")}
      </div>

      <div class="settlement-details">
        <div>Reconciled Amount: <strong style="color: #fff;">$${(resolution.amountSettledUSD || 0).toLocaleString()} USD</strong></div>
        <div>Approval Mode: <strong style="color: var(--accent-cyan);">${escapeHtml(resolution.approvalMode || "AUTONOMOUS")}</strong></div>
        <div>CRM Dispatch Ref: <strong style="color: #fff;">${escapeHtml(resolution.crmDispatchId || "COMM-1049")}</strong></div>
        <div>Ledger Status: <strong style="color: var(--accent-emerald);">POSTED & RECONCILED</strong></div>
      </div>

      ${resolution.stakeholderNotice ? `
        <div style="font-size: 0.74rem; color: var(--text-secondary); margin-top: 0.2rem;">Official Transmitted Memo:</div>
        <div class="settlement-letter">${escapeHtml(resolution.stakeholderNotice)}</div>
      ` : ""}
    </div>
  `;

  elements.swarmChatContainer.scrollTop = elements.swarmChatContainer.scrollHeight;
}

// ==========================================================================
// Human-In-The-Loop (HITL) Guardrail Flow
// ==========================================================================
function triggerHitlModal(hitlDetails) {
  state.currentHitlDetails = hitlDetails;

  elements.swarmStatusDot.className = "status-dot hitl";
  elements.swarmStatusText.textContent = "Awaiting Human Authorization";
  updateDagNodeStatus("node-policy", "PAUSED_HITL");

  elements.hitlRoleRequired.textContent = `${hitlDetails.requiredRole || "EXECUTIVE_OFFICER"} Authorization Required`;
  elements.hitlCaseId.textContent = hitlDetails.caseId || state.selectedCaseId;
  elements.hitlProposedAmount.textContent = `$${(hitlDetails.proposedAmountUSD || 0).toLocaleString()} USD`;
  elements.hitlRiskScore.textContent = (hitlDetails.riskScore || 0).toFixed(2);
  elements.hitlSummaryText.textContent = hitlDetails.summary || "Action exceeds pre-approved enterprise parameters.";

  elements.hitlReasonsList.innerHTML = "";
  (hitlDetails.triggerReasons || []).forEach(reason => {
    const li = document.createElement("li");
    li.textContent = reason;
    elements.hitlReasonsList.appendChild(li);
  });

  elements.hitlModal.classList.add("active");
}

async function submitHitlDecision(action) {
  if (!state.currentHitlDetails) return;

  const caseId = state.currentHitlDetails.caseId || state.selectedCaseId;
  const reviewerName = elements.hitlReviewerName.value.trim() || "Executive Officer";
  const note = elements.hitlDecisionNote.value.trim() || `Directive issued: ${action}`;

  elements.hitlModal.classList.remove("active");

  try {
    const res = await fetch("/api/hitl/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseId,
        action,
        reviewerName,
        note,
        apiKey: state.apiKey
      })
    });

    const data = await res.json();
    if (data.success) {
      appendSwarmMessage({
        from: reviewerName,
        to: "Swarm",
        message: `[EXECUTIVE DIRECTIVE] Action: ${action}. Note: ${note}`,
        timestamp: new Date().toISOString()
      });

      if (data.finalResolution) {
        renderFinalSettlement(data.finalResolution);
      }
      finishExecution();
    } else {
      alert(`HITL Decision error: ${data.error}`);
    }
  } catch (err) {
    console.error("Failed to post HITL decision:", err);
    alert("Network error submitting decision to backend.");
  }
}

// ==========================================================================
// Fragmented Silos Explorer
// ==========================================================================
async function openSilosModal() {
  elements.silosModal.classList.add("active");
  elements.siloJsonViewer.textContent = "Querying live enterprise database silos...";

  try {
    const res = await fetch("/api/enterprise/silos");
    const data = await res.json();
    if (data.success) {
      state.silosData = data.silos;
      renderSiloView("erp");
    }
  } catch (err) {
    elements.siloJsonViewer.textContent = `Error connecting to silos: ${err.message}`;
  }
}

function renderSiloView(siloType) {
  if (!state.silosData) return;
  let content = {};
  if (siloType === "erp") content = state.silosData.erpPurchaseOrders;
  if (siloType === "logistics") content = state.silosData.logisticsTracking;
  if (siloType === "banking") content = state.silosData.vendorMasterBanking;
  if (siloType === "policy") content = state.silosData.enterprisePolicies;
  if (siloType === "crm") content = state.silosData.supportTickets;

  elements.siloJsonViewer.textContent = JSON.stringify(content, null, 2);
}

// ==========================================================================
// Custom Case Ingestion
// ==========================================================================
async function submitCustomCase() {
  const title = document.getElementById("custTitle").value.trim();
  const category = document.getElementById("custCategory").value.trim();
  const amount = parseFloat(document.getElementById("custAmount").value) || 0;
  const poNumber = document.getElementById("custPo").value.trim();
  const trackingNumber = document.getElementById("custTracking").value.trim();
  const description = document.getElementById("custDesc").value.trim();

  if (!title) {
    alert("Please enter a case title.");
    return;
  }

  try {
    const res = await fetch("/api/cases/custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        category,
        claimedAmount: amount,
        poNumber,
        trackingNumber,
        description
      })
    });

    const data = await res.json();
    if (data.success && data.case) {
      elements.customCaseModal.classList.remove("active");
      await loadCases();
      selectCase(data.case.id);
    }
  } catch (err) {
    alert(`Failed to add custom case: ${err.message}`);
  }
}

// ==========================================================================
// LLM Config & Settings
// ==========================================================================
async function saveLlmSettings() {
  const key = elements.inputGeminiApiKey.value.trim();
  const model = elements.selectLlmModel.value;

  state.apiKey = key;
  state.model = model;
  localStorage.setItem("nexus_gemini_api_key", key);
  localStorage.setItem("nexus_llm_model", model);

  elements.llmEngineBadge.textContent = model;
  elements.llmModal.classList.remove("active");

  try {
    await fetch("/api/config/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: key, model })
    });
  } catch (e) {
    console.warn("Could not sync key to backend:", e);
  }
}

async function initSupabaseStatus() {
  const isClientConfigured = isSupabaseConfigured;
  if (isClientConfigured) {
    elements.frontendDbStatusText.textContent = "Configured (Browser Client Active)";
    elements.frontendDbStatusText.style.color = "var(--accent-emerald)";
  } else {
    elements.frontendDbStatusText.textContent = "Local Resilient Mode (Credentials Pending)";
    elements.frontendDbStatusText.style.color = "var(--accent-amber)";
  }

  const clientUrl = import.meta.env.VITE_SUPABASE_URL || "Not configured";
  elements.targetSupabaseUrl.textContent = clientUrl;
}

function setupRealtimeSubscriptions() {
  try {
    subscribeToRealtimeCases((payload) => {
      console.log("[Main] Realtime case change detected from Supabase, refreshing queue...");
      loadCases();
    });
  } catch (e) {
    console.warn("Could not register Supabase realtime channel:", e);
  }
}

async function checkBackendHealth() {
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    if (data.status === "HEALTHY") {
      console.log("Nexus-Ops Backend Connected:", data);

      if (data.supabase) {
        state.supabaseBackendStatus = data.supabase;
        if (data.supabase.connected) {
          elements.supabaseStatusBadge.textContent = "Supabase Live";
          elements.supabaseStatusBadge.style.color = "var(--accent-emerald)";
          elements.backendDbStatusText.textContent = "Connected (PostgreSQL Active)";
          elements.backendDbStatusText.style.color = "var(--accent-emerald)";
        } else {
          elements.supabaseStatusBadge.textContent = "Supabase Ready";
          elements.supabaseStatusBadge.style.color = "var(--accent-amber)";
          elements.backendDbStatusText.textContent = `Local Seed Mode (${data.supabase.mode || "Ready"})`;
          elements.backendDbStatusText.style.color = "var(--accent-amber)";
        }
      }
    }
  } catch (e) {
    console.warn("Backend not reachable directly via relative path. Proxy or server might be initializing.");
  }
}

// ==========================================================================
// Event Listeners Setup
// ==========================================================================
function setupEventListeners() {
  // Execute Swarm
  elements.btnRunActiveCase.addEventListener("click", executeActiveCase);
  elements.btnRefreshCases.addEventListener("click", loadCases);

  // Silos Modal
  elements.btnOpenSilos.addEventListener("click", openSilosModal);
  elements.btnCloseSilos.addEventListener("click", () => elements.silosModal.classList.remove("active"));
  elements.btnCloseSilosFooter.addEventListener("click", () => elements.silosModal.classList.remove("active"));
  document.querySelectorAll(".silo-tab").forEach(tab => {
    tab.addEventListener("click", (e) => {
      document.querySelectorAll(".silo-tab").forEach(t => t.classList.remove("active"));
      e.target.classList.add("active");
      renderSiloView(e.target.dataset.silo);
    });
  });

  // Supabase Modal
  if (elements.btnOpenSupabaseModal) {
    elements.btnOpenSupabaseModal.addEventListener("click", () => elements.supabaseModal.classList.add("active"));
  }
  if (elements.btnCloseSupabase) {
    elements.btnCloseSupabase.addEventListener("click", () => elements.supabaseModal.classList.remove("active"));
  }
  if (elements.btnCloseSupabaseFooter) {
    elements.btnCloseSupabaseFooter.addEventListener("click", () => elements.supabaseModal.classList.remove("active"));
  }
  if (elements.btnTestSupabase) {
    elements.btnTestSupabase.addEventListener("click", async () => {
      elements.btnTestSupabase.textContent = "Testing...";
      try {
        const clientTest = await testSupabaseConnection();
        const res = await fetch("/api/supabase/status");
        const backendTest = await res.json();

        alert(`--- Supabase Connection Diagnostics ---\n\n` +
          `Backend PostgreSQL: ${backendTest.mode} (${backendTest.message || backendTest.error || "Ready"})\n` +
          `Frontend Client: ${clientTest.mode} (${clientTest.message || clientTest.error || "Ready"})\n` +
          `Target Project URL: ${backendTest.url || "N/A"}`
        );
      } catch (err) {
        alert("Diagnostics error: " + err.message);
      } finally {
        elements.btnTestSupabase.textContent = "Test Live Ping";
      }
    });
  }

  // LLM Config Modal
  elements.btnOpenLlmModal.addEventListener("click", () => elements.llmModal.classList.add("active"));
  elements.btnCloseLlm.addEventListener("click", () => elements.llmModal.classList.remove("active"));
  elements.btnSaveLlm.addEventListener("click", saveLlmSettings);
  elements.btnTestLlm.addEventListener("click", async () => {
    elements.btnTestLlm.textContent = "Pinging...";
    try {
      const res = await fetch("/api/health");
      const d = await res.json();
      alert(`Backend Status: ${d.status}\nEngine: ${d.engine}\nActive Model: ${d.activeModel}`);
    } catch (e) {
      alert("Error connecting to backend: " + e.message);
    } finally {
      elements.btnTestLlm.textContent = "Test Connection";
    }
  });

  // Custom Case Modal
  elements.btnOpenCustomCase.addEventListener("click", () => elements.customCaseModal.classList.add("active"));
  elements.btnCloseCustomCase.addEventListener("click", () => elements.customCaseModal.classList.remove("active"));
  elements.btnCancelCustomCase.addEventListener("click", () => elements.customCaseModal.classList.remove("active"));
  elements.btnSubmitCustomCase.addEventListener("click", submitCustomCase);

  // HITL Decision Buttons
  elements.btnCloseHitl.addEventListener("click", () => elements.hitlModal.classList.remove("active"));
  elements.btnHitlApprove.addEventListener("click", () => submitHitlDecision("APPROVE"));
  elements.btnHitlReject.addEventListener("click", () => submitHitlDecision("REJECT"));
  elements.btnHitlEscalate.addEventListener("click", () => submitHitlDecision("ESCALATE"));
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
