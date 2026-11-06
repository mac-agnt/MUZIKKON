# Muzikkon, powered by Pulse

A sales demo of **Pulse** for Muzikkon Ltd (Dublin): an oversight layer that sits alongside Muzikkon's existing Shopify site and custom ERP.

Everything is a **frontend demo with illustrative data**. Nothing is sent, imported, paid or called, and no external system (Shopify, the ERP, email, carriers, banking, ad platforms) is connected. Product names and list prices follow the public muzikkon.com listings; customers, orders, invoices and staff are fictional.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
```

## What is in it

| Area | Where |
| --- | --- |
| Central typed dataset (12 orders, products, customers, invoices, agents, tasks, activity) | `src/muz/dataset.ts` |
| Local demo state and every action (import, QC, approvals, reminders, reorders) | `src/muz/store.ts` |
| Derived totals (every number on every screen comes from here) | `src/muz/selectors.ts` |
| UI kit built on the Pulse glass tokens | `src/muz/ui.tsx` |
| Pages: Orders, Inventory, Fulfilment, Customers, Finance, Agents, Dashboard, Work, Activity, Settings, Records | `src/muz/pages/` |
| Record drawers (order, product, customer, invoice, conversation, PO) | `src/muz/drawers.tsx` |
| Pulse AI answers grounded in the dataset (no LLM) | `src/muz/chat.ts` |
| Home, ontology graph, app frame, command palette | `src/views/`, `src/logic/` |
| Muzikkon theme (charcoal and antique gold, plus cream light theme) | `src/styles/pulse.css` |

Scenario date is fixed to **Friday 6 November 2026**, so the demo never drifts with the real date. Only the Home greeting follows the viewer's local time.

## Story threads

A. MZ-1042 Shopify order missing from the ERP: simulate the import. B. St Brigid's credit hold and overdue INV-208: reminder and conditional release (invoice never auto-paid). C. MZ-1044 lute quality check. D. MZ-1041 US tracking enquiry and AI draft reply. E. 15 String Trinity Cèilidh Harp shortage: purchase order approval and simulated goods receipt.

Settings, then Experience, has a suggested eight-step demo path and a Reset demo button.

## Template notes

The app frame, graph and design tokens come from the Pulse v5 Harbour template. See `CLAUDE.md` for the layout rules every client copy keeps.
