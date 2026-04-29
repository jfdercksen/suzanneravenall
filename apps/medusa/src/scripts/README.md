# Medusa Seed Script

Seeds regions, tax rates, shipping options, product collections, and
placeholder products via the Medusa Admin API.

## Prerequisites

1. Medusa is running locally (`npm run dev` in `apps/medusa/`)
2. You have created an admin user (via `medusa user -e admin@suzanneravenall.com -p yourpassword`)
3. The Medusa database migrations have been run (`npm run db:migrate`)

## Running the script

From `apps/medusa/`:

```bash
export MEDUSA_ADMIN_EMAIL=admin@suzanneravenall.com
export MEDUSA_ADMIN_PASSWORD=your_admin_password
npx ts-node src/scripts/seed.ts
```

Or with a custom Medusa URL (e.g., staging):

```bash
export MEDUSA_URL=https://staging.suzanneravenall.com
export MEDUSA_ADMIN_EMAIL=admin@suzanneravenall.com
export MEDUSA_ADMIN_PASSWORD=your_admin_password
npx ts-node src/scripts/seed.ts
```

## What it creates

| Type | Name | Currency / Rate / Amount |
|------|------|--------------------------|
| Region | South Africa | ZAR |
| Region | International | USD |
| Tax rate | VAT | 15% (South Africa region) |
| Shipping option | Digital Delivery | R0 / $0 (both regions) |
| Shipping option | Physical Delivery SA | R150 (South Africa region) |
| Collection | Start Here | Entry level programs R1,500–R5,000 |
| Collection | Deep Dive | Mid-tier intensives R5,000–R20,000 |
| Collection | Master Level | Premium coaching R20,000–R100,000+ |
| Collection | Practitioner | Licensing and certification programs |
| Product | Introduction to Trauma-Informed Transformation | R1,500 ZAR |
| Product | Clarity Breakthrough Session | R3,500 ZAR |
| Product | Foundations of Resilience Online Programme | R4,800 ZAR |
| Product | 90-Day Private Coaching Intensive | R18,000 ZAR |
| Product | Leadership Performance Accelerator | R12,000 ZAR |
| Product | Relationship Dynamics Deep Dive | R9,500 ZAR |
| Product | Transformation Mastery Retreat | R45,000 ZAR |
| Product | Executive VIP Day | R28,000 ZAR |
| Product | Annual Transformation Partnership | R95,000 ZAR |
| Product | Human Performance Replicator Practitioner Certification | R35,000 ZAR |
| Product | Train the Trainer — Foundations Programme | R22,000 ZAR |
| Product | Corporate Licensing Package | R55,000 ZAR |

## Running Migrations

After deploying to VPS or starting Medusa locally:

```bash
cd apps/medusa
npx medusa db:migrate
```

This will create the `program_metadata` table from the ProgramsModule model
definition added in Task 2.2. Run this once after first deploying Task 2.2.

## Idempotency

The script checks for existing records before creating. Running it multiple
times is safe — no duplicates will be created.

## Notes

- Amounts are stored in the smallest currency unit (cents). R150 = 15000.
- Shipping options require at least one fulfillment provider module to be installed.
  If none is found the script logs a warning and skips that option.
- Products are assigned to collections by handle — collections must be created
  before products. The seed script handles this ordering automatically.
- Never run against production without first verifying against staging.
