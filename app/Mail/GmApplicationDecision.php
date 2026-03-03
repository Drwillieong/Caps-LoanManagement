<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class GmApplicationDecision extends Mailable
{
    use Queueable, SerializesModels;

    public string $borrowerName;
    public string $loanType;
    public string $applicationDate;
    public int $terms;
    public float|int $loanAmount;
    public float|int $interestAmount;
    public float|int $monthlyPayment;
    public float|int $totalAmountDue;
    public string $decision; // 'approved' | 'rejected'
    public ?string $remarks;

    public function __construct(
        string $borrowerName,
        string $loanType,
        string $applicationDate,
        int $terms,
        float|int $loanAmount,
        float|int $interestAmount,
        float|int $monthlyPayment,
        float|int $totalAmountDue,
        string $decision,
        ?string $remarks = null
    ) {
        $this->borrowerName = $borrowerName;
        $this->loanType = $loanType;
        $this->applicationDate = $applicationDate;
        $this->terms = $terms;
        $this->loanAmount = $loanAmount;
        $this->interestAmount = $interestAmount;
        $this->monthlyPayment = $monthlyPayment;
        $this->totalAmountDue = $totalAmountDue;
        $this->decision = $decision;
        $this->remarks = $remarks;
    }

    public function envelope(): Envelope
    {
        $subject = $this->decision === 'approved'
            ? 'Loan Application Approved – For Check Voucher Processing'
            : 'Loan Application Decision Update';

        return new Envelope(
            subject: $subject
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.gm-application.decision',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}