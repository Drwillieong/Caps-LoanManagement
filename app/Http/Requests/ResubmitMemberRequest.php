<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ResubmitMemberRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, \Illuminate\Contracts\Validation\Rule|array<mixed>|string>>
     */
    public function rules(): array
    {
        $userId = $this->route('user');

        return [
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            // Ignore the current user's ID so the rejected member's own email
            // does not trigger the "Email has already been taken" error.
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique('users')->ignore($userId),
            ],

            // Personal fields
            'place_of_birth' => 'required|string|max:255',
            'date_of_birth' => 'required|date|before:today',
            'civil_status' => 'required|in:single,married,widowed',
            'sex' => 'required|in:male,female',
            'educational_attainment' => 'required|string|max:255',

            // Contact and address fields
            'permanent_address' => 'required|string|max:1000',
            'permanent_zip_code' => 'required|string|max:20',
            'permanent_mobile_number' => 'required|string|max:20',
            'present_address' => 'required|string|max:1000',
            'present_zip_code' => 'required|string|max:20',
            'mobile_number' => 'required|string|max:20',

            // Employment fields
            'position' => 'required|string|max:255',
            'basic_salary' => 'required|numeric|min:10000',
            'income_type' => 'required|in:monthly,daily,yearly',
            'net_income' => 'required|numeric|min:10000',
            'share_capital_balance' => 'required|numeric|min:10000',
            'other_source_of_income' => 'nullable|string|max:255',
            'facebook_account_name' => 'nullable|string|max:255',
            'spouse_occupation' => 'nullable|string|max:255',
            'spouse_gross_income' => 'nullable|numeric|min:0',
            'spouse_income_type' => 'required_with:spouse_occupation|in:monthly,daily,yearly',
            'spouse_net_income' => 'nullable|numeric|min:0',
            'legal_beneficiary_1_name' => 'nullable|string|max:255',
            'real_properties_owned' => 'nullable|string|max:2000',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'basic_salary.min' => 'Income (Gross) must be at least 10,000.',
            'share_capital_balance.min' => 'Share capital balance must be at least 10,000.',
            'spouse_income_type.required_with' => 'Spouse Income Type is required when Spouse Occupation is provided.',
        ];
    }
}
