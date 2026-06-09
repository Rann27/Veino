<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RequestCommission;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RequestCommissionController extends Controller
{
    public function index(Request $request)
    {
        $type = $request->query('type', 'all');
        $status = $request->query('status', 'all');

        $query = RequestCommission::with('user:id,display_name,email,coins')
            ->latest();

        if (in_array($type, ['request', 'commission'], true)) {
            $query->where('type', $type);
        }

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        return Inertia::render('Admin/RequestCommission/Index', [
            'items' => $query->paginate(20)->withQueryString(),
            'filters' => [
                'type' => $type,
                'status' => $status,
            ],
            'stats' => [
                'pending' => RequestCommission::where('status', RequestCommission::STATUS_PENDING)->count(),
                'billed' => RequestCommission::where('status', RequestCommission::STATUS_BILLED)->count(),
                'on_queue' => RequestCommission::where('status', RequestCommission::STATUS_ON_QUEUE)->count(),
                'completed' => RequestCommission::where('status', RequestCommission::STATUS_COMPLETED)->count(),
            ],
        ]);
    }

    public function update(Request $request, RequestCommission $requestCommission)
    {
        $allowedStatuses = $requestCommission->type === RequestCommission::TYPE_REQUEST
            ? [RequestCommission::STATUS_PENDING, RequestCommission::STATUS_APPROVED]
            : [
                RequestCommission::STATUS_PENDING,
                RequestCommission::STATUS_BILLED,
                RequestCommission::STATUS_ON_QUEUE,
                RequestCommission::STATUS_COMPLETED,
            ];

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:' . implode(',', $allowedStatuses)],
            'bill_amount' => [
                $request->input('status') === RequestCommission::STATUS_BILLED ? 'required' : 'nullable',
                'integer',
                'min:1',
                'max:9999999',
            ],
            'admin_note' => 'nullable|string|max:5000',
        ]);

        $data = [
            'status' => $validated['status'],
            'admin_note' => $validated['admin_note'] ?? null,
        ];

        if ($requestCommission->type === RequestCommission::TYPE_COMMISSION) {
            $data['bill_amount'] = $validated['status'] === RequestCommission::STATUS_BILLED
                ? ($validated['bill_amount'] ?? $requestCommission->bill_amount)
                : ($validated['bill_amount'] ?? $requestCommission->bill_amount);
        } else {
            $data['bill_amount'] = null;
        }

        $requestCommission->update($data);

        return back()->with('success', 'Request/Commission updated successfully.');
    }
}
