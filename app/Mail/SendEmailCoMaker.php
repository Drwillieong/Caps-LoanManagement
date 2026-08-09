<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SendEmailCoMaker extends Mailable
{
    use Queueable, SerializesModels;

    public $comakerName;
    public $borrowerName;
    public $loanType;
    public $loanAmount;
    public $borrower;
    public $loan;

    public function __construct(
        string $comakerName,
        string $borrowerName,
        string $loanType,
        float|int $loanAmount,
        $borrower = null,
        $loan = null
    ) {
        $this->comakerName = $comakerName;
        $this->borrowerName = $borrowerName;
        $this->loanType = $loanType;
        $this->loanAmount = $loanAmount;
        $this->borrower = $borrower;
        $this->loan = $loan;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'You Have Been Selected as a Loan Co-Maker',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.send-email-comaker',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}