-- =============================================================================
-- 076_p0_remediation.sql
-- P0 remediation: missing FKs and tenant-scoped uniqueness (non-breaking)
-- =============================================================================

-- Debit notes FKs
ALTER TABLE debit_notes
  ADD CONSTRAINT fk_debit_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT fk_debit_merchant FOREIGN KEY (merchant_id) REFERENCES merchants (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT fk_debit_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Credit notes organization FK
ALTER TABLE credit_notes
  ADD CONSTRAINT fk_credit_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Reconciliation record FKs
ALTER TABLE reconciliation_records
  ADD CONSTRAINT fk_recon_rec_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_recon_rec_merchant FOREIGN KEY (merchant_id) REFERENCES merchants (id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_recon_rec_transaction FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_recon_rec_settlement FOREIGN KEY (settlement_id) REFERENCES settlements (id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE reconciliation_imports
  ADD CONSTRAINT fk_recon_import_merchant FOREIGN KEY (merchant_id) REFERENCES merchants (id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Webhook platform FKs
UPDATE merchant_webhooks mw
  JOIN merchants m ON m.id = mw.merchant_id
  SET mw.organization_id = m.organization_id
  WHERE mw.organization_id IS NULL;

ALTER TABLE merchant_webhooks
  ADD CONSTRAINT fk_mw_organization FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE sandbox_simulations
  ADD CONSTRAINT fk_sandbox_sim_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE communication_campaigns
  ADD CONSTRAINT fk_comm_campaign_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Tenant-scoped uniqueness (additive indexes; legacy global uniques retained for compatibility)
ALTER TABLE invoices
  ADD UNIQUE KEY uk_invoices_org_number (organization_id, invoice_number);

ALTER TABLE merchants
  ADD UNIQUE KEY uk_merchants_org_code (organization_id, merchant_code);

ALTER TABLE customers
  ADD UNIQUE KEY uk_customers_org_code (organization_id, customer_code);

ALTER TABLE subscription_plans
  ADD UNIQUE KEY uk_subscription_plans_org_code (organization_id, plan_code);

ALTER TABLE payment_orders
  ADD UNIQUE KEY uk_payment_orders_org_merchant_order (organization_id, merchant_id, merchant_order_id);
