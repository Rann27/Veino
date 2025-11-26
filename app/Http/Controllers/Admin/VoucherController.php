<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VoucherController extends Controller
{
    public function index()
    {
        $vouchers = Voucher::latest()->paginate(20);

        return Inertia::render('Admin/Voucher/Index', [
            'vouchers' => $vouchers,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Voucher/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:vouchers,code',
            'type' => 'required|in:membership,ebook,hybrid',
            'discount_type' => 'required|in:percent,flat',
            'discount_value' => 'required|numeric|min:0',
            'usage_limit_type' => 'required|in:per_user,global',
            'usage_limit' => 'required|integer|min:1',
            'expires_at' => 'nullable|date|after:today',
            'is_active' => 'boolean',
        ]);

        // Force code to uppercase
        $validated['code'] = strtoupper($validated['code']);
        $validated['is_active'] = $request->boolean('is_active', true);

        // Validate percent discount
        if ($validated['discount_type'] === 'percent' && $validated['discount_value'] > 100) {
            return back()->withErrors(['discount_value' => 'Percentage discount cannot exceed 100%']);
        }

        Voucher::create($validated);

        return redirect()->route('admin.voucher.index')
            ->with('success', 'Voucher created successfully!');
    }

    public function edit(Voucher $voucher)
    {
        return Inertia::render('Admin/Voucher/Edit', [
            'voucher' => $voucher,
        ]);
    }

    public function update(Request $request, Voucher $voucher)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:vouchers,code,' . $voucher->id,
            'type' => 'required|in:membership,ebook,hybrid',
            'discount_type' => 'required|in:percent,flat',
            'discount_value' => 'required|numeric|min:0',
            'usage_limit_type' => 'required|in:per_user,global',
            'usage_limit' => 'required|integer|min:1',
            'expires_at' => 'nullable|date',
            'is_active' => 'boolean',
        ]);

        // Force code to uppercase
        $validated['code'] = strtoupper($validated['code']);
        $validated['is_active'] = $request->boolean('is_active');

        // Validate percent discount
        if ($validated['discount_type'] === 'percent' && $validated['discount_value'] > 100) {
            return back()->withErrors(['discount_value' => 'Percentage discount cannot exceed 100%']);
        }

        $voucher->update($validated);

        return redirect()->route('admin.voucher.index')
            ->with('success', 'Voucher updated successfully!');
    }

    public function destroy(Voucher $voucher)
    {
        $voucher->delete();

        return redirect()->route('admin.voucher.index')
            ->with('success', 'Voucher deleted successfully!');
    }
}
