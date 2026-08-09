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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f3f4f6;
            padding: 40px 0;
            margin: 0;
            line-height: 1.6;
        }
        
        .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 40px rgba(0, 0, 0, 0.06);
        }
        
        /* Header Section */
        .header {
           
            padding: 40px 48px 32px;
            text-align: center;
            border-bottom: 4px solid #2563eb;
        }
        
        .header-logo {
            max-width: 220px;
            height: auto;
            filter: brightness(0) invert(1);
        }
        
        .header-badge {
            display: inline-block;
            background: rgba(37, 99, 235, 0.15);
            color: #93bbfc;
            padding: 6px 20px;
            border-radius: 100px;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin-top: 16px;
            border: 1px solid rgba(37, 99, 235, 0.2);
        }
        
        /* Body Section */
        .body-content {
            padding: 48px 48px 32px;
        }
        
        .greeting {
            font-size: 22px;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 8px;
            letter-spacing: -0.3px;
        }
        
        .greeting-sub {
            font-size: 16px;
            color: #475569;
            margin-bottom: 24px;
        }
        
        .message-text {
            color: #334155;
            font-size: 15px;
            line-height: 1.8;
            margin: 20px 0;
        }
        
        .message-text strong {
            color: #0f172a;
            font-weight: 600;
        }
        
        /* Credentials Card */
        .credentials-card {
            background: #f8fafc;
            border-radius: 12px;
            padding: 28px 32px;
            margin: 28px 0;
            border: 1px solid #e2e8f0;
            position: relative;
        }
        
        .credentials-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #2563eb, #3b82f6);
            border-radius: 12px 12px 0 0;
        }
        
        .credentials-title {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 16px;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 20px;
        }
        
        .credentials-title .icon {
            font-size: 20px;
        }
        
        .credentials-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }
        
        .credential-item {
            background: #ffffff;
            padding: 16px 18px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            transition: border-color 0.2s;
        }
        
        .credential-item:hover {
            border-color: #94a3b8;
        }
        
        .credential-label {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        .credential-value {
            font-size: 15px;
            color: #0f172a;
            font-weight: 500;
            font-family: 'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace;
            word-break: break-all;
        }
        
        .credential-value.password {
            background: #f1f5f9;
            padding: 2px 10px;
            border-radius: 4px;
            display: inline-block;
            font-size: 14px;
            letter-spacing: 0.5px;
        }
        
        /* Divider */
        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
            margin: 32px 0;
        }
        
        /* Security Alert */
        .security-alert {
            background: #fefce8;
            border: 1px solid #fde68a;
            border-radius: 12px;
            padding: 20px 24px;
            margin: 24px 0;
            position: relative;
            padding-left: 56px;
        }
        
        .security-alert::before {
            content: '🔒';
            position: absolute;
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 20px;
        }
        
        .security-title {
            font-size: 14px;
            font-weight: 600;
            color: #92400e;
            margin-bottom: 4px;
        }
        
        .security-text {
            font-size: 14px;
            color: #78350f;
            line-height: 1.6;
        }
        
        /* CTA Button */
        .cta-container {
            text-align: center;
            margin: 36px 0 28px;
        }
        
        .cta-button {
            display: inline-block;
            background: #2563eb;
            color: #ffffff !important;
            padding: 14px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 15px;
            transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }
        
        .cta-button:hover {
            background: #1d4ed8;
            box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
            transform: translateY(-1px);
        }
        
        .cta-subtext {
            font-size: 13px;
            color: #64748b;
            margin-top: 12px;
        }
        
        /* Footer */
        .footer {
            background: #f8fafc;
            padding: 32px 48px 28px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
        }
        
        .footer-company {
            font-size: 14px;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 4px;
        }
        
        .footer-text {
            font-size: 13px;
            color: #64748b;
            line-height: 1.8;
        }
        
        .footer-text a {
            color: #2563eb;
            text-decoration: none;
            font-weight: 500;
        }
        
        .footer-text a:hover {
            text-decoration: underline;
        }
        
        .footer-social {
            display: flex;
            justify-content: center;
            gap: 16px;
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer-social a {
            color: #64748b;
            text-decoration: none;
            font-size: 13px;
            transition: color 0.2s;
        }
        
        .footer-social a:hover {
            color: #2563eb;
        }
        
        .footer-disclaimer {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 16px;
            line-height: 1.6;
        }
        
        /* Responsive */
        @media only screen and (max-width: 600px) {
            body {
                padding: 16px 0;
            }
            
            .email-wrapper {
                border-radius: 12px;
                margin: 0 12px;
            }
            
            .header {
                padding: 32px 24px 24px;
            }
            
            .header-logo {
                max-width: 160px;
            }
            
            .body-content {
                padding: 32px 24px 24px;
            }
            
            .credentials-grid {
                grid-template-columns: 1fr;
                gap: 10px;
            }
            
            .credentials-card {
                padding: 20px;
            }
            
            .footer {
                padding: 24px 24px 20px;
            }
            
            .greeting {
                font-size: 20px;
            }
            
            .cta-button {
                padding: 12px 32px;
                font-size: 14px;
                display: block;
            }
            
            .security-alert {
                padding: 16px 16px 16px 48px;
            }
            
            .security-alert::before {
                left: 16px;
            }
        }
        
        @media only screen and (max-width: 400px) {
            .header-logo {
                max-width: 130px;
            }
            
            .body-content {
                padding: 24px 16px 20px;
            }
            
            .credential-item {
                padding: 12px 14px;
            }
        }
    </style>
</head>
<body>

<div class="email-wrapper">
    
    <!-- HEADER -->
    <div class="header">
        <img src="{{ $message->embed(public_path('LEIMCO.png')) }}" alt="LEIMCO - Lending & Investment Cooperative" class="header-logo">
       
    </div>
    
    <!-- BODY -->
    <div class="body-content">
        
        <h1 class="greeting">Welcome, {{ $name ?? 'Member' }}!</h1>
        <p class="greeting-sub">Thank you for joining LEIMCO Cooperative</p>
        
        <p class="message-text">
            We are delighted to welcome you to <strong>LEIMCO - Lending & Investment Cooperative</strong>. 
            Your membership has been successfully activated. Below are your login credentials to access 
            your member portal and start enjoying the benefits of being a LEIMCO member.
        </p>
        
        <!-- Credentials Card -->
        <div class="credentials-card">
            <div class="credentials-title">
                <span class="icon">🔐</span>
                Your Login Credentials
            </div>
            
            <div class="credentials-grid">
                <div class="credential-item">
                    <div class="credential-label">Email Address</div>
                    <div class="credential-value">{{ $email }}</div>
                </div>
                <div class="credential-item">
                    <div class="credential-label">Temporary Password</div>
                    <div class="credential-value password">{{ $password }}</div>
                </div>
            </div>
        </div>
        
        <div class="divider"></div>
        
        <!-- Security Alert -->
        <div class="security-alert">
            <div class="security-title">Security Reminder</div>
            <p class="security-text">
                For your security, please change your password immediately after your first login. 
                Never share your credentials with anyone. LEIMCO will never ask for your password.
            </p>
        </div>
        
        <p class="message-text">
            We're committed to helping you achieve your financial goals through our cooperative 
            services. As a member, you'll have access to competitive loan products, investment 
            opportunities, and a supportive community.
        </p>
        
        <!-- CTA Button -->
        <div class="cta-container">
            <a href="{{ url('/login') }}" class="cta-button">
                Access Member Portal
            </a>
            <p class="cta-subtext">Click the button above to log in and get started</p>
        </div>
        
        <p class="message-text" style="font-size: 13px; color: #64748b; margin-top: 24px;">
            <strong>Need assistance?</strong> Our support team is available to help you with any 
            questions or concerns you may have about your membership.
        </p>
        
    </div>
    
    <!-- FOOTER -->
    <div class="footer">
        <div class="footer-company">
            LEIMCO - Lending & Investment Cooperative
        </div>
        <p class="footer-text">
            &copy; {{ date('Y') }} LEIMCO. All rights reserved.<br>
            <a href="mailto:support@leimco.com">support@leimco.com</a> &bull; 
            <a href="tel:+6321234567">(02) 123-4567</a>
        </p>
        
        <div class="footer-social">
            <a href="#">About Us</a>
            <a href="#">Services</a>
            <a href="#">Contact</a>
            <a href="#">Privacy Policy</a>
        </div>
        
        <p class="footer-disclaimer">
            This is an automated notification from LEIMCO. Please do not reply directly to this email. 
            If you have any questions or need assistance, please contact our support team.
        </p>
    </div>
    
</div>

</body>
</html>