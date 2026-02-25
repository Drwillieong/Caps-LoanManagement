<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Co-Maker Notification</title>

    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            color: #333;
        }
        .email-container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
        }
        .header img {
            max-width: 250px;
        }
        h1 {
            font-size: 22px;
            color: #2c3e50;
            margin-bottom: 20px;
            text-align: center;
        }
        p {
            font-size: 16px;
            line-height: 1.6;
            color: #555;
            margin-bottom: 15px;
        }
        .info-box {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            border-left: 4px solid #3490dc;
            margin: 25px 0;
        }
        .btn-container {
            text-align: center;
            margin: 35px 0;
        }
        .btn {
            background-color: #3490dc;
            color: #fff;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            display: inline-block;
        }
        .footer {
            text-align: center;
            font-size: 13px;
            color: #999;
            margin-top: 40px;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
    </style>
</head>
<body>

<div class="email-container">

    <!-- HEADER -->
    <div class="header">
        <img src="{{ $message->embed(public_path('LEIMCO.png')) }}" alt="LEIMCO Logo">
    </div>

    <h1>Loan Co-Maker Notification</h1>

    <p>Hello {{ $comakerName }},</p>

    <p>
        You have been selected as a <strong>Co-Maker</strong> for a loan application.
        Please review the loan details below:
    </p>

    <div class="info-box">
        <p><strong>Borrower:</strong> {{ $borrowerName }}</p>
        <p><strong>Loan Type:</strong> {{ $loanType }}</p>
        <p><strong>Loan Amount:</strong> ₱{{ number_format($loanAmount, 2) }}</p>
    </div>

    <p>
        As a Co-Maker, you share responsibility should the borrower fail to meet
        their loan obligations. Please log in to your account to review or confirm
        this request.
    </p>

    <div class="btn-container">
        <a href="{{ url('/login') }}" class="btn">Login to Portal</a>
    </div>

    <p>This is an automated email. Please do not reply.</p>

    <div class="footer">
        &copy; {{ date('Y') }} LEIMCO. All rights reserved.
    </div>

</div>

</body>
</html>