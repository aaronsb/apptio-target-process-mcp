# Project Configuration Documentation

## `/config/personalities`
**Note:** `/src/core/personality-loader.ts` uses `/config/personalities`, if not available manual load of personalities with same operations

---

### Developer
#### Tools
- show-my-tasks **%** 🟨
- start-working-on **%** 🟧
- update-progress **!**
- complete-task **%**
- pause-work
- show-my-bugs **@**
- investigate-bug **@**
- mark-bug-fixed **@**
- **log-time**
- show-time-spent
- **add-comment**
- report-blocker **#**
- request-review

### Tester
#### Tools
- show-items-for-testing 🟨
- start-testing 🟧
- create-test-run
- log-defect
- approve-testing
- reject-with-bugs **@**
- show-my-test-cases 🟨
- execute-test-suite
- show-defect-metrics 🟩
- **log-time**
- **add-comment**
- create-regession-suite

### Product Owner
#### Tools
- manage-product-backlog 🟪
- prioritize-features **$**
- create-user-story
- refine-requirements
- show-release-progress **!**
- stakeholder-report
- review-sprint-deliverables
- update-acceptance-criteria
- show-feature-metrics 🟩
- plan-roadmap
- **add-comment**
- schedule-stakeholder-review 🟦


### Project Manager
#### Tools
- show-team-tasks **%**
- show-sprint-status
- reassign-task **%**
- update-task-priority **$** **%**
- show-project-metrics 🟩
- show-team-velocity
- show-blockers **#**
- schedule-meeting 🟦
- create-sprint-report
- manage-backlog 🟪

**Legend:** 
- **bold**: common tools
- **!, @, #, $, %**: possibly related workflows/"dependencies" (by character)
- **🟩, 🟦, 🟪, 🟨, 🟧**: possible similar tool implementation (by color)




## `/src/core/operation-registry.ts`

### Developer
#### Tools
- show-my-tasks
- start-working-on
- update-progress
- complete-task
- log-time
- **resolve-blocker**
- **show-impediments**

### Tester
#### Tools
- **show-test-assignments** 🟡 (show-items-for-testing/show-my-test-cases)
- create-test-run
- log-defect
- **update-test-results**
- **review-test-coverage**

### Product Manager
#### Tools
- manage-backlog 🔴
- prioritize-features
- **plan-iteration**
- **show-team-capacity**
- **track-release-progress** 🟡 (show-release-progress)
- **review-feedback**

### Project Manager
#### Tools
- show-team-tasks
- **track-project-health**
- **generate-status-report** 🟡 (create-sprint-report/show-sprint-status)
- **identify-risks**
- **manage-dependencies**

**Legend:** 
- non-bold: present in `personality-loader.ts`
- **bold**: **not** present in `personality-loader.ts`
- 🔴: present in `personality-loader.ts` but under different role
- 🟡: **not** present in `personality-loader.ts`, but similar task present in same personality in `personality-loader.ts`

**Note:** Discrepancies between `src/core/personality-loader.ts`, `config/personalities`, and `src/core/operation-registry.ts`. Discrepancies in available operations and personality assignments of existing operations.