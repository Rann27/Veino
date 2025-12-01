<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EbookSeries;
use App\Models\EbookItem;
use App\Models\Genre;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class EbookSeriesController extends Controller
{
    /**
     * Display a listing of ebook series
     */
    public function index()
    {
        $series = EbookSeries::with(['genres', 'items'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('Admin/EbookSeries/Index', [
            'series' => $series,
        ]);
    }

    /**
     * Show the form for creating a new ebook series
     */
    public function create()
    {
        return Inertia::render('Admin/EbookSeries/Create', [
            'genres' => Genre::all(),
        ]);
    }

    /**
     * Store a newly created ebook series
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'alternative_title' => 'nullable|string|max:255',
            'synopsis' => 'nullable|string',
            'author' => 'nullable|string|max:255',
            'artist' => 'nullable|string|max:255',
            'cover' => 'nullable|image|max:2048',
            'genre_ids' => 'nullable|array',
            'genre_ids.*' => 'exists:genres,id',
            'show_trial_button' => 'nullable|boolean',
            'series_slug' => 'nullable|string|max:255',
        ]);

        // Handle cover upload
        if ($request->hasFile('cover')) {
            $path = $request->file('cover')->store('ebook-covers', 'public');
            $validated['cover'] = 'storage/' . $path;
        }

        // Generate slug
        $validated['slug'] = Str::slug($validated['title']);

        $series = EbookSeries::create($validated);

        // Attach genres
        if (!empty($validated['genre_ids'])) {
            $series->genres()->attach($validated['genre_ids']);
        }

        return redirect()->route('admin.ebookseries.edit', $series->id)
            ->with('success', 'Ebook series created successfully!');
    }

    /**
     * Show the form for editing ebook series
     */
    public function edit($id)
    {
        $series = EbookSeries::with(['genres', 'items'])->findOrFail($id);

        $items = $series->items()->orderBy('order')->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'title' => $item->title,
                'cover_url' => $item->cover_url,
                'summary' => $item->summary,
                'price_coins' => $item->price_coins,
                'order' => $item->order,
                'has_file' => !empty($item->file_path),
            ];
        });

        return Inertia::render('Admin/EbookSeries/Edit', [
            'series' => $series,
            'items' => $items,
            'genres' => Genre::all(),
        ]);
    }

    /**
     * Update ebook series
     */
    public function update(Request $request, $id)
    {
        $series = EbookSeries::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'alternative_title' => 'nullable|string|max:255',
            'synopsis' => 'nullable|string',
            'author' => 'nullable|string|max:255',
            'artist' => 'nullable|string|max:255',
            'cover' => 'nullable|image|max:2048',
            'genre_ids' => 'nullable|array',
            'genre_ids.*' => 'exists:genres,id',
            'show_trial_button' => 'nullable|boolean',
            'series_slug' => 'nullable|string|max:255',
        ]);

        // Handle cover upload
        if ($request->hasFile('cover')) {
            // Delete old cover
            if ($series->cover) {
                Storage::disk('public')->delete(str_replace('storage/', '', $series->cover));
            }

            $path = $request->file('cover')->store('ebook-covers', 'public');
            $validated['cover'] = 'storage/' . $path;
        }

        // Update slug if title changed
        if ($validated['title'] !== $series->title) {
            $validated['slug'] = Str::slug($validated['title']);
        }

        $series->update($validated);

        // Sync genres
        if (isset($validated['genre_ids'])) {
            $series->genres()->sync($validated['genre_ids']);
        }

        return back()->with('success', 'Ebook series updated successfully!');
    }

    /**
     * Remove ebook series
     */
    public function destroy($id)
    {
        $series = EbookSeries::findOrFail($id);

        // Delete cover
        if ($series->cover) {
            Storage::disk('public')->delete(str_replace('storage/', '', $series->cover));
        }

        // Delete all item covers and files
        foreach ($series->items as $item) {
            if ($item->cover) {
                Storage::disk('public')->delete(str_replace('storage/', '', $item->cover));
            }
            if ($item->file_path) {
                Storage::delete($item->file_path);
            }
        }

        $series->delete();

        return redirect()->route('admin.ebookseries.index')
            ->with('success', 'Ebook series deleted successfully!');
    }

    /**
     * Store new ebook item for a series
     */
    public function storeItem(Request $request, $seriesId)
    {
        $series = EbookSeries::findOrFail($seriesId);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'summary' => 'nullable|string',
            'price_coins' => 'required|integer|min:0',
            'order' => 'required|integer|min:0',
            'cover' => 'nullable|image|max:2048',
            'file' => 'nullable|file|mimes:epub|max:51200', // 50MB max
        ]);

        // Handle cover upload
        if ($request->hasFile('cover')) {
            $path = $request->file('cover')->store('ebook-item-covers', 'public');
            $validated['cover'] = 'storage/' . $path;
        }

        // Handle epub file upload
        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('ebook-files');
            $validated['file_path'] = $path;
        }

        $validated['ebook_series_id'] = $series->id;

        EbookItem::create($validated);

        return back()->with('success', 'Item added successfully!');
    }

    /**
     * Update ebook item
     */
    public function updateItem(Request $request, $seriesId, $itemId)
    {
        $item = EbookItem::where('ebook_series_id', $seriesId)
            ->findOrFail($itemId);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'summary' => 'nullable|string',
            'price_coins' => 'required|integer|min:0',
            'order' => 'required|integer|min:0',
            'cover' => 'nullable|image|max:2048',
            'file' => 'nullable|file|mimes:epub|max:51200',
        ]);

        // Handle cover upload
        if ($request->hasFile('cover')) {
            if ($item->cover) {
                Storage::disk('public')->delete(str_replace('storage/', '', $item->cover));
            }
            $path = $request->file('cover')->store('ebook-item-covers', 'public');
            $validated['cover'] = 'storage/' . $path;
        }

        // Handle epub file upload
        if ($request->hasFile('file')) {
            if ($item->file_path) {
                Storage::delete($item->file_path);
            }
            $path = $request->file('file')->store('ebook-files');
            $validated['file_path'] = $path;
        }

        $item->update($validated);

        return back()->with('success', 'Item updated successfully!');
    }

    /**
     * Delete ebook item
     */
    public function destroyItem($seriesId, $itemId)
    {
        $item = EbookItem::where('ebook_series_id', $seriesId)
            ->findOrFail($itemId);

        // Delete files
        if ($item->cover) {
            Storage::disk('public')->delete(str_replace('storage/', '', $item->cover));
        }
        if ($item->file_path) {
            Storage::delete($item->file_path);
        }

        $item->delete();

        return back()->with('success', 'Item deleted successfully!');
    }

    /**
     * Cleanup orphaned EPUB files
     * This will delete .epub files that are not referenced in the database
     */
    public function cleanupOrphanedFiles()
    {
        $deletedCount = 0;
        $deletedSize = 0;

        // Get all .epub files in storage/app/ebook-files
        $allFiles = Storage::files('ebook-files');
        
        // Get all file paths from database
        $registeredPaths = EbookItem::whereNotNull('file_path')
            ->pluck('file_path')
            ->toArray();

        // Find orphaned files (files that exist but not in database)
        $orphanedFiles = array_diff($allFiles, $registeredPaths);

        // Delete orphaned files
        foreach ($orphanedFiles as $file) {
            if (pathinfo($file, PATHINFO_EXTENSION) === 'epub') {
                $size = Storage::size($file);
                Storage::delete($file);
                $deletedCount++;
                $deletedSize += $size;
            }
        }

        // Convert bytes to MB for readability
        $deletedSizeMB = round($deletedSize / 1024 / 1024, 2);

        return back()->with('success', 
            "Cleanup completed! Deleted {$deletedCount} orphaned EPUB file(s), freed {$deletedSizeMB} MB of storage."
        );
    }
}
