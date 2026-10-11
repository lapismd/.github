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

This repository contains organization profile documentation only. It does not
configure CI, publishing, or policy for the other repositories.
