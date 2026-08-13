<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Loan Application Update – Co‑Maker Decision</title>
  <style>
    /* ----- base & reset (same as first template) ----- */
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
    /* header – white background, bottom border, centered logo */
    .header {
      background: #ffffff;
      padding: 28px 36px;
      text-align: center;
      border-bottom: 1px solid #e5eaf2;
    }
    .header img { max-width: 210px; height: auto; }

    /* body spacing */
    .body { padding: 34px 40px 28px; }

    /* eyebrow */
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

    /* section cards – exactly like first template */
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
      width: 42%;
    }
    .value {
      color: #1e293b;
      font-size: 14px;
      font-weight: 700;
      text-align: right;
    }
    .amount { color: #173d7a; font-size: 16px; }

    /* notice / status boxes – use the .notice style from first template */
    .notice {
      background: #fff7ed;
      border-left: 4px solid #f59e0b;
      border-radius: 8px;
      font-size: 14px;
      margin: 24px 0;
      padding: 18px 20px;
    }
    .notice strong { color: #7c2d12; }

    /* additional status-specific variants (keeps the same base) */
    .notice-accepted {
      background: #f0fdf4;
      border-left-color: #22c55e;
    }
    .notice-accepted strong { color: #166534; }

    .notice-declined {
      background: #fef2f2;
      border-left-color: #ef4444;
    }
    .notice-declined strong { color: #991b1b; }

    /* button */
    .button-wrap { text-align: center; margin: 28px 0 8px; }
    .button {
      background: #1d4ed8;
      border-radius: 6px;
      color: #ffffff !important;
      display: inline-block;
      font-size: 15px;
      font-weight: 700;
      padding: 13px 28px;
      text-decoration: none;
    }
    .disclaimer {
      color: #64748b;
      font-size: 12px;
      margin-top: 22px;
    }

    /* footer – dark background from first template */
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

    /* responsive – same as first template */
    @media only screen and (max-width: 600px) {
      .page { padding: 12px; }
      .header { padding: 24px 22px; }
      .body { padding: 28px 22px 22px; }
      td { display: block; padding: 10px 16px; }
      .label { width: auto; padding-bottom: 0; }
      .value { text-align: left; padding-top: 2px; }
    }

    /* small extra: divider line (optional, but matches first template) */
    .divider-light {
      height: 1px;
      background: #e5eaf2;
      margin: 24px 0;
    }
    .greeting {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 16px;
    }
    .greeting strong { color: #111827; }
  </style>
</head>
<body>

<div class="container">

  <!-- ===== HEADER with Logo ===== (exactly like first template) -->
  <div class="header">
    <img src="{{ $message->embed(public_path('LEIMCO.png')) }}" alt="LEIMCO Logo">
  </div>

  <!-- ===== BODY ===== -->
  <div class="body">

    <!-- eyebrow + greeting (matching first template) -->
    <p class="eyebrow">Loan Application Update</p>
    <h1>Dear {{ $borrowerName }},</h1>

    <!-- ===== STATUS BLOCK (using .notice style) ===== -->
    @if ($decision === 'accepted')
      <!-- ACCEPTED -->
      <div class="notice notice-accepted">
        <strong>✓ Co‑Maker Approved</strong><br>
        Great news! Your selected co‑maker, <strong>{{ $coMakerName }}</strong>, has accepted the co‑maker request for your loan application.
        Your application will now proceed to the next stage of review.
      </div>
      <div class="notice notice-accepted" style="border-left-color: #22c55e;">
        <strong>What’s Next?</strong><br>
        Your loan application is now pending further review. You will receive updates on the status of your application via email.
        Please ensure your contact information is up to date.
      </div>
    @else
      <!-- DECLINED -->
      <div class="notice notice-declined">
        <strong>✕ Co‑Maker Declined</strong><br>
        We regret to inform you that your selected co‑maker, <strong>{{ $coMakerName }}</strong>, has declined the co‑maker request for your loan application.
      </div>

      @if (!empty($rejectionReason))
        <div class="notice notice-declined" style="border-left-color: #ef4444;">
          <strong>Reason for Declining</strong><br>
          {{ $rejectionReason }}
        </div>
      @endif

      <div class="notice notice-declined" style="border-left-color: #ef4444;">
        <strong>What You Need to Do</strong><br>
        To continue with your loan application, please log in to your account and select a new co‑maker.
        Your current application status has been updated accordingly.
      </div>
    @endif

    <!-- ===== LOAN DETAILS SECTION (same style as first template) ===== -->
    <div class="section">
      <div class="section-title">📋 Loan Application Details</div>
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
          <td class="label">Loan Term</td>
          <td class="value">{{ $terms }} Months</td>
        </tr>
        <tr>
          <td class="label">Principal Amount</td>
          <td class="value amount">₱{{ number_format($loanAmount, 2) }}</td>
        </tr>
        <tr>
          <td class="label">Interest Amount</td>
          <td class="value">₱{{ number_format($interestAmount, 2) }}</td>
        </tr>
        <tr>
          <td class="label">Monthly Payment</td>
          <td class="value amount">₱{{ number_format($monthlyPayment, 2) }}</td>
        </tr>
        <tr>
          <td class="label">Total Amount Due</td>
          <td class="value amount" style="color:#173d7a; font-weight:700;">₱{{ number_format($totalAmountDue, 2) }}</td>
        </tr>
      </table>
    </div>

    <!-- ===== PORTAL BUTTON (same as first template) ===== -->
    <div class="button-wrap">
      <a href="{{ url('/login') }}" class="button">Review Request in Portal</a>
    </div>

    <!-- ===== DISCLAIMER ===== -->
    <p class="disclaimer">
      This is an automated notification from LEIMCO. Please do not reply directly to this email.
      If you have any questions or need assistance, please contact our support team.
    </p>

  </div>

  <!-- ===== FOOTER (exactly like first template) ===== -->
  <div class="footer">
    <strong>LEIMCO Lending and Investment Cooperative</strong>
    Copyright {{ date('Y') }} LEIMCO. All rights reserved.<br>
    Member Services: <a href="mailto:support@leimco.com">support@leimco.com</a>
  </div>

</div>

</body>
</html>