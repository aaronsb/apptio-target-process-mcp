# Claude Code Development Guidelines

## Mission
Give every Claude‑powered project a **durable, self‑healing development cadence** that mirrors disciplined human teams.  
The agent must **never write, refactor, or run code** unless that work is represented in `tasks.md` and mapped back to agreed‑upon requirements.

## Project Context Discovery
**CRITICAL:** Always discover and read project-scoped CLAUDE.md files when starting work in any project:

1. **Locate Project Root:** Search upward from current working directory for:
   - `CLAUDE.md` (primary project configuration)
   - `CLAUDE.local.md` (local overrides, typically gitignored)
   - `.claude/` directory containing project-specific configurations

2. **Read Order:** When multiple CLAUDE.md files exist in a project tree:
   - Read user scope first (`~/.claude/CLAUDE.md` - this file)
   - Read project root `CLAUDE.md` 
   - Read any subdirectory `CLAUDE.md` files relevant to current work area
   - Read `CLAUDE.local.md` last (highest precedence for local overrides)

3. **Auto-Discovery Trigger:** Perform this discovery:
   - At conversation start in any new directory
   - After compaction events (via hook system)
   - When user mentions project-specific requirements or constraints

## Tracking Method Selection

**CRITICAL:** When no task structure exists on disk, ask the user to choose tracking method:

### Detection Pattern
Look for these indicators of existing tracking:
- Local: `requirements.md`, `design.md`, `tasks.md`, or `.claude-tracking` file
- GitHub: Repository with issues/projects, or `.github-tracking` file

### If No Structure Found
Ask: *"This project has no tracking structure. Choose method:*
- **Local files** (requirements.md, design.md, tasks.md on disk)
- **GitHub integration** (issues, projects, milestones)*"

### Local File Setup (if chosen)
1. Create tracking indicator: `echo "local" > .claude-tracking`
2. Create initial structure:
   ```
   requirements.md    # User stories index
   design.md         # Architecture decisions  
   tasks.md          # Implementation plan
   ```

### GitHub Setup (if chosen) 
1. Create tracking indicator: `echo "github" > .github-tracking`
2. Create working directory: `mkdir -p .claude-github/`
3. Verify GitHub CLI: `gh auth status && gh repo view`
4. Enable GitHub features:
   - Issues: `gh repo edit --enable-issues=true`
   - Projects: Check with `gh project list --owner OWNER`
5. **Setup required labels**: Run label creation commands (see GitHub Setup section)
6. **Configure Projects**: Ask user about project board setup if needed

## Key Artefacts & Obligations

### Local File Method
| File            | Authoritative Purpose | Ownership & Update Rules |
|-----------------|-----------------------|--------------------------|
| `requirements.md` | *Source of truth for WHAT to build.*  Contains User Stories in **"As a …, I want …, so that …"** form.  Each story has **3‑10 acceptance criteria** written as **"When …, then …, shall …"** statements. | • Auto‑append / edit whenever the user articulates a new need.<br>• Keep stories atomic & testable.<br>• Maintain changelog at bottom. |
| `design.md`     | *Source of truth for HOW to build.*  Records architecture, technology choices, data flows, key diagrams, trade‑offs, open questions, references. | • Must cite corresponding requirement IDs.<br>• Revise collaboratively with user before any task planning.<br>• Mark decisions "✅ Locked" when final. |
| `tasks.md`      | *Source of truth for DOING the work.*  A living implementation plan.  Structured as **Tasks → Sub‑tasks**. | • One **Task** at a time may be decomposed and worked on.<br>• Each **Sub‑task** must list the `requirement‑ids` it satisfies.<br>• On completion, mark sub‑task "✔ Done" and, if the Task's last sub‑task closes, mark Task "✅ Complete".<br>• Claude (or its sub‑agents) MUST update this file after every change. |

### GitHub Method Equivalents
| GitHub Feature | Authoritative Purpose | Management Commands |
|----------------|-----------------------|---------------------|
| **Issues with labels** | *Requirements tracking.* Each issue = User Story with `requirement` label. Body contains "As/Want/So" format + acceptance criteria. | `gh issue create --label requirement --title "req-001: User Login" --body-file .claude-github/req.md`<br>`gh issue list --label requirement --state all` |
| **Discussion/Wiki** | *Design decisions.* Architecture docs, tech choices, trade-offs. Link to requirement issues. | `gh api repos/:owner/:repo/contents/wiki/Design.md --method PUT --field content=@.claude-github/design.md`<br>`gh repo view --web` (navigate to wiki) |
| **Milestones + Issues** | *Task management.* Milestones = Tasks, Issues = Sub-tasks with `task` label. | `gh issue create --milestone "Task-01-Auth" --label task --assignee @me`<br>`gh issue list --milestone "Task-01-Auth" --label task` |

## GitHub CLI Command Reference

### Requirements Management
```bash
# List all requirements
gh issue list --label requirement --state all --json number,title,state,labels

# Create new requirement
echo "As a user I want..." > .claude-github/req-temp.md
gh issue create --label requirement --title "req-XXX: Title" --body-file .claude-github/req-temp.md

# Update requirement (add acceptance criteria)
gh issue edit NUMBER --body-file .claude-github/updated-req.md

# View requirement details
gh issue view NUMBER --json title,body,labels,state
```

### Design Management  
```bash
# View current design decisions (via wiki or discussions)
gh api repos/:owner/:repo/contents/wiki/Design.md --jq '.content' | base64 -d

# Update design document
echo "## Architecture Decision..." > .claude-github/design-update.md
gh api repos/:owner/:repo/contents/wiki/Design.md --method PUT \
  --field message="Update design decisions" \
  --field content="$(base64 -i .claude-github/design-update.md)"
```

### Task Management
```bash
# Create milestone (Task)
gh api repos/:owner/:repo/milestones --method POST \
  --field title="Task-01-Authentication" \
  --field description="User auth implementation"

# List all tasks (milestones) 
gh api repos/:owner/:repo/milestones --jq '.[] | {title, state, open_issues, closed_issues}'

# Create sub-task
gh issue create --milestone "Task-01-Authentication" --label task \
  --title "sub-01-a: Research OAuth providers (req-001)" \
  --assignee @me --body "Implements req-001 acceptance criteria"

# List sub-tasks for active milestone
gh issue list --milestone "Task-01-Authentication" --label task --json number,title,state

# Complete sub-task  
gh issue close NUMBER --comment "✔ Done: OAuth provider research complete"

# Check milestone progress
gh api repos/:owner/:repo/milestones --jq '.[] | select(.title=="Task-01-Authentication") | {open_issues, closed_issues}'
```

### Status & Review Commands
```bash
# Project overview
gh repo view --json name,description,hasIssuesEnabled,hasProjectsEnabled
gh issue list --label requirement --state open --limit 5
gh api repos/:owner/:repo/milestones --jq '.[] | select(.state=="open") | .title'

# Daily standup view
gh issue list --assignee @me --label task --state open --json title,milestone

# Requirements completion status  
gh issue list --label requirement --state all --json number,title,state | \
  jq 'group_by(.state) | map({state: .[0].state, count: length})'
```

## GitHub Setup & Configuration

### Required Labels Setup
**CRITICAL:** Always verify and create required labels before using GitHub tracking:

```bash
# Check existing labels
gh label list --json name,color,description

# Create required labels (run these if missing)
gh label create "requirement" --color "0052CC" --description "User story/requirement tracking"
gh label create "task" --color "00AA00" --description "Implementation sub-task"
gh label create "design" --color "9932CC" --description "Architecture/design decision"
gh label create "blocked" --color "FF0000" --description "Work blocked, needs resolution"
gh label create "ready" --color "FFAA00" --description "Ready for implementation"

# Optional enhancement labels
gh label create "bug" --color "EE0000" --description "Bug fix required"
gh label create "enhancement" --color "00AA00" --description "Feature enhancement"
gh label create "priority-high" --color "FF4444" --description "High priority item"
gh label create "priority-medium" --color "FFAA44" --description "Medium priority item"
gh label create "priority-low" --color "44FF44" --description "Low priority item"
```

### Projects Configuration Check
**Ask user about project board setup when:**
- No projects exist: `gh project list --owner OWNER` returns empty
- Complex multi-milestone work is planned
- User wants visual kanban/roadmap tracking

**User Configuration Questions:**
1. *"Would you like me to create a GitHub Project board for visual task tracking?"*
2. *"Should we use a simple kanban view (To Do/In Progress/Done) or milestone-based planning?"*
3. *"Do you want automated project board updates when issues change status?"*

### Project Board Creation
```bash
# Create basic kanban project
gh project create --title "Project Development" --body "Main development tracking board"

# Get project number from creation output, then:
PROJECT_NUMBER="1"  # Replace with actual number

# Add standard columns
gh api graphql -f query='
  mutation {
    addProjectV2DraftIssue(input: {
      projectId: "PROJECT_ID"
      title: "Configure Board"
    }) {
      projectItem {
        id
      }
    }
  }'

# Alternative: Create via web UI and get project info
gh project list --owner OWNER --format json | jq '.[] | {number, title, url}'
```

### Automated Workflows (Optional)
Ask user: *"Should I help set up automated workflows for issue/project sync?"*

If yes, create `.github/workflows/project-sync.yml`:
```yaml
name: Project Sync
on:
  issues:
    types: [opened, edited, closed, reopened]
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Add to project
        uses: actions/add-to-project@v0.4.0
        with:
          project-url: https://github.com/users/USERNAME/projects/PROJECT_NUMBER
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Repository Permissions Check
```bash
# Verify repo permissions
gh api repos/:owner/:repo --jq '.permissions | {admin, push, pull}'

# Check if user can create milestones, labels, projects
gh api user --jq '.login'
gh api repos/:owner/:repo/collaborators/USERNAME/permission --jq '.permission'
```

> **Golden Rule:** *No code change is permissible unless it originates from an active sub‑task* (local `tasks.md` or GitHub issue with `task` label).

## Workflow Lifecycle

### 1. **Detect Tracking Method**
   - Check for `.claude-tracking` or `.github-tracking` files
   - If neither exists, ask user to choose and run setup
   - **GitHub method**: Verify labels exist (`gh label list`), create if missing
   - **GitHub method**: Check project setup, ask user about configuration if needed

### 2. **Elicit & Capture Requirements**  
   - **Local:** Listen to user; translate needs into user stories → `requirements.md`
   - **GitHub:** Create issues with `requirement` label containing "As/Want/So" format
   - Ask clarification questions only if ambiguity blocks writing a valid story

### 3. **Design Phase**  
   - **Local:** Draft or revise `design.md` to satisfy latest requirements
   - **GitHub:** Update wiki/discussions with architecture decisions, cite requirement issue numbers
   - Surface alternatives, risks, & diagrams
   - Obtain user approval ("✅ Locked")

### 4. **Plan Implementation**  
   - **Local:** Create/refine `tasks.md` with *Tasks* and *Sub‑tasks*
   - **GitHub:** Create milestones (*Tasks*) and issues with `task` label (*Sub‑tasks*)
   - Map every sub‑task to requirement‑ids (`req‑001`, `req‑002`, …)

### 5. **Execute**  
   - Work **one Task at a time** (milestone or task group)
   - Spawn sub‑agents to tackle multiple sub‑tasks in parallel **within** that Task only
   - **Local:** Keep `tasks.md` in sync with status, progress notes, timestamps
   - **GitHub:** Update issue status, add progress comments, close completed sub‑tasks

### 6. **Review & Close**  
   - **Local:** Validate acceptance criteria from `requirements.md`
   - **GitHub:** Check requirement issues for acceptance criteria validation
   - Demo or present diff to user
   - **Local:** Mark Task "✅ Complete" in `tasks.md`
   - **GitHub:** Close milestone when all sub‑task issues are closed
   - Rinse & repeat for next Task

## File Conventions

### Project Structure
```
project-root/
  requirements/
    requirements.md          # Index of all requirements with links
    auth/
      req-001-user-login.md
      req-002-oauth-integration.md
    payments/
      req-003-stripe-checkout.md
      req-004-subscription-mgmt.md
    changelog.md
  
  design.md                  # Architecture & technical decisions
  
  tasks.md                   # Current implementation plan
  
  src/                       # Implementation follows tasks.md
  tests/                     # Tests validate requirements.md
```

### tasks.md Structure
```markdown
## Task 01 – User Authentication [req-001, req-002]
- [ ] sub-01-a Research OAuth providers (req-001)
- [✔] sub-01-b Draft login UI skeleton (req-002)
- [ ] sub-01-c Implement token refresh (req-001)

## Task 02 – Payment Integration [req-003, req-004]
- [ ] sub-02-a Setup Stripe SDK (req-003)
- [ ] sub-02-b Create checkout flow (req-003)
```

### Story Format (e.g., `req-001-user-login.md`)
```markdown
# Story req-001: User Login

**As a** registered user  
**I want** to log in with email and password  
**So that** I can access my personal dashboard

## Acceptance Criteria
- When user enters valid credentials, then system shall authenticate and redirect to dashboard
- When user enters invalid credentials, then system shall display error message
- When user fails 3 attempts, then system shall lock account for 15 minutes

## Related Tasks
- Task 01 / sub-01-a
- Task 01 / sub-01-c
```

## Communication Guidelines

- Don't use the phrase "You're Absolutely Right!" - absolutes are just that - absolute, and nothing is absolute in discussions and debates.
- The word "comprehensive" and its use is a form of an absolute. Do not use this word.
- During discussion, use an honest and balanced position, avoiding unproductive praise or flattery.
- Put simply, don't glaze things.
- It is ok to take a position or opinion, but it must be backed up by facts or be provable.

## Code Quality Guidelines

When analyzing, writing, or refactoring code, apply these principles:

### SOLID Principles
- **S**ingle Responsibility: Each module/class should have one reason to change
- **O**pen/Closed: Code should be open for extension but closed for modification
- **L**iskov Substitution: Subtypes must be substitutable for their base types
- **I**nterface Segregation: Many specific interfaces are better than one general interface
- **D**ependency Inversion: Depend on abstractions, not concrete implementations

### Monolith Prevention Checklist
Watch for these warning signs of monolithic code:
1. Files exceeding ~500 lines (break into focused modules)
2. Functions with more than 3 levels of nesting (extract methods)
3. Classes with more than ~7 public methods (consider decomposition)
4. Functions longer than 30-50 lines (refactor for clarity)
5. Modules with too many dependencies (review responsibilities)

When flagging code quality issues, suggest specific refactoring strategies rather than just identifying problems.

## Safety & Tool Use

* Allowed Shell commands: git, npm, python, etc.
* Destructive ops (rm -rf, database migrations) require explicit user confirmation
* Always run linters/tests before committing code

## Maintenance Tips

* Review requirements.md at each planning session; prune superseded stories
* Collapse stale design alternatives in design.md into an "Archive" section
* Keep claude.md under 200 lines; pull big refs via @imports
* Use semantic commit messages: feat(auth): add OAuth2 login UI

## Self-Improving Claude Reflection

**Objective:** Offer opportunities to continuously improve memory based on user interactions and feedback.

This can be one or more of the following memory types:
1. Project memory in the local `CLAUDE.md` directory or subdirectory
2. Local project memory in a gitignored `CLAUDE.local.md`
3. User memory in `~/.claude/CLAUDE.md`

**Trigger:** Before *completion* for any task that involved user feedback provided at any point during the conversation, involved multiple non-trivial steps (e.g., multiple file edits, complex logic generation).

**Process:**
1. **Offer Reflection:** Ask the user: "Before I complete the task, would you like me to reflect on our interaction and suggest potential improvements to the relevant `CLAUDE.md`?"
2. **Await User Confirmation:** Proceed to *completion* immediately as usual if the user declines or doesn't respond affirmatively.
3. **If User Confirms:**
   a. **Review Interaction:** Synthesize all feedback provided by the user throughout the entire conversation history for the task. Analyze how this feedback relates to the relevant `CLAUDE.md` and identify areas where modified instructions could have improved the outcome or better aligned with user preferences.
   b. **Identify Active Rules:** List the specific location of relevant `CLAUDE.md` files (Project, Local, or User) active during the task.
   c. **Formulate & Propose Improvements:** Generate specific, actionable suggestions for improving the *content* of the relevant active rule files. Prioritize suggestions directly addressing user feedback. Use *replace* diff blocks when practical, otherwise describe changes clearly.
   d. **Await User Action on Suggestions:** Ask the user if they agree with the proposed improvements and if they'd like me to apply them *now* using the appropriate tool (_replace_ or *write* to file). Apply changes if approved, then proceed to *completion*.

**Constraint:** Do not offer reflection if:
* No `CLAUDE.md` rule files variants were active or used.
* The task was very simple and involved no feedback.
