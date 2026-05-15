import { writeFile } from 'node:fs/promises';

import type { ReportModel } from './models';

export const writeHtmlReport = async (model: ReportModel, outputPath: string): Promise<void> => {
  const html = renderReport(model);
  await writeFile(outputPath, html, 'utf8');
};

const renderReport = (model: ReportModel): string => {
  const rows = model.results
    .map(
      (result) => `
      <tr>
        <td>${escapeHtml(result.runner)}</td>
        <td>${escapeHtml(result.journey ?? 'all')}</td>
        <td><span class="status status-${escapeHtml(result.status)}">${escapeHtml(result.status)}</span></td>
        <td class="mono">${result.totalTestCount}</td>
        <td class="mono">${result.failedTestCount}</td>
        <td class="mono">${new Date(result.completedAt).toISOString()}</td>
      </tr>`
    )
    .join('\n');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>mic-check report</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Fira+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style>
      :root {
        --paper: #fcfbf7;
        --cream: #f8f5ee;
        --surface: #ffffff;
        --line: #e5e7eb;
        --text: #1f2937;
        --muted: #6b7280;
        --primary-blue: #1d4ed8;
        --urgent-red: #dc2626;
        --shadow: 0 8px 24px rgba(17, 24, 39, 0.08);
      }

      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      body {
        font-family: 'Fira Sans', sans-serif;
        font-size: 14px;
        line-height: 1.5;
        background: linear-gradient(180deg, var(--paper), var(--cream));
        color: var(--text);
      }

      .container {
        max-width: 1080px;
        margin: 24px auto;
        padding: 0 16px 24px;
      }

      .card {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 14px;
        box-shadow: var(--shadow);
      }

      .header { padding: 20px; margin-bottom: 16px; }
      h1 {
        margin: 0 0 8px;
        font-size: 28px;
        line-height: 1.2;
        letter-spacing: -0.01em;
      }
      .meta {
        margin: 0;
        color: var(--muted);
      }

      .summary-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        margin-bottom: 16px;
      }
      .summary-item {
        padding: 14px;
      }
      .summary-label {
        margin: 0 0 6px;
        color: var(--muted);
      }
      .summary-value {
        margin: 0;
        font-size: 22px;
        font-weight: 700;
      }
      .summary-value.critical {
        color: ${model.summary.failedTests > 0 ? 'var(--urgent-red)' : 'var(--text)'};
      }
      .summary-value.accent {
        color: var(--primary-blue);
      }

      .details {
        padding: 16px 20px;
        margin-bottom: 16px;
      }
      .details p { margin: 0; color: var(--muted); }

      code, .mono {
        font-family: 'Fira Code', monospace;
      }
      code {
        background: #f3f4f6;
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 2px 6px;
      }

      .table-wrap {
        overflow-x: auto;
      }
      table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
      }
      th, td {
        padding: 10px 12px;
        border-bottom: 1px solid var(--line);
        text-align: left;
        vertical-align: top;
        font-size: 14px;
      }
      th {
        font-weight: 600;
        background: #f6f7f9;
      }
      tr:last-child td { border-bottom: none; }

      .status {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 2px 10px;
        font-weight: 600;
        border: 1px solid var(--line);
        background: #f9fafb;
        color: var(--text);
      }
      .status.status-failed {
        border-color: rgba(220, 38, 38, 0.3);
        color: var(--urgent-red);
        background: rgba(220, 38, 38, 0.08);
      }
      .status.status-running {
        border-color: rgba(29, 78, 216, 0.3);
        color: var(--primary-blue);
        background: rgba(29, 78, 216, 0.08);
      }
    </style>
  </head>
  <body>
    <main class="container">
      <section class="card header">
        <h1>mic-check execution report</h1>
        <p class="meta">Generated at <strong class="mono">${new Date(model.generatedAt).toISOString()}</strong></p>
      </section>

      <section class="summary-grid">
        <article class="card summary-item">
          <p class="summary-label">Total runners</p>
          <p class="summary-value mono">${model.summary.totalRunners}</p>
        </article>
        <article class="card summary-item">
          <p class="summary-label">Total tests</p>
          <p class="summary-value mono accent">${model.summary.totalTests}</p>
        </article>
        <article class="card summary-item">
          <p class="summary-label">Failed tests</p>
          <p class="summary-value mono critical">${model.summary.failedTests}</p>
        </article>
        <article class="card summary-item">
          <p class="summary-label">Duration</p>
          <p class="summary-value mono">${model.summary.durationMs}ms</p>
        </article>
      </section>

      <section class="card details">
        <p>
          Raw payload: <code>raw-results.json</code><br />
          Allure files: <code>allure-results/</code>
        </p>
      </section>

      <section class="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Runner</th>
              <th>Journey</th>
              <th>Status</th>
              <th>Total Tests</th>
              <th>Failed</th>
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </section>
    </main>
  </body>
</html>`;
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
