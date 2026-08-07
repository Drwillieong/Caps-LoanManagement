<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Salary Deduction Update</title>
</head>
<body style="margin:0;background:#f6f7f9;color:#111827;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7f9;padding:24px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                    <tr>
                        <td style="padding:24px 28px;border-bottom:1px solid #e5e7eb;">
                            <h1 style="margin:0;font-size:20px;line-height:1.3;color:#111827;">Salary Deduction Update</h1>
                            <p style="margin:8px 0 0;font-size:14px;color:#6b7280;">Cutoff date: {{ $summary['cutoff_date'] }}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:28px;">
                            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hello {{ $summary['member_name'] }},</p>
                            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
                                We processed your recent salary deduction for your {{ $summary['loan_name'] }}.
                                Below is the summary posted to your loan account.
                            </p>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;">
                                <tr>
                                    <td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #eef0f3;">Amount deducted</td>
                                    <td align="right" style="padding:10px 0;border-bottom:1px solid #eef0f3;font-weight:600;">PHP {{ number_format($summary['deducted_amount'], 2) }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #eef0f3;">Expected deduction</td>
                                    <td align="right" style="padding:10px 0;border-bottom:1px solid #eef0f3;font-weight:600;">PHP {{ number_format($summary['expected_amount'], 2) }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #eef0f3;">Deduction status</td>
                                    <td align="right" style="padding:10px 0;border-bottom:1px solid #eef0f3;font-weight:600;">{{ $summary['status'] }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:10px 0;color:#6b7280;">Remaining loan balance</td>
                                    <td align="right" style="padding:10px 0;font-weight:600;">PHP {{ number_format($summary['remaining_balance'], 2) }}</td>
                                </tr>
                            </table>

                            <p style="margin:22px 0 0;font-size:14px;line-height:1.6;color:#6b7280;">
                                If you have questions about this deduction, please contact the office for assistance.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
