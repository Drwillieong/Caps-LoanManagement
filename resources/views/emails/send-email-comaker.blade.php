<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Co-Maker Loan Request</title>
    <style>
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
        .header {
            background: #ffffff;
            padding: 28px 36px;
            text-align: center;
            border-bottom: 1px solid #e5eaf2;
        }
        .header img { max-width: 210px; height: auto; }
        .body { padding: 34px 40px 28px; }
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
        .notice {
            background: #fff7ed;
        
            border-left: 4px solid ;
            border-radius: 8px;
           
            font-size: 14px;
            margin: 24px 0;
            padding: 18px 20px;
        }
        .notice strong { color: #7c2d12; }
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
        <div class="header">
            <img src="{{ $message->embed(public_path('LEIMCO.png')) }}" alt="LEIMCO Logo">
        </div>

        <div class="body">
            <p class="eyebrow">Official Co-Maker Request</p>
            <h1>Dear {{ $comakerName }},</h1>

            <p class="copy">
                You have been nominated as co-maker for a loan application submitted by <strong>{{ $borrowerName }}</strong>. Your acknowledgment is required in the LEIMCO member portal before the application can continue.
            </p>

            <div class="section">
                <div class="section-title">Borrower Information</div>
                <table role="presentation">
                    <tr>
                        <td class="label">Member Name</td>
                        <td class="value">{{ $borrowerName }}</td>
                    </tr>
                    <tr>
                        <td class="label">Members ID</td>
                        <td class="value">{{ $borrower->memberProfile->members_id ?? 'N/A' }}</td>
                    </tr>
                    <tr>
                        <td class="label">Position</td>
                        <td class="value">{{ $borrower->memberProfile->position ?? 'N/A' }}</td>
                    </tr>
                    <tr>
                        <td class="label">Contact Number</td>
                        <td class="value">{{ $borrower->memberProfile->mobile_number ?? 'N/A' }}</td>
                    </tr>
                    <tr>
                        <td class="label">Present Address</td>
                        <td class="value">{{ $borrower->memberProfile->present_address ?? 'N/A' }}{{ $borrower->memberProfile->present_zip_code ? ' '.$borrower->memberProfile->present_zip_code : '' }}</td>
                    </tr>
                </table>
            </div>

            <div class="section">
                <div class="section-title">Loan Application Details</div>
                <table role="presentation">
                    <tr>
                        <td class="label">Loan Type</td>
                        <td class="value">{{ $loanType }}</td>
                    </tr>
                    <tr>
                        <td class="label">Term</td>
                        <td class="value">{{ $loan->terms_months ?? 'N/A' }} {{ ($loan->terms_months ?? 0) == 1 ? 'Month' : 'Months' }}</td>
                    </tr>
                    <tr>
                        <td class="label">Principal Amount</td>
                        <td class="value amount">PHP {{ number_format($loanAmount, 2) }}</td>
                    </tr>
                    <tr>
                        <td class="label">Total Amount Due</td>
                        <td class="value">PHP {{ number_format($loan->total_amount_due ?? 0, 2) }}</td>
                    </tr>
                    <tr>
                        <td class="label">Monthly Amortization</td>
                        <td class="value">PHP {{ number_format($loan->monthly_amortization ?? 0, 2) }}</td>
                    </tr>
                    <tr>
                        <td class="label">Disbursement Method</td>
                        <td class="value">{{ isset($loan->disbursement_method) ? ucwords(str_replace('_', ' ', $loan->disbursement_method)) : 'N/A' }}</td>
                    </tr>
                </table>
            </div>

            <div class="notice">
                <strong>Important:</strong> By accepting this request, you acknowledge potential joint responsibility for repayment obligations if the borrower fails to pay according to the approved loan terms.
            </div>

            <p class="copy">
                Please sign in to your account to review the request and formally accept or decline your nomination.
            </p>

            <div class="button-wrap">
                <a href="{{ url('/login') }}" class="button">Review Request in Portal</a>
            </div>

            <p class="disclaimer">
                This is an automated notification from LEIMCO. Please do not reply directly to this email.
            </p>
        </div>

        <div class="footer">
            <strong>LEIMCO Lending and Investment Cooperative</strong>
            Copyright {{ date('Y') }} LEIMCO. All rights reserved.<br>
            Member Services: <a href="mailto:support@leimco.com">support@leimco.com</a>
        </div>
    </div>

</body>
</html>
