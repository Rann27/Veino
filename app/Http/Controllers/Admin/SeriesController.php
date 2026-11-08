<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Genre;
use App\Models\NativeLanguage;
use App\Models\PaymentSetting;
use App\Models\EbookSeries;
use App\Models\Series;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use HTMLPurifier;
use HTMLPurifier_Config;
use App\Services\ThumbnailService;

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
                            'cover_url'        => $s->thumb_url,
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
            'series'              => $series,
            'currentPage'         => $page,
            'totalPages'          => $totalPages,
            'hasMore'             => $page < $totalPages,
            'search'              => $search,
            'type'                => $type,
            'sort'                => $sort,
            'total'               => $total,
            'premiumChapterPrice' => PaymentSetting::get('premium_chapter_price', 10),
            'unlockChallenge' => [
                'enabled' => (bool) PaymentSetting::get('unlock_challenge_enabled', true),
                'days' => (int) PaymentSetting::get('unlock_challenge_days', 7),
                'daily_limit' => (int) PaymentSetting::get('unlock_challenge_daily_limit', 10),
                'rotate_after' => (int) PaymentSetting::get('unlock_rotate_after', 0),
                'ip_daily_limit' => (int) PaymentSetting::get('unlock_ip_daily_limit', 0),
                'sandbox' => app(\App\Services\ChapterUnlockService::class)->sandbox(),
                // False outside local, so the modal can say the switch is inert
                // here rather than showing a toggle that quietly does nothing.
                'sandbox_allowed' => app(\App\Services\ChapterUnlockService::class)->sandboxAllowed(),
                // Surfaced so the modal can warn instead of silently doing nothing.
                'token_configured' => app(\App\Services\ChapterUnlockService::class)->provider()->configured(),
                // The shortener the challenge runs through, and the ones on
                // offer (with whether each has its API token in .env).
                'provider' => app(\App\Services\ChapterUnlockService::class)->provider()->name(),
                'providers' => collect(app(\App\Services\ChapterUnlockService::class)->providers())
                    ->map(fn ($p) => ['name' => $p->name(), 'label' => $p->label(), 'configured' => $p->configured()])
                    ->values()->all(),
                'min_seconds' => app(\App\Services\ChapterUnlockService::class)->minChallengeSeconds(),
            ],
        ]);
    }

    public function show(Series $series)
    {
        // Chapter bodies are deliberately absent: this page lists chapters, it
        // does not display them. Shipping every content column turned the
        // payload into 3.2 MB on a long series. The editor fetches the one body
        // it needs from admin.chapters.content when it opens.
        $series->load(['nativeLanguage', 'genres', 'chapters' => function ($query) {
            $query->select([
                'id', 'series_id', 'title', 'chapter_number', 'chapter_link',
                'volume', 'is_premium', 'coin_price', 'is_published', 'views',
                'unlock_shortlink', 'unlock_token', 'created_at', 'updated_at',
            ])->orderBy('chapter_number');
        }]);

        // Show the live provider's link per chapter: with ShrinkEarn (or on a
        // non-main host) links are not kept in the unlock_shortlink column.
        $links = app(\App\Services\ChapterUnlockService::class)->currentShortlinks($series->chapters);
        $series->chapters->each(function ($chapter) use ($links) {
            $chapter->unlock_shortlink = $links[$chapter->id] ?? null;
            $chapter->makeHidden('unlock_token');
        });

        // Add raw cover URL for editing (bypass accessor)
        $seriesData = $series->toArray();
        $seriesData['cover_url_raw'] = $series->getOriginal('cover_url');

        return Inertia::render('Admin/Series/Show', [
            'series' => $seriesData,
            // Projected to arrays: EbookSeries appends price_range, whose
            // accessor reads $this->items, so returning models lazy-loads every
            // volume — 303 KB for a three-field dropdown.
            'ebookSeriesOptions' => EbookSeries::orderBy('title')
                ->get(['id', 'title', 'slug'])
                ->map(fn ($e) => ['id' => $e->id, 'title' => $e->title, 'slug' => $e->slug])
                ->all(),
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
            app(ThumbnailService::class)->generate($path);
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
            app(ThumbnailService::class)->generate($path);
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
            'ebook_series_options' => EbookSeries::orderBy('title')->get(['id', 'title', 'slug']),
        ]);
    }

    public function updateChapterPrice(Request $request)
    {
        $validated = $request->validate([
            'price' => 'required|integer|min:1|max:9999',
            'challenge_enabled' => 'required|boolean',
            // 0 means unlimited, which is why the floor is 0 rather than 1.
            'challenge_days' => 'required|integer|min:1|max:365',
            'challenge_daily_limit' => 'required|integer|min:0|max:100',
            // 0 disables rotation, which is why the floor is 0 rather than 1.
            'challenge_rotate_after' => 'required|integer|min:0|max:100',
            'challenge_ip_daily_limit' => 'required|integer|min:0|max:100',
            'challenge_sandbox' => 'required|boolean',
            'challenge_provider' => 'required|in:'.implode(',', array_keys(app(\App\Services\ChapterUnlockService::class)->providers())),
        ]);

        PaymentSetting::set('premium_chapter_price', $validated['price'], 'integer', 'Global coin price for unlocking a premium chapter');
        PaymentSetting::set('unlock_challenge_enabled', $validated['challenge_enabled'] ? 1 : 0, 'boolean', 'Offer free chapter access through the Move2Link challenge');
        PaymentSetting::set('unlock_challenge_days', $validated['challenge_days'], 'integer', 'How many days challenge-earned access lasts');
        PaymentSetting::set('unlock_challenge_daily_limit', $validated['challenge_daily_limit'], 'integer', 'Free unlocks a reader may earn per day (0 = unlimited)');
        PaymentSetting::set('unlock_rotate_after', $validated['challenge_rotate_after'], 'integer', 'Grants a claim token may serve before it is retired (0 = never rotate)');
        PaymentSetting::set('unlock_ip_daily_limit', $validated['challenge_ip_daily_limit'], 'integer', 'Free unlocks one IP address may earn per day across all accounts (0 = off)');
        PaymentSetting::set('unlock_challenge_sandbox', $validated['challenge_sandbox'] ? 1 : 0, 'boolean', 'Bypass Move2Link with a local stand-in gate — testing only');
        PaymentSetting::set('unlock_shortlink_provider', $validated['challenge_provider'], 'string', 'Shortlink provider the free-unlock challenge runs through');

        return back()->with('success', $validated['challenge_sandbox']
            ? 'Settings saved. Sandbox is ON — readers can unlock without seeing an ad.'
            : 'Settings saved.');
    }
}
