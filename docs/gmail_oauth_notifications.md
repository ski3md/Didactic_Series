# Gmail OAuth Pipeline Notifications

This repo's pipeline notifications can be configured to use Gmail OAuth instead of an app password.

## Required Files

- `credentials.json`: OAuth client secret downloaded from Google Cloud Console.
- `token.json`: user refresh/access token generated from the first consent flow.

## Bootstrap Steps

1. In Google Cloud Console, create or select a project.
2. Enable the Gmail API.
3. Configure the OAuth consent screen for the account that will send notifications.
4. Create an OAuth client ID for a desktop app.
5. Download the client secret JSON and save it as `credentials.json` in a secure location.
6. Run the local bootstrap flow once to generate `token.json` from the consent screen.
7. Store both files outside version control and point the pipeline at them with environment variables or config values.

## Recommended Environment Values

- `GMAIL_OAUTH_CLIENT_SECRETS_FILE=/secure/path/credentials.json`
- `GMAIL_OAUTH_TOKEN_FILE=/secure/path/token.json`
- `GMAIL_OAUTH_AUTO_AUTHORIZE=true`
- `EMAIL_SENDER=your.sender@gmail.com`
- `EMAIL_RECIPIENT=your.recipient@example.com`

## Operational Notes

- Use a dedicated sender account with Gmail API access.
- Re-authenticate if the refresh token is revoked or expires.
- Keep the token file restricted to the pipeline runner or secrets store.
- App-password SMTP is deprecated in this repo and ignored by the notifier.
