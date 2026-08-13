<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Loan Application Decision</title>
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

    /* ----- decision boxes (using .notice style from first template) ----- */
    .decision {
      border-radius: 8px;
      margin: 24px 0;
      padding: 18px 20px;
      font-size: 14px;
    }
    .decision.approved {
      background: #f0fdf4;
      border-left: 4px solid #22c55e;
    }
    .decision.rejected {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
    }
    .decision-label {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: .3px;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .approved .decision-label { color: #166534; }
    .rejected .decision-label { color: #991b1b; }
    .decision-text {
      color: #1f2937;
      font-size: 14px;
      margin: 0;
    }

    /* ----- summary section – exact replica of first template's .section ----- */
    .summary {
      border: 1px solid #dbe3ef;
      border-radius: 8px;
      margin: 24px 0;
      overflow: hidden;
    }
    .summary-title {
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
      width: 42%;
    }
    .value {
      color: #1e293b;
      font-size: 14px;
      font-weight: 700;
      text-align: right;
    }
    .amount { color: #173d7a; font-size: 16px; }

    /* total row – subtle highlight (no gradient) */
    .total-row td {
      background: #f0f6ff;
      color: #173d7a;
      font-size: 15px;
    }
    .total-row .value { font-weight: 700; }

    /* ----- notice / footer (first template style) ----- */
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

    <p class="eyebrow">Official Loan Decision</p>
    <h1>Dear {{ $borrowerName }},</h1>

    <!-- ===== DECISION BLOCK (using .decision with .approved/.rejected) ===== -->
    @if ($decision === 'approved')
      <p class="copy">
        Your loan application has been approved by the General Manager and has been forwarded to the Credit Coordinator for the next stage of validation.
      </p>
      <div class="decision approved">
        <div class="decision-label">Decision: Approved by GM</div>
        <p class="decision-text">
          This approval confirms that your application passed GM review. Final processing will continue under the cooperative's standard credit validation procedure.
        </p>
      </div>
    @else
      <p class="copy">
        After review, your loan application was not approved by the General Manager at this time.
      </p>
      <div class="decision rejected">
        <div class="decision-label">Decision: Rejected by GM</div>
        <p class="decision-text">
          {{ $remarks ?: 'Please contact the office for more information about this decision.' }}
        </p>
      </div>
    @endif

    <!-- ===== GM REMARKS (if any) ===== -->
    @if ($decision === 'approved' && !empty($remarks))
      <div class="decision approved" style="margin-top: 8px;">
        <div class="decision-label">GM Remarks</div>
        <p class="decision-text">{{ $remarks }}</p>
      </div>
    @endif

    <!-- ===== LOAN SUMMARY (exact .section style from first template) ===== -->
    <div class="summary">
      <div class="summary-title">Loan Application Summary</div>
      <table role="presentation">
        <tr>
          <td class="label">Loan Type</td>
          <td class="value">{{ $loanType }}</td>
        </tr>
        <tr>
          <td class="label">Application Date</td>
          <td class="value">{{ $applicationDate }}</td>
        </tr>
        <tr>
          <td class="label">Term</td>
          <td class="value">{{ $terms }} {{ $terms === 1 ? 'Month' : 'Months' }}</td>
        </tr>
        <tr>
          <td class="label">Principal Amount</td>
          <td class="value amount">PHP {{ number_format($loanAmount, 2) }}</td>
        </tr>
        <tr>
          <td class="label">Interest Amount</td>
          <td class="value">PHP {{ number_format($interestAmount, 2) }}</td>
        </tr>
        <tr>
          <td class="label">Monthly Amortization</td>
          <td class="value">PHP {{ number_format($monthlyPayment, 2) }}</td>
        </tr>
        <tr class="total-row">
          <td class="label">Total Amount Due</td>
          <td class="value">PHP {{ number_format($totalAmountDue, 2) }}</td>
        </tr>
      </table>
    </div>

    <!-- ===== NOTICE (first template style) ===== -->
    <div class="notice">
      This is an automated notification from LEIMCO. Please do not reply directly to this email. For questions, contact the cooperative office through official channels.
    </div>

  </div>

  <!-- ===== FOOTER (exactly as first template) ===== -->
  <div class="footer">
    <strong>LEIMCO Lending and Investment Cooperative</strong>
    Copyright {{ date('Y') }} LEIMCO. All rights reserved.
  </div>

</div>

</body>
</html>