# Agent Skills - Staging Directory

This folder contains **local reference copies** of agent skills for review and editing before deployment.

**Important:** Files in this `Skills/` folder are NOT automatically used by OpenCode or any AI agent. They serve as a staging area for skill development.

---

## What Are Agent Skills?

Agent skills are reusable instruction sets defined in `SKILL.md` files. They teach AI agents how to perform specific tasks consistently. When you invoke a skill, the agent loads its full instructions and follows them.

**Key characteristics:**
- **On-demand loading** - Skills are loaded when relevant, not always active
- **Reusable** - Once created, skills work across sessions
- **Scoped** - Can be global (all projects) or project-local (one repo)

---

## Folder Structure

```
Skills/                              <- This staging directory (for review only)
├── README.md                        <- This file
└── code-review/
    └── SKILL.md                     <- Skill definition to review

.opencode/skill/                     <- PRODUCTION: Project-local skills (used by AI)
└── code-review/
    └── SKILL.md

~/.config/opencode/skill/            <- PRODUCTION: Global skills (used by AI)
└── some-global-skill/
    └── SKILL.md
```

---

## Skill File Requirements

Each skill requires a `SKILL.md` file with:

### 1. YAML Frontmatter (Required)

```yaml
---
name: skill-name          # Required: 1-64 chars, lowercase, hyphens only
description: What it does # Required: 1-1024 chars
license: MIT              # Optional
compatibility: opencode   # Optional
metadata:                 # Optional: string-to-string map
  category: quality
  author: you
---
```

### 2. Naming Rules

The `name` field must:
- Be 1-64 characters
- Be lowercase alphanumeric only
- Use single hyphens as separators (no `--`)
- Not start or end with `-`
- Match the folder name exactly

**Valid:** `code-review`, `nextjs-api`, `test-runner`
**Invalid:** `Code_Review`, `my--skill`, `-starts-with-dash`

### 3. Content

After the frontmatter, include:
- Role/persona definition
- Instructions for the agent
- Checklists, examples, output formats
- Any context the agent needs

---

## Deployment Locations

| Location | Scope | When to Use |
|----------|-------|-------------|
| `.opencode/skill/<name>/SKILL.md` | Project-local | Skills specific to one repository |
| `~/.config/opencode/skill/<name>/SKILL.md` | Global | Skills useful across all projects |
| `~/.claude/skills/<name>/SKILL.md` | Global (Claude-compatible) | Works with Claude Code too |

### This Project Uses Project-Local

Since the `code-review` skill is specifically designed for the Polhem MVP project structure and documentation, we deploy it to:

```
.opencode/skill/code-review/SKILL.md
```

This ensures:
- The skill only activates in this repository
- The generic name "code-review" doesn't conflict with other projects
- The skill references (like `Docs/prd.md`) are always valid

---

## Workflow: Staging to Production

### Step 1: Create/Edit in Staging

Edit files in `Skills/<skill-name>/SKILL.md`

### Step 2: Review and Approve

Read through the skill, verify:
- [ ] Frontmatter is valid
- [ ] Name matches folder name
- [ ] Instructions are clear and complete
- [ ] File paths reference correct locations

### Step 3: Deploy to Production

Copy to the appropriate production location:

**For project-local (this project):**
```bash
# From project root
mkdir -p .opencode/skill/code-review
cp Skills/code-review/SKILL.md .opencode/skill/code-review/SKILL.md
```

**For global (all projects):**
```bash
# Windows
mkdir -p ~/.config/opencode/skill/code-review
cp Skills/code-review/SKILL.md ~/.config/opencode/skill/code-review/SKILL.md
```

### Step 4: Verify

In OpenCode, check that the skill is available:
```
What skills are available?
```

Or invoke directly:
```
Use the code-review skill on <target>
```

---

## Using Skills

Once deployed, invoke a skill by name:

```
Use the code-review skill on Docs/features/app-setup/
```

```
Run code-review on app/api/orders/route.js
```

The agent will:
1. See available skills in its tool description
2. Load the skill content when invoked
3. Follow the instructions in the skill

---

## Skill Permissions (Optional)

Control skill access in `opencode.json`:

```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "experimental-*": "ask",
      "internal-*": "deny"
    }
  }
}
```

| Permission | Behavior |
|------------|----------|
| `allow` | Skill loads immediately |
| `deny` | Skill hidden, access rejected |
| `ask` | User prompted before loading |

---

## Skills in This Project

| Skill | Purpose | Status |
|-------|---------|--------|
| `code-review` | Comprehensive code/instruction review as senior CTO | Staging |

---

## Troubleshooting

**Skill doesn't show up:**
1. Verify `SKILL.md` is spelled in ALL CAPS
2. Check frontmatter includes `name` and `description`
3. Ensure `name` matches folder name exactly
4. Check file is in correct location (`.opencode/skill/` not `Skills/`)

**Skill loads but doesn't work well:**
1. Review the instructions - are they clear enough?
2. Add more examples
3. Be more specific about what to check/do

---

## References

- [OpenCode Skills Documentation](https://opencode.ai/docs/skills/)
- [OpenCode Configuration](https://opencode.ai/docs/config/)
