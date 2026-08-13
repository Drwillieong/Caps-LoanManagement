<?php

namespace App\Mail;

use App\Models\PayrollUploadRow;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PayrollDeductionNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public PayrollUploadRow $payrollRow,
        public array $summary,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Salary Deduction Update - '.$this->summary['cutoff_date'],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payroll-deduction-notification',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
