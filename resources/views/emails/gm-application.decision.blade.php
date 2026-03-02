<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Loan Application Approved</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f0f2f5;
            margin: 0;
            padding: 20px 0;
        }
        .email-container {
            max-width: 600px;
            margin: auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,.08);
        }
        .header {
            padding: 30px 40px;
            text-align: center;
            border-bottom: 1px solid #e5e7eb;
        }
        .header img {
            max-width: 240px;
        }
        .email-body {
            padding: 40px;
        }
        .greeting {
            font-size: 18px;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .status-badge {
            display: inline-block;
            padding: 8px 22px;
            border-radius: 999px;
            font-weight: 600;
            font-size: 14px;
            background: #dcfce7;
            color: #166534;
            margin-bottom: 25px;
        }
        .status-badge.rejected {
            background: #fee2e2;
            color: #991b1b;
        }
        .message-text {
            font-size: 15px;
            color: #4b5563;
            line-height: 1.7;
            margin-bottom: 18px;
        }
        .action-box {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 10px;
            padding: 20px;
            margin: 25px 0;
        }
        .action-title {
            font-size: 15px;
            font-weight: 600;
            color: #166534;
            margin-bottom: 8px;
        }
        .action-box.rejected {
            background: #fef2f2;
            border-color: #fecaca;
        }
        .action-title.rejected {
            color: #991b1b;
        }
        .action-text {
            font-size: 14px;
            color: #15803d;
        }
        .action-text.rejected {
            color: #b91c1c;
        }
        .info-box {
            background: #f8fafc;
            border-radius: 10px;
            padding: 25px;
            border: 1px solid #e2e8f0;
            margin-top: 25px;
        }
        .info-box-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 15px;
            color: #1e293b;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .info-label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
        }
        .info-value {
            font-size: 15px;
            color: #1e293b;
            font-weight: 500;
        }
        .total-box {
            background: #eff6ff;
            padding: 18px 22px;
            border-radius: 10px;
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            font-weight: 700;
            color: #1e40af;
        }
        .divider {
            height: 1px;
            background: #e5e7eb;
            margin: 30px 0;
        }
        .footer {
            background: #f8fafc;
            text-align: center;
            padding: 25px 40px;
            font-size: 13px;
            color: #64748b;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>

<div class="email-container">

    <!-- Logo -->
    <div class="header">
        <img src="{{ $message->embed(public_path('LEIMCO.png')) }}" alt="LEIMCO Logo">
    </div>

    <!-- Body -->
    <div class="email-body">

        <p class="greeting">Dear <strong>{{ $borrowerName }}</strong>,</p>

        @if ($decision === 'approved')
            <div class="status-badge">✓ Loan Application Approved</div>

            <p class="message-text">
                We are pleased to inform you that your loan application has been
                <strong>approved by the General Manager</strong> after careful
                evaluation of your submitted requirements.
            </p>

            <p class="message-text">
                Your application has now been endorsed for
                <strong>check voucher preparation and processing</strong>.
                Kindly allow sufficient time for internal verification and approval procedures.
            </p>

            <div class="action-box">
                <div class="action-title">Next Steps</div>
                <p class="action-text">
                    You will receive a separate notification once your check voucher
                    is ready for release or if additional information is required.
                    Please wait for further instructions from our office.
                </p>
            </div>
        @else
            <div class="status-badge rejected">✕ Loan Application Rejected</div>

            <p class="message-text">
                We regret to inform you that your loan application has been
                <strong>rejected by the General Manager</strong>.
            </p>

            <div class="action-box rejected">
                <div class="action-title rejected">Reason for Rejection</div>
                <p class="action-text rejected">
                    {{ $remarks ?? 'Please contact our office for more details regarding the decision.' }}
                </p>
            </div>
        @endif
        
        <div class="divider"></div>

        <!-- Loan Info -->
        <div class="info-box">
            <div class="info-box-title">📋 Loan Application Summary</div>

            <div class="info-grid">
                <div>
                    <div class="info-label">Loan Type</div>
                    <div class="info-value">{{ $loanType }}</div>
                </div>
                <div>
                    <div class="info-label">Application Date</div>
                    <div class="info-value">{{ $applicationDate }}</div>
                </div>
                <div>
                    <div class="info-label">Loan Term</div>
                    <div class="info-value">{{ $terms }} Months</div>
                </div>
                <div>
                    <div class="info-label">Principal Amount</div>
                    <div class="info-value">₱{{ number_format($loanAmount, 2) }}</div>
                </div>
                <div>
                    <div class="info-label">Interest Amount</div>
                    <div class="info-value">₱{{ number_format($interestAmount, 2) }}</div>
                </div>
                <div>
                    <div class="info-label">Monthly Amortization</div>
                    <div class="info-value">₱{{ number_format($monthlyPayment, 2) }}</div>
                </div>
            </div>

            <div class="total-box">
                <span>Total Amount Due</span>
                <span>₱{{ number_format($totalAmountDue, 2) }}</span>
            </div>
        </div>

        <p class="message-text" style="font-size: 13px; color: #6b7280; margin-top: 30px;">
            This is an automated notification from LEIMCO. Please do not reply directly
            to this email. For inquiries, kindly contact our office through official channels.
        </p>

    </div>

    <!-- Footer -->
    <div class="footer">
        © {{ date('Y') }} LEIMCO – Lending & Investment Cooperative. All rights reserved.
    </div>

</div>

</body>
</html>