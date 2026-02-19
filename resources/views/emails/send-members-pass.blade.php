<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to LEIMCO</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            color: #333333;
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
            border-bottom: 1px solid #eeeeee;
        }
        .header img {
            max-width: 150px;
            height: auto;
        }
        h1 {
            color: #2c3e50;
            font-size: 24px;
            margin-bottom: 20px;
            text-align: center;
        }
        p {
            color: #555555;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 15px;
        }
        .credentials {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin: 25px 0;
            border-left: 4px solid #3490dc;
        }
        .credentials p {
            margin: 8px 0;
            font-size: 16px;
        }
        .btn-container {
            text-align: center;
            margin: 35px 0;
        }
        .btn {
            background-color: #3490dc;
            color: #ffffff;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            display: inline-block;
        }
        .btn:hover {
            background-color: #2779bd;
        }
        .footer {
            text-align: center;
            font-size: 13px;
            color: #999999;
            margin-top: 40px;
            border-top: 1px solid #eeeeee;
            padding-top: 20px;
        }
    </style>
</head>
<body>
<<<<<<< HEAD
    <h1>Welcome to Our System</h1>
    <p>Your account has been created successfully.</p>
    <p><strong>Email:</strong> {{ $email }}</p>
    <p><strong>Password:</strong> {{ $password }}</p>
    <p>Please log in and change your password for security.</p>
    <p>Best regards,<br>Laguna Electronics Inc. Multi-Purpose Cooperative</p>
=======
    <div class="email-container">
        <!-- Logo -->
        <div class="header">
     <img src="{{ $LeimcoLogo }}" alt="LEIMCO Logo" style="max-width:150px;">


        </div>

        <!-- Greeting -->
        <h1>Welcome to LEIMCO!</h1>
      
        <p>Hello {{ $name ?? 'Member' }},</p>

        <!-- Main message -->
        <p>
            Your account has been successfully created. We are excited to have you on board.
            Below are your login credentials to access the system:
        </p>

        <!-- Credentials box -->
        <div class="credentials">
            <p><strong>Email:</strong> {{ $email }}</p>
            <p><strong>Password:</strong> {{ $password }}</p>
        </div>

        <p>
            For security reasons, please keep this information confidential. We recommend changing your password after your first login.
        </p>

        <div class="btn-container">
            <a href="{{ url('/login') }}" class="btn">Login to Portal</a>
        </div>

        <p>
            Thank you for joining <strong>LEIMCO</strong>! We look forward to serving you.
        </p>
         <p>
            This is an automated email. Please do not reply.
        </p>

        <!-- Footer -->
        <div class="footer">
            &copy; {{ date('Y') }} LEIMCO. All rights reserved.
        </div>
    </div>
>>>>>>> origin/main
</body>
</html>
