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
runs hourly, on updater changes, and on manual dispatch. It updates the profile
only when package status changes. Registry errors fail the refresh and preserve
the previous profile; a registry 404 is the only response treated as unpublished.

This repository contains organization profile documentation only. It does not
configure CI, publishing, or policy for the other repositories.
