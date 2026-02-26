<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Co-Maker Notification</title>
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
        .email-body {
            padding: 40px;
        }
        .greeting {
            font-size: 18px;
            color: #1f2937;
            margin-bottom: 20px;
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
        .message-text {
            color: #4b5563;
            font-size: 15px;
            line-height: 1.7;
            margin: 20px 0;
        }
        .important-box {
            background: #fef3c7;
            border: 1px solid #fcd34d;
            border-radius: 10px;
            padding: 20px;
            margin: 25px 0;
        }
        .important-title {
            font-size: 15px;
            font-weight: 600;
            color: #92400e;
            margin-bottom: 8px;
        }
        .important-text {
            font-size: 14px;
            color: #b45309;
        }
        .btn-container {
            text-align: center;
            margin: 35px 0;
        }
        .btn {
            background-color: #2563eb;
            color: #ffffff;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            display: inline-block;
            font-size: 15px;
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

        <p class="greeting">Dear <strong>{{ $comakerName }}</strong>,</p>

        <p class="message-text">
            You have been selected as a <strong>Co-Maker</strong> for a loan application. 
            Below are the details of the loan request:
        </p>

        <!-- Loan Details Box -->
        <div class="info-box">
            <div class="info-box-title">
                📋 Loan Application Details
            </div>
            
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Borrower Name</span>
                    <span class="info-value">{{ $borrowerName }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Loan Type</span>
                    <span class="info-value">{{ $loanType }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Loan Amount</span>
                    <span class="info-value highlight">₱{{ number_format($loanAmount, 2) }}</span>
                </div>
            </div>
        </div>

        <div class="divider"></div>

        <!-- Important Information Box -->
        <div class="important-box">
            <div class="important-title">⚠️ Important Responsibility</div>
            <p class="important-text">
                As a Co-Maker, you share equal responsibility with the borrower for repaying the loan. 
                If the borrower fails to meet their loan obligations, you will be held equally liable for the debt.
                Please review this request carefully before accepting or declining.
            </p>
        </div>

        <p class="message-text">
            Please log in to your account to review the full loan details and respond to this co-maker request.
        </p>

        <div class="btn-container">
            <a href="{{ url('/login') }}" class="btn">Login to Portal</a>
        </div>

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
