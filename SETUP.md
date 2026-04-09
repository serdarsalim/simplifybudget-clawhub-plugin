# Setup

This is the shortest reliable setup for a real plugin user.

## 1. Copy The Template

Make your own copy of the required Google Sheet template:
- [Simplify Budget Template](https://docs.google.com/spreadsheets/d/1fA8lHlDC8bZKVHSWSGEGkXHNmVylqF0Ef2imI_2jkZ8/edit?gid=524897973#gid=524897973)

Do not change the expected layout unless you also change the bundled scripts.

## 2. Create Your Own Service Account

Create or reuse a Google service account with Google Sheets access and download the JSON key.

Set a canonical OpenClaw root first:

```bash
export OPENCLAW_HOME="${OPENCLAW_HOME:-$HOME/.openclaw}"
```

Common location:

```bash
$OPENCLAW_HOME/sa.json
```

## 3. Share The Copied Sheet

Share your copied Google Sheet with the service account email from the JSON key.

Give it editor access.

## 4. Install The Plugin

Install this package as an OpenClaw plugin so `openclaw.plugin.json` and `index.js` are loaded together with the bundled `scripts/` directory.

## 5. Set Environment Variables

Add these to your OpenClaw config or shell environment:

```bash
export GOOGLE_SA_FILE="$OPENCLAW_HOME/sa.json"
export SPREADSHEET_ID="your_google_sheet_id"
export TRACKER_CURRENCY="EUR"
export TRACKER_CURRENCY_SYMBOL="€"
```

Required:
- `GOOGLE_SA_FILE`
- `SPREADSHEET_ID`
- `TRACKER_CURRENCY`

Optional:
- `TRACKER_CURRENCY_SYMBOL`

## 6. Restart OpenClaw

```bash
openclaw daemon restart
```

## 7. Optional Web UI

If you want a browser UI for the same budget system, use:
- [simplifybudget.com](https://simplifybudget.com/)

The plugin still uses the Google Sheet as the source of truth.
