# 🚨 Trunk Extension Troubleshooting Guide

## Quick Fix for "Trunk ran into a problem"

### ⚡ Instant Solution (1 minute)

1. **Restart Trunk in VSCode:**
   - Press `Ctrl+Shift+P`
   - Type "Trunk: Restart"
   - Press Enter

2. **If that doesn't work, reload VSCode:**
   - Press `Ctrl+Shift+P`
   - Type "Developer: Reload Window"
   - Press Enter

3. **Verify fix:**
   - Open any file in your project
   - Trunk should show status in bottom-right corner
   - No error popup should appear

---

## 🔍 Root Cause (For Reference)

**Issue:** Windows filesystem `nul` device conflict
**Affected:** Python/Go linters (black, ruff, isort, shfmt, taplo)
**Solution:** Temporarily disabled problematic linters
**Status:** ✅ Fixed in `.trunk/trunk.yaml`

---

## 📋 Verification Checklist

After restarting extension, verify these items:

```bash
# 1. CLI still works
trunk --version
# Expected: 1.25.0

# 2. Check runs without errors
trunk check --sample 3
# Expected: No filesystem errors

# 3. Extension status in VSCode
# Look at bottom-right corner
# Expected: Trunk icon with file count
```

---

## 🐛 If Problems Persist

### Extension Still Crashes?

**Option 1: Clear Trunk cache**
```bash
# Delete cache directory
rm -rf .trunk/out
rm -rf .trunk/logs

# Restart extension
# Ctrl+Shift+P → "Trunk: Restart"
```

**Option 2: Reinstall extension**
```bash
# In VSCode Extensions panel (Ctrl+Shift+X)
1. Search "Trunk"
2. Click "Uninstall"
3. Reload VSCode
4. Reinstall "Trunk"
5. Reload VSCode again
```

**Option 3: Check extension logs**
```bash
# In VSCode:
1. Ctrl+Shift+P
2. "Developer: Show Logs"
3. Select "Extension Host"
4. Look for "trunk" errors
5. Share in GitHub issue if needed
```

---

### CLI Works But Extension Doesn't?

**Possible causes:**
1. Extension version mismatch
2. VSCode permissions issue
3. Extension daemon crash

**Solutions:**
```bash
# 1. Update both CLI and extension
trunk upgrade

# 2. In VSCode, update Trunk extension
# Extensions panel → Trunk → Update

# 3. Restart VSCode completely
# Close all windows, reopen
```

---

## 🔧 Advanced Diagnostics

### Check Daemon Logs
```bash
# View recent daemon output
ls -lt .trunk/out/*.yaml | head

# Read specific error file
cat .trunk/out/<latest-error>.yaml
```

### Validate Configuration
```bash
# Check YAML syntax
trunk check .trunk/trunk.yaml

# List active linters
trunk check --list

# Test on single file
trunk check README.md
```

### Check Runtime Status
```bash
# Node (should work)
node --version
# Expected: v22.x

# Python (currently disabled)
python --version
# Expected: Error (not installed)

# Go (currently disabled)
go version
# Expected: Error (not installed)
```

---

## 📞 Getting Help

### Before Reporting Issue

Collect this information:

```bash
# System info
trunk --version
node --version
code --version

# Error logs
cat .trunk/out/*.yaml

# Configuration
cat .trunk/trunk.yaml
```

### Where to Report

1. **Internal team:** Share `TRUNK_FIX_REPORT.md`
2. **Trunk support:** https://github.com/trunk-io/trunk/issues
3. **Extension bug:** https://github.com/trunk-io/vscode-trunk/issues

---

## ✅ Success Indicators

You're all set when:

- ✅ No "Trunk ran into a problem" popup
- ✅ Trunk icon visible in VSCode status bar
- ✅ `trunk check` runs without filesystem errors
- ✅ File issues show up in VSCode Problems panel
- ✅ Extension updates on file save

---

**Last Updated:** 2025-11-19
**Fix Version:** 1.0
**Configuration:** `.trunk/trunk.yaml`
