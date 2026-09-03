<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanCoMaker extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (LoanCoMaker $coMaker) {
            if (empty($coMaker->expires_at)) {
                $coMaker->expires_at = now()->addHours(Loan::COMAKER_EXPIRATION_HOURS);
            }
        });
    }

    public const STATUS_PENDING = 'pending';
    public const STATUS_EXPIRED = 'expired';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['loan_id', 'user_id', 'status', 'responded_at'];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'responded_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    /**
     * Get the loan that owns the co-maker.
     */
    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    /**
     * Get the user that is the co-maker.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope a query to only include pending co-maker requests that have expired.
     */
    public function scopeExpiredPending($query, ?int $hours = null)
    {
        $threshold = now()->subHours($hours ?? Loan::COMAKER_EXPIRATION_HOURS);

        return $query
            ->where('status', self::STATUS_PENDING)
            ->where('created_at', '<=', $threshold);
    }

    /**
     * Whether the co-maker request is still awaiting a response and within its window.
     */
    public function isExpired(): bool
    {
        return $this->status === self::STATUS_EXPIRED
            || ($this->status === self::STATUS_PENDING
                && $this->expires_at !== null
                && $this->expires_at->isPast());
    }

    /**
     * Compute (or return) the expiration timestamp for this request.
     */
    public function getExpiresAtAttribute($value)
    {
        if ($value) {
            return $value;
        }

        return $this->created_at?->copy()->addHours(Loan::COMAKER_EXPIRATION_HOURS);
    }
}

