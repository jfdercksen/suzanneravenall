# Medusa Seed Script

Seeds regions, tax rates, and shipping options via the Medusa Admin API.

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

## Idempotency

The script checks for existing records before creating. Running it multiple times is safe — no duplicates will be created.

## Notes

- Amounts are stored in the smallest currency unit (cents). R150 = 15000.
- Shipping options require at least one fulfillment provider module to be installed.
  If none is found the script logs a warning and skips that option.
- Never run against production without first verifying against staging.
