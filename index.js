import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BUDGET_BRIDGE_PATH = '/api/plugins/simplify-budget/bridge';
const SCRIPTS_DIR = path.join(__dirname, 'scripts');
const BUDGET_BRIDGE_SCRIPT = path.join(SCRIPTS_DIR, 'conversation_bridge.sh');

function normalizeText(value) {
  return String(value || '').trim();
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error('request body too large'));
      }
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

async function runBudgetBridge(action, payload = {}) {
  const args = [action];

  if (payload.message) args.push('--message', String(payload.message));
  if (payload.account) args.push('--account', String(payload.account));
  if (payload.date) args.push('--date', String(payload.date));
  if (payload.category) args.push('--category', String(payload.category));
  if (payload.nodeId) args.push('--node-id', String(payload.nodeId));
  if (payload.skipDuplicateCheck) args.push('--skip-duplicate-check');
  if (payload.stateJson) args.push('--state-json', JSON.stringify(payload.stateJson));
  if (payload.reply) args.push('--reply', String(payload.reply));

  const { stdout, stderr } = await execFileAsync('bash', [BUDGET_BRIDGE_SCRIPT, ...args], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  });

  const raw = `${stdout || ''}`.trim() || `${stderr || ''}`.trim();
  return raw ? JSON.parse(raw) : { ok: false, error: 'empty bridge response' };
}

async function runWorkspaceExec(subcommand, args = []) {
  const scriptPath = path.join(SCRIPTS_DIR, subcommand);
  const { stdout, stderr } = await execFileAsync('bash', [scriptPath, ...args], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  });

  const raw = `${stdout || ''}`.trim() || `${stderr || ''}`.trim();
  return raw;
}

function parseJsonOutput(raw) {
  return raw ? JSON.parse(raw) : [];
}

function parseReplyOutput(raw, prefix) {
  const line = String(raw || '')
    .split(/\r?\n/)
    .find((entry) => entry.startsWith(prefix));
  return line ? line.slice(prefix.length).trim() : '';
}

async function runExpenseFind(payload = {}) {
  const args = [];
  if (payload.query) args.push('--query', String(payload.query));
  if (payload.limit) args.push('--limit', String(payload.limit));
  if (payload.date) args.push('--date', String(payload.date));
  if (payload.amount) args.push('--amount', String(payload.amount));
  if (payload.description) args.push('--description', String(payload.description));
  if (payload.notes) args.push('--notes', String(payload.notes));
  if (payload.account) args.push('--account', String(payload.account));
  if (payload.transactionId) args.push('--transaction-id', String(payload.transactionId));
  const raw = await runWorkspaceExec('find_expenses.sh', args);
  return { ok: true, results: parseJsonOutput(raw) };
}

async function runIncomeFind(payload = {}) {
  const args = [];
  if (payload.query) args.push('--query', String(payload.query));
  if (payload.limit) args.push('--limit', String(payload.limit));
  if (payload.date) args.push('--date', String(payload.date));
  if (payload.amount) args.push('--amount', String(payload.amount));
  if (payload.name) args.push('--name', String(payload.name));
  if (payload.notes) args.push('--notes', String(payload.notes));
  if (payload.account) args.push('--account', String(payload.account));
  if (payload.source) args.push('--source', String(payload.source));
  if (payload.transactionId) args.push('--transaction-id', String(payload.transactionId));
  const raw = await runWorkspaceExec('find_income.sh', args);
  return { ok: true, results: parseJsonOutput(raw) };
}

async function runRecurringFind(payload = {}) {
  const args = [];
  if (payload.query) args.push('--query', String(payload.query));
  if (payload.date) args.push('--date', String(payload.date));
  if (payload.month) args.push('--month', String(payload.month));
  if (payload.mode) args.push('--mode', String(payload.mode));
  if (payload.limit) args.push('--limit', String(payload.limit));
  const raw = await runWorkspaceExec('find_recurring.sh', args);
  return { ok: true, results: parseJsonOutput(raw) };
}

async function runSummaryFind(payload = {}) {
  const args = [];
  if (payload.month) args.push('--month', String(payload.month));
  if (payload.type) args.push('--type', String(payload.type));
  const raw = await runWorkspaceExec('find_summary.sh', args);
  return { ok: true, result: parseJsonOutput(raw) };
}

async function runTransactionsFind(payload = {}) {
  const args = [];
  if (payload.query) args.push('--query', String(payload.query));
  if (payload.limit) args.push('--limit', String(payload.limit));
  if (payload.date) args.push('--date', String(payload.date));
  if (payload.month) args.push('--month', String(payload.month));
  if (payload.type) args.push('--type', String(payload.type));
  const raw = await runWorkspaceExec('find_transactions.sh', args);
  return { ok: true, results: parseJsonOutput(raw) };
}

async function runExpenseWrite(payload = {}) {
  const args = [];
  if (payload.amount) args.push('--amount', String(payload.amount));
  if (payload.category) args.push('--category', String(payload.category));
  if (payload.description) args.push('--description', String(payload.description));
  if (payload.date) args.push('--date', String(payload.date));
  if (payload.account) args.push('--account', String(payload.account));
  if (payload.notes) args.push('--notes', String(payload.notes));

  const raw = await runWorkspaceExec('write_expense.sh', args);
  const replyText = parseReplyOutput(raw, 'REPLY:');
  const verify = await runExpenseFind({
    date: payload.date,
    description: payload.description,
    limit: 5,
  });

  return {
    ok: true,
    replyText,
    rawOutput: raw,
    verified: verify.results,
    record: Array.isArray(verify.results) ? verify.results[0] || null : null,
  };
}

async function runExpenseUpdate(payload = {}) {
  const args = ['--id', String(payload.transactionId || '')];
  if (payload.amount !== undefined) args.push('--amount', String(payload.amount));
  if (payload.category !== undefined) args.push('--category', String(payload.category));
  if (payload.description !== undefined) args.push('--description', String(payload.description));
  if (payload.date !== undefined) args.push('--date', String(payload.date));
  if (payload.account !== undefined) args.push('--account', String(payload.account));
  if (payload.clearNotes) args.push('--clear-notes');
  else if (payload.notes !== undefined) args.push('--notes', String(payload.notes));

  const before = await runExpenseFind({ transactionId: payload.transactionId, limit: 1 });
  const raw = await runWorkspaceExec('update_expense.sh', args);
  const confirmText = parseReplyOutput(raw, 'CONFIRM:');
  const verify = await runExpenseFind({ transactionId: payload.transactionId, limit: 1 });

  return {
    ok: true,
    replyText: confirmText,
    rawOutput: raw,
    before: Array.isArray(before.results) ? before.results[0] || null : null,
    record: Array.isArray(verify.results) ? verify.results[0] || null : null,
  };
}

async function runExpenseDelete(payload = {}) {
  const transactionId = String(payload.transactionId || '');
  const before = await runExpenseFind({ transactionId, limit: 1 });
  const raw = await runWorkspaceExec('delete_expense.sh', [transactionId]);
  const confirmText = parseReplyOutput(raw, 'CONFIRM:');
  const after = await runExpenseFind({ transactionId, limit: 1 });

  return {
    ok: true,
    replyText: confirmText,
    rawOutput: raw,
    deleted: Array.isArray(before.results) ? before.results[0] || null : null,
    stillPresent: Array.isArray(after.results) ? after.results.length > 0 : false,
  };
}

export default function register(api) {
  api.registerHttpRoute({
    path: BUDGET_BRIDGE_PATH,
    auth: 'plugin',
    match: 'exact',
    async handler(req, res) {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'method not allowed' }));
        return true;
      }

      try {
        const body = await readJsonBody(req);
        const action = normalizeText(body.action);
        let result;

        if (action === 'preview') {
          result = await runBudgetBridge('preview', {
            message: body.message,
            account: body.account,
            date: body.date,
            category: body.category,
          });
        } else if (action === 'write') {
          result = await runBudgetBridge('write', {
            message: body.message,
            account: body.account,
            date: body.date,
            category: body.category,
            nodeId: body.nodeId,
            skipDuplicateCheck: !!body.skipDuplicateCheck,
          });
        } else if (action === 'learn') {
          result = await runBudgetBridge('learn', {
            message: body.message,
            category: body.category,
          });
        } else if (action === 'classify-reply') {
          result = await runBudgetBridge('classify-reply', {
            stateJson: body.stateJson,
            reply: body.reply,
          });
        } else if (action === 'expense-find') {
          result = await runExpenseFind(body);
        } else if (action === 'expense-write') {
          result = await runExpenseWrite(body);
        } else if (action === 'expense-update') {
          result = await runExpenseUpdate(body);
        } else if (action === 'expense-delete') {
          result = await runExpenseDelete(body);
        } else if (action === 'income-find') {
          result = await runIncomeFind(body);
        } else if (action === 'recurring-find') {
          result = await runRecurringFind(body);
        } else if (action === 'summary-find') {
          result = await runSummaryFind(body);
        } else if (action === 'transactions-find') {
          result = await runTransactionsFind(body);
        } else {
          res.statusCode = 400;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: `unsupported action: ${action || 'missing'}` }));
          return true;
        }

        res.statusCode = result?.ok === false ? 500 : 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: String(err) }));
      }
      return true;
    },
  });

}
