# 🚀 CI/CD Setup Guide

This project uses **GitHub Actions** for automated testing, building, and deployment to Vercel.

## 📋 What the CI/CD Pipeline Does

```
Code Push → GitHub
    ↓
GitHub Actions Triggered
    ├─ 🔍 Lint (ESLint)
    ├─ 🏗️ Build (Vite)
    └─ 🚀 Deploy to Vercel
    ↓
Live at Vercel URL ✅
```

---

## ⚙️ Setup Instructions

### **Step 1: Create Vercel Account**
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Authorize Vercel to access your GitHub repositories

### **Step 2: Connect Repository**
1. In Vercel dashboard, click **"Add New..."** → **"Project"**
2. Select **"SCHOOL_RESULT_SYSTEM"** repository
3. Configure settings:
   - **Framework:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Click **"Deploy"** (this creates your Vercel project)

### **Step 3: Get Vercel Secrets**
1. Go to **Project Settings** → **Environment Variables**
2. Copy the following from your Vercel dashboard:
   - **Vercel Token:** Dashboard → Settings → Tokens → Create
   - **Vercel Org ID:** Settings → Teams (copy Org ID)
   - **Vercel Project ID:** Project Settings → Project ID

### **Step 4: Add GitHub Secrets**
1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"** and add:

| Secret Name | Value |
|------------|-------|
| `VERCEL_TOKEN` | Your Vercel token |
| `VERCEL_ORG_ID` | Your Vercel Org ID |
| `VERCEL_PROJECT_ID` | Your Vercel Project ID |
| `VITE_API_URL` | `https://your-api.com` (optional) |

### **Step 5: Enable Protected Branch**
1. Go to **Settings** → **Branches** → **Branch protection rules**
2. Create rule for `main`:
   - ✅ Require status checks to pass before merging
   - ✅ Select `build` and `lint` checks

---

## 🔄 How to Use

### **Automatic Deployment**
```bash
# 1. Make changes locally
git add .
git commit -m "Feature: Add new subjects"

# 2. Push to GitHub
git push origin main

# 3. GitHub Actions automatically:
#    - Lints code
#    - Builds project
#    - Deploys to Vercel ✅

# Check status: GitHub → Actions tab
```

### **Pull Request Workflow**
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes and commit
git push origin feature/new-feature

# 3. Create Pull Request on GitHub
# GitHub Actions will:
#    - Run lint & build tests
#    - Report status on PR ✅

# 4. If all checks pass, merge to main
# Vercel deployment starts automatically
```

---

## 📊 Monitoring Your Deployments

### **GitHub Actions**
- Go to: **Repo** → **Actions** tab
- See all workflow runs with status ✅ or ❌

### **Vercel Deployments**
- Go to: [vercel.com/dashboard](https://vercel.com/dashboard)
- See deployment history
- Get live URL: `https://your-project.vercel.app`

### **Logs**
Click on any workflow run to see:
- 🔍 Lint output
- 🏗️ Build logs
- 🚀 Deployment logs

---

## 🛠️ Troubleshooting

### **Build fails: "Cannot find module X"**
```bash
# Solution: Ensure dependencies are installed
npm install
npm run build
```

### **Vercel deployment fails**
- Check Vercel secrets are correctly set
- Verify `VERCEL_PROJECT_ID` is correct
- Go to Vercel dashboard → Project → Deployments → Logs

### **Lint errors block deployment**
```bash
# Fix lint errors locally first
npm run lint

# Then commit and push
git add .
git commit -m "Fix: Lint errors"
git push origin main
```

---

## 📝 Environment Variables

If your app needs environment variables:

```bash
# 1. Add to Vercel Dashboard
# Project Settings → Environment Variables

# 2. Add to GitHub Secrets (for local CI/CD)
VITE_API_URL=https://api.example.com

# 3. Access in code
const apiUrl = import.meta.env.VITE_API_URL;
```

---

## 🔐 Security Best Practices

✅ **Do:**
- Keep secrets in GitHub Secrets (never in code)
- Use environment variables for sensitive data
- Require branch protection on main
- Review PRs before merging

❌ **Don't:**
- Commit secrets to Git
- Use hardcoded API keys
- Bypass status checks
- Use production secrets in development

---

## 📈 Next Steps

1. **Monitor first deployment** (takes 2-5 minutes)
2. **Set up team notifications** (Slack/Email)
3. **Add more environments** (staging, production)
4. **Implement automated testing** (unit tests, e2e)
5. **Set up monitoring** (error tracking, analytics)

---

## 📞 Need Help?

- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **Vercel Docs:** https://vercel.com/docs
- **Common Issues:** See Troubleshooting section above

---

**Status:** ✅ CI/CD Pipeline Ready
**Last Updated:** April 27, 2026
