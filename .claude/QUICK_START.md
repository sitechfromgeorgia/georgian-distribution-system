# .Claude Quick Start Guide

> Fast-track reference for the Claude Code configuration system

**For:** Developers wanting quick answers  
**Time to Read:** 5 minutes  
**Go Deep:** See CLAUDE.md (complete reference)

---

## 🚀 I Need to...

### Build a New Feature
```
1. /speckit.specify "Your feature description"
2. Read: .claude/workflows/feature-development.md
3. Use Skill: nextjs-supabase-saas-planner
4. Follow: .claude/rules/coding-standards.md
5. Deploy: /deploy command
```

### Fix a Bug
```
1. Use Skill: intelligent-debugger
2. Follow: 7-step debugging process in SKILL.md
3. Check: .claude/skills/intelligent-debugger/references/
4. Run: python scripts/log_analyzer.py
5. Test: npm test
```

### Deploy to Production
```
1. Read: .claude/commands/deploy.md
2. Run: npm test && npm run build
3. Use Skill: deployment-automation
4. Git: git push origin main
5. Monitor: Sentry dashboard
```

### Understand the Architecture
```
Read in this order:
1. .claude/instructions.md (overview)
2. .claude/context.md (current status)
3. .claude/architecture.md (system design)
```

### Check Project Status
```
Read: .claude/context.md
Shows:
- Current branch status
- Completed features
- Known issues
- Next priorities
```

### Write Quality Code
```
Follow: .claude/rules/coding-standards.md
Key points:
- TypeScript strict mode
- React best practices
- Next.js patterns
- Security requirements
```

### Optimize for Mobile
```
Use Skill: mobile-first-designer
Read: .claude/knowledge/mobile-optimization.md
Reference: PWA_GUIDE.md
```

### Debug Performance
```
Use Skill: intelligent-debugger
Run: python skills/intelligent-debugger/scripts/performance_check.py
Check: .claude/knowledge/realtime-optimization-summary.md
```

### Validate an Idea
```
Use Skill: idea-validator-pro
Use Skill: feature-impact-analyzer
Check: .claude/knowledge/answers/
```

---

## 📚 The Big Three Documents

### 1. instructions.md (Read First)
**What:** Complete project overview  
**When:** Starting new work  
**Contains:** Stack, standards, security, skills, commands  

### 2. context.md (Check Often)
**What:** Current project status  
**When:** Before every session  
**Contains:** Branch status, achievements, issues, next steps  

### 3. architecture.md (Reference)
**What:** System design & patterns  
**When:** Building features or scaling  
**Contains:** Architecture, database, realtime, deployment  

---

## 🎯 The 18 Skills (Pick One)

### If you're...

| Doing This | Use This Skill |
|-----------|----------------|
| Fixing bugs | intelligent-debugger |
| Reviewing code | code-quality-guardian |
| Designing database | database-schema-architect |
| Planning architecture | system-architecture-advisor |
| Integrating API | api-integration-specialist |
| Mobile/PWA work | mobile-first-designer |
| UI/UX design | modern-ui-designer |
| Analyzing feedback | user-feedback-interpreter |
| Building SaaS features | saas-architect |
| Planning new features | nextjs-supabase-saas-planner |
| Planning launch | saas-launch-planner |
| Prioritizing features | feature-impact-analyzer |
| Validating ideas | idea-validator-pro |
| Improving conversions | conversion-optimization-expert |
| SEO/Performance | technical-seo-specialist |
| Setting up analytics | product-analytics-integrator |
| CI/CD automation | deployment-automation |
| Improving prompts | prompt-optimization |

---

## 🛠️ The 13 Commands

### Speckit Commands (9)
```
/speckit.specify [description]      Create feature spec
/speckit.clarify [topic]            Resolve unclear requirements
/speckit.plan [notes]               Generate tech plan
/speckit.checklist [type]           Create quality checklists
/speckit.tasks [notes]              Generate task breakdown
/speckit.implement [notes]          Execute implementation
/speckit.analyze [focus]            Analyze specifications
/speckit.constitution [updates]     Manage project principles
speckit.md                           Complete guide
```

### System Commands (4)
```
/dev-setup                          Setup development environment
/test-feature                       Run feature tests
/deploy                             Production deployment
```

---

## 📖 Rules (Must Follow)

| Rule File | Contains |
|-----------|----------|
| coding-standards.md | TypeScript, React, Next.js patterns |
| security-requirements.md | Auth, encryption, validation |
| database-guidelines.md | RLS, migrations, indexing |
| testing-guidelines.md | Vitest, E2E, coverage targets |

---

## 🧠 Knowledge Base Quick Links

- **Analytics** → analytics-guide.md
- **Database** → database-schema.md
- **Mobile** → mobile-optimization.md
- **Orders** → order-workflow.md
- **PWA** → pwa-implementation.md
- **Real-time** → realtime-architecture.md
- **Tech Stack** → technology-stack.md
- **Roles** → user-roles.md
- **Q&A** → answers/ folder

---

## 🔧 Common Tasks (Copy-Paste Ready)

### Start Development
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### Run Tests
```bash
cd frontend
npm test              # Run all tests
npm test -- --watch  # Watch mode
npm test -- --coverage  # With coverage
```

### Type Check
```bash
cd frontend
npm run type-check
```

### Lint Code
```bash
cd frontend
npm run lint
```

### Build for Production
```bash
cd frontend
npm run build
```

### Create Feature Branch
```bash
git checkout main
git pull origin main
git checkout -b 00X-feature-name
```

### Commit Changes
```bash
git add .
git commit -m "feat: description

Details here

🤖 Generated with Claude Code"
```

### Create Pull Request
```bash
gh pr create --title "feat: description" --body "PR body here"
```

---

## 🎓 Learning Path (First Time?)

**Day 1 (30 min)**
- [ ] Read: instructions.md
- [ ] Read: context.md
- [ ] Skim: architecture.md

**Day 2 (45 min)**
- [ ] Read: rules/coding-standards.md
- [ ] Read: rules/security-requirements.md
- [ ] Review: technology-stack.md

**Day 3 (30 min)**
- [ ] Run: `/dev-setup`
- [ ] Read: commands/dev-setup.md
- [ ] Explore: codebase

**Day 4+**
- [ ] Pick a small task
- [ ] Follow relevant workflow
- [ ] Reference appropriate skill
- [ ] Submit for review

---

## 🐛 Debugging Flowchart

```
Bug Reported
    ↓
Can you reproduce it?
    NO → Gather more info
    YES ↓
    ↓
Use: intelligent-debugger skill
    ↓
Follow: 7-step process
    1. Reproduce
    2. Gather info
    3. Understand system
    4. Hypothesize
    5. Implement fix
    6. Verify
    7. Document
    ↓
Done!
```

---

## 🔐 Security Essentials

✅ DO:
- Validate all user input (use Zod)
- Test RLS policies for each role
- Use parameterized queries
- Verify auth in API routes
- Enable HTTPS in production

❌ DON'T:
- Commit .env files
- Trust client-side checks
- Use raw SQL with user input
- Hardcode secrets
- Disable security rules

See: rules/security-requirements.md

---

## 📊 Project Status

**Analytics Dashboard:** ✅ Complete (17/17 tasks)  
**Restaurant Orders:** 🔄 Next feature  
**Driver Mobile:** ⏳ Planned  
**Performance Dashboard:** ⏳ Planned  

Current Branch: `001-analytics-dashboard` (ready to merge)  
Main Branch: `main` (production)

---

## 🎯 Skill Quick Decision Tree

```
What's your task?
│
├─ Building something new?
│  └─ nextjs-supabase-saas-planner
│
├─ Fixing a problem?
│  └─ intelligent-debugger
│
├─ Making something better?
│  ├─ Performance? → technical-seo-specialist
│  ├─ Mobile? → mobile-first-designer
│  ├─ Code? → code-quality-guardian
│  └─ Database? → database-schema-architect
│
├─ Planning/Strategy?
│  ├─ Feature Priority? → feature-impact-analyzer
│  ├─ Validation? → idea-validator-pro
│  └─ Launch? → saas-launch-planner
│
└─ Other?
   ├─ Analytics? → product-analytics-integrator
   ├─ API? → api-integration-specialist
   ├─ UI? → modern-ui-designer
   ├─ Feedback? → user-feedback-interpreter
   ├─ Conversion? → conversion-optimization-expert
   ├─ Deploy? → deployment-automation
   └─ Prompts? → prompt-optimization
```

---

## 📞 Getting Help

### "I don't know where to start"
→ Read: instructions.md + context.md

### "I need to understand the system"
→ Read: architecture.md

### "Which skill do I use?"
→ Check: Quick Decision Tree (above)

### "How do I do X?"
→ Search: knowledge/ folder

### "What are the rules?"
→ Read: rules/ folder

### "Is this already done?"
→ Check: context.md

### "I'm stuck on a bug"
→ Use: intelligent-debugger skill

### "I need to plan work"
→ Use: /speckit.specify command

---

## 🗂️ Folder Map (Quick Reference)

```
.claude/
├── instructions.md ................. Read first
├── context.md ...................... Check often
├── architecture.md ................. System design
├── commands/ ....................... Quick commands
├── workflows/ ...................... Process guides
├── skills/ ......................... 18 specialists
├── rules/ .......................... Standards
├── knowledge/ ...................... Documentation
└── integrations/ ................... External services
```

---

## ⚡ Power Tips

1. **Always read `context.md` first** - Know where the project stands
2. **Use the right skill** - Don't do everything yourself
3. **Follow the workflows** - They're battle-tested
4. **Check the knowledge base** - Answers are documented
5. **Run tests before committing** - Catch issues early
6. **Update context after major work** - Keep team in sync
7. **Use Speckit for features** - Systematic > chaotic
8. **Reference standards** - Consistency matters
9. **Ask for help** - Use appropriate skill
10. **Document as you go** - Future you will thank you

---

## ❓ FAQ (2 Minutes)

**Q: Where's the complete reference?**  
A: CLAUDE.md (comprehensive master guide)

**Q: What's the most used skill?**  
A: intelligent-debugger (for bug fixing)

**Q: How do I start a feature?**  
A: /speckit.specify [description]

**Q: Should I read all the skills?**  
A: No, use them as needed for your task

**Q: How often do I update context.md?**  
A: After completing major features or deployments

**Q: Can I modify the rules?**  
A: Propose changes in PR with justification

**Q: What if I get stuck?**  
A: Use intelligent-debugger skill + ask for help

**Q: Is there a learning path?**  
A: Yes, see Day 1-4 plan (above)

---

## 🚀 30-Second Start

```
1. cd frontend
2. npm install
3. npm run dev
4. Open http://localhost:3000
5. Read: .claude/instructions.md
```

---

## 📋 Pre-Commit Checklist

- [ ] Tests pass: `npm test`
- [ ] Types pass: `npm run type-check`
- [ ] Lint passes: `npm run lint`
- [ ] No console.log statements
- [ ] No commented code
- [ ] Updated documentation
- [ ] Followed coding standards
- [ ] Mobile responsive
- [ ] Security considered
- [ ] RLS tested (if DB changes)

---

## 🎓 Master Documents

| Document | Purpose | Time |
|----------|---------|------|
| QUICK_START.md | This file (quick answers) | 5 min |
| instructions.md | Project overview | 15 min |
| context.md | Current status | 10 min |
| architecture.md | System design | 30 min |
| CLAUDE.md | Complete reference | 60 min |

---

**Last Updated:** 2025-11-19  
**Status:** Ready to use  
**Go Deep:** See CLAUDE.md

Start building! 🚀
