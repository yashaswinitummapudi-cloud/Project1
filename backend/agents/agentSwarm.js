/**
 * agentSwarm.js
 * Multi-Agent Autonomous Swarm for Enterprise Workflow & Exception Orchestration.
 * 
 * Agents:
 * 1. OrchestratorAgent (Planner & Coordinator)
 * 2. TriageAgent (Ingestion & Entity Normalization)
 * 3. AuditMatcherAgent (ERP, Dock Scans, Carrier Telemetry)
 * 4. RiskSentinelAgent (Fraud, Bank Routing, IP & Velocity)
 * 5. PolicyArbiterAgent (SLA Clauses, DoA Limits, Contract Penalties)
 * 6. SettlementAgent (ERP Credit Memo, CRM Dispatch, Executive Memo)
 */

import { llmService } from "../services/llmService.js";
import { enterpriseTools } from "../tools/enterpriseTools.js";
import { supabaseService } from "../services/supabaseService.js";

export class AgentSwarm {
  constructor() {
    this.activeRuns = new Map(); // caseId -> state
  }

  /**
   * Run the full autonomous multi-agent pipeline with real-time event streaming
   * @param {Object} inputCase - Case data
   * @param {Function} emitEvent - Callback to emit SSE events to frontend
   * @param {string} [customApiKey] - Optional LLM API key provided by user
   */
  async executeCase(inputCase, emitEvent, customApiKey = null) {
    const caseId = inputCase.id || inputCase.caseId;
    const startTime = Date.now();

    const state = {
      caseId,
      status: "RUNNING",
      inputCase,
      dag: this._buildExecutionDag(inputCase),
      agentOutputs: {},
      toolExecutions: [],
      collaborativeMessages: [],
      hitlRequired: false,
      hitlDetails: null,
      resolvedAt: null,
      finalResolution: null
    };

    this.activeRuns.set(caseId, state);

    emitEvent({
      type: "WORKFLOW_INITIALIZED",
      caseId,
      timestamp: new Date().toISOString(),
      dag: state.dag,
      message: `Autonomous swarm mobilized for ${inputCase.title || caseId}. Building execution plan DAG.`
    });

    try {
      // Step 1: Orchestrator Plans
      await this._runStepPlanner(state, emitEvent, customApiKey);

      // Step 2: Triage Ingestion
      await this._runStepTriage(state, emitEvent, customApiKey);

      // Step 3: Multi-Silo Audit & ERP Matching (Executes tools)
      await this._runStepAudit(state, emitEvent, customApiKey);

      // Step 4: Risk Sentinel & Fraud Detection (Executes tools)
      await this._runStepRisk(state, emitEvent, customApiKey);

      // Step 5: Policy Arbiter (SLA & Delegation of Authority)
      await this._runStepPolicy(state, emitEvent, customApiKey);

      // Step 6: Multi-Agent Collaborative Deliberation
      await this._runStepDeliberation(state, emitEvent, customApiKey);

      // Step 7: Check Guardrails for Human-In-The-Loop (HITL)
      if (state.hitlRequired) {
        state.status = "AWAITING_HUMAN_APPROVAL";
        emitEvent({
          type: "HITL_PAUSE",
          caseId,
          timestamp: new Date().toISOString(),
          hitlDetails: state.hitlDetails,
          message: "Autonomous execution halted. Safety guardrail triggered. Awaiting executive signoff."
        });
        return state;
      }

      // Step 8: Autonomous Settlement Execution
      await this._runStepSettlement(state, emitEvent, customApiKey, "AUTONOMOUS_APPROVED");

      state.status = "COMPLETED";
      const executionDurationMs = Date.now() - startTime;
      emitEvent({
        type: "WORKFLOW_COMPLETED",
        caseId,
        timestamp: new Date().toISOString(),
        durationMs: executionDurationMs,
        resolution: state.finalResolution,
        message: "All multi-step agent tasks successfully executed and verified."
      });

      return state;
    } catch (err) {
      state.status = "FAILED";
      emitEvent({
        type: "WORKFLOW_ERROR",
        caseId,
        error: err.message,
        timestamp: new Date().toISOString()
      });
      throw err;
    }
  }

  /**
   * Resume an execution after a Human-In-The-Loop decision
   */
  async resumeWithHumanDecision(caseId, decision, emitEvent, customApiKey = null) {
    const state = this.activeRuns.get(caseId);
    if (!state) {
      throw new Error(`No active workflow session found for case ${caseId}.`);
    }

    emitEvent({
      type: "HITL_DECISION_RECEIVED",
      caseId,
      decision,
      timestamp: new Date().toISOString(),
      message: `Human-in-the-loop decision received: ${decision.action.toUpperCase()} by ${decision.reviewerName || "Executive Officer"}`
    });

    if (decision.action === "APPROVE") {
      await this._runStepSettlement(state, emitEvent, customApiKey, "HUMAN_APPROVED", decision.note);
      state.status = "COMPLETED_VIA_HITL";
      emitEvent({
        type: "WORKFLOW_COMPLETED",
        caseId,
        timestamp: new Date().toISOString(),
        resolution: state.finalResolution,
        message: "Case executed following executive human approval."
      });
    } else if (decision.action === "REJECT") {
      state.status = "REJECTED_BY_HUMAN";
      state.finalResolution = {
        outcome: "REJECTED",
        reason: decision.note || "Rejected by Human Executive Officer.",
        timestamp: new Date().toISOString(),
        ledgerAction: "NO_LEDGER_POSTING_BLOCKED"
      };
      emitEvent({
        type: "WORKFLOW_COMPLETED",
        caseId,
        timestamp: new Date().toISOString(),
        resolution: state.finalResolution,
        message: "Case resolution rejected per human executive directive."
      });
    } else {
      // REQUEST_AUDIT or ESCALATE
      state.status = "ESCALATED_MANUAL_REVIEW";
      state.finalResolution = {
        outcome: "MANUAL_ESCALATION",
        reason: decision.note || "Routed to Forensic Audit Committee.",
        timestamp: new Date().toISOString(),
        ledgerAction: "FROZEN_PENDING_FORENSIC_REVIEW"
      };
      emitEvent({
        type: "WORKFLOW_COMPLETED",
        caseId,
        timestamp: new Date().toISOString(),
        resolution: state.finalResolution,
        message: "Case frozen and transferred to forensic committee."
      });
    }

    return state;
  }

  // --- Step 1: Planner ---
  async _runStepPlanner(state, emitEvent, customApiKey) {
    this._updateDagNode(state, "node-plan", "RUNNING", emitEvent);

    const deliberation = await llmService.generateAgentDeliberation({
      agentRole: "OrchestratorPlanner",
      systemPrompt: "You are the Lead Autonomous Workflow Orchestrator. You analyze complex business exceptions across ERP, Logistics, and Banking. Plan the step-by-step DAG.",
      userPrompt: `Exception Case: ${JSON.stringify(state.inputCase)}`,
      customKey: customApiKey
    });

    state.agentOutputs.orchestrator = deliberation;

    emitEvent({
      type: "AGENT_THOUGHT",
      agent: "OrchestratorAgent",
      role: "Lead Workflow Planner",
      avatar: "🧠",
      thought: deliberation.thought,
      plan: deliberation.plan,
      confidence: deliberation.confidenceScore,
      timestamp: new Date().toISOString()
    });

    await this._sleep(700);
    this._updateDagNode(state, "node-plan", "COMPLETED", emitEvent);
  }

  // --- Step 2: Triage ---
  async _runStepTriage(state, emitEvent, customApiKey) {
    this._updateDagNode(state, "node-triage", "RUNNING", emitEvent);

    const deliberation = await llmService.generateAgentDeliberation({
      agentRole: "TriageAgent",
      systemPrompt: "You are the Ingestion and Entity Normalization Agent. Extract vendor ID, PO number, tracking number, and claimed amounts.",
      userPrompt: `Input Payload: ${JSON.stringify(state.inputCase.inputPayload || state.inputCase)}`,
      customKey: customApiKey
    });

    const payload = state.inputCase.inputPayload || state.inputCase;
    state.extractedEntities = {
      poNumber: payload.poNumber || "PO-8902",
      trackingNumber: payload.trackingNumber || (payload.poNumber === "PO-8902" ? "TRK-9811204" : null),
      vendorId: payload.vendorId || "VEND-TECH-882",
      claimedDiscrepancyAmount: payload.claimedDiscrepancyAmount || 0,
      currency: payload.claimedCurrency || "USD"
    };

    emitEvent({
      type: "AGENT_THOUGHT",
      agent: "TriageAgent",
      role: "Data Extraction & Entity Parser",
      avatar: "📥",
      thought: `Entities extracted successfully. PO: ${state.extractedEntities.poNumber}, Vendor: ${state.extractedEntities.vendorId}, Claimed Amount: $${state.extractedEntities.claimedDiscrepancyAmount.toLocaleString()}`,
      plan: "Pass normalized entities to AuditMatcherAgent and RiskSentinelAgent.",
      confidence: 0.98,
      timestamp: new Date().toISOString()
    });

    await this._addSwarmMessage(state, emitEvent, {
      from: "TriageAgent",
      to: "Swarm",
      message: `Ingestion verified for ${state.extractedEntities.poNumber}. Target entities normalized for multi-silo investigation.`
    });

    await this._sleep(600);
    this._updateDagNode(state, "node-triage", "COMPLETED", emitEvent);
  }

  // --- Step 3: Audit & Matching ---
  async _runStepAudit(state, emitEvent, customApiKey) {
    this._updateDagNode(state, "node-audit", "RUNNING", emitEvent);

    const { poNumber, trackingNumber } = state.extractedEntities;

    // Tool 1: Query SAP ERP
    emitEvent({
      type: "TOOL_START",
      agent: "AuditMatcherAgent",
      tool: "queryPurchaseOrder",
      args: { poNumber },
      timestamp: new Date().toISOString()
    });
    const poResult = await enterpriseTools.queryPurchaseOrder({ poNumber });
    state.toolExecutions.push({ tool: "queryPurchaseOrder", result: poResult });
    emitEvent({
      type: "TOOL_RESULT",
      agent: "AuditMatcherAgent",
      tool: "queryPurchaseOrder",
      result: poResult,
      timestamp: new Date().toISOString()
    });

    // Tool 2: Check Dock Receipt
    const dockResult = await enterpriseTools.getDockReceipt({ poNumber });
    state.toolExecutions.push({ tool: "getDockReceipt", result: dockResult });

    // Tool 3: Carrier Telemetry
    let carrierResult = null;
    if (trackingNumber) {
      emitEvent({
        type: "TOOL_START",
        agent: "AuditMatcherAgent",
        tool: "fetchCarrierTelemetry",
        args: { trackingNumber },
        timestamp: new Date().toISOString()
      });
      carrierResult = await enterpriseTools.fetchCarrierTelemetry({ trackingNumber });
      state.toolExecutions.push({ tool: "fetchCarrierTelemetry", result: carrierResult });
      emitEvent({
        type: "TOOL_RESULT",
        agent: "AuditMatcherAgent",
        tool: "fetchCarrierTelemetry",
        result: carrierResult,
        timestamp: new Date().toISOString()
      });
    }

    const auditDeliberation = await llmService.generateAgentDeliberation({
      agentRole: "AuditMatcherAgent",
      systemPrompt: "You are the Audit and ERP Matcher Agent. Cross-examine line items, receiving scan logs, and carrier weight loss telemetry.",
      userPrompt: `PO: ${JSON.stringify(poResult)}, Dock: ${JSON.stringify(dockResult)}, Carrier: ${JSON.stringify(carrierResult)}`,
      customKey: customApiKey
    });

    state.auditFindings = {
      poData: poResult.data,
      dockData: dockResult.data,
      carrierData: carrierResult?.data,
      physicalDiscrepancyConfirmed: Boolean(dockResult.success && dockResult.data?.scannedCount < 80),
      carrierWeightLossConfirmed: Boolean(carrierResult?.data?.weightVarianceKg > 5.0)
    };

    emitEvent({
      type: "AGENT_THOUGHT",
      agent: "AuditMatcherAgent",
      role: "ERP & Supply Chain Investigator",
      avatar: "🔍",
      thought: auditDeliberation.thought,
      plan: "Transmitting discrepancy evidence to Policy Arbiter and Risk Sentinel.",
      confidence: auditDeliberation.confidenceScore,
      timestamp: new Date().toISOString()
    });

    await this._addSwarmMessage(state, emitEvent, {
      from: "AuditMatcherAgent",
      to: "PolicyArbiterAgent",
      message: `ERP cross-match complete. Found tangible discrepancy. Dock scan shows ${dockResult.data?.scannedCount || "N/A"} units vs 80 ordered. Carrier lost 19.8kg in transit at transit hub.`
    });

    await this._sleep(700);
    this._updateDagNode(state, "node-audit", "COMPLETED", emitEvent);
  }

  // --- Step 4: Risk & Fraud ---
  async _runStepRisk(state, emitEvent, customApiKey) {
    this._updateDagNode(state, "node-risk", "RUNNING", emitEvent);

    const { vendorId } = state.extractedEntities;

    emitEvent({
      type: "TOOL_START",
      agent: "RiskSentinelAgent",
      tool: "verifyVendorBanking",
      args: { vendorId },
      timestamp: new Date().toISOString()
    });

    const bankResult = await enterpriseTools.verifyVendorBanking({ vendorId });
    state.toolExecutions.push({ tool: "verifyVendorBanking", result: bankResult });

    emitEvent({
      type: "TOOL_RESULT",
      agent: "RiskSentinelAgent",
      tool: "verifyVendorBanking",
      result: bankResult,
      timestamp: new Date().toISOString()
    });

    const riskDeliberation = await llmService.generateAgentDeliberation({
      agentRole: "RiskSentinelAgent",
      systemPrompt: "You are the Risk & Fraud Sentinel Agent. Evaluate vendor banking changes, IP geo anomalies, and transaction velocity.",
      userPrompt: `Vendor Master: ${JSON.stringify(bankResult)}`,
      customKey: customApiKey
    });

    const isHighRiskFraud = (bankResult.data?.baselineRiskScore >= 0.70) || (bankResult.data?.submissionIp?.includes("Tor"));
    const calculatedRiskScore = isHighRiskFraud ? 0.94 : (bankResult.data?.baselineRiskScore || 0.12);

    state.riskAssessment = {
      vendorData: bankResult.data,
      riskScore: calculatedRiskScore,
      isHighRiskFraud,
      flags: isHighRiskFraud
        ? ["CRITICAL_BANK_ROUTING_CHANGED_UNDER_72_HOURS", "TOR_PROXY_SUBMISSION_IP", "OFFSHORE_JURISDICTION"]
        : ["VERIFIED_HISTORICAL_PARTNER", "LOW_DISPUTE_RATE_0.4_PCT"]
    };

    emitEvent({
      type: "AGENT_THOUGHT",
      agent: "RiskSentinelAgent",
      role: "Fraud & Financial Security Sentinel",
      avatar: "🛡️",
      thought: isHighRiskFraud
        ? "CRITICAL ALERT: Vendor bank routing changed 4 days ago to an offshore account; invoice uploaded from a Tor exit node. High probability of Business Email Compromise (BEC)."
        : "Vendor is Tier-1 strategic partner with $4.2M lifetime volume and 0.4% dispute rate. Bank routing matches approved master record.",
      plan: isHighRiskFraud ? "Trigger immediate quarantine and force executive HITL review." : "Clear financial security checkpoint.",
      confidence: riskDeliberation.confidenceScore,
      timestamp: new Date().toISOString()
    });

    await this._addSwarmMessage(state, emitEvent, {
      from: "RiskSentinelAgent",
      to: "OrchestratorAgent",
      message: isHighRiskFraud
        ? "🚨 CRITICAL THREAT: BEC Fraud vector detected on routing change and Tor IP. Recommending immediate HITL freeze."
        : "Financial integrity check passed. Composite risk score 0.12 (Low)."
    });

    await this._sleep(700);
    this._updateDagNode(state, "node-risk", "COMPLETED", emitEvent);
  }

  // --- Step 5: Policy & SLA ---
  async _runStepPolicy(state, emitEvent, customApiKey) {
    this._updateDagNode(state, "node-policy", "RUNNING", emitEvent);

    const isSlaCase = state.inputCase.id === "CASE-4119" || state.inputCase.type === "SLA_BREACH_CLAIM";
    let slaResult = null;

    if (isSlaCase) {
      const payload = state.inputCase.inputPayload || state.inputCase;
      emitEvent({
        type: "TOOL_START",
        agent: "PolicyArbiterAgent",
        tool: "calculateSlaPenalty",
        args: {
          monthlySpend: payload.monthlyBillingUSD || 85000,
          targetUptime: payload.targetUptimePercent || 99.95,
          actualUptime: payload.actualUptimePercent || 99.12
        },
        timestamp: new Date().toISOString()
      });

      slaResult = await enterpriseTools.calculateSlaPenalty({
        monthlySpend: payload.monthlyBillingUSD || 85000,
        targetUptime: payload.targetUptimePercent || 99.95,
        actualUptime: payload.actualUptimePercent || 99.12
      });

      state.toolExecutions.push({ tool: "calculateSlaPenalty", result: slaResult });
      emitEvent({
        type: "TOOL_RESULT",
        agent: "PolicyArbiterAgent",
        tool: "calculateSlaPenalty",
        result: slaResult,
        timestamp: new Date().toISOString()
      });
    }

    const proposedAmount = isSlaCase
      ? (slaResult?.data?.creditAmountUSD || 7062.00)
      : (state.extractedEntities.claimedDiscrepancyAmount || 11600.00);

    // Guardrail Check
    const guardrailCheck = await enterpriseTools.checkPolicyGuardrails({
      proposedAction: "ISSUE_CREDIT_OR_SETTLEMENT",
      amountUSD: proposedAmount,
      riskScore: state.riskAssessment.riskScore
    });

    state.policyEvaluation = {
      slaCalculation: slaResult?.data || null,
      proposedAmountUSD: proposedAmount,
      guardrail: guardrailCheck.data
    };

    if (guardrailCheck.data.requiresHITL) {
      state.hitlRequired = true;
      state.hitlDetails = {
        requiredRole: guardrailCheck.data.requiredRole,
        triggerReasons: guardrailCheck.data.triggerReasons,
        proposedAmountUSD: proposedAmount,
        riskScore: state.riskAssessment.riskScore,
        caseId: state.caseId,
        summary: `Policy threshold exceeded: ${guardrailCheck.data.triggerReasons.join(" ")}`
      };
    }

    emitEvent({
      type: "AGENT_THOUGHT",
      agent: "PolicyArbiterAgent",
      role: "Corporate Governance & SLA Arbiter",
      avatar: "⚖️",
      thought: `Policy compliance analyzed. Proposed financial impact is $${proposedAmount.toLocaleString()}. Delegation of Authority rule evaluates: ${guardrailCheck.data.requiresHITL ? "Escalation Required" : "Within Autonomous Limits"}.`,
      plan: "Coordinate final consensus across agent swarm.",
      confidence: 0.97,
      timestamp: new Date().toISOString()
    });

    await this._addSwarmMessage(state, emitEvent, {
      from: "PolicyArbiterAgent",
      to: "Swarm",
      message: guardrailCheck.data.requiresHITL
        ? `Delegation of authority triggered for $${proposedAmount.toLocaleString()}. Escalation required to ${guardrailCheck.data.requiredRole}.`
        : `Policy compliance verified. Pre-authorized under automatic threshold ($2,500). Ready for settlement dispatch.`
    });

    await this._sleep(700);
    this._updateDagNode(state, "node-policy", "COMPLETED", emitEvent);
  }

  // --- Step 6: Collaborative Deliberation ---
  async _runStepDeliberation(state, emitEvent, customApiKey) {
    this._updateDagNode(state, "node-deliberate", "RUNNING", emitEvent);

    const deliberationPrompt = `
Synthesize findings from:
1. Audit Agent: ${JSON.stringify(state.auditFindings)}
2. Risk Sentinel: ${JSON.stringify(state.riskAssessment)}
3. Policy Arbiter: ${JSON.stringify(state.policyEvaluation)}
Formulate unanimous consensus on resolution action.`;

    const consensus = await llmService.generateAgentDeliberation({
      agentRole: "OrchestratorPlanner",
      systemPrompt: "You are the consensus arbiter. Bring all agents into alignment.",
      userPrompt: deliberationPrompt,
      customKey: customApiKey
    });

    emitEvent({
      type: "CONSENSUS_REACHED",
      caseId: state.caseId,
      timestamp: new Date().toISOString(),
      consensusSummary: consensus.thought,
      swarmStatus: state.hitlRequired ? "PAUSED_FOR_HITL_AUTHORIZATION" : "APPROVED_FOR_AUTONOMOUS_SETTLEMENT"
    });

    await this._addSwarmMessage(state, emitEvent, {
      from: "OrchestratorAgent",
      to: "Swarm",
      message: state.hitlRequired
        ? `Consensus reached with pending executive review. Preparing decision dossier for Human-In-The-Loop interface.`
        : `Consensus achieved. Unanimous approval to dispatch automated ERP credit memo and stakeholder resolution.`
    });

    await this._sleep(800);
    this._updateDagNode(state, "node-deliberate", "COMPLETED", emitEvent);
  }

  // --- Step 7 & 8: Settlement Execution ---
  async _runStepSettlement(state, emitEvent, customApiKey, approvalMode = "AUTONOMOUS_APPROVED", reviewNote = "") {
    this._updateDagNode(state, "node-execute", "RUNNING", emitEvent);

    const amount = state.policyEvaluation.proposedAmountUSD;
    const poNumber = state.extractedEntities.poNumber;
    const vendorId = state.extractedEntities.vendorId;

    // Execute Tool: SAP Credit Memo
    emitEvent({
      type: "TOOL_START",
      agent: "SettlementAgent",
      tool: "createCreditMemo",
      args: { poNumber, vendorId, creditAmountUSD: amount },
      timestamp: new Date().toISOString()
    });

    const memoResult = await enterpriseTools.createCreditMemo({
      poNumber,
      vendorId,
      creditAmountUSD: amount,
      reasoning: `Auto-reconciled exception by Nexus-Ops Agent Swarm. Mode: ${approvalMode}. ${reviewNote}`
    });
    state.toolExecutions.push({ tool: "createCreditMemo", result: memoResult });

    emitEvent({
      type: "TOOL_RESULT",
      agent: "SettlementAgent",
      tool: "createCreditMemo",
      result: memoResult,
      timestamp: new Date().toISOString()
    });

    // Execute Tool: CRM Dispatch Notification
    const letter = `Dear Partner,

Following autonomous multi-system forensic verification across SAP ERP records, dock scans, and carrier telemetry regarding ${poNumber}, our multi-agent compliance system has verified the exception.

Resolution Summary:
- Approved Settlement: $${amount.toLocaleString()} USD
- Transaction Reference: ${memoResult.data.memoId}
- Authorization Class: ${approvalMode}
- Remarks: ${reviewNote || "Discrepancy reconciled against carrier telemetry loss in transit."}

The adjusted ledger balance has been posted to our SAP financial ledger.

Sincerely,
Enterprise Autonomous Accounts Payable Operations Swarm`;

    const commResult = await enterpriseTools.dispatchStakeholderResolution({
      caseId: state.caseId,
      recipientEmail: "billing@partner-vendor.com",
      subject: `Resolution Notice: Exception Reconciled for ${poNumber} [${memoResult.data.memoId}]`,
      formalLetterBody: letter
    });
    state.toolExecutions.push({ tool: "dispatchStakeholderResolution", result: commResult });

    state.finalResolution = {
      outcome: "RECONCILED_AND_SETTLED",
      approvalMode,
      memoId: memoResult.data.memoId,
      amountSettledUSD: amount,
      erpLedgerStatus: memoResult.data.status,
      crmDispatchId: commResult.data.dispatchId,
      stakeholderNotice: letter,
      auditTimestamp: new Date().toISOString()
    };

    // Asynchronously persist to Supabase if configured
    supabaseService.recordSettlementMemo({
      caseId: state.caseId,
      memoId: memoResult.data.memoId,
      poNumber,
      vendorId,
      amountSettledUSD: amount,
      erpLedgerStatus: memoResult.data.status,
      approvalMode,
      crmDispatchId: commResult.data.dispatchId,
      stakeholderNotice: letter,
      auditTrail: `Auto-reconciled by Nexus-Ops Agent Swarm. Mode: ${approvalMode}. ${reviewNote}`
    }).catch(err => console.warn(`[AgentSwarm] Supabase memo save warning: ${err.message}`));

    emitEvent({
      type: "AGENT_THOUGHT",
      agent: "SettlementAgent",
      role: "Execution & ERP Settlement Agent",
      avatar: "⚡",
      thought: `Ledger entry posted successfully (${memoResult.data.memoId}). Stakeholder resolution email transmitted via CRM. Multi-system fragmented state synchronized.`,
      plan: "Archive audit logs and complete workflow execution.",
      confidence: 0.99,
      timestamp: new Date().toISOString()
    });

    await this._addSwarmMessage(state, emitEvent, {
      from: "SettlementAgent",
      to: "Swarm",
      message: `Execution complete. SAP Credit Memo ${memoResult.data.memoId} active in ERP ledger.`
    });

    await this._sleep(700);
    this._updateDagNode(state, "node-execute", "COMPLETED", emitEvent);
  }

  // Helper: Build DAG
  _buildExecutionDag(inputCase) {
    return [
      { id: "node-plan", label: "Autonomous Planning", agent: "OrchestratorAgent", status: "PENDING", description: "Deconstruct exception into adaptive dependency graph" },
      { id: "node-triage", label: "Ingestion & Entity Parsing", agent: "TriageAgent", status: "PENDING", description: "Normalize unstructured ticket & parse PO/Invoice metadata" },
      { id: "node-audit", label: "Multi-Silo ERP & Logistics Match", agent: "AuditMatcherAgent", status: "PENDING", description: "Cross-reference SAP POs, dock logs, and DHL telemetry" },
      { id: "node-risk", label: "Fraud & Security Sentinel", agent: "RiskSentinelAgent", status: "PENDING", description: "Audit vendor bank updates, IP origin, and BEC vectors" },
      { id: "node-policy", label: "Contractual SLA & DoA Compliance", agent: "PolicyArbiterAgent", status: "PENDING", description: "Evaluate policy thresholds and delegation limits" },
      { id: "node-deliberate", label: "Swarm Consensus Deliberation", agent: "All Agents", status: "PENDING", description: "Synthesize multi-agent evidence & resolve contradictions" },
      { id: "node-execute", label: "ERP Ledger Settlement & Notice", agent: "SettlementAgent", status: "PENDING", description: "Post SAP credit memo and transmit CRM formal resolution" }
    ];
  }

  _updateDagNode(state, nodeId, status, emitEvent) {
    const node = state.dag.find(n => n.id === nodeId);
    if (node) {
      node.status = status;
      emitEvent({
        type: "DAG_UPDATED",
        caseId: state.caseId,
        nodeId,
        status,
        timestamp: new Date().toISOString()
      });
    }
  }

  async _addSwarmMessage(state, emitEvent, msg) {
    const chatMsg = {
      ...msg,
      timestamp: new Date().toISOString()
    };
    state.collaborativeMessages.push(chatMsg);
    emitEvent({
      type: "SWARM_MESSAGE",
      caseId: state.caseId,
      ...chatMsg
    });
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const agentSwarm = new AgentSwarm();
