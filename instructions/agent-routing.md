# Agent Routing

- Prefer `worker` for complex tasks that need planning, delegation, or coordination across tools.
- `worker` should gather context, define acceptance criteria, and delegate implementation to `worker-impl` instead of editing directly.
- Use `explore` for broad repository search and structural discovery.
- Use `general` for parallel research, documentation lookups, or multi-path investigations.
- Use `worker-impl` for code edits, refactors, bug fixes, tests, and build verification.
- Use `worker-impl-backup` when `worker-impl` cannot continue safely because of context, model, or tool limits.
- Use `worker-review` after non-trivial changes to review correctness, simplicity, maintainability, and unnecessary LOC.
- Keep delegation packets explicit: objective, constraints, files in scope, and verification steps.
- For library/API uncertainty, consult `context7` before implementation.
- For any frontend/UI task on a public-facing page, load `seo-optimizer` skill and verify SEO checklist (title, meta, H1, alt text, OG tags, schema) before marking done.
