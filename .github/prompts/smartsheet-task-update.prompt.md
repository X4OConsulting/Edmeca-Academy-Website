---
name: smartsheet-task-update
description: 'Update one or more tasks in the EdMeCa Academy SDLC Smartsheet tracker via the REST API. Use after completing code tasks, changing statuses, or resetting progress.'
argument-hint: 'Task IDs and new status/percentage (e.g. "3.10 Complete 100%, 3.11 In Progress 50%")'
---

Update Smartsheet task(s): **${input:tasks}**

## Context

- **Sheet ID**: `1413139749883780` (EdMeCa Academy Website Development)
- **Column IDs**: `STATUS = 5778398742531972`, `PCT = 3526598928846724`
- **API token**: read from `.env.local` as `SMARTSHEET_API_TOKEN`

## Row IDs Reference

| Task | Description | Row ID |
|---|---|---|
| 3.10 | Error Handling & Loading States | `1654401815744388` |
| 3.11 | Theme System & Dark Mode | `6158001443114884` |
| 3.14 | Google OAuth Integration | `4158254072560516` |
| 3.15 | Supabase Realtime Sync | `2522677165990788` |
| 3.16 | Progress Tracking Logic | `7026276793361284` |
| 3.17 | Portal Navigation & Routing | `4774477165361284` |
| 3.18 | Dashboard Widgets | `397377351361284` |
| 3.19 | BMC Tool Implementation | `3649177165361284` |
| 3.20 | User Dashboard – Learning Path | `2889968069705604` |
| 3.21 | Google OAuth Consent Screen | blocked |
| 3.22 | Portal Mobile Responsiveness | `3797832619589508` |
| 3.23 | Phase 4 UAT Readiness | `3401137897406340` |

## Steps

### 1. Build the update payload
Construct a JSON array of row update objects. One object per task:
```js
[
  {
    id: ROW_ID,
    cells: [
      { columnId: 5778398742531972, value: "Complete" },  // STATUS
      { columnId: 3526598928846724, value: "100%" }        // PCT
    ]
  }
]
```

Valid STATUS values: `"Not Started"` | `"In Progress"` | `"Complete"` | `"Blocked"`
Valid PCT values: `"0%"` | `"10%"` | `"25%"` | `"50%"` | `"75%"` | `"100%"`

### 2. Send the PUT request
Run via Node.js inline script or `scripts/smartsheet-cli.js`:
```sh
node scripts/smartsheet-cli.js status <taskId> "<status>"
node scripts/smartsheet-cli.js complete <taskId>
```

Or inline for bulk updates (see `scripts/smartsheet-cli.js` for the multi-row PUT pattern).

### 3. Verify
```sh
node scripts/smartsheet-cli.js sheet
```
Confirms connection and lists recent row data.

### 4. Update the CSV (source of truth)
After updating the live sheet, update `smartsheet/EDMECA_Academy_SDLC_Tasks.csv` to match.

## Quality Checklist
- [ ] Row IDs verified before sending (wrong row ID silently updates the wrong task)
- [ ] PCT value is a string with `%` suffix (e.g. `"100%"` not `100`)
- [ ] After marking Complete, sync branches: `git checkout staging && git merge main --no-edit && git push`
- [ ] CSV updated to reflect new statuses
- [ ] If adding a NEW task row, do it manually at app.smartsheet.com (POST new rows is blocked by Smartsheet network layer)
