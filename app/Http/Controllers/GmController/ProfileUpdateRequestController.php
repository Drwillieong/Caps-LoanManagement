<?php

namespace App\Http\Controllers\GmController;

use App\Http\Controllers\Controller;
use App\Models\MemberProfile;
use App\Models\ProfileUpdateRequest;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProfileUpdateRequestController extends Controller
{
    /**
     * HR: Submit a pending profile update request.
     * Stores the original data (snapshot) and the pending changes (proposed edits).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'member_id' => 'required|string|exists:member_profiles,employee_id',
            'pending_data' => 'required|array',
        ]);

        // Check if there's already a pending update request for this member
        $existingPending = ProfileUpdateRequest::where('member_id', $validated['member_id'])
            ->where('status', 'pending')
            ->exists();

        if ($existingPending) {
            return redirect()->route('users')
                ->with('error', 'An update request for this profile is already awaiting GM approval.');
        }

        // Get the current member profile data as snapshot
        $memberProfile = MemberProfile::findOrFail($validated['member_id']);
        $originalData = $memberProfile->toArray();

        // Remove relationships and timestamps from original data snapshot
        unset($originalData['user'], $originalData['beneficiaries'], $originalData['deduction_records']);

        // Create the pending update request
        $updateRequest = ProfileUpdateRequest::create([
            'member_id' => $validated['member_id'],
            'requested_by' => Auth::id(),
            'original_data' => $originalData,
            'pending_data' => $validated['pending_data'],
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

        // Extract the pending data fields that are fillable on MemberProfile
        $pendingData = collect($updateRequest->pending_data)
            ->only($memberProfile->getFillable())
            ->toArray();

        // Update the member profile with the approved changes
        $memberProfile->update($pendingData);

        // Mark the request as approved
        $updateRequest->update([
            'status' => 'approved',
            'reviewed_by' => Auth::id(),
        ]);

        app(ActivityLogService::class)->logActivity(
            'profile_update_approved',
            null,
            'GM approved profile update request #'.$updateRequest->id.' for member ID #'.$updateRequest->member_id.'.'
        );

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

        $updateRequest = ProfileUpdateRequest::findOrFail($id);

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

        return redirect()->route('gm.pending-edits')
            ->with('success', 'Profile update request rejected.');
    }
}

