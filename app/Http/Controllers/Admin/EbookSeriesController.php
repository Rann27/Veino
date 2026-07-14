<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EbookSeries;
use App\Models\EbookItem;
use App\Models\Genre;
use App\Models\Series;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Inertia\Inertia;

class EbookSeriesController extends Controller
{
    /**
     * Display a listing of ebook series
     */
    public function index()
    {
        $series = EbookSeries::withCount('items')
            ->with(['genres'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        // Append price_range and cover_url for each series
        $series->getCollection()->transform(function ($s) {
            $s->price_range = $s->price_range;
            $s->cover_url   = $s->cover_url;
            return $s;
        });

        return Inertia::render('Admin/EbookSeries/Index', [
            'series' => $series,
            'stats'  => [
                'total_series'   => EbookSeries::count(),
                'premium_count'  => EbookSeries::where('free_for_premium_members', true)->count(),
                'exclusive_count'=> EbookSeries::where('free_for_premium_members', false)->count(),
                'total_volumes'  => \App\Models\EbookItem::count(),
            ],
        ]);
    }

    /**
     * Return on-site series info as JSON for the "Fetch Info" feature
     */
    public function seriesInfo(string $slug)
    {
        $series = Series::with('genres')->where('slug', $slug)->firstOrFail();

        return response()->json([
            'title'             => $series->title,
            'alternative_title' => $series->alternative_title ?? '',
            'synopsis'          => $series->synopsis ?? '',
            'author'            => $series->author ?? '',
            'artist'            => $series->artist ?? '',
            'cover_url'         => $series->cover_url ?? null,
            'slug'              => $series->slug,
            'genre_ids'         => $series->genres->pluck('id')->values()->toArray(),
        ]);
    }

    /**
     * Show the form for creating a new ebook series
     */
    public function create()
    {
        return Inertia::render('Admin/EbookSeries/Create', [
            'genres' => Genre::all(),
            'seriesOptions' => Series::orderBy('title')->get(['id', 'title', 'slug']),
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
            'cover' => 'nullable|image|max:10240',
            'genre_ids' => 'nullable|array',
            'genre_ids.*' => 'exists:genres,id',
            'show_trial_button' => 'nullable|boolean',
            'series_slug' => 'nullable|string|max:255',
            'free_for_premium_members' => 'nullable|boolean',
            'is_mature' => 'nullable|boolean',
        ]);

        $validated['free_for_premium_members'] = $request->boolean('free_for_premium_members');
        $validated['show_trial_button'] = $request->boolean('show_trial_button');
        $validated['is_mature'] = $request->boolean('is_mature');

        // Handle cover upload
        if ($request->hasFile('cover')) {
            $path = $request->file('cover')->store('ebook-covers', 'public');
            $validated['cover'] = 'storage/' . $path;
        } elseif ($request->filled('fetched_cover_url')) {
            // Download cover from on-site series URL
            $response = Http::timeout(15)->get($request->fetched_cover_url);
            if ($response->successful()) {
                $ext  = pathinfo(parse_url($request->fetched_cover_url, PHP_URL_PATH), PATHINFO_EXTENSION) ?: 'jpg';
                $name = 'ebook-covers/' . Str::random(20) . '.' . $ext;
                Storage::disk('public')->put($name, $response->body());
                $validated['cover'] = 'storage/' . $name;
            }
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
                'has_pdf_file' => !empty($item->pdf_file_path),
                'has_preview' => !empty($item->preview_content),
            ];
        });

        return Inertia::render('Admin/EbookSeries/Edit', [
            'series' => $series,
            'items' => $items,
            'genres' => Genre::all(),
            'seriesOptions' => Series::orderBy('title')->get(['id', 'title', 'slug']),
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
            'cover' => 'nullable|image|max:10240',
            'genre_ids' => 'nullable|array',
            'genre_ids.*' => 'exists:genres,id',
            'show_trial_button' => 'nullable|boolean',
            'series_slug' => 'nullable|string|max:255',
            'free_for_premium_members' => 'nullable|boolean',
            'is_mature' => 'nullable|boolean',
        ]);

        $validated['free_for_premium_members'] = $request->boolean('free_for_premium_members');
        $validated['show_trial_button'] = $request->boolean('show_trial_button');
        $validated['is_mature'] = $request->boolean('is_mature');

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
            if ($item->pdf_file_path) {
                Storage::delete($item->pdf_file_path);
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
            'cover' => 'nullable|image|max:10240',
            'file' => 'required|file|extensions:epub|max:40960', // EPUB MIME varies by browser; validate extension.
            'pdf_file' => 'nullable|file|extensions:pdf|max:40960',
        ]);

        $itemData = [
            'ebook_series_id' => $series->id,
            'title' => $validated['title'],
            'summary' => $validated['summary'] ?? null,
            'price_coins' => $validated['price_coins'],
            'order' => $validated['order'],
        ];

        // Handle cover upload
        if ($request->hasFile('cover')) {
            $path = $request->file('cover')->store('ebook-item-covers', 'public');
            $itemData['cover'] = 'storage/' . $path;
        }

        // Handle epub file upload
        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('ebook-files');
            $itemData['file_path'] = $path;
        }

        // Handle PDF file upload
        if ($request->hasFile('pdf_file')) {
            $path = $request->file('pdf_file')->store('ebook-files');
            $itemData['pdf_file_path'] = $path;
        }

        $item = new EbookItem($itemData);
        $item->saveOrFail();

        return redirect()->route('admin.ebookseries.edit', $series->id)
            ->with('success', 'Item added successfully!')
            ->with('item_saved_id', $item->id);
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
            'cover' => 'nullable|image|max:10240',
            'file' => 'nullable|file|extensions:epub|max:40960',
            'pdf_file' => 'nullable|file|extensions:pdf|max:40960',
        ]);

        // EPUB must always exist (either existing file or newly uploaded file)
        if (!$item->file_path && !$request->hasFile('file')) {
            return back()->withErrors([
                'file' => 'EPUB file is required.',
            ])->withInput();
        }

        $itemData = [
            'title' => $validated['title'],
            'summary' => $validated['summary'] ?? null,
            'price_coins' => $validated['price_coins'],
            'order' => $validated['order'],
        ];

        // Handle cover upload
        if ($request->hasFile('cover')) {
            if ($item->cover) {
                Storage::disk('public')->delete(str_replace('storage/', '', $item->cover));
            }
            $path = $request->file('cover')->store('ebook-item-covers', 'public');
            $itemData['cover'] = 'storage/' . $path;
        }

        // Handle epub file upload
        if ($request->hasFile('file')) {
            if ($item->file_path) {
                Storage::delete($item->file_path);
            }
            $path = $request->file('file')->store('ebook-files');
            $itemData['file_path'] = $path;
        }

        // Handle PDF file upload
        if ($request->hasFile('pdf_file')) {
            if ($item->pdf_file_path) {
                Storage::delete($item->pdf_file_path);
            }
            $path = $request->file('pdf_file')->store('ebook-files');
            $itemData['pdf_file_path'] = $path;
        }

        $item->fill($itemData);
        $item->saveOrFail();

        return redirect()->route('admin.ebookseries.edit', $seriesId)
            ->with('success', 'Item updated successfully!')
            ->with('item_saved_id', $item->id);
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
        if ($item->pdf_file_path) {
            Storage::delete($item->pdf_file_path);
        }

        $item->delete();

        return back()->with('success', 'Item deleted successfully!');
    }

    /**
     * Show preview editor for an ebook item
     */
    public function editPreview($seriesId, $itemId)
    {
        $series = EbookSeries::findOrFail($seriesId);
        $item = EbookItem::where('ebook_series_id', $seriesId)->findOrFail($itemId);

        return Inertia::render('Admin/EbookSeries/PreviewEdit', [
            'series' => $series,
            'item' => [
                'id' => $item->id,
                'title' => $item->title,
                'order' => $item->order,
                'preview_content' => $item->preview_content ?? '',
            ],
        ]);
    }

    /**
     * Save preview content for an ebook item
     */
    public function savePreview(Request $request, $seriesId, $itemId)
    {
        $item = EbookItem::where('ebook_series_id', $seriesId)->findOrFail($itemId);

        $validated = $request->validate([
            'preview_content' => 'required|string',
        ]);

        $item->update(['preview_content' => $validated['preview_content']]);

        return redirect()->route('admin.ebookseries.edit', $seriesId)
            ->with('success', 'Preview saved successfully!');
    }

    /**
     * Remove preview content from an ebook item
     */
    public function destroyPreview($seriesId, $itemId)
    {
        $item = EbookItem::where('ebook_series_id', $seriesId)->findOrFail($itemId);

        $item->update(['preview_content' => null]);

        return back()->with('success', 'Preview removed successfully!');
    }

    /**
     * Upload image for preview content (CKEditor)
     */
    public function uploadPreviewImage(Request $request)
    {
        $request->validate([
            'upload' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        if ($request->hasFile('upload')) {
            $path = $request->file('upload')->store('ebook-preview-images', 'public');

            return response()->json(['url' => asset('storage/' . $path)]);
        }

        return response()->json(['error' => ['message' => 'Image upload failed']], 400);
    }

    /**
     * Cleanup orphaned EPUB files
     * This will delete .epub files that are not referenced in the database
     */
    public function cleanupOrphanedFiles()
    {
        $deletedCount = 0;
        $deletedSize = 0;

        // Get all files in storage/app/ebook-files
        $allFiles = Storage::files('ebook-files');
        
        // Get all file paths from database (both EPUB and PDF)
        $registeredEpubPaths = EbookItem::whereNotNull('file_path')
            ->pluck('file_path')
            ->toArray();
        
        $registeredPdfPaths = EbookItem::whereNotNull('pdf_file_path')
            ->pluck('pdf_file_path')
            ->toArray();
        
        $registeredPaths = array_merge($registeredEpubPaths, $registeredPdfPaths);

        // Find orphaned files (files that exist but not in database)
        $orphanedFiles = array_diff($allFiles, $registeredPaths);

        // Delete orphaned files (both .epub and .pdf)
        foreach ($orphanedFiles as $file) {
            $extension = pathinfo($file, PATHINFO_EXTENSION);
            if (in_array($extension, ['epub', 'pdf'])) {
                $size = Storage::size($file);
                Storage::delete($file);
                $deletedCount++;
                $deletedSize += $size;
            }
        }

        // Convert bytes to MB for readability
        $deletedSizeMB = round($deletedSize / 1024 / 1024, 2);

        return back()->with('success', 
            "Cleanup completed! Deleted {$deletedCount} orphaned EPUB/PDF file(s), freed {$deletedSizeMB} MB of storage."
        );
    }
}
