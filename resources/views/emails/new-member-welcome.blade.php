<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to LEIMCO</title>
</head>
<body style="margin: 0; padding: 24px; background: #f3f4f6; font-family: Arial, sans-serif; color: #111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; overflow: hidden; border-radius: 12px; background: #ffffff;">
                    <tr>
                        <td style="padding: 32px 40px; border-bottom: 1px solid #e5e7eb;">
                            <h1 style="margin: 0; color: #047857; font-size: 24px;">Welcome to LEIMCO</h1>
                            <p style="margin: 8px 0 0; color: #4b5563; font-size: 14px;">
                                Your member portal account has been created.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 32px 40px;">
                            <p style="margin: 0 0 16px; font-size: 16px;">
                                Dear {{ $user->name ?: 'Member' }},
                            </p>

                            <p style="margin: 0 0 24px; color: #374151; line-height: 1.6;">
                                You can now sign in to the LEIMCO loan management portal using the credentials below.
                            </p>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; border: 1px solid #d1fae5; border-radius: 10px; background: #ecfdf5;">
                                <tr>
                                    <td style="padding: 18px 20px;">
                                        <p style="margin: 0 0 6px; color: #065f46; font-size: 12px; font-weight: 700; text-transform: uppercase;">Email Address</p>
                                        <p style="margin: 0 0 18px; color: #111827; font-family: Consolas, monospace; font-size: 15px;">{{ $user->email }}</p>

                                        <p style="margin: 0 0 6px; color: #065f46; font-size: 12px; font-weight: 700; text-transform: uppercase;">Temporary Password</p>
                                        <p style="margin: 0; color: #111827; font-family: Consolas, monospace; font-size: 15px;">{{ $temporaryPassword }}</p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0 0 24px; color: #92400e; line-height: 1.6;">
                                For your security, please change this temporary password immediately after your first login.
                            </p>

                            <p style="margin: 0 0 24px;">
                                <a href="{{ url('/login') }}" style="display: inline-block; border-radius: 8px; background: #047857; padding: 12px 20px; color: #ffffff; font-weight: 700; text-decoration: none;">
                                    Login to Portal
                                </a>
                            </p>

                            <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                                This is an automated message. If you did not expect this account, please contact LEIMCO support.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 40px; border-top: 1px solid #e5e7eb; background: #f9fafb;">
                            <p style="margin: 0; color: #6b7280; font-size: 12px;">
                                Copyright {{ date('Y') }} LEIMCO - Lending & Investment Cooperative. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
