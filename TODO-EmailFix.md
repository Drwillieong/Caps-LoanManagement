# Email Fix - Brevo SMTP Setup
Status: 🟡 In Progress

## Steps Completed ✅
- [x] Investigated error (Brevo auth failure due to unverified Gmail sender)
- [x] Added error handling to LoanController  
- [x] Added failover mailer config

## Steps Remaining 🔄
1. **Brevo Setup (Manual - User)**:
   ```
   1. Login to Brevo dashboard
   2. Verify sender: nyak123457@gmail.com OR add custom domain
   3. Get SMTP relay key: https://app-smtp.brevo.com/
   4. Update .env:
      MAIL_USERNAME=verified-brevo-sender@gmail.com
      MAIL_PASSWORD=xsmtpsib-[your-new-key]
   ```

2. **Clear Cache**:
   ```
   php artisan config:clear
   php artisan config:cache
   php artisan queue:restart
   ```

3. **Test**:
   ```
   1. Apply loan with co-maker
   2. Check co-maker email inbox
   3. Check logs: tail -f storage/logs/laravel.log
   ```

## Code Changes Applied:
- LoanController: Added try-catch around Mail::send()
- config/mail.php: Added 'failover' mailer (logs if SMTP fails)

**Next: User complete Brevo sender verification → test**
