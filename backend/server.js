/**
 * server.js
 * Express backend server for Nexus-Ops Autonomous Agentic AI Workflow Engine.
 * Provides REST APIs, real-time Server-Sent Events (SSE) streaming,
 * enterprise tool runners, and Human-In-The-Loop (HITL) authorization endpoints.
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { enterpriseCases } from "./data/cases.js";
import { mockEnterpriseDb } from "./data/enterpriseDb.js";
import { agentSwarm } from "./agents/agentSwarm.js";
import { llmService } from "./services/llmService.js";
import { supabaseService } from "./services/supabaseService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// In-memory active case lookup
let caseRegistry = [...enterpriseCases];

/**
 * Health check with Supabase & LLM status
 */
app.get("/api/health", async (req, res) => {
  const supabaseConn = await supabaseService.testConnection();
  res.json({
    status: "HEALTHY",
    version: "2.5.0",
    engine: "Nexus-Ops Autonomous Multi-Agent Swarm",
    llmConfigured: llmService.isConfigured(),
    activeModel: llmService.modelName,
    supabase: {
      configured: supabaseService.isConfigured(),
      ...supabaseConn
    }
  });
});

/**
 * Get all available enterprise cases from Supabase or local seed
 */
app.get("/api/cases", async (req, res) => {
  const cases = await supabaseService.getCases();
  caseRegistry = cases;
  res.json({
    success: true,
    total: caseRegistry.length,
    cases: caseRegistry,
    source: supabaseService.isConfigured() ? "SUPABASE_POSTGRESQL" : "LOCAL_DATA_SEED"
  });
});

/**
 * Get single case
 */
app.get("/api/cases/:id", (req, res) => {
  const target = caseRegistry.find(c => c.id === req.params.id);
  if (!target) {
    return res.status(404).json({ success: false, error: "Case not found" });
  }
  res.json({ success: true, case: target });
});

/**
 * Ingest custom business problem case
 */
app.post("/api/cases/custom", async (req, res) => {
  const { title, category, description, poNumber, claimedAmount, vendorId, trackingNumber } = req.body;
  const newId = `CASE-CUST-${Math.floor(1000 + Math.random() * 9000)}`;

  const newCase = {
    id: newId,
    title: title || "Custom Enterprise Discrepancy & Workflow Exception",
    category: category || "General Corporate Operations",
    urgency: "HIGH",
    difficulty: "Dynamic Agentic Deliberation & Silo Synthesis",
    summary: description || "User-submitted custom business workflow exception requiring autonomous planning and execution.",
    inputPayload: {
      caseId: newId,
      type: "CUSTOM_ENTERPRISE_EXCEPTION",
      poNumber: poNumber || "PO-8902",
      trackingNumber: trackingNumber || "TRK-9811204",
      vendorId: vendorId || "VEND-TECH-882",
      claimedDiscrepancyAmount: parseFloat(claimedAmount) || 5000.00,
      claimedCurrency: "USD",
      vendorInvoiceNumber: `INV-CUST-${Math.floor(10000 + Math.random() * 90000)}`,
      emailBody: description || "Custom discrepancy statement submitted via enterprise portal."
    }
  };

  await supabaseService.saveCase(newCase);
  caseRegistry.unshift(newCase);
  res.status(201).json({ success: true, case: newCase });
});

/**
 * Check Supabase database connectivity & status
 */
app.get("/api/supabase/status", async (req, res) => {
  const result = await supabaseService.testConnection();
  res.json({
    success: true,
    configured: supabaseService.isConfigured(),
    url: process.env.SUPABASE_URL || "Not configured",
    ...result
  });
});

/**
 * Inspect Enterprise Data Silos (Fragmented Workflow View)
 */
app.get("/api/enterprise/silos", (req, res) => {
  res.json({
    success: true,
    silos: {
      erpPurchaseOrders: mockEnterpriseDb.purchaseOrders,
      logisticsTracking: mockEnterpriseDb.logistics,
      vendorMasterBanking: mockEnterpriseDb.vendorMaster,
      enterprisePolicies: mockEnterpriseDb.enterprisePolicies,
      supportTickets: mockEnterpriseDb.supportTickets
    }
  });
});

/**
 * Real-time Server-Sent Events (SSE) streaming endpoint
 * Streams live agent thoughts, DAG state updates, tool calls, and swarm consensus
 */
app.get("/api/orchestrate/stream", async (req, res) => {
  const { caseId, apiKey } = req.query;

  const targetCase = caseRegistry.find(c => c.id === caseId);
  if (!targetCase) {
    return res.status(404).json({ error: `Case ${caseId} not found` });
  }

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const emitEvent = (eventData) => {
    try {
      res.write(`data: ${JSON.stringify(eventData)}\n\n`);
    } catch (e) {
      console.warn("Failed to write to SSE stream", e.message);
    }
  };

  // Run the multi-agent execution
  try {
    await agentSwarm.executeCase(targetCase, emitEvent, apiKey || null);
  } catch (err) {
    emitEvent({ type: "FATAL_ERROR", error: err.message });
  }
});

/**
 * Synchronous REST endpoint for headless execution
 */
app.post("/api/orchestrate/run", async (req, res) => {
  const { caseId, apiKey } = req.body;
  const targetCase = caseRegistry.find(c => c.id === caseId);
  if (!targetCase) {
    return res.status(404).json({ success: false, error: "Case not found" });
  }

  const events = [];
  const captureEvent = (evt) => events.push(evt);

  try {
    const finalState = await agentSwarm.executeCase(targetCase, captureEvent, apiKey || null);
    res.json({
      success: true,
      caseId,
      status: finalState.status,
      finalResolution: finalState.finalResolution,
      hitlRequired: finalState.hitlRequired,
      hitlDetails: finalState.hitlDetails,
      eventLogCount: events.length,
      events
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Human-In-The-Loop (HITL) Decision Endpoint
 * Approves, rejects, or requests audit on an exception paused at guardrails
 */
app.post("/api/hitl/decision", async (req, res) => {
  const { caseId, action, reviewerName, note, apiKey } = req.body;

  if (!caseId || !action) {
    return res.status(400).json({ success: false, error: "caseId and action (APPROVE|REJECT|ESCALATE) are required." });
  }

  const events = [];
  const captureEvent = (evt) => events.push(evt);

  try {
    const finalState = await agentSwarm.resumeWithHumanDecision(
      caseId,
      { action, reviewerName: reviewerName || "Executive Officer", note },
      captureEvent,
      apiKey || null
    );

    res.json({
      success: true,
      caseId,
      status: finalState.status,
      finalResolution: finalState.finalResolution,
      events
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Configure LLM Settings
 */
app.post("/api/config/llm", (req, res) => {
  const { apiKey, model } = req.body;
  if (apiKey) {
    llmService.setApiKey(apiKey);
  }
  if (model) {
    llmService.modelName = model;
  }
  res.json({
    success: true,
    isConfigured: llmService.isConfigured(),
    model: llmService.modelName
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` 🚀 NEXUS-OPS Autonomous Multi-Agent Swarm Backend`);
  console.log(` 📡 Running on: http://localhost:${PORT}`);
  console.log(` 🤖 Active LLM Engine: ${llmService.modelName} (API Key: ${llmService.isConfigured() ? "Configured" : "Cognitive Simulation Ready"})`);
  console.log(`====================================================`);
});
