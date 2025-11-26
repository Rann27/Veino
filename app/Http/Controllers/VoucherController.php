<?php

namespace App\Http\Controllers;

use App\Models\Voucher;
use Illuminate\Http\Request;

class VoucherController extends Controller
{
    /**
     * Validate voucher code for a specific type
     */
    public function validate(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'type' => 'required|in:membership,ebook',
            'amount' => 'required|numeric|min:0',
        ]);

        $voucher = Voucher::where('code', strtoupper($request->code))->first();

        if (!$voucher) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid voucher code.',
            ], 404);
        }

        $userId = auth()->id();
        $validation = $voucher->isValidFor($userId, $request->type);

        if (!$validation['valid']) {
            return response()->json([
                'success' => false,
                'message' => $validation['message'],
            ], 400);
        }

        $discountAmount = $voucher->calculateDiscount($request->amount);
        $finalAmount = max(0, $request->amount - $discountAmount);

        return response()->json([
            'success' => true,
            'message' => 'Voucher applied successfully!',
            'data' => [
                'voucher_id' => $voucher->id,
                'voucher_code' => $voucher->code,
                'discount_type' => $voucher->discount_type,
                'discount_value' => $voucher->discount_value,
                'discount_amount' => $discountAmount,
                'original_amount' => $request->amount,
                'final_amount' => $finalAmount,
            ],
        ]);
    }
}
