<?php

namespace App\Http\Controllers;

use App\Models\PurchasedItem;
use App\Models\EbookItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class BookshelfController extends Controller
{
    /**
     * Display user's purchased ebook items grouped by series
     */
    public function index()
    {
        $userId = auth()->id();

        $purchasedItems = PurchasedItem::where('user_id', $userId)
            ->with(['ebookItem.ebookSeries'])
            ->orderBy('purchased_at', 'desc')
            ->get();

        // Group by series
        $groupedBySeries = $purchasedItems->groupBy(function ($purchase) {
            return $purchase->ebookItem->ebookSeries->id;
        })->map(function ($items, $seriesId) {
            $firstItem = $items->first();
            $series = $firstItem->ebookItem->ebookSeries;

            return [
                'series_id' => $series->id,
                'series_title' => $series->title,
                'series_slug' => $series->slug,
                'series_cover' => $series->thumb_url,
                'items' => $items->map(function ($purchase) {
                    return [
                        'id' => $purchase->ebookItem->id,
                        'title' => $purchase->ebookItem->title,
                        'cover_url' => $purchase->ebookItem->thumb_url,
                        'purchased_at' => $purchase->purchased_at->format('M d, Y'),
                        'can_download' => !empty($purchase->ebookItem->file_path),
                        'can_download_pdf' => !empty($purchase->ebookItem->pdf_file_path),
                    ];
                })->values(),
            ];
        })->values();

        return Inertia::render('Bookshelf', [
            'seriesGroups' => $groupedBySeries,
        ]);
    }

    /**
     * Download ebook file
     */
    public function download($itemId)
    {
        $user = auth()->user();
        $userId = $user->id;

        $purchase = PurchasedItem::where('user_id', $userId)
            ->where('ebook_item_id', $itemId)
            ->with('ebookItem.ebookSeries')
            ->first();

        $item = $purchase
            ? $purchase->ebookItem
            : EbookItem::with('ebookSeries')->findOrFail($itemId);

        if (!$purchase && !$item->isFreeForPremiumMember($user)) {
            abort(403, 'You do not have access to this ebook.');
        }

        if (!$item->file_path || !Storage::exists($item->file_path)) {
            return back()->with('error', 'File not available for download.');
        }

        $this->recordDownload($userId, $item->id, 'epub');

        $fileName = $item->title . '.epub';

        return Storage::download($item->file_path, $fileName);
    }

    /**
     * Download PDF file
     */
    public function downloadPdf($itemId)
    {
        $user = auth()->user();
        $userId = $user->id;

        $purchase = PurchasedItem::where('user_id', $userId)
            ->where('ebook_item_id', $itemId)
            ->with('ebookItem.ebookSeries')
            ->first();

        $item = $purchase
            ? $purchase->ebookItem
            : EbookItem::with('ebookSeries')->findOrFail($itemId);

        if (!$purchase && !$item->isFreeForPremiumMember($user)) {
            abort(403, 'You do not have access to this PDF.');
        }

        if (!$item->pdf_file_path || !Storage::exists($item->pdf_file_path)) {
            return back()->with('error', 'PDF file not available for download.');
        }

        $this->recordDownload($userId, $item->id, 'pdf');

        $fileName = $item->title . '.pdf';

        return Storage::download($item->pdf_file_path, $fileName);
    }

    /**
     * Counts a download against the reader, volume and format.
     *
     * Called only once access is confirmed and the file is known to exist, so
     * a refused or broken download is never counted. A single atomic upsert:
     * the first download inserts the row, every later one bumps it, and two
     * simultaneous clicks cannot both insert.
     *
     * Never allowed to cost anyone their file — a counter that fails to write
     * is worth less than the download itself.
     */
    private function recordDownload(int $userId, int $itemId, string $format): void
    {
        try {
            $now = now();

            DB::table('ebook_downloads')->upsert(
                [[
                    'user_id' => $userId,
                    'ebook_item_id' => $itemId,
                    'format' => $format,
                    'downloads' => 1,
                    'first_downloaded_at' => $now,
                    'last_downloaded_at' => $now,
                ]],
                ['user_id', 'ebook_item_id', 'format'],
                [
                    'downloads' => DB::raw('downloads + 1'),
                    'last_downloaded_at' => $now,
                ],
            );
        } catch (\Throwable) {
            // Silent by design.
        }
    }
}
