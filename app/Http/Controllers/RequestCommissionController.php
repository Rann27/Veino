<?php

namespace App\Http\Controllers;

use App\Models\RequestCommission;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RequestCommissionController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        return Inertia::render('Request/Index', [
            'requests' => RequestCommission::where('user_id', $user->id)
                ->latest()
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:request,commission',
            'title' => 'required|string|max:255',
            'raw_link' => [
                'nullable',
                'string',
                'max:5000',
                function (string $attribute, mixed $value, \Closure $fail) {
                    $url = trim((string) $value);

                    if ($url === '') {
                        return;
                    }

                    $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));

                    if (!filter_var($url, FILTER_VALIDATE_URL) || !in_array($scheme, ['http', 'https'], true)) {
                        $fail('The raw link must be a valid http or https URL.');
                    }
                },
            ],
            'note_for_admin' => 'nullable|string|max:5000',
            'is_private' => 'nullable|boolean',
            'email' => 'required|email|max:255',
        ]);

        $type = $validated['type'];
        $rawLink = isset($validated['raw_link']) ? trim((string) $validated['raw_link']) : null;
        $noteForAdmin = isset($validated['note_for_admin']) ? trim((string) $validated['note_for_admin']) : null;

        RequestCommission::create([
            'user_id' => Auth::id(),
            'type' => $type,
            'title' => $validated['title'],
            'raw_link' => $rawLink !== '' ? $rawLink : null,
            'note_for_admin' => $noteForAdmin !== '' ? $noteForAdmin : null,
            'is_private' => $type === RequestCommission::TYPE_COMMISSION
                ? $request->boolean('is_private')
                : false,
            'email' => $validated['email'],
            'status' => RequestCommission::STATUS_PENDING,
        ]);

        return back()->with('request_commission_sent', [
            'type' => $type,
        ]);
    }

    public function pay(RequestCommission $requestCommission)
    {
        $user = Auth::user();

        if ($requestCommission->user_id !== $user->id) {
            abort(403);
        }

        if (!$requestCommission->isCommission() || $requestCommission->status !== RequestCommission::STATUS_BILLED) {
            return back()->with('error', 'This commission is not ready for payment.');
        }

        if (!$requestCommission->bill_amount || $requestCommission->bill_amount <= 0) {
            return back()->with('error', 'The commission bill is not configured yet.');
        }

        $paidRequest = null;

        try {
            DB::transaction(function () use ($user, $requestCommission, &$paidRequest) {
                $lockedUser = $user->newQuery()->whereKey($user->id)->lockForUpdate()->firstOrFail();
                $lockedRequest = RequestCommission::whereKey($requestCommission->id)->lockForUpdate()->firstOrFail();

                if ($lockedRequest->status !== RequestCommission::STATUS_BILLED) {
                    return;
                }

                $amount = (int) $lockedRequest->bill_amount;

                if ($lockedUser->coins < $amount) {
                    throw new \RuntimeException('insufficient_coins');
                }

                $lockedUser->decrement('coins', $amount);

                $lockedRequest->update([
                    'status' => RequestCommission::STATUS_ON_QUEUE,
                    'paid_at' => now(),
                ]);

                Transaction::create([
                    'user_id' => $lockedUser->id,
                    'type' => 'commission_payment',
                    'amount' => 0,
                    'coins_spent' => $amount,
                    'payment_method' => 'coins',
                    'status' => 'completed',
                    'description' => "Commission payment: {$lockedRequest->title}",
                ]);

                $paidRequest = $lockedRequest->fresh();
            });
        } catch (\RuntimeException $exception) {
            if ($exception->getMessage() === 'insufficient_coins') {
                return back()->with('error', "Insufficient coins. You need {$requestCommission->bill_amount} coins.");
            }

            throw $exception;
        }

        return back()->with('success', 'Commission paid successfully. Your request is now on queue.');
    }
}
