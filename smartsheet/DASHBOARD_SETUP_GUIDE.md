# EdMeCa Academy — QA Dashboard Setup Guide
**Dashboard Name:** EdMeCa Academy – Test Cases QA Dashboard  
**Sheet:** Test Cases (ID: 3745437451243396)  
**Date:** February 2026

---

## Prerequisites

Before building the dashboard, confirm all of the following are done:

- [ ] All 7 reports saved in your workspace (named exactly as below)
- [ ] All summary fields added to the Test Cases sheet (Sheet Summary panel)
- [ ] Summary fields return correct values (not 0 or #ERROR)

---

## How to Create the Dashboard

1. In your Smartsheet workspace sidebar → **+ New → Dashboard/Sight**
2. Name it: **EdMeCa Academy – Test Cases QA Dashboard**
3. Click **+ Widget** to add each widget below in order

---

## Sheet Summary Fields Reference

All metric widgets pull from the **Test Cases sheet summary panel** (right sidebar → Summary).  
Add each field in the Sheet Summary panel using the formulas below.

| Field Name | Formula | Format |
|---|---|---|
| Total Tests | `=COUNT([Test ID]:[Test ID])` | Number |
| Pass | `=COUNTIF(Status:Status, "Pass")` | Number |
| Fail | `=COUNTIF(Status:Status, "Fail")` | Number |
| Partial | `=COUNTIF(Status:Status, "Partial")` | Number |
| Not Run | `=COUNTIF(Status:Status, "Not Run")` | Number |
| Pass Rate % | `=COUNTIF(Status:Status, "Pass") / COUNT([Test ID]:[Test ID])` | Percentage |
| Execution Rate % | `=(COUNTIF(Status:Status, "Pass") + COUNTIF(Status:Status, "Fail") + COUNTIF(Status:Status, "Partial")) / COUNT([Test ID]:[Test ID])` | Percentage |
| Bugs Tracked | `=COUNTIF([Linked Bug]:[Linked Bug], "<>")` | Number |
| Critical Pass | `=COUNTIFS(Priority:Priority, "Critical", Status:Status, "Pass")` | Number |
| Critical Fail | `=COUNTIFS(Priority:Priority, "Critical", Status:Status, "Fail")` | Number |
| Critical Not Run | `=COUNTIFS(Priority:Priority, "Critical", Status:Status, "Not Run")` | Number |

> **Percentage fields:** Do not multiply by 100 in the formula. Set the field’s number format to **Percentage** in the Sheet Summary panel — Smartsheet handles the display conversion automatically.

---

## Widget Build Order

### Row 1 — Title

**Widget type:** Title

| Field | Value |
|---|---|
| Title text | EdMeCa Academy |
| Subtitle | Test Cases — QA Dashboard |
| Background colour | Navy (#1f3a6e) |

---

### Row 2 — Key Metrics (4 widgets side by side)

> For all metric widgets: click **+ Widget → Metric → Sheet Summary** → select the Test Cases sheet → select the field name below.

---

**Metric 1 — Total Tests**

| Field | Value |
|---|---|
| Widget type | Metric |
| Data source | Sheet Summary |
| Sheet | Test Cases |
| Field | Total Tests |
| Label | Total Tests |
| Size | Medium |

---

**Metric 2 — Pass Rate**

| Field | Value |
|---|---|
| Widget type | Metric |
| Data source | Sheet Summary |
| Sheet | Test Cases |
| Field | Pass Rate % |
| Label | Pass Rate |
| Size | Medium |

> Displays as percentage if the summary field is formatted as Percentage.

---

**Metric 3 — Execution Rate**

| Field | Value |
|---|---|
| Widget type | Metric |
| Data source | Sheet Summary |
| Sheet | Test Cases |
| Field | Execution Rate % |
| Label | Execution Rate |
| Size | Medium |

> Execution Rate = (Pass + Fail + Partial) / Total — shows how much of the test suite has been run regardless of result.

---

**Metric 4 — Tests Needing Attention**

| Field | Value |
|---|---|
| Widget type | Metric |
| Data source | Sheet Summary |
| Sheet | Test Cases |
| Field | Fail |
| Label | Failed Tests |
| Size | Medium |

---

### Row 3 — Additional Metrics (4 widgets side by side)

---

**Metric 5 — Pass Count**

| Field | Value |
|---|---|
| Widget type | Metric |
| Data source | Sheet Summary |
| Sheet | Test Cases |
| Field | Pass |
| Label | Pass |

---

**Metric 6 — Fail Count**

| Field | Value |
|---|---|
| Widget type | Metric |
| Data source | Sheet Summary |
| Sheet | Test Cases |
| Field | Fail |
| Label | Fail |

---

**Metric 7 — Partial Count**

| Field | Value |
|---|---|
| Widget type | Metric |
| Data source | Sheet Summary |
| Sheet | Test Cases |
| Field | Partial |
| Label | Partial |

---

**Metric 8 — Not Run Count**

| Field | Value |
|---|---|
| Widget type | Metric |
| Data source | Sheet Summary |
| Sheet | Test Cases |
| Field | Not Run |
| Label | Not Run |

---

**Metric 9 — Bugs Tracked**

| Field | Value |
|---|---|
| Widget type | Metric |
| Data source | Sheet Summary |
| Sheet | Test Cases |
| Field | Bugs Tracked |
| Label | Bugs Tracked |

> Counts test cases that have a value in the **Linked Bug** column — formula: `=COUNTIF([Linked Bug]:[Linked Bug], "<>")`. Add this field to the Sheet Summary panel if not already present.

---

### Row 4 — Charts (2 side by side)

> For all chart widgets: click **+ Widget → Chart** → select the report → configure axes as below.

> **Smartsheet chart limitation:** Dashboard chart widgets require pre-summarized (grouped) report data. Raw ungrouped reports return "data cannot be charted". Stacked bars with multi-colour series are **not supported** — Smartsheet outputs long-format data (one row per group) but stacked bars need wide-format (one column per status). Use regular bar/column charts instead — one bar per group showing the total count.

---

**Chart 1 — Status Distribution**

Report must have: Group By = Status, Summarize = Count of Status, Columns = Status

| Field | Value |
|---|---|
| Widget type | Chart |
| Data source | Report: **Status Distribution** |
| Chart type | Pie or Donut |
| Label / Slice | Status |
| Value | Count of Status |
| Title | Overall Test Status |

Expected slices: Pass (17) · Partial (1) · Fail (1) · Not Run (1)

---

**Chart 2 — Results by Priority**

Report must have: Group By = Priority, Summarize = Count of Status, Columns = Priority + Status

| Field | Value |
|---|---|
| Widget type | Chart |
| Data source | Report: **Results by Priority** |
| Chart type | Bar or Column |
| X-axis | Priority |
| Value | Count of Status |
| Title | Test Results by Priority |

Expected bars: Critical (9) · High (9) · Medium (2) — total tests per priority level

---

### Row 5 — Charts (2 side by side)

---

**Chart 3 — Results by Feature Area**

Report must have: Group By = Feature Area, Summarize = Count of Status, Columns = Feature Area + Status

| Field | Value |
|---|---|
| Widget type | Chart |
| Data source | Report: **Results by Feature Area** |
| Chart type | Bar or Column |
| X-axis | Feature Area |
| Value | Count of Status |
| Title | Results by Feature Area |

Highlights: Auth/Email and Auth/Security have the lowest counts — cross-reference Report 6 list for detail

---

**Chart 4 — Results by Test Type**

Report must have: Group By = Test Type, Summarize = Count of Status, Columns = Test Type + Status

| Field | Value |
|---|---|
| Widget type | Chart |
| Data source | Report: **Results by Test Type** |
| Chart type | Bar or Column |
| X-axis | Test Type |
| Value | Count of Status |
| Title | Results by Test Type |

---

### Row 6 — Charts (2 side by side)

---

**Chart 5 — Production vs Staging**

Report must have: Group By = Environment, Summarize = Count of Status, Columns = Environment + Status

| Field | Value |
|---|---|
| Widget type | Chart |
| Data source | Report: **Production vs Staging** |
| Chart type | Bar or Column |
| X-axis | Environment |
| Value | Count of Status |
| Title | Results by Environment |

Expected: Production (12 Pass) · Staging (8 total — mix of Pass, Fail, Partial, Not Run)

---

**Metric Panel — Critical Test Breakdown**

| Field | Value |
|---|---|
| Widget type | Metric |
| Data source | Sheet Summary |
| Sheet | Test Cases |
| Field | Critical Pass |
| Label | Critical — Pass |

*Add a second and third metric widget here for Critical Fail and Critical Not Run — place all 3 stacked vertically in this column.*

| Field | Value |
|---|---|
| Field | Critical Fail |
| Label | Critical — Fail |

| Field | Value |
|---|---|
| Field | Critical Not Run |
| Label | Critical — Not Run |

---

### Row 7 — Report List: Tests Needing Attention

**Widget type:** Report  

| Field | Value |
|---|---|
| Data source | Report: **Tests Needing Attention** |
| Columns visible | Test Case Name, Feature Area, Priority, Status, Linked Bug |
| Title | ⚠ Tests Needing Attention |
| Height | Tall (show all 3 rows) |

This is a live filtered list — updates automatically as sheet data changes.

---

### Row 8 — Report List: Not Yet Executed

**Widget type:** Report

| Field | Value |
|---|---|
| Data source | Report: **Not Yet Executed** |
| Columns visible | Test Case Name, Feature Area, Priority, Test Type, Environment, Linked Task |
| Title | ⏳ Not Yet Executed |
| Height | Medium |

---

## Complete Widget Summary

| # | Row | Widget Type | Data Source | Title |
|---|---|---|---|---|
| 1 | 1 | Title | — | EdMeCa Academy |
| 2 | 2 | Metric | Sheet Summary → Total Tests | Total Tests |
| 3 | 2 | Metric | Sheet Summary → Pass Rate % | Pass Rate |
| 4 | 2 | Metric | Sheet Summary → Execution Rate % | Execution Rate |
| 5 | 2 | Metric | Sheet Summary → Fail | Failed Tests |
| 6 | 3 | Metric | Sheet Summary → Pass | Pass |
| 7 | 3 | Metric | Sheet Summary → Fail | Fail |
| 8 | 3 | Metric | Sheet Summary → Partial | Partial |
| 9 | 3 | Metric | Sheet Summary → Not Run | Not Run |
| 10 | 3 | Metric | Sheet Summary → Bugs Tracked | Bugs Tracked |
| 11 | 4 | Chart (Pie) | Report: Status Distribution | Overall Test Status |
| 12 | 4 | Chart (Bar) | Report: Results by Priority | Results by Priority |
| 13 | 5 | Chart (Bar) | Report: Results by Feature Area | Results by Feature Area |
| 14 | 5 | Chart (Bar) | Report: Results by Test Type | Results by Test Type |
| 15 | 6 | Chart (Bar) | Report: Production vs Staging | Results by Environment |
| 16 | 6 | Metric | Sheet Summary → Critical Pass/Fail/Not Run | Critical Breakdown |
| 17 | 7 | Report list | Report: Tests Needing Attention | ⚠ Tests Needing Attention |
| 18 | 8 | Report list | Report: Not Yet Executed | ⏳ Not Yet Executed |

---

## Key Rules (learned during setup)

| Rule | Detail |
|---|---|
| Metrics use Sheet Summary | Widget → Metric → Sheet Summary → select field |
| Charts use Reports | Widget → Chart → select Report → configure axes |
| Report lists use Reports | Widget → Report → select Report |
| Columns to Display must include any column used in Group/Summarize/Sort | Add Status to columns even if not the primary display column |
| Primary column (Test ID) cannot be used in Summarize | Always use Count of Status instead |
| PICKLIST columns cannot be sorted in reports | Leave Sort blank — chart widget renders X-axis alphabetically |
| Stacked bars with multi-colour series are not supported | Smartsheet outputs long-format data; stacked bars need wide-format. Use regular bar/column charts instead |
| Raw ungrouped reports cause "data cannot be charted" | Always use Group By + Summarize in reports used for chart widgets |
| Use Report list widgets for breakdown detail | Reports 6 and 7 as list widgets show the full per-test detail that charts cannot express |
| Percentage fields — no × 100 in formula | Set field number format to Percentage in Sheet Summary |
