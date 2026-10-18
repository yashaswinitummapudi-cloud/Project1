-- ==============================================================================
-- NEXUS-OPS AUTONOMOUS MULTI-AGENT DATABASE SCHEMA FOR SUPABASE
-- Run this SQL in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Cases Table (Enterprise Exception Queue)
CREATE TABLE IF NOT EXISTS public.nexus_cases (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'HIGH',
  difficulty TEXT,
  summary TEXT,
  input_payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Settlement Memos Table (Audited Ledger Postings)
CREATE TABLE IF NOT EXISTS public.nexus_settlement_memos (
  id TEXT PRIMARY KEY,
  case_id TEXT REFERENCES public.nexus_cases(id) ON DELETE CASCADE,
  memo_id TEXT NOT NULL,
  po_number TEXT,
  vendor_id TEXT,
  credit_amount_usd NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'POSTED_TO_SAP_LEDGER',
  approval_mode TEXT NOT NULL DEFAULT 'AUTONOMOUS_APPROVED',
  crm_dispatch_id TEXT,
  stakeholder_notice TEXT,
  audit_trail TEXT,
  posted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Swarm Execution Audit Logs Table (Agent Thoughts & Deliberations)
CREATE TABLE IF NOT EXISTS public.nexus_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  case_id TEXT REFERENCES public.nexus_cases(id) ON DELETE CASCADE,
  agent TEXT NOT NULL,
  role TEXT,
  event_type TEXT NOT NULL,
  content JSONB NOT NULL,
  confidence NUMERIC(4, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enterprise Silos Table (Fragmented System State)
CREATE TABLE IF NOT EXISTS public.nexus_enterprise_silos (
  silo_name TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- Enable Row Level Security (RLS) & Public Policies for Demo/App Access
-- ==============================================================================
ALTER TABLE public.nexus_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nexus_settlement_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nexus_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nexus_enterprise_silos ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated roles full read/write for application operations
CREATE POLICY "Allow public read on nexus_cases" ON public.nexus_cases FOR SELECT USING (true);
CREATE POLICY "Allow public insert on nexus_cases" ON public.nexus_cases FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on nexus_cases" ON public.nexus_cases FOR UPDATE USING (true);

CREATE POLICY "Allow public read on nexus_settlement_memos" ON public.nexus_settlement_memos FOR SELECT USING (true);
CREATE POLICY "Allow public insert on nexus_settlement_memos" ON public.nexus_settlement_memos FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on nexus_audit_logs" ON public.nexus_audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on nexus_audit_logs" ON public.nexus_audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on nexus_enterprise_silos" ON public.nexus_enterprise_silos FOR SELECT USING (true);
CREATE POLICY "Allow public write on nexus_enterprise_silos" ON public.nexus_enterprise_silos FOR ALL USING (true);

-- ==============================================================================
-- Seed Initial Enterprise Cases
-- ==============================================================================
INSERT INTO public.nexus_cases (id, title, category, urgency, difficulty, summary, input_payload, status)
VALUES
(
  'CASE-1205',
  'Damaged Transit Carton Auto-Credit Reconciliation',
  'Supply Chain & Auto-Settlement',
  'LOW',
  'Autonomous 3-Way Match & Automatic Ledger Posting (Zero Human Intervention)',
  'Single laptop carton reported damaged on delivery for PO-8902 ($1,450 variance). Amount is within the autonomous $2,500 threshold and vendor risk score is 0.12 (Tier 1 Strategic).',
  '{"caseId": "CASE-1205", "type": "INVOICE_DISCREPANCY", "poNumber": "PO-8902", "trackingNumber": "TRK-9811204", "vendorId": "VEND-TECH-882", "claimedDiscrepancyAmount": 1450.00, "claimedCurrency": "USD", "vendorInvoiceNumber": "INV-2026-9042"}'::jsonb,
  'PENDING'
),
(
  'CASE-8902',
  'Vendor Invoice vs Dock Count Short-Shipment Exception',
  'Supply Chain & Accounts Payable',
  'HIGH',
  'Multi-system cross-check (ERP + DHL Telemetry + Weight Variance)',
  'Vendor Apex Hardware billed $116,000 for 80 laptops under PO-8902. Warehouse dock scanner recorded only 72 laptops received (variance of 8 units = $11,600). Vendor claims carrier damage/loss.',
  '{"caseId": "CASE-8902", "type": "INVOICE_DISCREPANCY", "poNumber": "PO-8902", "trackingNumber": "TRK-9811204", "vendorId": "VEND-TECH-882", "claimedDiscrepancyAmount": 11600.00, "claimedCurrency": "USD", "vendorInvoiceNumber": "INV-2026-9041"}'::jsonb,
  'PENDING'
),
(
  'CASE-4119',
  'Cloud Infrastructure SLA Outage Credit Claim',
  'IT Operations & Contractual Compliance',
  'CRITICAL',
  'Contract Clause Extraction + Metric Verification + Formula Credit Calculation',
  'Internal engineering filed a breach claim against SaaS provider SkyPulse for 6.2 hours of cluster downtime in September (99.12% actual vs 99.95% committed).',
  '{"caseId": "CASE-4119", "type": "SLA_BREACH_CLAIM", "poNumber": "PO-4119", "vendorId": "VEND-CLOUD-901", "contractRef": "CTR-SKY-2026-A", "targetUptimePercent": 99.95, "actualUptimePercent": 99.12, "monthlyBillingUSD": 85000.00}'::jsonb,
  'PENDING'
),
(
  'CASE-7721',
  'High-Risk Banking Routing Change & Duplicate Freight Invoice',
  'Financial Fraud & Risk Containment',
  'CRITICAL_FRAUD_ALERT',
  'Fraud Vector Correlation + IP Anomaly Detection + HITL Hard Guardrail',
  'Invoice received for $42,000 from Veritas Logistics. Vendor profile shows routing number modified 4 days ago to an offshore bank, and invoice was uploaded from a Tor exit node.',
  '{"caseId": "CASE-7721", "type": "HIGH_RISK_INVOICE_AUDIT", "poNumber": "PO-7721", "vendorId": "VEND-GLOBAL-404", "claimedDiscrepancyAmount": 42000.00, "claimedCurrency": "USD", "vendorInvoiceNumber": "INV-VER-7721"}'::jsonb,
  'PENDING'
)
ON CONFLICT (id) DO NOTHING;
