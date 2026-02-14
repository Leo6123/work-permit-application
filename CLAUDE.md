# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Work permit application system (施工安全作業許可申請系統) for construction safety operations. Built with Next.js 14 App Router, TypeScript, Prisma (PostgreSQL via Supabase), React Hook Form, and Zod validation.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production (includes prisma generate)
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Generate Prisma client
npx prisma generate

# Run Prisma migrations (local development)
npx prisma migrate dev

# Push schema changes to database (Vercel deployment)
npx prisma db push
```

## Architecture

### Database Models (Prisma)

Two main models in `prisma/schema.prisma`:

1. **WorkPermitApplication**: Main application record
   - JSON string fields that must be parsed: `contractorInfo`, `hazardFactors`, `hazardousOperations`, `personnelInfo`
   - Status field drives approval workflow
   - Contains emails for all approvers

2. **ApprovalLog**: Audit trail for all approval actions
   - Links to WorkPermitApplication with cascade delete
   - Stores approver type, action, comment, and timestamp

### Approval Workflow States

The status field determines the current approval stage:

1. **pending_area_supervisor**: Hot work applications start here, requiring area supervisor approval first
2. **pending_ehs**: Standard entry point for non-hot-work applications; hot work applications move here after area supervisor approval
3. **pending_manager**: After EHS approval, department manager provides final approval
4. **approved**: All approvals complete
5. **rejected**: Any approver can reject; workflow stops

### JSON Field Handling

Several database fields store JSON strings and must be parsed when reading and stringified when writing:

```typescript
// When reading from database
const app = await prisma.workPermitApplication.findUnique({...});
const hazardFactors = JSON.parse(app.hazardFactors);

// When writing to database
await prisma.workPermitApplication.create({
  data: {
    hazardFactors: JSON.stringify(hazardFactorsObject),
    // ...
  }
});
```

### Work Order Numbers

Generated using Taiwan timezone (UTC+8) in format: `EHS + yyyymmddHHMM`

Example: `EHS202601171430` (2026-01-17 14:30)

- Use `generateWorkOrderNumber()` for new applications
- Use `getWorkOrderNumberFromDate(createdAt)` to display existing application numbers
- Implementation in `lib/workOrderNumber.ts` uses `Intl.DateTimeFormat` with Asia/Taipei timezone

### Email Notifications

Implemented in `lib/notifications.ts` using Resend API:

- Falls back to console.log if `RESEND_API_KEY` is not set
- Multiple notification functions for different workflow stages
- All notifications include formatted HTML emails with links to application details

### Configuration Files

**lib/config.ts**: Manages approver email addresses

- `EHS_MANAGER_EMAIL`: From env var, defaults to configured email
- `getDepartmentManagerEmail(department)`: Maps department names to manager emails
- `getAreaSupervisorEmail(areaSupervisor)`: Maps area supervisor names to emails
- Both functions check environment variables first, then fall back to hardcoded defaults

## Key Patterns

### API Routes

Located in `app/api/applications/`:

- `route.ts`: GET (list), POST (create)
- `[id]/route.ts`: GET (single), PATCH (update)
- `[id]/approve/route.ts`: POST (approval action)

All routes validate input with Zod schemas from `lib/validation.ts`.

### Form Validation

Located in `lib/validation.ts`:

- `applicationFormSchema`: Main application form validation
- `ehsApprovalRequestSchema`: EHS Manager approval (requires 10+ char comment on reject)
- `approvalRequestSchema`: Standard approval validation
- Uses Zod with custom refinements for business logic (e.g., hot work requires details)

### Special Permit Components

Three multi-page PDF-style permit forms in `components/`:

- `HotWorkPermit.tsx`: Hot work operations permit
- `ConfinedSpacePermit.tsx`: Confined space permit
- `WorkAtHeightPermit.tsx`: Work at height permit

These are client-side components that receive parsed data and render printable multi-page forms with `pageBreakAfter: 'always'` styling.

### Type Definitions

Located in `types/application.ts`:

- All TypeScript interfaces for application data
- Enums for status, approver types, actions
- Interfaces match Prisma schema but with parsed JSON fields

## Environment Variables

Required in `.env` (see `.env.example`):

```bash
DATABASE_URL                  # Supabase PostgreSQL connection string
NEXT_PUBLIC_BASE_URL         # Base URL for email links
EHS_MANAGER_EMAIL            # EHS Manager email address
DEPARTMENT_MANAGERS          # CSV format: "dept1:email1,dept2:email2"
AREA_SUPERVISORS             # CSV format: "name1:email1,name2:email2"
RESEND_API_KEY              # Optional: Resend API key for real emails
FROM_EMAIL                  # Optional: Sender email (default: onboarding@resend.dev)
FROM_NAME                   # Optional: Sender name
```

## Important Notes

### Timezone Handling

All datetime operations use Taiwan timezone (Asia/Taipei, UTC+8):
- Work order number generation
- Date display formatting
- Date/time validation

### Prisma Client Singleton

`lib/prisma.ts` exports a singleton Prisma client to prevent connection pool exhaustion in development (hot reload):

```typescript
export const prisma = globalForPrisma.prisma ?? new PrismaClient({...});
```

Always import from `@/lib/prisma` rather than creating new instances.

### Vercel Deployment

- SQLite is not supported on Vercel; must use Supabase PostgreSQL
- Ensure DATABASE_URL includes `pgbouncer=true&connection_limit=1`
- Run `prisma migrate deploy` or `prisma db push` after first deployment to create tables
- `postinstall` script runs `prisma generate` automatically

### Hot Work Special Handling

When `hazardFactors.hotWork` is checked:
- Application must include `hotWorkDetails` with area supervisor selection
- Initial status is `pending_area_supervisor` (not `pending_ehs`)
- Area supervisor is notified first instead of EHS Manager
- After area supervisor approves, status becomes `pending_ehs` and EHS is notified

### Validation Business Rules

- Work time start and end must be on the same day
- Hot work requires complete `hotWorkDetails` object
- Contractor personnel type requires contractor name
- EHS Manager rejection requires comment with minimum 10 characters
- Contractor personnel can be input as comma-separated string (auto-converted to array)
