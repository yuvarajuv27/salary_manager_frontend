# Install Superpowers (project scope only)

Do this in **each** of these workspaces:

1. `salary_manager_frontend`
2. `salary_manager_backend`

## Steps

1. Open the project folder in Cursor (or focus that root in a multi-root workspace).
2. Open **Customize** (or Agent chat).
3. Search for **Superpowers**, or run `/add-plugin superpowers`.
4. Choose **Install** → **Project** scope (not User / Global).
5. Fully quit and reopen Cursor if skills do not appear.
6. Confirm skills such as `brainstorming`, `writing-plans`, and `test-driven-development` are available (try `/brainstorming`).

## Verify scope

In Customize → Plugins, filter by **workspace/project**. Superpowers should list for these two projects only—not as a user-wide install.

## After install

Project rules already enforce:

- Full Superpowers loop always
- Docs written under `docs/`
- No git commit / push / PR unless you explicitly ask
