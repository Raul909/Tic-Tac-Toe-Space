# 🔒 SECURITY CHECKLIST

## ⚠️ NEVER COMMIT THESE TO GITHUB:

- ❌ `.env` file
- ❌ MongoDB connection strings
- ❌ Database passwords
- ❌ API keys
- ❌ Secret tokens
- ❌ AWS credentials
- ❌ Any passwords

## ✅ Safe MongoDB Setup

### Step 1: Get Connection String from Atlas

1. MongoDB Atlas → Database → Connect
2. Copy connection string
3. Replace `<password>` with your actual password
4. Add `/tictactoe` before the `?`

**Example format (DO NOT COMMIT):**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/tictactoe?retryWrites=true&w=majority
```

### Step 2: Add to Local .env (NOT COMMITTED)

```bash
cd tictactoe
nano .env
```

Add:
```env
MONGODB_URI=your_connection_string_here
NODE_ENV=development
PORT=3000
```

**Verify .env is in .gitignore:**
```bash
cat .gitignore | grep .env
# Should show: .env
```

### Step 3: Add to Render (Secure)

1. Render Dashboard → Your Service
2. Environment tab
3. Add Environment Variable:
   - Key: `MONGODB_URI`
   - Value: Your connection string
4. Save

**This is secure** - Render encrypts environment variables.

### Step 4: Use in Code (Safe)

```javascript
// This is SAFE - reads from environment
const MONGODB_URI = process.env.MONGODB_URI;

// This is UNSAFE - hardcoded password
// const MONGODB_URI = 'mongodb+srv://user:password123@...'; // ❌ NEVER DO THIS
```

## 🛡️ Security Best Practices

### ✅ DO:
- Use environment variables
- Keep `.env` in `.gitignore`
- Use strong passwords
- Rotate credentials regularly
- Use different passwords for dev/prod

### ❌ DON'T:
- Commit `.env` files
- Hardcode passwords in code
- Share credentials in chat/email
- Use weak passwords
- Reuse passwords

## 🔍 Check for Exposed Secrets

```bash
# Check if .env is ignored
git status

# Should NOT show .env file
# If it does, remove it:
git rm --cached .env
git commit -m "Remove .env from tracking"
```

## 🚨 If You Accidentally Exposed Secrets

### IMMEDIATE ACTIONS:

1. **Revoke the exposed credential IMMEDIATELY**
   - MongoDB: Change password in Atlas
   - API Keys: Revoke and generate new one
   - AWS: Rotate access keys
   
2. **Generate new credentials**
   - Use strong, unique values
   - Store in `.env` (local) or Render Environment (production)
   
3. **Never reuse exposed credentials**
   - Assume they are compromised
   - Create completely new ones

### If Exposed in Chat/Email:
- ❌ The key is now public and compromised
- ✅ Revoke it immediately
- ✅ Generate a new one
- ✅ Never share the new one

### If Committed to GitHub:
1. **Revoke credentials immediately**
2. **Remove from git history**
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   
   git push origin --force --all
   ```
3. **Verify removal**
   ```bash
   git log --all --full-history -- .env
   ```

## 🔐 API Key Management

### Where to Store API Keys:

**Local Development:**
```bash
# .env file (in .gitignore)
MODEL_API_KEY=your_actual_key_here
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
```

**Production (Render):**
```
Dashboard → Environment → Add Variable
Key: MODEL_API_KEY
Value: your_actual_key_here
```

**In Code (Safe):**
```javascript
// ✅ CORRECT - Read from environment
const apiKey = process.env.MODEL_API_KEY;

// ❌ WRONG - Hardcoded
const apiKey = 'al-aFvshpCZKWLI1eqg2Xd0W85dk8d3YClhF4BQ87Er0Wc';
```

## ⚠️ Common Mistakes to Avoid

### ❌ DON'T:
- Share keys in chat, email, or messages
- Commit `.env` files to git
- Hardcode keys in source code
- Screenshot keys and share images
- Post keys in forums or Stack Overflow
- Share keys with team members directly

### ✅ DO:
- Use environment variables
- Keep `.env` in `.gitignore`
- Use secret management tools
- Rotate keys regularly
- Use different keys for dev/staging/prod
- Share keys through secure password managers

## 🛡️ Security Checklist

Before committing code:
- [ ] No hardcoded passwords
- [ ] No API keys in code
- [ ] `.env` in `.gitignore`
- [ ] No connection strings in code
- [ ] No AWS credentials in code
- [ ] All secrets in environment variables

## 📝 Remember

**If you can see it in your code, so can everyone else on GitHub!**

Use environment variables for ALL secrets.

## ✅ Current Status

Your repository is secure:
- ✅ `.env` in `.gitignore`
- ✅ No secrets in git history
- ✅ `.env.example` provided (safe template)
- ✅ Environment variables documented

## 📝 Remember

**Golden Rule:** If it's a secret, it goes in `.env` or Render Environment Variables, NEVER in code!
