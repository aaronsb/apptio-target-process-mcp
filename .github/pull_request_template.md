## Description

<!-- Provide a brief description of the changes in this PR -->

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Semantic operation (intelligent workflow implementation)

## Semantic Operations Checklist

**⚠️ REQUIRED: This project uses semantic operations, not simple API wrappers!**

- [ ] **I have read and understood the [Semantic Operations Documentation](../docs/semantic-operations/)**
- [ ] **I have read [CONTRIBUTING.md](../CONTRIBUTING.md) completely**
- [ ] **I understand the difference between semantic operations and API wrappers**

### If adding/modifying operations:

- [ ] The operation provides intelligent workflow assistance, not just data access
- [ ] It discovers capabilities dynamically rather than hardcoding assumptions
- [ ] It provides helpful guidance when things go wrong
- [ ] It adapts based on user role when appropriate
- [ ] It suggests logical next steps in the workflow

### If adding a raw tool:

- [ ] I've considered if this should be a semantic operation instead
- [ ] I've documented why this needs to be a low-level tool
- [ ] The tool supports semantic operations built on top of it

## Testing

- [ ] I have tested my changes locally
- [ ] I have added tests for my changes
- [ ] All tests pass
- [ ] I have tested with different user roles (if applicable)

## Documentation

- [ ] I have updated relevant documentation
- [ ] My code includes appropriate comments
- [ ] I have updated the README if needed

## Additional Notes

<!-- Any additional information that reviewers should know -->

---

**Remember:** We're building intelligent assistants that understand work context, not just API wrappers. If your contribution doesn't align with this philosophy, please reconsider your approach.