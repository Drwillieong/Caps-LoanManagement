<?php

namespace App\Console\Commands;

use App\Models\Loan;
use App\Models\LoanCoMaker;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AutoRejectExpiredLoans extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'loans:auto-reject-expired
                            {--hours=48 : Number of hours a co-maker request may stay pending before expiring}
                            {--dry-run : List the requests that would be expired without updating them}';

    /**
     * The console command description.
     */
    protected $description = 'Automatically expire co-maker requests that have been pending longer than the allowed window.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $hours = (int) $this->option('hours');
        $dryRun = (bool) $this->option('dry-run');

        $threshold = now()->subHours($hours);

        $query = LoanCoMaker::query()
            ->where('status', 'pending')
            ->where('created_at', '<=', $threshold)
            ->whereHas('loan', function ($query) {
                $query->where('status', Loan::STATUS_AWAITING_COMAKER);
            });

        if ($dryRun) {
            $count = $query->count();
            $this->info("{$count} co-maker request(s) older than {$hours}h would be marked as expired.");

            $query->with('loan:id,status')->eachById(function (LoanCoMaker $coMaker) {
                $this->line("  - LoanCoMaker #{$coMaker->id} (loan #{$coMaker->loan_id}) created at {$coMaker->created_at}");
            });

            return self::SUCCESS;
        }

        $expired = $query->get();

        if ($expired->isEmpty()) {
            $this->info('No expired co-maker requests found.');

            return self::SUCCESS;
        }

        $count = DB::transaction(function () use ($expired) {
            $now = now();

            return LoanCoMaker::whereIn('id', $expired->pluck('id')->all())
                ->update([
                    'status' => 'expired',
                    'responded_at' => $now,
                ]);
        });

        $this->info("Marked {$count} co-maker request(s) as expired (older than {$hours}h).");

        return self::SUCCESS;
    }
}
