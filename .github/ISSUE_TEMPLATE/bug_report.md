---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: 'bug'
assignees: ''

---

## 🎯 Semantic Operations Context

**Which type of operation were you using?**
- [ ] Raw tool (search_entities, get_entity, etc.)
- [ ] Semantic operation (show_my_tasks, start_working_on, etc.)
- [ ] Not sure

**If using semantic operations:**
- User role: [developer/project-manager/tester/product-owner]
- Did discovery fail? [Yes/No/Not sure]
- Did it fall back to basic behavior? [Yes/No/Not sure]

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Configure MCP server with '...'
2. Call tool '....'
3. With parameters '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Actual behavior**
What actually happened instead.

**Error messages**
```
Please paste any error messages here
```

**Environment (please complete the following information):**
 - OS: [e.g. macOS, Windows, Linux]
 - Node.js version: [e.g. 18.0.0]
 - MCP Client: [e.g. Claude Desktop, Custom]
 - Targetprocess version: [if known]

**Configuration**
```json
// Please share your configuration (remove sensitive data)
{
  "domain": "example.tpondemand.com",
  "authentication": "basic"
}
```

**Additional context**
Add any other context about the problem here.

---

**Note:** If this is about semantic operations not being "intelligent enough", that's valuable feedback! We want operations that truly understand workflows and provide helpful guidance.