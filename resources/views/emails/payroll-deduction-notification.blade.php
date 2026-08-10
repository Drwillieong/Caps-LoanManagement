<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Salary Deduction Update</title>
  <style>
    /* ----- base & reset (strictly from first template) ----- */
    body {
      margin: 0;
      padding: 0;
      background: #eef2f7;
      color: #172033;
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.6;
    }
    .container {
      max-width: 680px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #dbe3ef;
      border-radius: 8px;
      overflow: hidden;
    }
    /* header – white, bottom border, centered logo */
    .header {
      background: #ffffff;
      padding: 28px 36px;
      text-align: center;
      border-bottom: 1px solid #e5eaf2;
    }
    .header img { max-width: 210px; height: auto; }

    /* body */
    .body { padding: 34px 40px 28px; }

    /* eyebrow + h1 */
    .eyebrow {
      color: #315d9f;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1.2px;
      margin: 0 0 8px;
      text-transform: uppercase;
    }
    h1 {
      color: #111827;
      font-size: 24px;
      line-height: 1.3;
      margin: 0 0 16px;
    }
    p { margin: 0 0 16px; }
    .copy { color: #475569; font-size: 15px; }
    .subtitle {
      color: #6b7280;
      font-size: 14px;
      margin-top: -8px;
      margin-bottom: 20px;
    }

    /* ----- summary section – exact .section style from first template ----- */
    .section {
      border: 1px solid #dbe3ef;
      border-radius: 8px;
      margin: 24px 0;
      overflow: hidden;
    }
    .section-title {
      background: #f8fafc;
      border-bottom: 1px solid #dbe3ef;
      color: #111827;
      font-size: 15px;
      font-weight: 700;
      padding: 14px 18px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    td {
      border-bottom: 1px solid #edf2f7;
      padding: 12px 18px;
      vertical-align: top;
    }
    tr:last-child td { border-bottom: 0; }
    .label {
      color: #64748b;
      font-size: 12px;
      text-transform: uppercase;
      width: 46%;
    }
    .value {
      color: #1e293b;
      font-size: 14px;
      font-weight: 700;
      text-align: right;
    }
    .amount { color: #173d7a; font-size: 16px; }

    /* status badge – subtle, professional */
    .status-badge {
      display: inline-block;
      padding: 2px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .3px;
    }
    .status-success {
      background: #ecfdf5;
      color: #065f46;
    }
    .status-pending {
      background: #fffbeb;
      color: #92400e;
    }

    /* notice / footer (first template style) */
    .notice {
      background: #f8fafc;
      border-left: 4px solid #315d9f;
      color: #475569;
      font-size: 13px;
      margin-top: 26px;
      padding: 16px 18px;
      border-radius: 0 8px 8px 0;
    }

    .footer {
      background: #172033;
      color: #cbd5e1;
      font-size: 12px;
      padding: 24px 36px;
      text-align: center;
    }
    .footer strong {
      color: #ffffff;
      display: block;
      font-size: 13px;
      margin-bottom: 4px;
    }
    .footer a { color: #bfdbfe; text-decoration: none; }

    /* ----- responsive (same as first template) ----- */
    @media only screen and (max-width: 600px) {
      .page { padding: 12px; }
      .header { padding: 24px 22px; }
      .body { padding: 28px 22px 22px; }
      td { display: block; padding: 10px 16px; }
      .label { width: auto; padding-bottom: 0; }
      .value { text-align: left; padding-top: 2px; }
    }
  </style>
</head>
<body>

<div class="container">

  <!-- ===== HEADER ===== (exactly as first template) -->
  <div class="header">
    <img src="{{ $message->embed(public_path('LEIMCO.png')) }}" alt="LEIMCO Logo">
  </div>

  <!-- ===== BODY ===== -->
  <div class="body">

    <p class="eyebrow">Salary Deduction Update</p>
    <h1>Hello {{ $summary['member_name'] }},</h1>
    <p class="subtitle">Cutoff date: {{ $summary['cutoff_date'] }}</p>

    <p class="copy">
      We processed your recent salary deduction for your {{ $summary['loan_name'] }}.
      Below is the summary posted to your loan account.
    </p>

    <!-- ===== DEDUCTION SUMMARY (exact .section style) ===== -->
    <div class="section">
      <div class="section-title">Deduction Summary</div>
      <table role="presentation">
        <tr>
          <td class="label">Amount deducted</td>
          <td class="value amount">PHP {{ number_format($summary['deducted_amount'], 2) }}</td>
        </tr>
        <tr>
          <td class="label">Expected deduction</td>
          <td class="value">PHP {{ number_format($summary['expected_amount'], 2) }}</td>
        </tr>
        <tr>
          <td class="label">Deduction status</td>
          <td class="value">
            @php
              $statusClass = $summary['status'] === 'Success' ? 'status-success' : 'status-pending';
            @endphp
            <span class="status-badge {{ $statusClass }}">{{ $summary['status'] }}</span>
          </td>
        </tr>
        <tr>
          <td class="label">Remaining loan balance</td>
          <td class="value amount">PHP {{ number_format($summary['remaining_balance'], 2) }}</td>
        </tr>
      </table>
    </div>

    <!-- ===== NOTICE (first template style) ===== -->
    <div class="notice">
      If you have questions about this deduction, please contact the office for assistance.
    </div>

  </div>

  <!-- ===== FOOTER (exactly as first template) ===== -->
  <div class="footer">
    <strong>LEIMCO Lending and Investment Cooperative</strong>
    Copyright {{ date('Y') }} LEIMCO. All rights reserved.<br>
    Member Services: <a href="mailto:support@leimco.com">support@leimco.com</a>
  </div>

</div>

</body>
</html>