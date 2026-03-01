<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset OTP</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
        .wrapper { max-width: 480px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #7c3aed, #db2777); padding: 32px 24px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px; }
        .body { padding: 32px 24px; }
        .greeting { color: #1a1a2e; font-size: 16px; margin-bottom: 16px; }
        .desc { color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
        .otp-box { background: #f8f4ff; border: 2px dashed #7c3aed; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px; }
        .otp-label { color: #7c3aed; font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
        .otp-code { font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #1a1a2e; font-family: 'Courier New', monospace; }
        .expiry { color: #db2777; font-size: 13px; margin-top: 10px; font-weight: 600; }
        .warning { background: #fff8e1; border-left: 4px solid #f59e0b; border-radius: 4px; padding: 12px 16px; margin-bottom: 24px; }
        .warning p { color: #92400e; font-size: 13px; margin: 0; line-height: 1.5; }
        .footer { background: #f4f4f7; padding: 20px 24px; text-align: center; }
        .footer p { color: #999; font-size: 12px; margin: 0; line-height: 1.6; }
        .brand { color: #7c3aed; font-weight: 700; text-decoration: none; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>VeiNovel</h1>
            <p>Password Reset Request</p>
        </div>
        <div class="body">
            <p class="greeting">Hi {{ $userName }},</p>
            <p class="desc">
                We received a request to reset your password. Use the OTP code below to continue.
                This code is valid for <strong>10 minutes</strong>.
            </p>

            <div class="otp-box">
                <div class="otp-label">Your OTP Code</div>
                <div class="otp-code">{{ $otp }}</div>
                <div class="expiry">⏱ Expires in 10 minutes</div>
            </div>

            <div class="warning">
                <p>
                    🔒 If you did not request a password reset, please ignore this email.
                    Your account remains secure and no changes have been made.
                </p>
            </div>

            <p class="desc" style="margin-bottom: 0;">
                Do not share this code with anyone. VeiNovel will never ask for your OTP via chat or support.
            </p>
        </div>
        <div class="footer">
            <p>
                This email was sent from <a href="https://veinovel.com" class="brand">VeiNovel</a><br>
                © {{ date('Y') }} VeiNovel. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
