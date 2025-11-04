# Memory Bank Prompting Guide for Kilocode AI Agent

## PURPOSE
This document provides the Prompt Master mode with comprehensive guidelines for creating high-quality, detailed, and executable prompts for Kilocode AI Agent tasks.

## MEMORY BANK STRUCTURE

The Memory Bank consists of structured markdown files stored in `.kilocode/rules/memory-bank/` that help Kilocode maintain context across sessions:

### Core Files (Mandatory)

1. **brief.md** (Manually created and maintained)
   - Foundation document for the entire project
   - High-level overview of what you're building
   - Core requirements and business goals
   - Should be concise but comprehensive
   - Example: "Building a React web app for Georgian distribution system with multi-warehouse support, real-time inventory tracking, and barcode scanning capabilities."

2. **product.md** (AI-maintained)
   - Why the project exists
   - Problems being solved
   - How the product should work
   - User experience goals and expectations
   - Target audience and use cases

3. **context.md** (Most frequently updated)
   - Current work focus and active tasks
   - Recent changes and completed work
   - Active decisions and considerations
   - Next steps and immediate priorities
   - Blockers and open questions

4. **architecture.md** (AI-maintained)
   - System architecture overview
   - Key technical decisions and rationale
   - Design patterns in use
   - Component relationships and data flow
   - Critical implementation paths
   - Integration points

5. **tech.md** (AI-maintained)
   - Technologies, frameworks, and libraries
   - Development environment setup
   - Technical constraints and requirements
   - Dependencies and versions
   - Tool configurations and usage patterns
   - Build and deployment processes

### Optional Files

6. **tasks.md** (Optional but recommended)
   - Repetitive task workflows
   - Step-by-step procedures for common patterns
   - Files typically modified for specific task types
   - Important considerations and gotchas
   - Examples: "Adding new AI models", "Implementing API endpoints"

7. **Additional context files** (As needed)
   - Feature-specific documentation
   - Integration specifications
   - API documentation
   - Testing strategies
   - Deployment procedures

## PROMPT ENGINEERING FRAMEWORKS

### 1. RTF Framework (Role-Task-Format)
**Best for:** Simple code changes, bug fixes, straightforward implementations

**Structure:**
```
Role: [Specify AI expertise - e.g., "You are a senior React developer"]
Task: [Clear, specific action - e.g., "Refactor the UserProfile component"]
Format: [Expected output - e.g., "Provide updated code with inline comments"]
```

### 2. PECRA Framework (Purpose-Expectation-Context-Request-Audience)
**Best for:** Complex features, new system components, multi-file changes

**Structure:**
```
Purpose: [Overall goal and why it matters]
Expectation: [Desired output format and quality standards]
Context: [Relevant background, constraints, and dependencies]
Request: [Specific task with detailed requirements]
Audience: [Who will use/review this - affects complexity level]
```

### 3. OSCAR Framework (Objective-Scope-Constraints-Assumptions-Results)
**Best for:** Architectural decisions, system design, complex planning

**Structure:**
```
Objective: [End goal and success criteria]
Scope: [Boundaries and what's included/excluded]
Constraints: [Limitations, technical restrictions, compliance needs]
Assumptions: [Accepted conditions and prerequisites]
Results: [Expected deliverables and outcomes]
```

### 4. APE Framework (Action-Purpose-Expectation)
**Best for:** Research tasks, analysis work, Ask mode queries

**Structure:**
```
Action: [What to analyze/research/explain]
Purpose: [Why this information is needed]
Expectation: [How to present findings]
```

### 5. Chain-of-Thought (CoT) Prompting
**Best for:** Complex reasoning, debugging, multi-step problem-solving

**Pattern:**
```
Task: [Problem description]
Think step-by-step:
1. [First consideration]
2. [Second consideration]
3. [Third consideration]
Then: [Final action/solution]
```

## PROMPT QUALITY CHECKLIST

Before delivering any prompt, validate against these criteria:

### ✓ Context Completeness
- [ ] Memory Bank knowledge incorporated
- [ ] Relevant codebase patterns identified
- [ ] Project Constitution principles referenced
- [ ] Technology stack constraints acknowledged
- [ ] Current project status understood

### ✓ Objective Clarity
- [ ] Goal is specific and measurable
- [ ] Success criteria are defined
- [ ] Scope is clearly bounded
- [ ] Deliverables are explicit
- [ ] Timeline or priority indicated

### ✓ Requirements Detail
- [ ] Functional requirements listed
- [ ] Technical specifications provided
- [ ] Performance expectations stated
- [ ] Security considerations included
- [ ] Georgian localization needs addressed (if applicable)

### ✓ Implementation Guidance
- [ ] Steps are actionable and sequential
- [ ] Dependencies are identified
- [ ] File paths are specific
- [ ] Code patterns are referenced
- [ ] Edge cases are considered

### ✓ Verification Criteria
- [ ] Test commands specified
- [ ] Success indicators defined
- [ ] Error handling covered
- [ ] Validation steps included
- [ ] Acceptance criteria clear

### ✓ Mode Appropriateness
- [ ] Correct mode selected for task type
- [ ] Tool permissions match needs
- [ ] File access scope is appropriate
- [ ] Constraints align with mode capabilities

### ✓ Language and Format
- [ ] Prompt body is in English
- [ ] Georgian terms handled appropriately
- [ ] Markdown formatting correct
- [ ] Code blocks properly formatted
- [ ] Structure follows template

### ✓ Constitution Alignment
- [ ] Follows project principles
- [ ] Respects coding standards
- [ ] Adheres to architecture patterns
- [ ] Maintains type safety
- [ ] Includes proper error handling

## KILOCODE MODE SELECTION GUIDE

### 💻 Code Mode
**Use when:**
- Implementing features
- Writing new code
- Modifying existing functionality
- Bug fixes with code changes
- Refactoring work

**Permissions:** Full access (read, edit, browser, command, MCP)

### ❓ Ask Mode
**Use when:**
- Researching approaches
- Understanding code
- Exploring documentation
- Learning new concepts
- Code explanation needed

**Permissions:** Read-only (read, browser, MCP)

### 🏗️ Architect Mode
**Use when:**
- System design
- High-level planning
- Architecture decisions
- Creating specifications
- Writing technical documentation

**Permissions:** Read + markdown editing only (read, edit for .md, browser, MCP)

### 🪲 Debug Mode
**Use when:**
- Investigating bugs
- Diagnosing errors
- Performance troubleshooting
- Test failures
- Runtime issues

**Permissions:** Full access (read, edit, browser, command, MCP)

### 🪃 Orchestrator Mode
**Use when:**
- Complex multi-phase projects
- Tasks requiring multiple modes
- Coordinating subtasks
- Breaking down large features
- Managing workflows

**Permissions:** Task delegation and coordination

## CLARIFYING QUESTIONS FRAMEWORK

When user requests are ambiguous or incomplete, ALWAYS ask 4-5 clarifying questions before proceeding.

### Question Categories:

**1. Scope & Boundaries**
- What specific files/components are affected?
- What's in scope vs. out of scope?
- Are there any areas to avoid modifying?

**2. Technical Details**
- What technology stack should be used?
- Are there existing patterns to follow?
- What are the performance requirements?

**3. Context & Dependencies**
- What work was recently completed?
- What dependencies exist?
- What's the current state of related features?

**4. Success Criteria**
- How will we know this is complete?
- What are the acceptance criteria?
- Are there specific test cases to pass?

**5. Constraints & Preferences**
- Are there time or resource constraints?
- Any coding style preferences?
- Security or compliance requirements?

### Example Question Set:
```
Before I create the detailed prompt, I need to clarify a few things:

1. **Scope**: Which specific components or files should be modified for this feature?
2. **Integration**: Should this integrate with existing authentication, or is it standalone?
3. **Data Model**: Do we need new database tables, or will we extend existing ones?
4. **UI Requirements**: Is there a design mockup, or should I follow existing patterns?
5. **Testing**: What level of testing is expected (unit, integration, E2E)?

Please provide answers, and I'll generate a comprehensive prompt for Kilocode.
```

## RESEARCH INTEGRATION

### When to Request External Research:

Request research from Perplexity Space when:
- Best practices for unfamiliar technology
- Security patterns for sensitive features
- Performance optimization techniques
- Industry standards compliance
- New framework/library usage

### Research Request Template:
```
Before generating the prompt, I need to research best practices.

Please run these queries in Perplexity Space:

1. [Specific technical question about implementation approach]
2. [Security/performance consideration query]
3. [Framework-specific best practice question]

Once you provide the research findings, I'll incorporate them into a comprehensive prompt.
```

## PROMPT TEMPLATE STRUCTURE

Every generated prompt should follow this structure:

```markdown
# [TASK NAME] - [TARGET MODE]

## METADATA
- **ID**: [unique-identifier]
- **Title**: [Descriptive title]
- **Mode**: [Code | Ask | Architect | Debug | Orchestrator]
- **Created**: [YYYY-MM-DD]
- **Complexity**: [Low | Medium | High]
- **Estimated Time**: [time estimate]
- **Dependencies**: [list any prerequisite work]

## OBJECTIVE
[Clear, measurable goal statement. One paragraph explaining what should be achieved.]

## REQUIREMENTS

### Functional Requirements
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

### Technical Requirements
- [Technical spec 1]
- [Technical spec 2]

### Performance Requirements
- [Performance criteria]

### Security Requirements
- [Security considerations]

### Georgian Localization (if applicable)
- [Localization needs]

## CONTEXT

### Current State
[Description of current codebase state]

### Related Work
[Recent changes or related features]

### Constraints
[Any limitations or restrictions]

## IMPLEMENTATION STEPS

### Phase 1: [Phase Name]
**Files to modify:**
- `path/to/file1.ts`
- `path/to/file2.tsx`

**Tasks:**
1. [Specific task 1]
2. [Specific task 2]
3. [Specific task 3]

**Expected outcome:** [What should be achieved]

### Phase 2: [Phase Name]
[Same structure as Phase 1]

### Phase 3: [Phase Name]
[Same structure as Phase 1]

## TECHNICAL SPECIFICATIONS

### Type Safety
- [TypeScript interfaces/types needed]
- [Type validation approach]

### Database
- [Schema changes if any]
- [Query patterns]

### Real-time (if applicable)
- [WebSocket/subscription patterns]

### Performance
- [Optimization requirements]
- [Caching strategy]

### Testing
- [Test coverage expectations]
- [Test scenarios]

## DELIVERABLES

- [ ] [Deliverable 1 with specific criteria]
- [ ] [Deliverable 2 with specific criteria]
- [ ] [Deliverable 3 with specific criteria]
- [ ] Unit tests with >80% coverage
- [ ] Documentation updated
- [ ] Georgian translations added (if applicable)

## CONSTRAINTS

### Constitution Compliance
- Follow [Specific principle from Constitution v1.1.1]
- Adhere to [Coding standard]

### Technical Constraints
- [Technology limitation]
- [Performance boundary]

### Time Constraints
- [Any deadlines]

## VERIFICATION

### Commands to Run
\`\`\`bash
npm run type-check
npm run lint
npm run test
npm run build
\`\`\`

### Success Criteria
- [ ] All TypeScript types compile without errors
- [ ] All tests pass
- [ ] Linting passes with no warnings
- [ ] Feature works as specified
- [ ] No console errors in browser
- [ ] Georgian translations display correctly (if applicable)

### Manual Testing
1. [Test scenario 1]
2. [Test scenario 2]
3. [Test scenario 3]

## OUTPUT

### Expected Report Format
Provide a summary including:
- Changes made (files modified/created)
- Key decisions and rationale
- Any deviations from the plan and why
- Potential issues or follow-up work needed
- Test results summary

## NOTES
[Any additional context, warnings, or considerations]
```

## BEST PRACTICES

### 1. Always Start with Questions
- NEVER assume requirements
- Ask 4-5 clarifying questions
- Wait for answers before proceeding
- Validate understanding before generating

### 2. Consult Memory Bank First
- Read all Memory Bank files before analysis
- Reference current project status
- Incorporate architectural decisions
- Align with established patterns

### 3. Use Code Indexing
- Search codebase for relevant patterns
- Identify existing implementations to follow
- Find related components
- Discover dependencies

### 4. Select Appropriate Framework
- Simple tasks → RTF
- Complex features → PECRA
- Architecture → OSCAR
- Research → APE
- Multi-step → Orchestrator template

### 5. Be Specific and Detailed
- Include exact file paths
- Reference specific functions/components
- Provide concrete examples
- Define clear acceptance criteria

### 6. Think Georgian Context
- Consider localization needs
- Include translation requirements
- Reference Georgian-specific features
- Ensure RTL considerations if needed

### 7. Validate Before Delivery
- Run through quality checklist
- Ensure all sections complete
- Verify mode appropriateness
- Check Constitution alignment

### 8. Include Verification Steps
- Specific commands to run
- Clear success criteria
- Manual testing procedures
- Error handling validation

## COMMON PITFALLS TO AVOID

❌ **Don't:**
- Skip clarifying questions
- Assume requirements
- Mix Georgian and English in prompt body
- Forget Constitution compliance
- Omit verification steps
- Use vague language
- Provide generic examples
- Ignore Memory Bank context

✅ **Do:**
- Always ask first, generate second
- Be explicit and specific
- Reference actual project files
- Include concrete examples
- Provide clear acceptance criteria
- Validate against checklist
- Use English for prompt body
- Incorporate Memory Bank knowledge

## ITERATIVE IMPROVEMENT

After each prompt execution:
1. Track what worked well
2. Note any missing information
3. Identify improvements for next time
4. Update approach for similar tasks
5. Learn from feedback

## PROMPT SAVING CONVENTIONS

**File naming:** `prompts/[sequence]-[feature]-[mode].md`

Examples:
- `prompts/001-user-auth-code.md`
- `prompts/002-api-integration-architect.md`
- `prompts/003-performance-debug.md`

**File structure:**
```
project-root/
├── prompts/
│   ├── 001-feature-name-mode.md
│   ├── 002-feature-name-mode.md
│   └── README.md (index of prompts)
└── .kilocode/
    └── rules/
        └── memory-bank/
            └── prompting-guide.md (this file)
```

## SUCCESS METRICS

A successful Prompt Master interaction achieves:
1. ✅ User request begins with 4-5 clarifying questions
2. ✅ Memory Bank is read and referenced
3. ✅ Research requested when needed
4. ✅ Generated prompt is detailed and framework-aligned
5. ✅ Prompt passes quality validation
6. ✅ Properly saved with correct naming
7. ✅ Clear usage instructions provided
8. ✅ First-try execution success rate >80%

## EXAMPLE WORKFLOWS

### Workflow 1: New Feature Implementation

1. **User Request**: "Add user authentication"
2. **Prompt Master**: Asks 5 clarifying questions about scope, tech stack, UI, security, testing
3. **User Answers**: Provides details
4. **Prompt Master**: Reads Memory Bank, searches codebase for auth patterns
5. **Prompt Master**: Selects PECRA framework (complex feature)
6. **Prompt Master**: Generates detailed prompt with phases
7. **Prompt Master**: Validates against checklist
8. **Prompt Master**: Saves to `prompts/015-user-authentication-code.md`
9. **Prompt Master**: Reports location and usage instructions

### Workflow 2: Architecture Planning

1. **User Request**: "Design real-time notification system"
2. **Prompt Master**: Asks clarifying questions
3. **Prompt Master**: Requests research on WebSocket best practices
4. **User**: Provides research findings
5. **Prompt Master**: Reads Memory Bank for architecture context
6. **Prompt Master**: Selects OSCAR framework (architecture task)
7. **Prompt Master**: Generates detailed planning prompt for Architect mode
8. **Prompt Master**: Validates and saves
9. **Prompt Master**: Reports next steps

### Workflow 3: Bug Investigation

1. **User Request**: "Fix cart calculation error"
2. **Prompt Master**: Asks about error symptoms, reproduction steps, expected behavior
3. **User**: Provides details
4. **Prompt Master**: Searches codebase for cart-related files
5. **Prompt Master**: Selects RTF framework (straightforward fix)
6. **Prompt Master**: Generates Debug mode prompt with systematic approach
7. **Prompt Master**: Validates and saves
8. **Prompt Master**: Reports usage

## GEORGIAN LOCALIZATION CONSIDERATIONS

When creating prompts for projects with Georgian language support:

### Include in Requirements:
- Georgian translations for UI text
- RTL/LTR handling (Georgian is LTR)
- Georgian date/number formatting
- Georgian keyboard input support
- Font support for Georgian characters

### Testing Checklist:
- [ ] Georgian text displays correctly
- [ ] Input validation works with Georgian characters
- [ ] Sorting works correctly with Georgian alphabet
- [ ] Search functions handle Georgian text
- [ ] Error messages have Georgian translations

### Common Georgian-specific patterns:
```typescript
// Example: Georgian localization pattern
const translations = {
  en: { welcome: "Welcome" },
  ka: { welcome: "მოგესალმებით" } // Georgian
};
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-01
**Maintained By**: Prompt Master Mode
**Purpose**: Guide Prompt Master in creating optimal prompts for Kilocode AI Agent
