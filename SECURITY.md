# Security Guidelines

## ✅ Current Status

- `.env` files are NOT tracked by git
- `.env` files are in `.gitignore`
- No tokens have been committed to git history
- Example files (`.env.example`) are safe to commit

## Environment Variables

### What's Protected

The following files contain sensitive data and are **NEVER** committed:

- `.env` (root folder)
- `backend/.env` (backend folder)
- Any `.env.local` files
- Any `.env.*.local` files

### What's Safe to Commit

These template files are safe and should be committed:

- `.env.example` (root folder)
- `backend/.env.example` (backend folder)

## Setup for New Users

### 1. Clone Repository
```bash
git clone <repo-url>
cd phantomfleet
```

### 2. Create .env Files
```bash
# Root .env (for Streamlit)
copy .env.example .env

# Backend .env (for FastAPI)
copy backend\.env.example backend\.env
```

### 3. Add Your Token
Edit both `.env` files and replace `your_hf_token_here` with your actual Hugging Face token.

## Verification

### Check .env is Ignored
```bash
# Should return nothing
git status | findstr ".env"

# Should return nothing
git ls-files | findstr ".env"
```

### Check .env.example is Tracked
```bash
# Should show .env.example files
git ls-files | findstr ".env.example"
```

## If Token Was Accidentally Committed

If you accidentally committed a token:

### 1. Revoke the Token Immediately
Go to https://huggingface.co/settings/tokens and revoke the exposed token.

### 2. Generate New Token
Create a new token at https://huggingface.co/settings/tokens

### 3. Update .env Files
Replace the old token with the new one in both `.env` files.

### 4. Remove from Git History (if needed)
```bash
# Remove file from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env backend/.env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (WARNING: This rewrites history!)
git push origin --force --all
```

## Best Practices

### ✅ DO:
- Use `.env.example` as template
- Keep `.env` files local only
- Add `.env` to `.gitignore`
- Revoke tokens if exposed
- Use different tokens for dev/prod

### ❌ DON'T:
- Commit `.env` files
- Share tokens in chat/email
- Use production tokens in development
- Hardcode tokens in source code
- Push `.env` to public repos

## Current .gitignore Protection

```gitignore
# Environment variables - NEVER COMMIT THESE!
.env
.env.local
.env.*.local
backend/.env
backend/.env.local
**/.env
**/.env.local

# But allow example files
!.env.example
!backend/.env.example
```

This ensures:
- All `.env` files are ignored
- Example files are tracked
- Nested `.env` files are also ignored

## Token Security

### Hugging Face Token
- Free tier token
- Can be revoked anytime at https://huggingface.co/settings/tokens
- Rate limited by Hugging Face
- No billing risk

### If Token is Exposed
1. Revoke immediately
2. Generate new token
3. Update `.env` files
4. Check git history
5. Force push if needed (last resort)

## Monitoring

### Check for Exposed Secrets
```bash
# Search for potential tokens in code
git grep -i "hf_" -- "*.py" "*.ts" "*.tsx" "*.js"

# Should return nothing (tokens should only be in .env)
```

### Pre-commit Hook (Optional)
Create `.git/hooks/pre-commit`:
```bash
#!/bin/bash
if git diff --cached --name-only | grep -q "\.env$"; then
    echo "ERROR: Attempting to commit .env file!"
    echo "Please remove .env from staging area."
    exit 1
fi
```

## Summary

✅ Your tokens are safe
✅ `.env` files are not tracked
✅ `.gitignore` is properly configured
✅ Example files are provided for new users
✅ No tokens in git history

**Keep it this way - never commit .env files!**
