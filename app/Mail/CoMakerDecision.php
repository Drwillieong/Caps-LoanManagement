<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CoMakerDecision extends Mailable
{
    use Queueable, SerializesModels;

    public string $borrowerName;
    public string $borrowerEmail;
    public string $coMakerName;
    public string $decision;
    public string $loanType;
    public float|int $loanAmount;
    public string $applicationDate;
    public int $terms;
    public float|int $interestAmount;
    public float|int $monthlyPayment;
    public float|int $totalAmountDue;

    public function __construct(
        string $borrowerName,
        string $borrowerEmail,
        string $coMakerName,
        string $decision, // accepted | rejected
        string $loanType,
        float|int $loanAmount,
        string $applicationDate,
        int $terms,
        float|int $interestAmount,
        float|int $monthlyPayment,
        float|int $totalAmountDue
    ) {
        $this->borrowerName = $borrowerName;
        $this->borrowerEmail = $borrowerEmail;
        $this->coMakerName = $coMakerName;
        $this->decision = $decision;
        $this->loanType = $loanType;
        $this->loanAmount = $loanAmount;
        $this->applicationDate = $applicationDate;
        $this->terms = $terms;
        $this->interestAmount = $interestAmount;
        $this->monthlyPayment = $monthlyPayment;
        $this->totalAmountDue = $totalAmountDue;
    }

    public function envelope(): Envelope
    {
        $decisionText = $this->decision === 'accepted' ? 'Approved' : 'Declined';
        return new Envelope(
            subject: "Your Loan Application - Co-Maker {$decisionText}"
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.co-maker-decision',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
