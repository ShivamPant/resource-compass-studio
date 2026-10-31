<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Safety keywords are checked in the browser (src/lib/safety.ts) before any AI call; emergencies must never depend on a model.
- Claude calls live only in src/lib/assistant.functions.ts server functions and return proposals; every action is applied client-side only after a human Confirm.
- App state (demo clock, reminders, trips) is in-memory React context (src/lib/store.tsx); there is no backend persistence by design for the demo.
