/**
 * cases.js
 * Pre-configured real-world enterprise exception cases demonstrating
 * fragmented workflows, repetitive decision-making, multi-agent collaboration, and HITL guardrails.
 */

export const enterpriseCases = [
  {
    id: "CASE-1205",
    title: "Damaged Transit Carton Auto-Credit Reconciliation",
    category: "Supply Chain & Auto-Settlement",
    urgency: "LOW",
    difficulty: "Autonomous 3-Way Match & Automatic Ledger Posting (Zero Human Intervention)",
    summary: "Single laptop carton reported damaged on delivery for PO-8902 ($1,450 variance). Amount is within the autonomous $2,500 threshold and vendor risk score is 0.12 (Tier 1 Strategic). The multi-agent swarm plans, cross-checks, and auto-posts the credit memo with zero human intervention.",
    inputPayload: {
      caseId: "CASE-1205",
      type: "INVOICE_DISCREPANCY",
      poNumber: "PO-8902",
      trackingNumber: "TRK-9811204",
      vendorId: "VEND-TECH-882",
      claimedDiscrepancyAmount: 1450.00,
      claimedCurrency: "USD",
      vendorInvoiceNumber: "INV-2026-9042",
      emailBody: `From: logistics@apexhardware.com
Subject: In-transit carton damage acknowledgment: PO-8902

Dear AP Team,
Following carrier notification, carton #72 incurred forklift puncture during transit. We have authorized an immediate $1,450.00 line item credit against PO-8902. Please auto-reconcile in your ERP.`
    }
  },
  {
    id: "CASE-8902",
    title: "Vendor Invoice vs Dock Count Short-Shipment Exception",
    category: "Supply Chain & Accounts Payable",
    urgency: "HIGH",
    difficulty: "Multi-system cross-check (ERP + DHL Telemetry + Weight Variance)",
    summary: "Vendor Apex Hardware billed $116,000 for 80 laptops under PO-8902. Warehouse dock scanner recorded only 72 laptops received (variance of 8 units = $11,600). Vendor claims carrier damage/loss. DHL telemetry shows weight drop in transit.",
    inputPayload: {
      caseId: "CASE-8902",
      type: "INVOICE_DISCREPANCY",
      poNumber: "PO-8902",
      trackingNumber: "TRK-9811204",
      vendorId: "VEND-TECH-882",
      claimedDiscrepancyAmount: 11600.00,
      claimedCurrency: "USD",
      vendorInvoiceNumber: "INV-2026-9041",
      emailBody: `From: billing@apexhardware.com
Subject: Discrepancy on PO-8902 Payment (Invoice INV-2026-9041)

Hello Accounts Payable,
Our records indicate we dispatched 80 Dell Latitude 7440 laptops via DHL Express under tracking TRK-9811204 against purchase order PO-8902. 
You withheld $11,600 from our remittance. We fulfilled our FOB shipping point obligations. Please investigate with your receiving warehouse and issue the remaining balance immediately.`
    }
  },
  {
    id: "CASE-4119",
    title: "Cloud Infrastructure SLA Outage Credit Claim",
    category: "IT Operations & Contractual Compliance",
    urgency: "CRITICAL",
    difficulty: "Contract Clause Extraction + Metric Verification + Formula Credit Calculation",
    summary: "Internal engineering filed a breach claim against SaaS provider SkyPulse for 6.2 hours of cluster downtime in September (99.12% actual vs 99.95% committed). Multi-agent system must verify monitoring logs, calculate SLA credit using contract penalty formula, and issue credit memo.",
    inputPayload: {
      caseId: "CASE-4119",
      type: "SLA_BREACH_CLAIM",
      poNumber: "PO-4119",
      vendorId: "VEND-CLOUD-901",
      contractRef: "CTR-SKY-2026-A",
      targetUptimePercent: 99.95,
      actualUptimePercent: 99.12,
      monthlyBillingUSD: 85000.00,
      emailBody: `From: sre-lead@enterprise.internal
Subject: SLA Credit Request: September Outage Incident #INC-9921

Hi Vendor Management,
SkyPulse Cloud dedicated cluster suffered a catastrophic network routing partition on Sep 18. Actual uptime was 99.12%, breaching our contractual 99.95% SLA. Per section 8.4 of contract CTR-SKY-2026-A, we are entitled to compensatory credits. Please calculate and apply the penalty credit to our upcoming invoice.`
    }
  },
  {
    id: "CASE-7721",
    title: "High-Risk Banking Routing Change & Duplicate Freight Invoice",
    category: "Financial Fraud & Risk Containment",
    urgency: "CRITICAL_FRAUD_ALERT",
    difficulty: "Fraud Vector Correlation + IP Anomaly Detection + HITL Hard Guardrail",
    summary: "Invoice received for $42,000 from Veritas Logistics. Vendor profile shows routing number modified 4 days ago to an offshore bank, and invoice was uploaded from a Tor exit node. The agent must catch the fraud vectors and halt for Human-in-the-Loop executive review.",
    inputPayload: {
      caseId: "CASE-7721",
      type: "HIGH_RISK_INVOICE_AUDIT",
      poNumber: "PO-7721",
      vendorId: "VEND-GLOBAL-404",
      claimedDiscrepancyAmount: 42000.00,
      claimedCurrency: "USD",
      vendorInvoiceNumber: "INV-VER-7721",
      emailBody: `From: accounting@veritas-freight-corp.cc
Subject: Urgent Payment Notice: Freight Invoice INV-VER-7721

Dear Finance Team,
Please note our updated remittance details for offshore accounts. Remit $42,000 for international logistics services under PO-7721 directly to First Offshore Commercial Bank Belize, routing 071000013, account ending 9910. Immediate payment required within 24 hours to avoid demurrage penalties.`
    }
  }
];
