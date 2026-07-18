<?php

namespace App\Http\Requests\Settings;

use App\Concerns\ProfileValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProfileUpdateRequest extends FormRequest
{
    use ProfileValidationRules;

    protected function prepareForValidation(): void
    {
        if ($this->filled('name') && (! $this->filled('first_name') || ! $this->filled('last_name'))) {
            $parts = preg_split('/\s+/', trim((string) $this->input('name'))) ?: [];
            $firstName = array_shift($parts) ?: (string) $this->input('name');

            $this->merge([
                'first_name' => $firstName,
                'last_name' => implode(' ', $parts) ?: $firstName,
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->profileRules($this->user()->id);
    }
}
