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

## 🚨 If You Accidentally Committed Secrets

1. **Rotate credentials immediately**
   - Change MongoDB password
   - Generate new API keys
   
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
   # Should show nothing
   ```

## ✅ Current Status

Your repository is secure:
- ✅ `.env` in `.gitignore`
- ✅ No secrets in git history
- ✅ `.env.example` provided (safe template)
- ✅ Environment variables documented

## 📝 Remember

**Golden Rule:** If it's a secret, it goes in `.env` or Render Environment Variables, NEVER in code!
