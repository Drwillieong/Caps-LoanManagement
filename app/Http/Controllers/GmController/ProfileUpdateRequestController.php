<?php

namespace App\Http\Controllers\GmController;

use App\Http\Controllers\Controller;
use App\Models\MemberProfile;
use App\Models\ProfileUpdateRequest;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProfileUpdateRequestController extends Controller
{
    /**
     * Fields that are allowed/comparable in the profile update diff.
     * Must match the DISPLAY_FIELDS keys in PendingEdits.tsx.
     */
    private const COMPARABLE_FIELDS = [
        'first_name', 'middle_name', 'last_name', 'date_of_birth', 'sex',
        'civil_status', 'place_of_birth', 'educational_attainment',
        'mobile_number', 'permanent_mobile_number',
        'present_address', 'present_zip_code', 'permanent_address', 'permanent_zip_code',
        'position', 'basic_salary', 'income_type', 'net_income',
        'share_capital_balance', 'other_source_of_income', 
        'facebook_account_name',
        'spouse_occupation', 'spouse_gross_income', 'spouse_income_type', 'spouse_net_income',
        'legal_beneficiary_1_name', 'real_properties_owned',
    ];

    /**
     * Fields stored on the linked users table that may be changed via profile edits.
     */
    private const USER_FIELDS = [
        'email',
    ];

    /**
     * Fields that are currency/numeric — normalize to clean float for comparison.
     */
    private const CURRENCY_FIELDS = [
        'basic_salary', 'net_income', 'share_capital_balance',
        'gross_income', 'capital_build_up',
        'spouse_gross_income', 'spouse_net_income',
        'monthly_amortization',
    ];

    private const IMMUTABLE_FIELDS = [
        'employee_id', 'id', 'user_id', 'created_at', 'updated_at',
    ];

    /**
     * Normalize a value for diff comparison:
     * - null / empty / '—' → null
     * - currency fields → float (strip commas, ₱, etc.)
     * - other → trimmed string
     */
    private function normalizeDiffValue(string $key, mixed $value): mixed
    {
        // Treat null, empty string, or em-dash as null
        if (is_null($value) || $value === '' || $value === '—' || $value === '–' || $value === '-') {
            return null;
        }

        // Currency fields: strip formatting and cast to float with 2 decimals
        if (in_array($key, self::CURRENCY_FIELDS)) {
            // Remove ₱, commas, spaces, any non-numeric chars except dot and minus
            $cleaned = preg_replace('/[^0-9.\-]/', '', (string) $value);
            return round((float) $cleaned, 2);
        }

        return trim((string) $value);
    }

    private function normalizeBeneficiaries(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        return collect($value)
            ->map(fn ($beneficiary) => [
                'full_name' => trim((string) ($beneficiary['full_name'] ?? '')),
                'relationship' => trim((string) ($beneficiary['relationship'] ?? '')),
                'date_of_birth' => trim((string) ($beneficiary['date_of_birth'] ?? '')),
            ])
            ->filter(fn ($beneficiary) => $beneficiary['full_name'] !== '' || $beneficiary['relationship'] !== '' || $beneficiary['date_of_birth'] !== '')
            ->values()
            ->all();
    }

    /**
     * HR: Submit a pending profile update request.
     * Stores the original data (snapshot) and ONLY the truly changed pending edits.
     */
    public function store(Request $request)
    {
        $memberId = (string) $request->input('member_id');
        $memberProfile = MemberProfile::with(['user', 'beneficiaries'])->findOrFail($memberId);
        $memberUserId = $memberProfile->user?->id;

        $validated = $request->validate([
            'member_id' => 'required|string|exists:member_profiles,employee_id',
            'pending_data' => 'required|array',
        ]);

        $validatedPendingData = validator($request->input('pending_data', []), [
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($memberUserId),
            ],
            'first_name' => 'nullable|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'place_of_birth' => 'nullable|string|max:255',
            'date_of_birth' => 'nullable|date|before:today',
            'sex' => 'nullable|in:male,female',
            'civil_status' => 'nullable|in:single,married,widowed,separated',
            'educational_attainment' => 'nullable|string|max:255',
            'mobile_number' => 'nullable|string|max:20',
            'permanent_mobile_number' => 'nullable|string|max:20',
            'present_address' => 'nullable|string|max:2000',
            'present_zip_code' => 'nullable|string|max:20',
            'permanent_address' => 'nullable|string|max:2000',
            'permanent_zip_code' => 'nullable|string|max:20',
            'position' => 'nullable|string|max:255',
            'basic_salary' => 'nullable|numeric|min:10000',
            'income_type' => 'nullable|in:monthly,daily,yearly',
            'net_income' => 'nullable|numeric|min:10000',
            'share_capital_balance' => 'nullable|numeric|min:10000',
            'other_source_of_income' => 'nullable|string|max:255',
            'facebook_account_name' => 'nullable|string|max:255',
            'spouse_occupation' => 'nullable|string|max:255',
            'spouse_gross_income' => 'required_with:spouse_occupation|nullable|numeric|min:0',
            'spouse_income_type' => 'required_with:spouse_occupation|nullable|in:monthly,daily,yearly',
            'spouse_net_income' => 'required_with:spouse_occupation|nullable|numeric|min:0',
            'real_properties_owned' => 'nullable|string|max:2000',
            'beneficiaries' => 'nullable|array',
            'beneficiaries.*.full_name' => 'nullable|string|max:255',
            'beneficiaries.*.relationship' => 'nullable|string|max:255',
            'beneficiaries.*.date_of_birth' => 'nullable|date|before:today',
        ])->validate();

        // Check if there's already a pending update request for this member
        $existingPending = ProfileUpdateRequest::where('member_id', $validated['member_id'])
            ->where('status', 'pending')
            ->exists();

        if ($existingPending) {
            return redirect()->route('users')
                ->with('error', 'An update request for this profile is already awaiting GM approval.');
        }

        $originalData = $memberProfile->toArray();
        $originalData['beneficiaries'] = $this->normalizeBeneficiaries($memberProfile->beneficiaries->toArray());

        // Remove relationships and timestamps from original data snapshot
        unset($originalData['user'], $originalData['deduction_records']);

        // Ensure mobile_number and legal_beneficiary_1_name are present in pending_data
        // so they don't cause false-positives when compared.
        $pendingData = $validatedPendingData;
        foreach (self::IMMUTABLE_FIELDS as $field) {
            unset($pendingData[$field]);
        }

        $originalUser = $memberProfile->user?->toArray() ?? [];

        if (!array_key_exists('mobile_number', $pendingData)) {
            $pendingData['mobile_number'] = $originalData['mobile_number'] ?? null;
        }
        if (!array_key_exists('legal_beneficiary_1_name', $pendingData)) {
            $pendingData['legal_beneficiary_1_name'] = $originalData['legal_beneficiary_1_name'] ?? null;
        }

        // Filter pending_data to ONLY include fields that actually changed
        // This prevents unchanged fields (with formatting differences) from appearing as diffs
        $filteredPending = [];
        foreach (array_merge(self::COMPARABLE_FIELDS, self::USER_FIELDS) as $field) {
            $source = in_array($field, self::USER_FIELDS, true) ? $originalUser : $originalData;
            $origVal = $this->normalizeDiffValue($field, $source[$field] ?? null);
            $pendVal = $this->normalizeDiffValue($field, $pendingData[$field] ?? null);

            // If both are null/empty after normalization — skip
            if (is_null($origVal) && is_null($pendVal)) {
                continue;
            }

            // Only include if actually different
            if ($origVal !== $pendVal) {
                $filteredPending[$field] = $pendingData[$field];
            }
        }

        // Also include non-comparable fields the user might need (e.g. profile_picture)
        // that are part of the fillable member profile but not in our diff display
        foreach ($pendingData as $key => $value) {
            if (
                !in_array($key, self::COMPARABLE_FIELDS)
                && !in_array($key, self::USER_FIELDS)
                && !in_array($key, self::IMMUTABLE_FIELDS)
                && !is_null($value)
                && $value !== ''
                && $key !== 'beneficiaries'
            ) {
                $filteredPending[$key] = $value;
            }
        }

        if (array_key_exists('beneficiaries', $pendingData)) {
            $originalBeneficiaries = $this->normalizeBeneficiaries($originalData['beneficiaries'] ?? []);
            $pendingBeneficiaries = $this->normalizeBeneficiaries($pendingData['beneficiaries']);

            if ($originalBeneficiaries !== $pendingBeneficiaries) {
                $filteredPending['beneficiaries'] = $pendingBeneficiaries;
            }
        }

        if (empty($filteredPending)) {
            return redirect()->back()
                ->with('error', 'No profile changes were detected.');
        }

        // Create the pending update request with only the changed data
        // Store original_data as-is (full snapshot), pending_data as filtered changed fields
        $updateRequest = ProfileUpdateRequest::create([
            'member_id' => $validated['member_id'],
            'request_type' => 'profile_update',
            'requested_by' => Auth::id(),
            'original_data' => $originalData,
            'pending_data' => $filteredPending,
            'status' => 'pending',
        ]);

        app(ActivityLogService::class)->logActivity(
            'profile_update_requested',
            null,
            'HR requested profile update for member ID #'.$validated['member_id'].'.'
        );

        return redirect()->route('users')
            ->with('success', 'Profile update request submitted successfully and is awaiting GM approval.');
    }

    public function requestStatusChange(Request $request, string $employeeId)
    {
        $memberProfile = MemberProfile::with('user')->findOrFail($employeeId);

        $validated = $request->validate([
            'proposed_status' => 'required|string|in:active,inactive',
            // A reason is mandatory when HR requests a deactivation (inactive).
            'reason' => [
                $request->input('proposed_status') === 'inactive' ? 'required' : 'nullable',
                'string',
                'max:2000',
            ],
        ]);

        if ($memberProfile->account_status === $validated['proposed_status']) {
            return redirect()->route('users')
                ->with('error', 'This member account is already '.$validated['proposed_status'].'.');
        }

        $existingPending = ProfileUpdateRequest::where('member_id', $employeeId)
            ->where('status', 'pending')
            ->exists();

        if ($existingPending) {
            return redirect()->route('users')
                ->with('error', 'A request for this member is already awaiting GM approval.');
        }

        ProfileUpdateRequest::create([
            'member_id' => $employeeId,
            'request_type' => 'status_change',
            'proposed_status' => $validated['proposed_status'],
            'reason' => $validated['reason'] ?? null,
            'requested_by' => Auth::id(),
            'original_data' => [
                'account_status' => $memberProfile->account_status ?? 'active',
            ],
            'pending_data' => [
                'account_status' => $validated['proposed_status'],
            ],
            'status' => 'pending',
        ]);

        app(ActivityLogService::class)->logActivity(
            'member_status_change_requested',
            null,
            'HR requested account status change for member ID #'.$employeeId.' to '.$validated['proposed_status'].'.'
        );

        return redirect()->route('users')
            ->with('success', 'Account status change request submitted and is awaiting GM approval.');
    }

    /**
     * GM: Fetch all pending profile update requests with member and requester info.
     */
    public function index()
    {
        $pendingRequests = ProfileUpdateRequest::with([
            'member.user',
            'requester',
        ])
        ->where('status', 'pending')
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($request) {
            $member = $request->member;
            $memberUser = $member?->user;

            return [
                'id' => $request->id,
                'member_id' => $request->member_id,
                'member_name' => $memberUser ? trim($memberUser->first_name.' '.($memberUser->middle_name ? $memberUser->middle_name.' ' : '').$memberUser->last_name) : 'Unknown',
                'member_email' => $memberUser?->email ?? 'Unknown',
                'requested_by_name' => $request->requester?->name ?? 'Unknown',
                'requested_by_email' => $request->requester?->email ?? 'Unknown',
                'request_type' => $request->request_type ?? 'profile_update',
                'proposed_status' => $request->proposed_status,
                'reason' => $request->reason,
                'original_data' => $request->original_data,
                'pending_data' => $request->pending_data,
                'status' => $request->status,
                'created_at' => $request->created_at->toIso8601String(),
            ];
        });

        return Inertia::render('dashboards/Gm/PendingEdits', [
            'pendingEdits' => $pendingRequests,
        ]);
    }

    /**
     * GM: Get pending profile edit requests count (for badge/dashboard).
     */
    public function pendingCount()
    {
        $count = ProfileUpdateRequest::where('status', 'pending')->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Sanitize pending data values before model update to prevent
     * Laravel 12 / PHP 8.4 MathException from strict decimal casting.
     *
     * - null / '' / '—' / '–' / '-' → null
     * - Currency/decimal fields: strip ₱, commas, non-numeric chars, cast to float
     * - Other fields: trimmed string or left as-is
     */
    private function sanitizeForModelUpdate(array $pendingData, MemberProfile $memberProfile): array
    {
        // Decimal/currency fields on MemberProfile that need numeric sanitization
        $decimalFields = [
            'basic_salary',
            'net_income',
            'gross_income',
            'share_capital_balance',
            'capital_build_up',
            'spouse_gross_income',
            'spouse_net_income',
            'monthly_amortization',
        ];

        $sanitized = [];

        foreach ($pendingData as $field => $value) {
            // 1. Convert empty strings, dashes, or null to null
            if ($value === '' || $value === '—' || $value === '–' || $value === '-' || $value === null) {
                $sanitized[$field] = null;
                continue;
            }

            // 2. Sanitize decimal/currency fields
            if (in_array($field, $decimalFields)) {
                if (is_numeric($value)) {
                    $sanitized[$field] = (float) $value;
                } else {
                    // Strip out currency symbols, commas, spaces — keep only digits, dot, minus
                    $cleaned = preg_replace('/[^\d.]/', '', str_replace(',', '', (string) $value));
                    $sanitized[$field] = $cleaned !== '' ? (float) $cleaned : null;
                }
                continue;
            }

            // 3. All other fields — keep original value (trim if string)
            $sanitized[$field] = is_string($value) ? trim($value) : $value;
        }

        return $sanitized;
    }

    private function notifyHr(ProfileUpdateRequest $updateRequest, string $decision, ?string $reason = null): void
    {
        $memberName = $updateRequest->member?->user?->name ?? 'member ID #'.$updateRequest->member_id;
        $requestLabel = $updateRequest->request_type === 'status_change'
            ? 'account '.($updateRequest->proposed_status === 'inactive' ? 'inactivation' : 'activation').' request'
            : 'member detail update request';
        $title = 'GM '.($decision === 'approved' ? 'Approved ' : 'Rejected ').ucfirst($requestLabel);
        $message = 'GM '.$decision.' the '.$requestLabel.' for '.$memberName.' (request #'.$updateRequest->id.').';

        if ($reason) {
            $message .= ' Reason: '.$reason;
        }

        $notificationService = app(NotificationService::class);

        User::query()
            ->where('role', 'hr')
            ->each(fn (User $hrUser) => $notificationService->createNotification(
                $hrUser,
                $title,
                $message,
                'gm_profile_decision',
                $updateRequest->id,
                ProfileUpdateRequest::class
            ));
    }

    /**
     * GM: Approve a profile update request.
     * Merges pending_data into the member_profiles table.
     */
    public function approve($id)
    {
        $updateRequest = ProfileUpdateRequest::with('member')->findOrFail($id);

        if ($updateRequest->status !== 'pending') {
            return redirect()->route('gm.pending-edits')
                ->with('error', 'This update request has already been '.$updateRequest->status.'.');
        }

        $memberProfile = $updateRequest->member;

        if (! $memberProfile) {
            return redirect()->route('gm.pending-edits')
                ->with('error', 'Member profile not found.');
        }

        if ($updateRequest->request_type === 'status_change') {
            $proposedStatus = $updateRequest->proposed_status;

            $memberProfile->update([
                'account_status' => $proposedStatus,
            ]);

            $memberProfile->user?->update([
                'status' => 'active',
                'is_active' => $proposedStatus === 'active',
            ]);

            $updateRequest->update([
                'status' => 'approved',
                'rejection_reason' => null,
                'reviewed_by' => Auth::id(),
            ]);

            app(ActivityLogService::class)->logActivity(
                'member_status_change_approved',
                null,
                'GM approved account status change request #'.$updateRequest->id.' for member ID #'.$updateRequest->member_id.' to '.$proposedStatus.'.'
            );

            $this->notifyHr($updateRequest->load('member.user'), 'approved');

            return redirect()->route('gm.pending-edits')
                ->with('success', 'Account status change request approved successfully.');
        }

        // Fallback: explicitly update account_status/status if present in pending_data
        // regardless of request_type, to ensure status changes are always applied.
        $rawPendingDataForStatus = $updateRequest->pending_data ?? [];
        if (is_string($rawPendingDataForStatus)) {
            $rawPendingDataForStatus = json_decode($rawPendingDataForStatus, true) ?: [];
        }

        if (isset($rawPendingDataForStatus['account_status']) || isset($rawPendingDataForStatus['status'])) {
            if (isset($rawPendingDataForStatus['account_status'])) {
                $memberProfile->update([
                    'account_status' => $rawPendingDataForStatus['account_status'],
                ]);
            } elseif (isset($rawPendingDataForStatus['status'])) {
                $memberProfile->update([
                    'status' => $rawPendingDataForStatus['status'],
                ]);
            }
        }

        // Extract the pending data fields that are fillable on MemberProfile
        $rawPendingData = $updateRequest->pending_data ?? [];
        if (is_string($rawPendingData)) {
            $rawPendingData = json_decode($rawPendingData, true) ?: [];
        }

        foreach (self::IMMUTABLE_FIELDS as $field) {
            unset($rawPendingData[$field]);
        }

        $pendingData = collect($rawPendingData)
            ->only($memberProfile->getFillable())
            ->toArray();
        foreach (self::IMMUTABLE_FIELDS as $field) {
            unset($pendingData[$field]);
        }

        // Sanitize values before model update to prevent MathException
        // from Laravel 12's strict decimal casting on formatted currency strings.
        $pendingData = $this->sanitizeForModelUpdate($pendingData, $memberProfile);

        // Update the member profile with the sanitized changes
        $memberProfile->update($pendingData);

        // Apply any user-account field changes (e.g. email)
        $userData = collect($rawPendingData)
            ->only(self::USER_FIELDS)
            ->filter(fn ($value) => ! is_null($value) && $value !== '')
            ->toArray();

        if (! empty($userData) && $memberProfile->user) {
            $memberProfile->user->update($userData);
        }

        if (isset($rawPendingData['beneficiaries']) && is_array($rawPendingData['beneficiaries'])) {
            $memberProfile->beneficiaries()->delete();

            foreach ($this->normalizeBeneficiaries($rawPendingData['beneficiaries']) as $beneficiary) {
                if ($beneficiary['full_name'] === '') {
                    continue;
                }

                $memberProfile->beneficiaries()->create($beneficiary);
            }
        }

        // Mark the request as approved and clear any previous rejection reason
        $updateRequest->update([
            'status' => 'approved',
            'rejection_reason' => null,
            'reviewed_by' => Auth::id(),
        ]);

        // Clear rejection reasons on any previously rejected requests for this member,
        // so that the "Edit Rejected" badge no longer shows in SeeUsers.tsx.
        ProfileUpdateRequest::where('member_id', $updateRequest->member_id)
            ->where('status', 'rejected')
            ->where('id', '!=', $updateRequest->id)
            ->update(['rejection_reason' => null]);

        app(ActivityLogService::class)->logActivity(
            'profile_update_approved',
            null,
            'GM approved profile update request #'.$updateRequest->id.' for member ID #'.$updateRequest->member_id.'.'
        );

        $this->notifyHr($updateRequest->load('member.user'), 'approved');

        return redirect()->route('gm.pending-edits')
            ->with('success', 'Profile update request approved successfully. Member profile has been updated.');
    }

    /**
     * GM: Reject a profile update request with a mandatory reason.
     */
    public function reject($id, Request $request)
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:2000',
        ]);

        $updateRequest = ProfileUpdateRequest::with('member.user')->findOrFail($id);

        if ($updateRequest->status !== 'pending') {
            return redirect()->route('gm.pending-edits')
                ->with('error', 'This update request has already been '.$updateRequest->status.'.');
        }

        // Mark the request as rejected with reason
        $updateRequest->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'],
            'reviewed_by' => Auth::id(),
        ]);

        app(ActivityLogService::class)->logActivity(
            'profile_update_rejected',
            null,
            'GM rejected profile update request #'.$updateRequest->id.' for member ID #'.$updateRequest->member_id.'. Reason: '.$validated['rejection_reason'],
            $validated['rejection_reason']
        );

        $this->notifyHr($updateRequest, 'rejected', $validated['rejection_reason']);

        return redirect()->route('gm.pending-edits')
            ->with('success', 'Profile update request rejected.');
    }
}
