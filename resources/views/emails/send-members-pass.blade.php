<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Welcome to LEIMCO</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }

        .email-container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            padding: 40px;
            border-radius: 8px;
        }

        .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 1px solid #eeeeee;
            margin-bottom: 30px;
        }

        .header img {
            max-width: 150px;
            height: auto;
        }

        h1 {
            color: #2c3e50;
            text-align: center;
        }

        p {
            font-size: 15px;
            line-height: 1.6;
            color: #555;
        }

        .credentials {
            background: #f8f9fa;
            padding: 20px;
            border-left: 4px solid #3490dc;
            margin: 25px 0;
            border-radius: 6px;
        }

        .btn-container {
            text-align: center;
            margin: 30px 0;
        }

        .btn {
            background: #3490dc;
            color: #ffffff;
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
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>

<div class="email-container">

    <!-- HEADER LOGO -->
    <div class="header">
        <img src="{{ asset('LEIMCO.png') }}" alt="LEIMCO Logo">
    </div>

    <h1>Welcome to LEIMCO!</h1>

    <p>Hello {{ $name }},</p>

    <p>
        Your account has been successfully created. Below are your login credentials:
    </p>

    <div class="credentials">
        <p><strong>Email:</strong> {{ $email }}</p>
        <p><strong>Password:</strong> {{ $password }}</p>
    </div>

    <p>
        For security reasons, please change your password after your first login.
    </p>

    <div class="btn-container">
        <a href="{{ url('/login') }}" class="btn">Login to Portal</a>
    </div>

    <p>
        Thank you for joining <strong>LEIMCO</strong>. We look forward to serving you.
    </p>

    <p>This is an automated email. Please do not reply.</p>

    <div class="footer">
        &copy; {{ date('Y') }} LEIMCO. All rights reserved.
    </div>

</div>

</body>
</html>
