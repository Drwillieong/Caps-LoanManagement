<?php

use App\Mail\GmApplicationDecision;
use App\Models\Loan;
use Illuminate\Support\Facades\Mail;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$l = Loan::whereNotNull('loan_type_id')->whereHas('user')->latest()->first();
if (! $l) {
    echo "no pending loan\n";
    exit;
}
$u = $l->user;
try {
    Mail::to($u->email)->send(new GmApplicationDecision(
        $u->name,
        $l->loanType->name ?? 'N/A',
        $l->created_at->format('F d, Y'),
        (int) $l->terms_months,
        (float) $l->principal_amount,
        (float) $l->interest_amount,
        (float) $l->monthly_amortization,
        (float) $l->total_amount_due,
        'approved',
        null
    ));
    echo 'SENT OK to '.$u->email."\n";
} catch (\Throwable $e) {
    echo 'ERROR: '.$e->getMessage()."\n";
}
