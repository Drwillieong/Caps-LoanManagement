<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayrollUpload extends Model
{
    use HasFactory;

    protected $fillable = ['uploaded_by', 'original_file_name', 'stored_file_name', 'file_hash', 'cutoff_date', 'status', 'total_rows', 'processed_rows', 'failed_rows', 'duplicate_rows', 'paid_count', 'partial_count', 'missed_count', 'deferred_count', 'total_expected_amount', 'total_deducted_amount', 'remarks', 'error_message', 'started_at', 'finished_at'];

    protected function casts(): array
    {
        return [
            'cutoff_date' => 'date',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'total_expected_amount' => 'decimal:2',
            'total_deducted_amount' => 'decimal:2',
        ];
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function rows(): HasMany
    {
        return $this->hasMany(PayrollUploadRow::class);
    }
}
