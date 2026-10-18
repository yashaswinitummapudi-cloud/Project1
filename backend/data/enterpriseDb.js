/**
 * enterpriseDb.js
 * Simulated enterprise data silos representing fragmented corporate systems:
 * 1. SAP/NetSuite ERP (POs, Invoices, Warehouse Receipts)
 * 2. DHL/FedEx Logistics Tracking (Telemetric signatures, weight receipts)
 * 3. Stripe & Global Banking (Vendor bank records, SWIFT, transaction history)
 * 4. Enterprise Contracts & SLA Policy Repository
 */

export const mockEnterpriseDb = {
  // SAP ERP Purchase Orders & Line Items
  purchaseOrders: {
    "PO-8902": {
      poNumber: "PO-8902",
      vendorId: "VEND-TECH-882",
      vendorName: "Apex Hardware Systems Ltd.",
      totalAmount: 116000.00,
      currency: "USD",
      status: "PARTIALLY_RECEIVED",
      orderDate: "2026-09-12",
      items: [
        { sku: "DELL-LAT-7440", description: "Latitude 7440 Ultrabooks 32GB", unitPrice: 1450.00, orderedQty: 80, receivedQty: 72 }
      ],
      dockReceipt: {
        receiptId: "RCV-DOCK-4401",
        receivedAt: "2026-10-02T14:22:00Z",
        dockInspector: "Marcus Vance",
        scannedCount: 72,
        discrepancyNote: "Pallet #3 delivered with seal broken. 8 units unaccounted for on manifest dock check."
      }
    },
    "PO-4119": {
      poNumber: "PO-4119",
      vendorId: "VEND-CLOUD-901",
      vendorName: "SkyPulse Cloud Networks Inc.",
      totalAmount: 85000.00,
      currency: "USD",
      status: "ACTIVE_SERVICE",
      orderDate: "2026-01-01",
      items: [
        { sku: "CLOUD-INFRA-DEDICATED", description: "Dedicated Enterprise Kubernetes Cluster", unitPrice: 85000.00, orderedQty: 1, receivedQty: 1 }
      ],
      contractRef: "CTR-SKY-2026-A",
      slaCommitment: 99.95,
      actualUptimePastMonth: 99.12
    },
    "PO-7721": {
      poNumber: "PO-7721",
      vendorId: "VEND-GLOBAL-404",
      vendorName: "Veritas Logistics Fleet Group",
      totalAmount: 42000.00,
      currency: "USD",
      status: "PENDING_PAYMENT",
      orderDate: "2026-10-05",
      items: [
        { sku: "FREIGHT-OCT-INTL", description: "Q3 Multi-modal Cross-Pacific Freight Handling", unitPrice: 42000.00, orderedQty: 1, receivedQty: 1 }
      ]
    }
  },

  // Logistics & Telemetry (DHL / FedEx / Freight)
  logistics: {
    "TRK-9811204": {
      carrier: "DHL Express Freight",
      trackingNumber: "TRK-9811204",
      origin: "Austin Assembly Facility, TX",
      destination: "Chicago Central Fulfillment Hub #4, IL",
      dispatchedWeightKg: 198.4,
      deliveredWeightKg: 178.6,
      status: "DELIVERED_WITH_EXCEPTION",
      deliveryTimestamp: "2026-10-02T13:45:10Z",
      signedBy: "M. Vance (Security Gate 4)",
      incidentLog: [
        { time: "2026-09-30T18:10:00Z", event: "Hub Transfer Indianapolis: Package re-taped after conveyor jam" },
        { time: "2026-10-02T13:45:00Z", event: "Delivery completed with weight discrepancy notice" }
      ]
    },
    "TRK-3391081": {
      carrier: "FedEx Freight Cargo",
      trackingNumber: "TRK-3391081",
      origin: "Seattle, WA",
      destination: "New York Data Center, NY",
      status: "COMPLETED",
      deliveryTimestamp: "2026-10-06T09:12:00Z",
      signedBy: "J. Doe"
    }
  },

  // Vendor Bank Ledger & Fraud Signals
  vendorMaster: {
    "VEND-TECH-882": {
      vendorId: "VEND-TECH-882",
      name: "Apex Hardware Systems Ltd.",
      tier: "Tier-1 Strategic",
      historicalTransactionVolume: 4200000.00,
      disputeRatePercent: 0.4,
      bankAccountLast4: "4419",
      bankRoutingNumber: "021000021",
      bankName: "JPMorgan Chase Enterprise",
      lastBankUpdate: "2024-03-15",
      riskScore: 0.12 // Low risk
    },
    "VEND-CLOUD-901": {
      vendorId: "VEND-CLOUD-901",
      name: "SkyPulse Cloud Networks Inc.",
      tier: "Tier-1 Strategic SaaS",
      historicalTransactionVolume: 1200000.00,
      disputeRatePercent: 1.1,
      bankAccountLast4: "8832",
      bankRoutingNumber: "121000358",
      bankName: "Silicon Valley Bank",
      lastBankUpdate: "2025-01-10",
      riskScore: 0.08
    },
    "VEND-GLOBAL-404": {
      vendorId: "VEND-GLOBAL-404",
      name: "Veritas Logistics Fleet Group",
      tier: "Tier-3 General Supplier",
      historicalTransactionVolume: 180000.00,
      disputeRatePercent: 4.8,
      bankAccountLast4: "9910",
      bankRoutingNumber: "071000013",
      bankName: "First Offshore Commercial Bank (Belize)",
      lastBankUpdate: "2026-10-14T03:12:00Z", // CHANGED 4 DAYS AGO!
      submissionIp: "185.220.101.45 (Tor Exit Node / Anonymous Proxy)",
      riskScore: 0.94 // CRITICAL FRAUD ANOMALY
    }
  },

  // Corporate Policies & Thresholds
  enterprisePolicies: {
    delegationOfAuthority: {
      autoApproveMaxAmountUSD: 2500.00,
      managerApprovalMaxAmountUSD: 25000.00,
      vpExecutiveApprovalMaxAmountUSD: 100000.00
    },
    discrepancyRules: {
      carrierWeightLossThresholdKg: 5.0,
      shortShipmentAutoCreditAllowed: true,
      slaPenaltyFormula: "((TargetUptime - ActualUptime) / TargetUptime) * MonthlySpend * 10",
      bankChangeQuarantineWindowHours: 72 // Require manual dual-authorization if bank changed in < 72h
    }
  },

  // Mock CRM / Zendesk Support Tickets
  supportTickets: {
    "TICK-8902": {
      ticketId: "TICK-8902",
      subject: "Hardware shipment discrepancy notice: PO-8902 invoice balance",
      customerOrVendor: "billing@apexhardware.com",
      status: "OPEN_DISPUTE",
      priority: "HIGH",
      history: [
        { from: "Vendor Billing", message: "We billed for 80 units ($116,000). Payment received was only $104,400. Please clear the pending $11,600." }
      ]
    },
    "TICK-4119": {
      ticketId: "TICK-4119",
      subject: "SLA Failure Claim: September Cloud Infrastructure Outage",
      customerOrVendor: "cto@megacorp.internal",
      status: "OPEN_CLAIM",
      priority: "CRITICAL",
      history: [
        { from: "Internal SRE", message: "Cluster was unreachable for 6.2 hours in Sep (99.12% uptime). Contract states 10x prorated credit for uptime breaches below 99.5%." }
      ]
    }
  }
};
