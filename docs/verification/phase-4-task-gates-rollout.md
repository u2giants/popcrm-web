# Phase 4 task-gate rollout evidence

Issue `popcre/ai-devops#335` adds repository-local routing policy and executable refusal evidence. The policy protects POP CRM identity, privileged worker, production-release, host-unit, and shared-database paths without changing application, database, worker, host, or deployment behavior.

## Required evidence

- `bash scripts/test-task-gates.sh`: 20 passed / 0 failed. It verifies representative classifications, normal code shipping, database escalation refusal, failed acknowledgement and owner-request bypasses, and byte-exact rollback restoration.
- `.github/workflows/task-gates.yml` repeats that proof on pull requests and `main` using the accepted task-gate engine pinned by commit.
- `popcre/ai-devops` is public, so the read-only cross-repository checkout works with the normal GitHub token.
- The existing shared-database guard remains independent and unchanged.
- `npm run lint -- --quiet`: passed with zero findings.
- `npm test -- --run --reporter=dot`: 20 files and 182 tests passed.
- `npm run build`: passed; 2,706 modules transformed.
- `scripts/check-workflow-shell.sh`: passed.

The engine deliberately chooses the strongest matching class. Therefore a browser source path that also matches an authorization-specific rule resolves to `ui-live-workflow`, retaining authenticated visual proof rather than weakening to `reviewer-safety`. This rollout itself changes no browser source path, so no live UI proof is required for this candidate.

## Release boundary

POP CRM deploys production on every non-documentation push to `main`. This rollout does not authorize production deployment, so its reviewed pull request must remain unmerged until that release is explicitly authorized. No database, worker, host, infrastructure, or production action is part of this change.
