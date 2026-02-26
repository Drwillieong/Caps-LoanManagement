<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to LEIMCO</title>
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
        .welcome-badge {
            display: inline-block;
            background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
            color: #166534;
            padding: 8px 20px;
            border-radius: 25px;
            font-weight: 600;
            font-size: 14px;
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
        }
        .credentials-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .credential-item {
            background: #ffffff;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        .credential-label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .credential-value {
            font-size: 15px;
            color: #1e293b;
            font-weight: 500;
            font-family: monospace;
        }
        .message-text {
            color: #4b5563;
            font-size: 15px;
            line-height: 1.7;
            margin: 20px 0;
        }
        .security-box {
            background: #fef3c7;
            border: 1px solid #fcd34d;
            border-radius: 10px;
            padding: 20px;
            margin: 25px 0;
        }
        .security-title {
            font-size: 15px;
            font-weight: 600;
            color: #92400e;
            margin-bottom: 8px;
        }
        .security-text {
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
            .credentials-grid {
                grid-template-columns: 1fr;
            }
            .header {
                padding: 25px 20px;
            }
        }
        .a{
              
                color: black;
               
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

        <div class="welcome-badge">🎉 Welcome to LEIMCO</div>

        <p class="greeting">Dear <strong>{{ $name ?? 'Member' }}</strong>,</p>

        <p class="message-text">
            Welcome to <strong>LEIMCO - Lending & Investment Cooperative</strong>! 
            Your account has been successfully created. Please find your login credentials below:
        </p>

        <!-- Credentials Box -->
        <div class="info-box">
            <div class="info-box-title">
                🔐 Your Login Credentials
            </div>
            
            <div class="credentials-grid">
                <div class="credential-item">
                    <div class="credential-label">Email Address</div>
                    <div class="credential-value">{{ $email }}</div>
                </div>
                <div class="credential-item">
                    <div class="credential-label">Temporary Password</div>
                    <div class="credential-value">{{ $password }}</div>
                </div>
            </div>
        </div>

        <div class="divider"></div>

        <!-- Security Notice Box -->
        <div class="security-box">
            <div class="security-title">🔒 Security Notice</div>
            <p class="security-text">
                For security reasons, please change your password immediately after your first login. 
                Keep your credentials confidential and do not share them with anyone.
            </p>
        </div>

        <p class="message-text">
            We're excited to have you as a member of LEIMCO. We look forward to serving you and helping you achieve your financial goals.
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
