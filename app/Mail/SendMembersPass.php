<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SendMembersPass extends Mailable
{
    use Queueable, SerializesModels;

    public $email;
    public $password;
    public $name;

    public function __construct($email, $password, $name = null)
    {
        $this->email = $email;
        $this->password = $password;
        $this->name = $name;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Account Credentials',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.send-members-pass',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
