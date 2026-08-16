# Instruction language: English only

All instruction-style writing must be in English, regardless of the language
the user writes in during conversation.

**Scope** — anything an agent or a future contributor reads as guidance:

- `CLAUDE.md` (project and user level), `AGENTS.md`, and any rules files
- Serena memories
- Skill / slash-command definitions
- Code comments and test descriptions
- Commit messages and PR descriptions

**Not in scope** — this is about instructions, not the product:

- User-facing site copy stays bilingual EN/VI (`messages/en.json`, `messages/vi.json`)
- Chat replies to the user still follow whichever language the user is writing in

**Why:** stated by the user on 2026-08-17. Note that large parts of this repo's
existing `CLAUDE.md` and some tests (e.g. `tests/lib/anonymity.test.ts`) are
still written in Vietnamese from before this rule. New and edited text goes in
English; a full translation of the legacy Vietnamese has not been done yet, so
expect a mixed-language file until it is.
