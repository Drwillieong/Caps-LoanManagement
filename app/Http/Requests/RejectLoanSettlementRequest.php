<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RejectLoanSettlementRequest extends FormRequest
{
    public function authorize(): bool
    {
        $settlementRequest = $this->route('settlementRequest');

        return $settlementRequest && $this->user()?->can('review', $settlementRequest);
    }

    public function rules(): array
    {
        return [
            'rejection_reason' => ['required', 'string', 'max:1000'],
        ];
    }
}
