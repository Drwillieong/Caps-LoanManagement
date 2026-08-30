<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLoanSettlementRequest extends FormRequest
{
    public function authorize(): bool
    {
        $loan = $this->route('loan');

        return $loan && $this->user()?->can('create', [\App\Models\LoanSettlementRequest::class, $loan]);
    }

    public function rules(): array
    {
        return [
            'confirm' => ['accepted'],
        ];
    }
}
