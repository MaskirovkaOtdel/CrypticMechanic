## Git Branching Strategy

- **Never push directly to `main`.** All new commits (features, fixes, refactors) must be committed and pushed to the `dev` branch first.
- Only merge `dev` into `main` when the user explicitly confirms the changes are stable and ready for release.
- After merging to `main`, ensure both `dev` and `main` are in sync.
- Release tags (e.g., `alpha-v1.0.0`, `alpha-v1.0.1`) should only be created on `main` after a merge from `dev`.

## Design Philosophy

- **Scalability first**: Structure code with modularity and separation of concerns. New features should slot in without refactoring existing systems.
- **Security conscious**: Never hardcode or transmit secrets. API keys stay in localStorage only. Sanitize all user input. Use CSP-friendly patterns.
- **Useful over flashy**: Every feature must solve a real user problem. Avoid feature bloat — if it doesn't help the user decode errors faster, question whether it belongs.
- **Rich but not overwhelming**: The UI should feel premium and polished (animations, themes, micro-interactions) without cognitive overload. Progressive disclosure over upfront complexity.
