<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Member Registration Rejected</title>
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
            background: #fee2e2;
            color: #991b1b;
            margin-bottom: 25px;
        }
        .message-text {
            font-size: 15px;
            color: #4b5563;
            line-height: 1.7;
            margin-bottom: 18px;
        }
        .info-box {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 10px;
            padding: 25px;
            margin: 25px 0;
        }
        .info-box-title {
            font-size: 16px;
            font-weight: 600;
            color: #991b1b;
            margin-bottom: 10px;
        }
        .info-detail {
            font-size: 14px;
            color: #7f1d1d;
            line-height: 1.6;
        }
        .info-detail strong {
            color: #991b1b;
        }
        .member-details {
            background: #f8fafc;
            border-radius: 10px;
            padding: 20px;
            border: 1px solid #e2e8f0;
            margin-top: 20px;
        }
        .member-details p {
            margin: 8px 0;
            font-size: 14px;
            color: #374151;
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

        <p class="greeting">Dear <strong>{{ $hrName }}</strong>,</p>

        <div class="status-badge">✕ Member Registration Rejected</div>

        <p class="message-text">
            The General Manager has reviewed and <strong>rejected</strong> a member registration application. Please see the details below:
        </p>

        <div class="member-details">
            <p><strong>Member Name:</strong> {{ $memberName }}</p>
            <p><strong>Email Address:</strong> {{ $memberEmail }}</p>
        </div>

        <div class="info-box">
            <div class="info-box-title">Reason for Rejection</div>
            <div class="info-detail">
                {{ $rejectionReason }}
            </div>
        </div>

        <p class="message-text">
            If you have any questions regarding this decision, please contact the General Manager's office for further clarification.
        </p>

        <div class="divider"></div>

        <p class="message-text" style="font-size: 13px; color: #6b7280;">
            This is an automated notification from LEIMCO. Please do not reply directly to this email.
        </p>

    </div>

    <!-- Footer -->
    <div class="footer">
        © {{ date('Y') }} LEIMCO – Lending & Investment Cooperative. All rights reserved.
    </div>

</div>

</body>
</html>

