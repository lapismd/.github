# Lapis.MD GitHub organization profile

GitHub renders [profile/README.md](profile/README.md) on the public
[Lapis.MD organization overview](https://github.com/lapismd).

## Maintaining the profile

- Add public repositories to the table when they join the organization.
- Verify the actual active workflow filename before adding a build badge.
- Use the default branch for CI badges. Label release and documentation workflows
  explicitly so they are not mistaken for package CI.
- Link only packages confirmed to be published on npm. Use text links for
  packages so they remain readable when an external badge service is unavailable.
- Keep success and failure status in live badges rather than hardcoded text.

The npm column is generated from the public package names in
[profile/packages.json](profile/packages.json). Include intended public packages
even before their first release; keep private packages out of this list.
Run `node scripts/update-npm-status.mjs` to refresh publication status and the
registry's `latest` versions, and `node --test scripts/update-npm-status.test.mjs`
to check the updater.

[Refresh npm status](https://github.com/lapismd/.github/actions/workflows/refresh-npm-status.yml)
runs updater tests on changes and manual dispatch. The generator remains owned
here; the old scheduled GITHUB_TOKEN writer is retired to avoid competing PR
writers and workflow-approval waits.

[The central profile pilot](https://github.com/lapismd/dependency-automation/actions/workflows/profile-refresh.yml)
generates the candidate without App credentials, then validates and publishes
only npm-status cells through a separate worker using the existing App. It keeps
one rolling PR, stops for manual branch repairs, and preserves ordinary CI and
merge policy. The pilot is manual-only until hosted acceptance is recorded in
[the rollout tracker](https://github.com/lapismd/dependency-automation/blob/main/PLAN.md).
No secret is copied to this repository. Registry errors preserve the previous
profile; a registry 404 is the only response treated as unpublished.

This repository contains organization profile documentation only. It does not
configure CI, publishing, or policy for the other repositories.
