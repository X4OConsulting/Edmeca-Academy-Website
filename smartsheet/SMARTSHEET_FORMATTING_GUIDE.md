# Smartsheet Conditional Formatting Guide — Test Cases
**Project:** EdMeCa Academy Website Development  
**Sheet:** Test Cases (ID: 3745437451243396)

---

## How to Open

1. Open the sheet at [app.smartsheet.com](https://app.smartsheet.com)
2. Right-click any column header → **Conditional Formatting**
3. Click **+ Add Rule**
4. Set the condition, choose the format, then set **Apply to** (see below)
5. Click **Save** — drag rules to reorder (top = highest priority, first match wins)

---

## Row vs Column — When to Use Each

| Apply to | What it does | Best for |
|---|---|---|
| **Entire Row** | Colours the whole row when the condition is met | Overall health view — scan rows at a glance |
| **This column only** | Colours only that specific cell | Spot a specific value without dominating the row |

You can mix both within the same sheet — e.g. colour the entire row by Pass/Fail, then additionally colour individual Priority cells for extra signals.

---

## Rule Set 1 — Status (Entire Row)
*Recommended as your base layer. Gives immediate test health at a glance.*

| Priority | Column | Condition | Background | Apply to |
|---|---|---|---|---|
| 1 | Status | is exactly `Fail` | 🔴 Light Red | **Entire Row** |
| 2 | Status | is exactly `Partial` | 🟠 Light Orange | **Entire Row** |
| 3 | Status | is exactly `Pending` | 🔵 Light Blue | **Entire Row** |
| 4 | Status | is exactly `Not Run` | 🟡 Light Yellow | **Entire Row** |
| 5 | Status | is exactly `Pass` | 🟢 Light Green | **Entire Row** |

---

## Rule Set 2 — Pass/Fail (Column only)
*Adds a focused Pass/Fail badge on just that cell — useful since the column only ever holds `Pass` or `Fail`.*

| Priority | Column | Condition | Background | Bold | Apply to |
|---|---|---|---|---|---|
| 1 | Pass/Fail | is exactly `Fail` | 🔴 Light Red | ✅ | **This column only** |
| 2 | Pass/Fail | is exactly `Pass` | 🟢 Light Green | — | **This column only** |

---

## Rule Set 3 — Priority (Column only)
*Highlights the Priority cell so severity still reads even when the row is green.*

| Priority | Column | Condition | Background | Bold | Apply to |
|---|---|---|---|---|---|
| 1 | Priority | is exactly `Critical` | 🔴 Light Red | ✅ | **This column only** |
| 2 | Priority | is exactly `High` | 🟠 Light Orange | — | **This column only** |
| 3 | Priority | is exactly `Medium` | 🟡 Light Yellow | — | **This column only** |
| 4 | Priority | is exactly `Low` | 🟢 Light Green | — | **This column only** |

---

## Rule Set 4 — Linked Bug (Entire Row override)
*Add this as rule priority 1 (above all others) to flag any test that has a linked bug — regardless of pass/fail status.*

| Priority | Column | Condition | Background | Bold | Apply to |
|---|---|---|---|---|---|
| 1 | Linked Bug | is not blank | 🟠 Light Orange | ✅ | **Entire Row** |

> Move this to the **top** of your rule list by dragging it. It overrides the Status row colour, which is intentional — a "Pass" test with a linked bug deserves a second look.

---

## Rule Set 5 — Test Type (Column only)
*Optional. Adds a colour badge to the Test Type cell for quick filtering without affecting the row.*

| Priority | Column | Condition | Background | Apply to |
|---|---|---|---|---|
| 1 | Test Type | is exactly `Smoke` | 🔵 Light Blue | **This column only** |
| 2 | Test Type | is exactly `Functional` | 🟢 Light Green | **This column only** |
| 3 | Test Type | is exactly `Negative` | 🟠 Light Orange | **This column only** |
| 4 | Test Type | is exactly `Visual` | Light Purple | **This column only** |
| 5 | Test Type | is exactly `Deliverability` | 🟡 Light Yellow | **This column only** |

---

## Rule Set 6 — Missing Test Date (Column only)
*Highlights the Test Date cell when a test has a Pass/Fail result but no date recorded — data quality check.*

| Priority | Column | Condition | Background | Italic | Apply to |
|---|---|---|---|---|---|
| 1 | Test Date | is blank | 🟡 Light Yellow | ✅ | **This column only** |

---

## Rule Set 7 — SDLC Phase (Column only)
*Optional colour badge on the SDLC Phase cell. Useful when filtering by phase.*

| Priority | Column | Condition | Background | Apply to |
|---|---|---|---|---|
| 1 | SDLC Phase | contains `5` | 🟠 Light Orange | **This column only** |
| 2 | SDLC Phase | contains `4` | 🟡 Light Yellow | **This column only** |
| 3 | SDLC Phase | contains `3` | 🔵 Light Blue | **This column only** |
| 4 | SDLC Phase | contains `2` | Light Purple | **This column only** |
| 5 | SDLC Phase | contains `1` | Light Gray | **This column only** |

---

## Recommended Setup (layered)

Apply in this order — the Linked Bug override sits at the top so it always wins:

| Final Priority | Rule | Apply to |
|---|---|---|
| 1 | Linked Bug is not blank → Orange + Bold | **Entire Row** |
| 2 | Status = `Fail` → Red | **Entire Row** |
| 3 | Status = `Partial` → Orange | **Entire Row** |
| 4 | Status = `Pending` → Blue | **Entire Row** |
| 5 | Status = `Not Run` → Yellow | **Entire Row** |
| 6 | Status = `Pass` → Green | **Entire Row** |
| 7 | Pass/Fail = `Fail` → Red + Bold | **This column only** |
| 8 | Pass/Fail = `Pass` → Green | **This column only** |
| 9 | Priority = `Critical` → Red + Bold | **This column only** |
| 10 | Priority = `High` → Orange | **This column only** |
| 11 | Priority = `Medium` → Yellow | **This column only** |
| 12 | Priority = `Low` → Green | **This column only** |
| 13 | Test Date is blank → Yellow + Italic | **This column only** |

---

## Text & Font Formatting Reference

| Option | When to use |
|---|---|
| **Bold** | Critical priority, linked bugs, overrides |
| *Italic* | Pending / not yet run / missing data |
| ~~Strikethrough~~ | Deprecated or removed test cases |
| **Text colour** | Use sparingly — dark red text on light red bg improves contrast |

## Colour Reference

| UI Label | Use case in Test Cases |
|---|---|
| 🔴 Light Red | Fail result, Critical priority |
| 🟠 Light Orange | Partial result, High priority, Linked Bug |
| 🟡 Light Yellow | Not Run, Missing data, Medium priority |
| 🟢 Light Green | Pass result, Low priority |
| 🔵 Light Blue | Pending / In Progress, Smoke tests |
| Light Gray | Inactive / Not Started |
| Light Purple | Visual tests, Design phase |
