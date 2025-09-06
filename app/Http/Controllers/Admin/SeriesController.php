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
        $config->set('HTML.Allowed', 'p,br,strong,em,b,i,u,h1,h2,h3,h4,h5,h6,ul,ol,li,img[src|alt|title|width|height],a[href|title],blockquote,code,pre,span[style],div[style]');
        $config->set('Attr.AllowedFrameTargets', ['_blank']);
        $config->set('CSS.AllowedProperties', 'color,background-color,text-align,font-weight,font-style,text-decoration,margin,padding');
        
        $purifier = new HTMLPurifier($config);
        return $purifier->purify($content);
    }

    public function index()
    {
        $series = Series::with(['nativeLanguage', 'genres'])
            ->withCount('chapters')
            ->latest()
            ->paginate(12);

        return Inertia::render('Admin/Series/Index', [
            'series' => $series,
        ]);
    }

    public function show(Series $series)
    {
        $series->load(['nativeLanguage', 'genres', 'chapters' => function($query) {
            $query->orderBy('chapter_number');
        }]);

        return Inertia::render('Admin/Series/Show', [
            'series' => $series,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'alternative_title' => 'nullable|string|max:255',
            'cover_url' => 'nullable|url',
            'synopsis' => 'nullable|string',
            'author' => 'nullable|string|max:255',
            'artist' => 'nullable|string|max:255',
            'rating' => 'nullable|numeric|min:0|max:10',
            'status' => 'required|in:ongoing,complete,hiatus',
            'native_language_id' => 'required|exists:native_languages,id',
            'genre_ids' => 'required|array',
            'genre_ids.*' => 'exists:genres,id',
        ]);

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
            'cover_url' => 'nullable|url',
            'synopsis' => 'nullable|string',
            'author' => 'nullable|string|max:255',
            'artist' => 'nullable|string|max:255',
            'rating' => 'nullable|numeric|min:0|max:10',
            'status' => 'required|in:ongoing,complete,hiatus',
            'native_language_id' => 'required|exists:native_languages,id',
            'genre_ids' => 'required|array',
            'genre_ids.*' => 'exists:genres,id',
        ]);

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
