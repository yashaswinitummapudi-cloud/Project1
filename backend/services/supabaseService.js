/**
 * supabaseService.js
 * Supabase Database Service for Nexus-Ops Backend.
 * Manages PostgreSQL persistence for Cases, Audited Settlement Memos, Agent Thought Logs,
 * and Enterprise Silo snapshots.
 * 
 * Provides automated fallback to local state if credentials are not yet configured.
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { enterpriseCases } from "../data/cases.js";
import { mockEnterpriseDb } from "../data/enterpriseDb.js";

dotenv.config();

export class SupabaseService {
  constructor() {
    this.url = process.env.SUPABASE_URL || "";
    this.key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
    this.client = null;
    this.isConnected = false;
    this.localCases = [...enterpriseCases];

    this.init();
  }

  init() {
    const isPlaceholder = !this.url || this.url.includes("your-project-id") || !this.key || this.key.includes("your-supabase");

    if (!isPlaceholder && this.url.startsWith("https://")) {
      try {
        this.client = createClient(this.url, this.key, {
          auth: { persistSession: false }
        });
        console.log(`[SupabaseService] Initialized client for: ${this.url}`);
      } catch (err) {
        console.warn(`[SupabaseService] Failed to initialize client: ${err.message}`);
        this.client = null;
      }
    } else {
      console.log(`[SupabaseService] Running in Local Memory Mode (Supabase URL/Key pending).`);
      this.client = null;
    }
  }

  isConfigured() {
    return Boolean(this.client);
  }

  /**
   * Test live connectivity to Supabase
   */
  async testConnection() {
    if (!this.client) {
      return {
        connected: false,
        mode: "LOCAL_FALLBACK",
        message: "Supabase credentials are placeholder or unconfigured. Running in local resilient mode."
      };
    }

    try {
      const { data, error } = await this.client
        .from("nexus_cases")
        .select("id")
        .limit(1);

      if (error) {
        return {
          connected: false,
          mode: "ERROR",
          error: error.message,
          hint: "Ensure you have executed supabase_schema.sql in your Supabase SQL editor."
        };
      }

      this.isConnected = true;
      return {
        connected: true,
        mode: "LIVE_SUPABASE_POSTGRES",
        message: "Successfully connected to Supabase PostgreSQL database."
      };
    } catch (err) {
      return {
        connected: false,
        mode: "NETWORK_ERROR",
        error: err.message
      };
    }
  }

  /**
   * Fetch all cases (Supabase -> fallback to local enterpriseCases)
   */
  async getCases() {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from("nexus_cases")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map(row => ({
            id: row.id,
            title: row.title,
            category: row.category,
            urgency: row.urgency,
            difficulty: row.difficulty,
            summary: row.summary,
            status: row.status,
            inputPayload: row.input_payload
          }));
        }
      } catch (err) {
        console.warn(`[SupabaseService] Error fetching cases, using fallback: ${err.message}`);
      }
    }

    return [...this.localCases];
  }

  /**
   * Save a newly ingested custom case
   */
  async saveCase(caseObj) {
    this.localCases.unshift(caseObj);

    if (this.client) {
      try {
        const { data, error } = await this.client
          .from("nexus_cases")
          .insert({
            id: caseObj.id,
            title: caseObj.title,
            category: caseObj.category,
            urgency: caseObj.urgency || "HIGH",
            difficulty: caseObj.difficulty || "Custom Case",
            summary: caseObj.summary,
            input_payload: caseObj.inputPayload || caseObj,
            status: caseObj.status || "PENDING"
          })
          .select();

        if (!error) {
          console.log(`[SupabaseService] Case ${caseObj.id} saved to Supabase.`);
          return data[0];
        } else {
          console.warn(`[SupabaseService] Insert error: ${error.message}`);
        }
      } catch (err) {
        console.warn(`[SupabaseService] Failed to insert case to Supabase: ${err.message}`);
      }
    }

    return caseObj;
  }

  /**
   * Record audited settlement memo in Supabase
   */
  async recordSettlementMemo(memoData) {
    if (this.client) {
      try {
        const { error } = await this.client
          .from("nexus_settlement_memos")
          .insert({
            id: `MEMO-${Date.now()}`,
            case_id: memoData.caseId,
            memo_id: memoData.memoId,
            po_number: memoData.poNumber,
            vendor_id: memoData.vendorId,
            credit_amount_usd: memoData.amountSettledUSD,
            status: memoData.erpLedgerStatus || "POSTED_TO_SAP_LEDGER",
            approval_mode: memoData.approvalMode || "AUTONOMOUS_APPROVED",
            crm_dispatch_id: memoData.crmDispatchId,
            stakeholder_notice: memoData.stakeholderNotice,
            audit_trail: memoData.auditTrail || "Auto-reconciled by Nexus-Ops Swarm"
          });

        if (error) {
          console.warn(`[SupabaseService] Memo insert error: ${error.message}`);
        } else {
          console.log(`[SupabaseService] Settlement Memo ${memoData.memoId} recorded in Supabase.`);
        }
      } catch (err) {
        console.warn(`[SupabaseService] Failed to record memo: ${err.message}`);
      }
    }
  }

  /**
   * Log an agent thought / tool call event for forensic audit trail
   */
  async logAuditEvent({ caseId, agent, role, eventType, content, confidence }) {
    if (this.client) {
      try {
        await this.client
          .from("nexus_audit_logs")
          .insert({
            case_id: caseId,
            agent: agent || "OrchestratorAgent",
            role: role || "System",
            event_type: eventType,
            content: content || {},
            confidence: confidence || null
          });
      } catch (e) {
        // Silently tolerate log failure
      }
    }
  }
}

export const supabaseService = new SupabaseService();
