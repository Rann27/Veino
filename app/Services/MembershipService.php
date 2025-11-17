<?php

namespace App\Services;

use App\Models\User;
use App\Models\MembershipPackage;
use App\Models\MembershipPurchase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class MembershipService
{
    /**
     * Process a membership purchase
     * 
     * @param User $user
     * @param MembershipPackage $package
     * @param string $paymentMethod
     * @param string|null $transactionId
     * @return MembershipPurchase
     * @throws Exception
     */
    public function purchaseMembership(
        User $user,
        MembershipPackage $package,
        string $paymentMethod,
        ?string $transactionId = null
    ): MembershipPurchase {
        DB::beginTransaction();
        
        try {
            // Create purchase record
            $purchase = MembershipPurchase::create([
                'user_id' => $user->id,
                'membership_package_id' => $package->id,
                'tier' => $package->tier,
                'duration_days' => $package->duration_days,
                'price_usd' => $package->price_usd,
                'payment_method' => $paymentMethod,
                'transaction_id' => $transactionId,
                'status' => 'pending',
            ]);
            
            DB::commit();
            
            Log::info('Membership purchase created', [
                'user_id' => $user->id,
                'package_id' => $package->id,
                'purchase_id' => $purchase->id,
            ]);
            
            return $purchase;
            
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Failed to create membership purchase', [
                'user_id' => $user->id,
                'package_id' => $package->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Complete a membership purchase and activate membership
     * 
     * @param MembershipPurchase $purchase
     * @return bool
     * @throws Exception
     */
    public function completePurchase(MembershipPurchase $purchase): bool
    {
        DB::beginTransaction();
        
        try {
            // Mark purchase as completed (this also activates the membership)
            $purchase->complete();
            
            DB::commit();
            
            Log::info('Membership purchase completed', [
                'user_id' => $purchase->user_id,
                'purchase_id' => $purchase->id,
                'tier' => $purchase->tier,
                'expires_at' => $purchase->expires_at,
            ]);
            
            return true;
            
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Failed to complete membership purchase', [
                'purchase_id' => $purchase->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Fail a membership purchase
     * 
     * @param MembershipPurchase $purchase
     * @param string|null $reason
     * @return bool
     */
    public function failPurchase(MembershipPurchase $purchase, ?string $reason = null): bool
    {
        $purchase->status = 'failed';
        if ($reason) {
            $purchase->notes = $reason;
        }
        
        $result = $purchase->save();
        
        Log::info('Membership purchase failed', [
            'purchase_id' => $purchase->id,
            'reason' => $reason,
        ]);
        
        return $result;
    }

    /**
     * Refund a membership purchase
     * 
     * @param MembershipPurchase $purchase
     * @param string|null $reason
     * @return bool
     */
    public function refundPurchase(MembershipPurchase $purchase, ?string $reason = null): bool
    {
        return $purchase->refund($reason);
    }

    /**
     * Check and expire all expired memberships
     * This should be run via a scheduled task
     * 
     * @return int Number of memberships expired
     */
    public function expireExpiredMemberships(): int
    {
        $expiredUsers = User::where('membership_tier', 'premium')
            ->where('membership_expires_at', '<=', now())
            ->get();
        
        $count = 0;
        foreach ($expiredUsers as $user) {
            if ($user->expireMembership()) {
                $count++;
                
                Log::info('Membership expired', [
                    'user_id' => $user->id,
                    'tier' => $user->membership_tier,
                ]);
            }
        }
        
        return $count;
    }

    /**
     * Grant premium membership to user
     * 
     * @param User $user
     * @param int $days
     * @return bool
     */
    public function grantPremium(User $user, int $days): bool
    {
        return $user->grantMembership('premium', $days);
    }

    /**
     * Extend user's current membership
     * 
     * @param User $user
     * @param int $days
     * @return bool
     */
    public function extendMembership(User $user, int $days): bool
    {
        if (!$user->hasActiveMembership()) {
            return false;
        }
        
        $user->membership_expires_at = $user->membership_expires_at->addDays($days);
        return $user->save();
    }

    /**
     * Get membership statistics for a user
     * 
     * @param User $user
     * @return array
     */
    public function getUserMembershipStats(User $user): array
    {
        $activeMembership = $user->activeMembershipPurchase();
        $totalPurchases = $user->membershipPurchases()->completed()->count();
        $totalSpent = $user->membershipPurchases()->completed()->sum('price_usd');
        
        return [
            'current_tier' => $user->membership_tier,
            'is_active' => $user->hasActiveMembership(),
            'expires_at' => $user->membership_expires_at,
            'days_remaining' => $user->membership_days_remaining,
            'active_purchase' => $activeMembership,
            'total_purchases' => $totalPurchases,
            'total_spent' => $totalSpent,
            'can_access_premium' => $user->canAccessPremiumContent(),
        ];
    }

    /**
     * Check if user can purchase a specific package
     * 
     * @param User $user
     * @param MembershipPackage $package
     * @return array ['can_purchase' => bool, 'reason' => string|null]
     */
    public function canPurchasePackage(User $user, MembershipPackage $package): array
    {
        // Check if package is active
        if (!$package->is_active) {
            return [
                'can_purchase' => false,
                'reason' => 'This package is not currently available.',
            ];
        }
        
        // Check if user is banned
        if ($user->is_banned) {
            return [
                'can_purchase' => false,
                'reason' => 'Your account is banned and cannot make purchases.',
            ];
        }
        
        // Check if user has pending purchase
        $hasPending = $user->membershipPurchases()
            ->where('status', 'pending')
            ->exists();
            
        if ($hasPending) {
            return [
                'can_purchase' => false,
                'reason' => 'You have a pending membership purchase. Please wait for it to complete.',
            ];
        }
        
        return [
            'can_purchase' => true,
            'reason' => null,
        ];
    }
}
