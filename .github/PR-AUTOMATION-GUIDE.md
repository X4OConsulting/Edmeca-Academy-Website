# 🎯 PR Automation Quick Reference

## 🚀 What Happens When You Create a PR?

```
┌─────────────────────────────────────────────────────────────────┐
│                     YOU CREATE A PULL REQUEST                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  📝 STEP 1: Auto-Generate Description (if minimal)              │
│                                                                  │
│  ✓ Analyzes code changes by category                           │
│  ✓ Generates comprehensive description                         │
│  ✓ Adds checklist and templates                                │
│  ✓ Posts notification comment                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  🔍 STEP 2: Code Quality Analysis                               │
│                                                                  │
│  ✓ TypeScript type checking                                    │
│  ✓ Application build                                           │
│  ✓ Change statistics                                           │
│  ✓ Critical files detection                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  📊 STEP 3: Generate Analysis Report                            │
│                                                                  │
│  ✓ Creates detailed report                                     │
│  ✓ Posts/updates PR comment                                    │
│  ✓ Shows pass/fail status                                      │
│  ✓ Lists all changes                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
        ┌──────────────────┐  ┌──────────────────┐
        │  ✅ ALL PASSED   │  │  ❌ CHECKS FAILED│
        └──────────────────┘  └──────────────────┘
                    │                   │
                    ▼                   ▼
        ┌──────────────────┐  ┌──────────────────┐
        │ • Auto-Approve   │  │ • Request Changes│
        │ • Add labels     │  │ • Add labels     │
        │ • Success comment│  │ • Error details  │
        └──────────────────┘  └──────────────────┘
```

---

## 📋 What Gets Checked?

| Check | Description | Pass Criteria |
|-------|-------------|---------------|
| **TypeScript** | Type checking | No type errors |
| **Build** | Application build | Build succeeds |
| **Analysis** | Code statistics | Always runs |

---

## 🏷️ Label System

| Label | Color | Meaning | Action |
|-------|-------|---------|--------|
| `auto-approved` | 🟢 Green | All checks passed | Ready for merge |
| `ready-to-merge` | 🟢 Green | Approved by automation | Merge when ready |
| `needs-work` | 🔴 Red | Changes requested | Fix issues |
| `failing-checks` | 🔴 Red | CI checks failed | Review errors |

---

## ✅ Auto-Approval Conditions

Your PR will be **automatically approved** if:

- ✅ TypeScript compilation succeeds
- ✅ Application build completes
- ✅ No critical errors found

---

## ❌ When Changes Are Requested

Your PR will get **changes requested** if:

- ❌ TypeScript errors exist
- ❌ Build fails
- ❌ Critical issues detected

**What to do:**
1. Check the analysis report comment
2. Fix the issues locally
3. Push changes to your branch
4. Automation re-runs automatically

---

## 📊 Analysis Report Sections

```markdown
# 🔍 PR Analysis Report

✅/❌ TypeScript Check
✅/❌ Build Status

📊 Change Statistics
├─ Files Changed: X
├─ Lines Added: +X
├─ Lines Removed: -X
└─ Critical Files: X

📝 Files Changed
└─ Detailed list

💡 Recommendations
└─ Context-specific advice
```

---

## 🎨 PR Description Template

Auto-generated descriptions include:

```markdown
## 📋 Description
[Auto-generated based on changes]

### 🎨 Component Changes
### 📄 Page Changes
### ⚙️ Backend Changes
### 🗄️ Database Changes
### 🔄 CI/CD Changes

## 📝 Commits
[List of commits]

## 📊 Change Statistics
[Git diff stats]

## ✅ Checklist
- [ ] Code follows conventions
- [ ] TypeScript passes
- [ ] Build succeeds
- [ ] Tested locally
- [ ] Documentation updated

## 🧪 Testing
[Add your testing notes]

## 📸 Screenshots
[For UI changes]

## 🔗 Related Issues
Closes #
```

---

## 🛠️ Developer Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/my-feature
```

### 2. Make Changes
```bash
# Code your feature
npm run dev  # Test locally
npm run check  # Verify TypeScript
npm run build  # Test build
```

### 3. Commit & Push
```bash
git add .
git commit -m "feat: descriptive message"
git push origin feature/my-feature
```

### 4. Create PR
- Go to GitHub
- Click "New Pull Request"
- Add title (description optional - will auto-generate!)
- Submit

### 5. Wait for Automation
- ⏱️ ~2-3 minutes for checks
- 📧 Get notification of results
- ✅ Auto-approved OR ❌ Changes requested

### 6. Fix Issues (if needed)
```bash
# Make fixes
git add .
git commit -m "fix: address review comments"
git push
# Automation re-runs automatically
```

### 7. Merge
- ✅ When approved and ready
- 🎉 CI/CD deploys automatically

---

## 🔧 Local Pre-Flight Checks

**Before creating PR, run these locally:**

```bash
# Type checking
npm run check

# Build test
npm run build

# Optional: Run linting
npm run lint  # (if configured)

# Optional: Run tests
npm test      # (if configured)
```

**All passing?** ✅ Your PR will likely auto-approve!

---

## 📈 Success Metrics

**Check the report for:**
- Low lines changed = easier review
- Few files modified = focused change
- No critical files = lower risk
- All checks green = quality code

---

## 🚨 Critical Files Warning

Changes to these trigger special review:

- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config
- `vite.config.ts` - Build config
- `.env*` - Environment variables
- `supabase/` - Database migrations

**Extra care needed!** ⚠️

---

## 💡 Pro Tips

1. **Small PRs** = Faster approval
2. **Clear commits** = Better auto-descriptions
3. **Run checks locally** = Fewer CI failures
4. **Update description** = Better context for reviewers
5. **Add screenshots** = Easier UI review

---

## 🆘 Troubleshooting

### "Changes Requested" but I don't see errors?
- Check the full analysis report comment
- Look for TypeScript errors
- Review build output in artifacts

### Workflow didn't run?
- Check Actions tab
- Verify branch name matches triggers
- Ensure Actions are enabled

### Auto-approve didn't work?
- Verify all checks show green ✅
- Check workflow logs for details
- May need manual approval for first PR

---

## 📞 Need Help?

1. Check `.github/workflows/README.md` for detailed docs
2. Review workflow logs in Actions tab
3. Ask team lead or DevOps

---

**Remember:** The automation is here to help, not hinder! 🚀

*If automation requests changes, it's catching issues before they hit production.*
*If automation approves, you still get final review from team members.*

---

**Quick Command Reference:**

```bash
# Setup labels (first time only)
node scripts/setup-github-labels.js

# Local checks before PR
npm run check
npm run build

# View workflow status
gh pr checks  # (requires GitHub CLI)
```

---

*Last Updated: February 16, 2026*
*EDMECA Academy - Automated PR Review System*
