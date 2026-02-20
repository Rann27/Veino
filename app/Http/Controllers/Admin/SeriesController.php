<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Genre;
use App\Models\NativeLanguage;
use App\Models\Series;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use HTMLPurifier;
use HTMLPurifier_Config;

class SeriesController extends Controller
{
    private function sanitizeHtmlContent(string $content): string
    {
        $config = HTMLPurifier_Config::createDefault();
        
        // Set definition cache for custom elements
        $config->set('HTML.DefinitionID', 'ckeditor-synopsis');
        $config->set('HTML.DefinitionRev', 1);
        
        $config->set('HTML.Allowed', 'p,br,strong,em,b,i,u,h1,h2,h3,h4,h5,h6,ul,ol,li,img[src|alt|title|width|height|style|class],a[href|title],blockquote,code,pre,span[style|class],div[style|class]');
        $config->set('Attr.AllowedFrameTargets', ['_blank']);
        
        // Use more permissive CSS - allow all safe properties
        $config->set('CSS.AllowTricky', true);
        $config->set('CSS.Proprietary', true);
        
        // Allow data URIs for images (base64)
        $config->set('URI.AllowedSchemes', [
            'http' => true,
            'https' => true,
            'data' => true,
        ]);
        
        // Get definition object and add custom elements
        if ($def = $config->maybeGetRawHTMLDefinition()) {
            // Add figure element for CKEditor images
            $def->addElement('figure', 'Block', 'Flow', 'Common', [
                'class' => 'Text',
                'style' => 'Text',
            ]);
            
            // Add figcaption element
            $def->addElement('figcaption', 'Inline', 'Flow', 'Common', [
                'class' => 'Text',
                'style' => 'Text',
            ]);
        }
        
        // Escape standalone angle brackets that are not part of HTML tags
        // This regex preserves HTML tags but escapes standalone < and >
        $content = preg_replace_callback(
            '/(<(?:[^>"\']|"[^"]*"|\'[^\']*\')*>)|([<>])/s',
            function($matches) {
                if (!empty($matches[1])) {
                    // This is a complete HTML tag, keep it as is
                    return $matches[1];
                } else {
                    // This is a standalone angle bracket, convert to HTML entity
                    return $matches[2] === '<' ? '&lt;' : '&gt;';
                }
            },
            $content
        );
        
        $purifier = new HTMLPurifier($config);
        return $purifier->purify($content);
    }

    public function index(Request $request)
    {
        $search  = $request->get('search', '');
        $page    = (int) $request->get('page', 1);
        $type    = $request->get('type', '');    // 'light-novel' | 'web-novel' | ''
        $sort    = $request->get('sort', 'newest'); // 'newest' | 'oldest' | 'views' | 'chapters'
        $perPage = 40;

        $query = Series::with(['nativeLanguage', 'genres'])
            ->withCount('chapters')
            ->selectRaw('series.*, COALESCE((SELECT SUM(c.views) FROM chapters c WHERE c.series_id = series.id), 0) AS total_chapter_views');

        if ($search) {
            $query->where('title', 'LIKE', '%' . $search . '%');
        }

        if ($type) {
            $query->where('type', $type);
        }

        match ($sort) {
            'oldest'   => $query->oldest(),
            'views'    => $query->orderByDesc('views'),
            'chapters' => $query->orderByDesc('chapters_count'),
            default    => $query->latest(),
        };

        $total      = $query->count();
        $totalPages = (int) ceil($total / $perPage);

        $series = $query->skip(($page - 1) * $perPage)
                        ->take($perPage)
                        ->get()
                        ->map(fn($s) => [
                            'id'               => $s->id,
                            'title'            => $s->title,
                            'alternative_title'=> $s->alternative_title,
                            'cover_url'        => $s->cover_url,
                            'status'           => $s->status,
                            'type'             => $s->type,
                            'slug'             => $s->slug,
                            'author'           => $s->author,
                            'rating'           => $s->rating,
                            'views'            => (int) $s->views + (int) ($s->total_chapter_views ?? 0),
                            'chapters_count'   => $s->chapters_count,
                            'native_language'  => $s->nativeLanguage ? ['id' => $s->nativeLanguage->id, 'name' => $s->nativeLanguage->name] : null,
                            'genres'           => $s->genres->map(fn($g) => ['id' => $g->id, 'name' => $g->name]),
                            'created_at'       => $s->created_at,
                        ]);

        return Inertia::render('Admin/Series/Index', [
            'series'      => $series,
            'currentPage' => $page,
            'totalPages'  => $totalPages,
            'hasMore'     => $page < $totalPages,
            'search'      => $search,
            'type'        => $type,
            'sort'        => $sort,
            'total'       => $total,
        ]);
    }

    public function show(Series $series)
    {
        $series->load(['nativeLanguage', 'genres', 'chapters' => function($query) {
            $query->orderBy('chapter_number');
        }]);

        // Add raw cover URL for editing (bypass accessor)
        $seriesData = $series->toArray();
        $seriesData['cover_url_raw'] = $series->getOriginal('cover_url');

        return Inertia::render('Admin/Series/Show', [
            'series' => $seriesData,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'alternative_title' => 'nullable|string|max:255',
            'cover_type' => 'required|in:cdn,file',
            'cover_url' => 'nullable|url',
            'cover_file' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
            'synopsis' => 'nullable|string',
            'author' => 'nullable|string|max:255',
            'artist' => 'nullable|string|max:255',
            'rating' => 'nullable|numeric|min:0|max:10',
            'status' => 'required|in:ongoing,complete,hiatus',
            'type' => 'required|in:light-novel,web-novel',
            'native_language_id' => 'required|exists:native_languages,id',
            'genre_ids' => 'required|array',
            'genre_ids.*' => 'exists:genres,id',
            'show_epub_button' => 'nullable|boolean',
            'epub_series_slug' => 'nullable|string|max:255',
            'is_mature' => 'nullable|boolean',
        ]);

        // Handle cover based on type
        if ($validated['cover_type'] === 'file' && $request->hasFile('cover_file')) {
            $path = $request->file('cover_file')->store('series-covers', 'public');
            $validated['cover_url'] = $path;
        } elseif ($validated['cover_type'] === 'cdn' && empty($validated['cover_url'])) {
            $validated['cover_url'] = null;
        }

        // Sanitize synopsis HTML content
        if (!empty($validated['synopsis'])) {
            $validated['synopsis'] = $this->sanitizeHtmlContent($validated['synopsis']);
        }

        $validated['slug'] = Str::slug($validated['title']);

        $series = Series::create($validated);
        $series->genres()->attach($validated['genre_ids']);

        return redirect()->back()->with('success', 'Series created successfully');
    }

    public function update(Request $request, Series $series)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'alternative_title' => 'nullable|string|max:255',
            'cover_type' => 'required|in:cdn,file',
            'cover_url' => 'nullable|url',
            'cover_file' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
            'synopsis' => 'nullable|string',
            'author' => 'nullable|string|max:255',
            'artist' => 'nullable|string|max:255',
            'rating' => 'nullable|numeric|min:0|max:10',
            'status' => 'required|in:ongoing,complete,hiatus',
            'type' => 'required|in:light-novel,web-novel',
            'native_language_id' => 'required|exists:native_languages,id',
            'genre_ids' => 'required|array',
            'genre_ids.*' => 'exists:genres,id',
            'show_epub_button' => 'nullable|boolean',
            'epub_series_slug' => 'nullable|string|max:255',
            'is_mature' => 'nullable|boolean',
        ]);

        // Handle cover based on type
        if ($validated['cover_type'] === 'file' && $request->hasFile('cover_file')) {
            // Delete old file if exists and is a file type
            if ($series->cover_type === 'file' && $series->cover_url) {
                \Storage::disk('public')->delete($series->cover_url);
            }
            $path = $request->file('cover_file')->store('series-covers', 'public');
            $validated['cover_url'] = $path;
        } elseif ($validated['cover_type'] === 'cdn' && empty($validated['cover_url'])) {
            // If switching to CDN with no URL, keep existing if it's CDN type
            if ($series->cover_type === 'cdn') {
                $validated['cover_url'] = $series->cover_url;
            } else {
                // Delete old file if exists
                if ($series->cover_url) {
                    \Storage::disk('public')->delete($series->cover_url);
                }
                $validated['cover_url'] = null;
            }
        }

        // Sanitize synopsis HTML content
        if (!empty($validated['synopsis'])) {
            $validated['synopsis'] = $this->sanitizeHtmlContent($validated['synopsis']);
        }

        if ($validated['title'] !== $series->title) {
            $validated['slug'] = Str::slug($validated['title']);
        }

        $series->update($validated);
        $series->genres()->sync($validated['genre_ids']);

        return redirect()->back()->with('success', 'Series updated successfully');
    }

    public function destroy(Series $series)
    {
        $series->delete();
        return redirect()->route('admin.series.index')->with('success', 'Series deleted successfully');
    }

    public function getFormData()
    {
        return response()->json([
            'genres' => Genre::all(['id', 'name']),
            'native_languages' => NativeLanguage::all(['id', 'name']),
        ]);
    }
}
