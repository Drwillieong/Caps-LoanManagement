<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Loan Application Update</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f0f2f5;
            padding: 20px 0;
            margin: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        .email-header {
            background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
            padding: 30px 40px;
            text-align: center;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
            background-color: #ffffff;
            padding: 30px 40px;
        }
        .header img {
            max-width: 250px;
        }
        .company-logo {
            font-size: 28px;
            font-weight: bold;
            color: #ffffff;
            letter-spacing: 1px;
        }
        .company-tagline {
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
            margin-top: 5px;
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
            padding: 8px 20px;
            border-radius: 25px;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 25px;
        }
        .status-accepted {
            background: #dcfce7;
            color: #166534;
        }
        .status-rejected {
            background: #fee2e2;
            color: #991b1b;
        }
        .info-box {
            background: #f8fafc;
            border-radius: 10px;
            padding: 25px;
            margin: 25px 0;
            border: 1px solid #e2e8f0;
        }
        .info-box-title {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .info-item {
            display: flex;
            flex-direction: column;
        }
        .info-label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .info-value {
            font-size: 15px;
            color: #1e293b;
            font-weight: 500;
        }
        .info-value.highlight {
            color: #2563eb;
            font-size: 18px;
        }
        .total-box {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border-radius: 10px;
            padding: 20px 25px;
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .total-label {
            font-size: 14px;
            color: #1e40af;
            font-weight: 500;
        }
        .total-value {
            font-size: 22px;
            color: #1e40af;
            font-weight: 700;
        }
        .message-text {
            color: #4b5563;
            font-size: 15px;
            line-height: 1.7;
            margin: 20px 0;
        }
        .action-box {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 10px;
            padding: 20px;
            margin: 25px 0;
        }
        .action-box-decline {
            background: #fef2f2;
            border: 1px solid #fecaca;
        }
        .action-title {
            font-size: 15px;
            font-weight: 600;
            color: #166534;
            margin-bottom: 8px;
        }
        .action-title-decline {
            color: #991b1b;
        }
        .action-text {
            font-size: 14px;
            color: #15803d;
        }
        .action-text-decline {
            color: #b91c1c;
        }
        .email-footer {
            background: #f8fafc;
            padding: 25px 40px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer-text {
            font-size: 13px;
            color: #64748b;
            margin-bottom: 8px;
        }
        .footer-contact {
            font-size: 12px;
            color: #94a3b8;
        }
        .footer-contact a {
            color: #2563eb;
            text-decoration: none;
        }
        .divider {
            height: 1px;
            background: #e2e8f0;
            margin: 25px 0;
        }
        @media only screen and (max-width: 600px) {
            .email-container {
                margin: 10px;
            }
            .email-body {
                padding: 25px;
            }
            .info-grid {
                grid-template-columns: 1fr;
            }
            .email-header {
                padding: 25px 20px;
            }
            .header {
                padding: 25px 20px;
            }
        }
    </style>
</head>
<body>

<div class="email-container">

    <!-- HEADER with Logo -->
    <div class="header">
        <img src="{{ $message->embed(public_path('LEIMCO.png')) }}" alt="LEIMCO Logo">
    </div>

    <!-- Body -->
    <div class="email-body">

        <p class="greeting">Dear <strong>{{ $borrowerName }}</strong>,</p>

        <!-- Status Badge -->
        @if ($decision === 'accepted')
            <div class="status-badge status-accepted">✓ Co-Maker Approved</div>
            <p class="message-text">
                Great news! Your selected co-maker, <strong>{{ $coMakerName }}</strong>, has accepted the co-maker request for your loan application. 
                Your application will now proceed to the next stage of review.
            </p>
            
            <!-- Next Steps Box -->
            <div class="action-box">
                <div class="action-title">What's Next?</div>
                <p class="action-text">
                    Your loan application is now pending further review. You will receive updates on the status of your application via email.
                    Please ensure your contact information is up to date.
                </p>
            </div>
        @else
            <div class="status-badge status-rejected">✕ Co-Maker Declined</div>
            <p class="message-text">
                We regret to inform you that your selected co-maker, <strong>{{ $coMakerName }}</strong>, has declined the co-maker request for your loan application.
            </p>
            
            @if (!empty($rejectionReason))
                <div class="action-box action-box-decline">
                    <div class="action-title action-title-decline">Reason for Declining</div>
                    <p class="action-text action-text-decline">
                        {{ $rejectionReason }}
                    </p>
                </div>
            @endif
            
            <!-- Next Steps Box -->
            <div class="action-box action-box-decline">
                <div class="action-title action-title-decline">What You Need to Do</div>
                <p class="action-text action-text-decline">
                    To continue with your loan application, please log in to your account and select a new co-maker. 
                    Your current application status has been updated accordingly.
                </p>
            </div>
        @endif

        <div class="divider"></div>

        <!-- Loan Details Box -->
        <div class="info-box">
            <div class="info-box-title">
                📋 Loan Application Details
            </div>
            
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Loan Type</span>
                    <span class="info-value">{{ $loanType }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Application Date</span>
                    <span class="info-value">{{ $applicationDate }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Loan Term</span>
                    <span class="info-value">{{ $terms }} Months</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Principal Amount</span>
                    <span class="info-value">₱{{ number_format($loanAmount, 2) }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Interest Amount</span>
                    <span class="info-value">₱{{ number_format($interestAmount, 2) }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Monthly Payment</span>
                    <span class="info-value highlight">₱{{ number_format($monthlyPayment, 2) }}</span>
                </div>
            </div>

            <div class="total-box">
                <span class="total-label">Total Amount Due</span>
                <span class="total-value">₱{{ number_format($totalAmountDue, 2) }}</span>
            </div>
        </div>

        <div class="divider"></div>

        <p class="message-text" style="font-size: 13px; color: #6b7280;">
            This is an automated notification from LEIMCO. Please do not reply directly to this email. 
            If you have any questions or need assistance, please contact our support team.
        </p>

    </div>

    <!-- Footer -->
    <div class="email-footer">
        <p class="footer-text">
            © {{ date('Y') }} LEIMCO - Lending & Investment Cooperative. All rights reserved.
        </p>
        <p class="footer-contact">
            Need help? Contact us at <a href="mailto:support@leimco.com">support@leimco.com</a> 
            or call (02) 123-4567
        </p>
    </div>

</div>

</body>
</html>
