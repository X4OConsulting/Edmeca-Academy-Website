# Smartsheet Setup Instructions - EDMECA Academy SDLC Tracker

## Overview
This guide walks you through importing the EDMECA Academy SDLC tracker CSV file into Smartsheet and configuring it for optimal project management.

## Prerequisites
- Active Smartsheet account
- CSV file: `smartsheet/EDMECA_Academy_SDLC_Tasks.csv`
- Basic Smartsheet knowledge recommended

## Step 1: Import CSV to Smartsheet

### Option A: Create New Sheet from CSV
1. **Login to Smartsheet** at [app.smartsheet.com](https://app.smartsheet.com)
2. Click **"Create"** in the left sidebar
3. Select **"Browse templates & import"**
4. Choose **"Import Microsoft Excel or CSV"**
5. **Click "Choose File"** and select `EDMECA_Academy_SDLC_Tasks.csv`
6. **Preview Import Settings:**
   - ✅ First row contains column headers
   - ✅ Delimiter: Comma
   - ✅ Text qualifier: Quote
7. **Click "Import"**
8. **Name your sheet:** "EDMECA Academy SDLC Tracker"
9. **Click "Create Sheet"**

### Option B: Import to Existing Sheet
1. Open existing Smartsheet
2. **File menu** → **Import** → **Microsoft Excel/CSV**
3. Follow steps 5-9 above

## Step 2: Configure Hierarchical Structure

### Enable Hierarchy
1. **Right-click on Task ID column** header
2. Select **"Convert to Hierarchy"**
3. Smartsheet will automatically create parent-child relationships based on numbering:
   - **Parent**: 1, 2, 3, 4, 5, 6, 7 (Phase headers)
   - **Children**: 1.1, 1.2, 2.1, 2.2, etc. (Subtasks)

### Alternative Manual Setup
If automatic hierarchy doesn't work:
1. Select phase rows (1, 2, 3, 4, 5, 6, 7)
2. **Right-click** → **Indent/Outdent** → **Outdent** (make parents)
3. Select subtask rows (1.1, 1.2, etc.)
4. **Right-click** → **Indent/Outdent** → **Indent** (make children)

## Step 3: Configure Column Types

### Set Column Properties
**Right-click each column header** and select **"Edit Column Properties"**:

| Column | Type | Properties |
|--------|------|------------|
| **Task ID** | Text/Number | Primary column, Hierarchy enabled |
| **Task Name** | Text/Number | - |
| **SDLC Phase** | Dropdown | Values: 1-Planning, 2-Design, 3-Development, 4-Testing, 5-Deployment, 6-Documentation, 7-Maintenance |
| **Category** | Dropdown | Values: Architecture, Security, Frontend, Backend, UI/UX, Quality, Infrastructure, etc. |
| **Priority** | Dropdown | Values: Low, Medium, High, Critical |
| **Status** | Dropdown | Values: Not Started, In Progress, Complete |
| **% Complete** | Percentage | 0-100% |
| **Assigned To** | Contact | Team member assignments |
| **Start Date** | Date | Project start dates |
| **End Date** | Date | Project end dates |
| **Duration (days)** | Duration | Calculated field |
| **Predecessor** | Predecessor | Task dependencies |
| **Criteria Met** | Checkbox | ✅/❌ |
| **Submitted** | Checkbox | ✅/❌ |
| **Risk Level** | Dropdown | Values: Low, Medium, High |

## Step 4: Enable Project Management Features

### Enable Gantt Chart
1. **Right-click on sheet tabs**
2. Select **"Gantt View"**
3. **Configure Dependencies:**
   - Start Date: Auto-calculated from predecessors
   - End Date: Based on duration
   - Dependencies: Use Predecessor column

### Enable Resource Management
1. **Tools** → **Resource Management**
2. **Assign team members** to tasks
3. **Set capacity and availability**

### Enable Dashboards
1. **Create Dashboard** for executive summary
2. **Add widgets:**
   - Project health (% complete by phase)
   - Timeline/Milestone chart
   - Risk summary
   - Resource allocation

## Step 5: Configure Automation

### Set Up Automated Workflows
1. **Automation** → **Create Workflow**
2. **Common Automations:**
   - **Status Updates**: Notify when task status changes to "Complete"
   - **Overdue Alerts**: Send alerts for tasks past due date
   - **Approval Requests**: Request approval when deliverables submitted
   - **Progress Reports**: Weekly progress summaries

### Example Automation Rules
```
WHEN: Status changes to "Complete"
THEN: Send notification to Project Manager
AND: Update parent task % complete

WHEN: End Date is in the past AND Status ≠ "Complete"  
THEN: Send alert to assigned team member
AND: Flag as "At Risk"
```

## Step 6: Share and Collaborate

### Set Permissions
1. **Share button** (top right)
2. **Add team members:**
   - **Admin**: Project managers
   - **Editor**: Team members
   - **Viewer**: Stakeholders
3. **Send sharing invitation**

### Create Reports
1. **Reports** → **Create Report**
2. **Useful Reports:**
   - Open tasks by assignee
   - Overdue tasks
   - Tasks completing this week
   - High-priority items

## Step 7: Customize Views

### Create Custom Views
1. **Save current view** as "Master Timeline"
2. **Create filtered views:**
   - **Current Sprint**: Tasks in progress
   - **Next 30 Days**: Upcoming tasks
   - **Critical Path**: High priority items
   - **By Phase**: Filter by SDLC phase

### Card View Setup
1. **Switch to Card View**
2. **Configure lanes by Status:**
   - Not Started
   - In Progress  
   - Complete
3. **Ideal for daily standups**

## Step 8: Integration Setup

### Connect External Tools
- **Microsoft Project**: Import/export project files
- **Jira**: Sync development tasks
- **Slack**: Team notifications
- **Microsoft Teams**: Project updates
- **Google Drive**: Document attachments

## Best Practices

### Regular Maintenance
- ✅ **Weekly status updates** by team members
- ✅ **Dependency review** for accuracy
- ✅ **Risk assessment** updates
- ✅ **Resource allocation** adjustments

### Performance Optimization
- 📊 **Use conditional formatting** for visual status indicators
- 🎯 **Set baseline dates** for schedule comparison
- 📈 **Track key metrics**: On-time delivery, budget variance
- 🔄 **Regular sprint retrospectives**

## Troubleshooting

### Common Issues
**Hierarchy not displaying correctly:**
- Ensure Task ID column is set as Primary
- Check that numbering follows parent.child format (1.1, 1.2)

**Dependencies not working:**
- Verify Predecessor column contains valid Task IDs
- Check that Start/End dates are properly formatted

**Automation not triggering:**
- Confirm workflow conditions are met
- Check that users have proper permissions

## Training Resources

- **Smartsheet University**: Free online courses
- **Help Center**: searchsheet.com/help
- **Community**: community.smartsheet.com
- **YouTube**: Smartsheet official channel

## Support Contacts

- **Project Manager**: [Your PM Email]
- **Smartsheet Admin**: [Admin Email]  
- **IT Support**: [Support Email]

---

**Next Steps:**
1. Import CSV file to Smartsheet
2. Configure hierarchy and column types
3. Enable Gantt view and dependencies
4. Set up team access and permissions  
5. Create automation workflows
6. Begin daily project tracking

**Success Metrics:**
- All 56 tasks properly hierarchical
- Dependencies mapped correctly
- Team members assigned and notified
- Automated progress reporting active
- Executive dashboard providing insights