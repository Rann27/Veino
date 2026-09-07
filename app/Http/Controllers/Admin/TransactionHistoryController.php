<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CoinPurchase;
use App\Models\MembershipHistory;
use App\Models\PurchasedItem;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TransactionHistoryController extends Controller
{
    /**
     * Ordering happens in SQL, not in the browser.
     *
     * Sorting only the twenty rows already on screen answers a question nobody
     * asks — "who spent most on this page" is meaningless. Each key maps to a
     * real column so "highest amount" means highest across the whole history,
     * and paging keeps the order.
     *
     * @var array<string, array<string, string>>
     */
    private const SORTABLE = [
        'coin' => [
            'user' => 'users.display_name',
            'item' => 'coin_packages.name',
            'quantity' => 'coin_purchases.coins_amount',
            'amount' => 'coin_purchases.price_usd',
            'method' => 'coin_purchases.payment_method',
            'status' => 'coin_purchases.status',
            'date' => 'coin_purchases.created_at',
        ],
        'membership' => [
            'user' => 'users.display_name',
            'item' => 'membership_packages.name',
            'quantity' => 'membership_history.duration_days',
            'amount' => 'membership_history.amount_usd',
            'method' => 'membership_history.payment_method',
            'status' => 'membership_history.status',
            'date' => 'membership_history.created_at',
        ],
        'ebook' => [
            'user' => 'users.display_name',
            'item' => 'ebook_items.title',
            'amount' => 'purchased_items.price_paid',
            'date' => 'purchased_items.created_at',
        ],
    ];

    public function index(Request $request)
    {
        // Each tab keeps its own sort, so switching tabs does not silently
        // reorder the one you were reading.
        $sorts = [];

        foreach (['coin', 'membership', 'ebook'] as $tab) {
            $key = (string) $request->query($tab.'_sort', 'date');
            $dir = $request->query($tab.'_dir') === 'asc' ? 'asc' : 'desc';
            $sorts[$tab] = [
                'key' => isset(self::SORTABLE[$tab][$key]) ? $key : 'date',
                'dir' => $dir,
            ];
        }

        // Get coin purchase history (top-up via PayPal/Cryptomus)
        $coinPurchases = $this->applySort(
                CoinPurchase::with(['user', 'coinPackage'])->select('coin_purchases.*'),
                'coin', $sorts['coin'],
                fn ($q) => $q->leftJoin('users', 'users.id', '=', 'coin_purchases.user_id')
                             ->leftJoin('coin_packages', 'coin_packages.id', '=', 'coin_purchases.coin_package_id')
            )
            ->paginate(20, ['*'], 'coin_page')
            // Without this the sort is dropped the moment you turn the page.
            ->withQueryString();

        // Get membership purchase history (bought with coins)
        $membershipPurchases = $this->applySort(
                MembershipHistory::with(['user', 'membershipPackage'])->select('membership_history.*'),
                'membership', $sorts['membership'],
                fn ($q) => $q->leftJoin('users', 'users.id', '=', 'membership_history.user_id')
                             ->leftJoin('membership_packages', 'membership_packages.id', '=', 'membership_history.membership_package_id')
            )
            ->paginate(20, ['*'], 'membership_page')
            ->withQueryString();

        // Get ebook purchase history (bought with coins)
        // Projected to plain arrays instead of handed over as models.
        //
        // EbookSeries appends price_range, whose accessor reads $this->items —
        // so serialising the relation lazy-loads every volume of every series,
        // each carrying its preview_content HTML. On this page that turned 20
        // rows into 821 KB, about 41 KB per row, for three fields that actually
        // get rendered. Narrowing the select alone cannot win against an append.
        $ebookPurchases = PurchasedItem::with([
                'user:id,name,display_name,email',
                'ebookItem:id,ebook_series_id,title,price_coins',
                'ebookItem.ebookSeries:id,title,slug',
            ])
            ->select('purchased_items.*')
            ->leftJoin('users', 'users.id', '=', 'purchased_items.user_id')
            ->leftJoin('ebook_items', 'ebook_items.id', '=', 'purchased_items.ebook_item_id')
            ->orderBy(self::SORTABLE['ebook'][$sorts['ebook']['key']], $sorts['ebook']['dir'])
            ->paginate(20, ['*'], 'ebook_page')
            ->withQueryString()
            ->through(fn ($purchase) => [
                'id' => $purchase->id,
                'price_paid' => $purchase->price_paid,
                'purchased_at' => $purchase->purchased_at,
                'created_at' => $purchase->created_at,
                'user' => $purchase->user ? [
                    'id' => $purchase->user->id,
                    'name' => $purchase->user->name,
                    'display_name' => $purchase->user->display_name,
                    'email' => $purchase->user->email,
                ] : null,
                'ebook_item' => $purchase->ebookItem ? [
                    'id' => $purchase->ebookItem->id,
                    'title' => $purchase->ebookItem->title,
                    // volume_number is deliberately absent. The page declares
                    // it optional and no such column exists, so it has always
                    // been undefined and the "Volume n" line never rendered.
                    // Filling it from `order` would be wrong twice over: order
                    // is a sort key, not a volume number, and the item title
                    // already ends with "Volume 3" — so the line would repeat
                    // what is printed directly above it.
                    'price_coins' => $purchase->ebookItem->price_coins,
                    'ebook_series' => $purchase->ebookItem->ebookSeries ? [
                        'id' => $purchase->ebookItem->ebookSeries->id,
                        'title' => $purchase->ebookItem->ebookSeries->title,
                        'slug' => $purchase->ebookItem->ebookSeries->slug,
                    ] : null,
                ] : null,
            ]);

        return Inertia::render('Admin/TransactionHistory', [
            'sorts' => $sorts,
            'coinPurchases' => $coinPurchases,
            'membershipPurchases' => $membershipPurchases,
            'ebookPurchases' => $ebookPurchases,
        ]);
    }

    /**
     * Joins only when the chosen column lives on another table.
     *
     * Joining unconditionally would work but makes every default listing pay
     * for two joins it never reads.
     */
    private function applySort(Builder $query, string $tab, array $sort, callable $join): Builder
    {
        $column = self::SORTABLE[$tab][$sort['key']];

        if (str_starts_with($column, 'users.') || str_contains($column, '_packages.')) {
            $join($query);
        }

        return $query->orderBy($column, $sort['dir']);
    }
}
