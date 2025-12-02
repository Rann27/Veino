<?php

namespace App\Http\Controllers;

use App\Models\PurchasedItem;
use Illuminate\Http\Request;
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
                'series_cover_url' => $series->cover_url,
                'items' => $items->map(function ($purchase) {
                    return [
                        'id' => $purchase->ebookItem->id,
                        'title' => $purchase->ebookItem->title,
                        'cover_url' => $purchase->ebookItem->cover_url,
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
        $userId = auth()->id();

        $purchase = PurchasedItem::where('user_id', $userId)
            ->where('ebook_item_id', $itemId)
            ->with('ebookItem')
            ->firstOrFail();

        $item = $purchase->ebookItem;

        if (!$item->file_path || !Storage::exists($item->file_path)) {
            return back()->with('error', 'File not available for download.');
        }

        $fileName = $item->title . '.epub';

        return Storage::download($item->file_path, $fileName);
    }

    /**
     * Download PDF file
     */
    public function downloadPdf($itemId)
    {
        $userId = auth()->id();

        $purchase = PurchasedItem::where('user_id', $userId)
            ->where('ebook_item_id', $itemId)
            ->with('ebookItem')
            ->firstOrFail();

        $item = $purchase->ebookItem;

        if (!$item->pdf_file_path || !Storage::exists($item->pdf_file_path)) {
            return back()->with('error', 'PDF file not available for download.');
        }

        $fileName = $item->title . '.pdf';

        return Storage::download($item->pdf_file_path, $fileName);
    }
}
