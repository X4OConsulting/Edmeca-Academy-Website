# 🚀 GitHub Actions CI/CD Workflows

This directory contains automated workflows for the EDMECA Academy project.

## 📋 Available Workflows

### 1. **PR Automation & Review** (`pr-automation.yml`)

Comprehensive automated PR review system that runs on every pull request.

**Triggers:** When PR is opened, synchronized, or reopened

**What it does:**
- ✅ Runs TypeScript type checking
- ✅ Builds the application
- ✅ Analyzes code changes and statistics
- ✅ Generates detailed analysis report
- ✅ Posts feedback as PR comments
- ✅ **Auto-approves** if all checks pass
- ❌ **Requests changes** if errors are found
- 🏷️ Adds labels (`auto-approved`, `ready-to-merge`, `needs-work`, `failing-checks`)

**Secrets Required:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Output:**
Creates a detailed analysis report including:
- TypeScript check results
- Build status
- Files changed statistics
- Critical files warnings
- Recommendations

---

### 2. **Auto-Generate PR Description** (`pr-description.yml`)

Automatically generates comprehensive PR descriptions if the PR is created with minimal or no description.

**Triggers:** When PR is opened

**What it does:**
- 📝 Analyzes all code changes
- 🗂️ Categorizes changes (components, pages, backend, database, etc.)
- 📊 Generates statistics
- ✅ Creates a comprehensive description with checklist
- 📌 Updates the PR description automatically

**Categories Tracked:**
- Component changes
- Page modifications
- Backend updates
- Database migrations
- CI/CD workflow changes
- Dependency updates

---

### 3. **Deploy** (`deploy.yml`)

Production deployment workflow.

**Triggers:** Push to `main` branch, PRs to `main`

**What it does:**
- 🗄️ Runs database migrations (on main branch only)
- 🏗️ Builds and deploys to Netlify
- 🧪 Runs tests for PRs

---

## 🔧 Setup Instructions

### 1. Required Secrets

Add these to your repository secrets (Settings → Secrets and variables → Actions):

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_PROJECT_ID=your_project_id
SUPABASE_ACCESS_TOKEN=your_access_token
NETLIFY_AUTH_TOKEN=your_netlify_token
NETLIFY_SITE_ID=your_site_id
```

### 2. Repository Labels

Create these labels in your repository (Settings → Labels):

| Label | Color | Description |
|-------|-------|-------------|
| `auto-approved` | `#0e8a16` | PR automatically approved by CI |
| `ready-to-merge` | `#0e8a16` | All checks passed, ready to merge |
| `needs-work` | `#d73a4a` | Changes requested by automated review |
| `failing-checks` | `#d73a4a` | CI checks failed |

### 3. Branch Protection Rules

Configure branch protection for `main` branch:

1. Go to Settings → Branches
2. Add rule for `main`
3. Enable:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators

---

## 📖 Usage Examples

### Example 1: Creating a PR (Auto-Description)

```bash
git checkout -b feature/new-component
# Make your changes
git add .
git commit -m "Add new component"
git push origin feature/new-component
# Create PR on GitHub with minimal description
```

**Result:** The workflow will automatically generate a comprehensive description!

### Example 2: PR Review Process

1. Create PR → Auto-description generated
2. CI runs automatically:
   - TypeScript check
   - Build verification
   - Code analysis
3. Analysis report posted as comment
4. **If all checks pass:**
   - ✅ Auto-approved
   - 🏷️ Labels: `auto-approved`, `ready-to-merge`
   - 💬 Success comment posted
5. **If checks fail:**
   - ❌ Changes requested
   - 🏷️ Labels: `needs-work`, `failing-checks`
   - 📋 Error details in analysis report

---

## 🎯 Workflow Decision Tree

```
PR Created
    │
    ├─→ Empty/Minimal Description?
    │       │
    │       └─→ YES: Auto-generate description ✅
    │
    ├─→ Run Code Quality Checks
    │       │
    │       ├─→ TypeScript Check
    │       ├─→ Build Application
    │       └─→ Analyze Changes
    │
    ├─→ Generate Analysis Report
    │       │
    │       └─→ Post as PR Comment
    │
    └─→ All Checks Passed?
            │
            ├─→ YES: Auto-Approve ✅
            │        - Add success labels
            │        - Post success comment
            │
            └─→ NO: Request Changes ❌
                     - Add needs-work labels
                     - Post error details
```

---

## 🔍 Analysis Report Example

```markdown
# 🔍 PR Analysis Report

**PR #42**: Add new learning tools component

✅ **TypeScript Check**: Passed
✅ **Build**: Passed

## 📊 Change Statistics

- **Files Changed**: 8
- **Lines Added**: +245
- **Lines Removed**: -32
- **Critical Files Modified**: 0

## 📝 Files Changed

client/src/components/LearningTools.tsx    | 156 +++++++
client/src/pages/Tools.tsx                 |  45 +++
client/src/lib/utils.ts                    |  12 +-
...

## 💡 Recommendations

✅ **All checks passed!**
- Code quality checks passed
- Build successful
- Ready for review
```

---

## 🛠️ Customization

### Modify Check Criteria

Edit `pr-automation.yml` to add more checks:

```yaml
- name: Run ESLint
  run: npm run lint
  
- name: Run Tests
  run: npm test
  
- name: Check Code Coverage
  run: npm run test:coverage
```

### Change Auto-Approve Conditions

Modify the `auto-approve` job conditions:

```yaml
if: |
  needs.code-quality.outputs.has-errors == 'false' &&
  needs.code-quality.outputs.critical_files < '3' &&
  github.event.pull_request.user.login != 'dependabot[bot]'
```

---

## 📊 Monitoring

View workflow runs:
1. Go to **Actions** tab in GitHub
2. Select workflow from left sidebar
3. View individual run details
4. Download artifacts for detailed logs

---

## 🐛 Troubleshooting

### Workflow not triggering?

**Check:**
- ✅ Workflow files are in `.github/workflows/`
- ✅ YAML syntax is valid
- ✅ Branch names match trigger configuration
- ✅ Actions are enabled in repository settings

### Auto-approve not working?

**Check:**
- ✅ `GITHUB_TOKEN` has write permissions
- ✅ All checks are passing
- ✅ Conditions in `auto-approve` job are met

### Description not auto-generating?

**Check:**
- ✅ PR description is actually minimal (<50 chars)
- ✅ Workflow has write permissions for PRs
- ✅ Check workflow run logs

---

## 🎓 Best Practices

1. **Always review auto-generated descriptions** and enhance them with context
2. **Don't bypass failing checks** - fix the issues instead
3. **Use semantic commit messages** for better auto-generated descriptions
4. **Add screenshots** for UI changes
5. **Link related issues** in PR description

---

## 📝 Contributing

To improve these workflows:

1. Test changes in a feature branch first
2. Use workflow visualization: `gh workflow view <workflow-name>`
3. Monitor run times and optimize if needed
4. Document any new secrets or configuration

---

## 🔗 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [GitHub Script Action](https://github.com/actions/github-script)

---

**Last Updated:** February 16, 2026
**Maintained by:** EDMECA Academy Development Team
