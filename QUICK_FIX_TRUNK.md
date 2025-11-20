# ⚡ Quick Fix: Trunk VSCode Extension on Windows

## 🎯 Problem
VSCode shows: **"Trunk ran into a problem"** or **"Trunk: Stopped"**

## ✅ Solution (3 steps, 2 minutes)

### Step 1: Reload VSCode (30 seconds)
```
Press: Ctrl+Shift+P
Type: "Developer: Reload Window"
Press: Enter
```

### Step 2: Verify It's Working (30 seconds)
Look at bottom-right corner of VSCode → Should see Trunk icon without error

### Step 3: Wait for Runtimes (First Time Only, ~5 minutes)
Trunk is downloading Python & Go in the background. Check progress:

```
View → Output → Select "Trunk" from dropdown
```

---

## 📋 What Changed?

**Files Modified:**
1. `.trunk/trunk.yaml` - Configured hermetic Python/Go runtimes
2. `.trunk/user.yaml` - Windows-specific linter overrides (NEW, not in git)
3. `.trunk/.gitignore` - Excluded user.yaml from version control

**Based On:** [Official Trunk.io Documentation](https://docs.trunk.io/)

---

## 🐛 Still Not Working?

### Check #1: Daemon Running?
```bash
trunk daemon status
```
**Expected:** `✔ Daemon running (pid: xxxxx)`

### Check #2: View Logs
```
VSCode: View → Output → "Trunk"
```

### Check #3: Clear Cache & Retry
```bash
rm -rf .trunk/out
rm -rf .trunk/logs
```
Then reload VSCode again

---

## 📖 Full Details

See: [TRUNK_WINDOWS_SOLUTION.md](./TRUNK_WINDOWS_SOLUTION.md)

---

**Fixed:** 2025-11-19
**Status:** ✅ Ready to Use
**Next:** Reload VSCode → Extension works!
