# Security

Please report vulnerabilities privately through GitHub Security Advisories rather than a public
issue. Include impact, reproduction steps, and affected versions. Do not include live credentials
or personal data. Supported security fixes target the latest default-branch release.

The static client has no secrets or trusted authority. Optional multiplayer services must validate
every action, cap message size and rate, check origins, reject duplicates/out-of-order sequences,
sanitize display names, and keep credentials in environment variables.
