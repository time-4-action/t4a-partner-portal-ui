# Releasing & keeping the changelog current

The Partner Portal ships from **two repos** (`t4a-partner-portal-api`, `t4a-partner-portal-ui`)
but presents **one unified changelog** to partners at **`/changelog`**.

There is **one source of truth**: [`t4a-partner-portal-ui/src/lib/changelog.js`](../src/lib/changelog.js).
Everything else (the `/changelog` page, `CHANGELOG.md` in both repos, and the git tags) is
mirrored from it. Keep them in lockstep — a release is not "done" until all four are updated.

## Versioning

[Semantic Versioning](https://semver.org): `MAJOR.MINOR.PATCH`.

- **MAJOR** — breaking API/contract changes for integrators.
- **MINOR** — new user-facing capability, backwards compatible (this is the common one).
- **PATCH** — bug fixes / polish only, no new capability.

`scope` on each entry says which repos the release touched (`"api"`, `"ui"`). If a release
only changes one repo, only tag that repo.

## Checklist for cutting a release `vX.Y.Z`

1. **Decide the version** from the rules above based on what merged since the last tag.
2. **Edit `src/lib/changelog.js`** — prepend a new object to `RELEASES` (newest first):
   - Move `latest: true` from the previous top entry onto the new one.
   - Fill `added` / `changed` / `fixed` with plain, partner-readable sentences (not raw
     commit subjects). Record the tagged commit short-SHA per repo in `commits`.
3. **Mirror `CHANGELOG.md`** in **both** repos — same wording, plus the `[X.Y.Z]` link at the
   bottom. (The two `CHANGELOG.md` files are intentionally identical.)
4. **Commit** the docs/data changes in each repo.
5. **Tag & push** the exact commit the release ships from, in each repo it touches:

   ```bash
   # in each repo (api and/or ui)
   git tag -a vX.Y.Z -m "vX.Y.Z — <Title>

   <one-line summary>

   Added:   …
   Changed: …
   Fixed:   …"
   git push origin vX.Y.Z
   ```

6. **(Optional) GitHub Release** — `gh release create vX.Y.Z --notes-file <notes>` to give
   the tag a rich page. The `[X.Y.Z]` links in `CHANGELOG.md` point at
   `…/releases/tag/vX.Y.Z`.

## Handy commands

```bash
# What changed since the last tag (start here when writing an entry):
git log $(git describe --tags --abbrev=0)..HEAD --oneline

# List tags in version order:
git tag -l --sort=-v:refname

# Inspect an annotated tag's message:
git tag -n99 vX.Y.Z
```

## Notes / gotchas

- **The old `v1.0.0` was wrong.** Before this changelog existed, a stray lightweight
  `v1.0.0` tag pointed at an early-January "improved website design" commit and had been
  pushed. It was deleted (local + remote) and recreated as an annotated tag on the real
  June GA-readiness commit. Don't resurrect the old one.
- Tags are **annotated** (`-a`), never lightweight — the message body is what a GitHub
  Release shows and what future maintainers read.
- The `/changelog` route is **public** (outside the `(protected)` group in `src/proxy.js`),
  so double-check nothing sensitive (internal infra, credentials, customer names) lands in a
  changelog entry.
