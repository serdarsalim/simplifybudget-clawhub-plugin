# Simplify Budget Plugin

`simplify-budget` is an OpenClaw plugin package for running a personal budget tracker on top of a specific Google Sheets template.

It exposes an OpenClaw HTTP route and runs the bundled budget scripts directly. This package is for plugin installation, not skill-only installation.

It handles:
- expense create, find, update, delete
- income create, find, update, delete
- recurring item create, find, update, delete
- summary and cross-ledger lookup routes
- conversation preview/write/learn flows through the bundled bridge script

## Required Sheet

This plugin only works with the Simplify Budget sheet template, or a direct copy of it:
- [Simplify Budget Template](https://docs.google.com/spreadsheets/d/1fA8lHlDC8bZKVHSWSGEGkXHNmVylqF0Ef2imI_2jkZ8/edit?gid=524897973#gid=524897973)

Each user must make their own copy of the sheet and configure their own Google service account credentials.

Optional browser UI for the same system:
- [simplifybudget.com](https://simplifybudget.com/)

The plugin talks to the Google Sheet directly. The web UI is optional.

## What This Ships

This package contains:
- `openclaw.plugin.json`: plugin manifest
- `index.js`: plugin entrypoint
- `scripts/`: bundled budget scripts used by the plugin
- `CONVERSATION_WORKFLOW.md`: conversation-layer reference

## Install Summary

1. Copy the Google Sheet template.
2. Create your own Google service account JSON key.
3. Share the copied sheet with the service account email.
4. Install this plugin package.
5. Set the required environment variables.
6. Restart OpenClaw.

Full instructions are in [SETUP.md](./SETUP.md).
