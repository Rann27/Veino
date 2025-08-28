<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Chapter;
use App\Models\Series;
use Illuminate\Http\Request;
use HTMLPurifier;
use HTMLPurifier_Config;

class ChapterController extends Controller
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

    public function store(Request $request, Series $series)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'is_premium' => 'boolean',
            'coin_price' => 'nullable|integer|min:1',
        ]);

        $validated['series_id'] = $series->id;
        $validated['chapter_number'] = $series->getNextChapterNumber();
        $validated['is_premium'] = $request->boolean('is_premium');
        $validated['content'] = $this->sanitizeHtmlContent($validated['content']);
        
        if (!$validated['is_premium']) {
            $validated['coin_price'] = 0;
        } else {
            $validated['coin_price'] = $validated['coin_price'] ?? 45;
        }

        Chapter::create($validated);

        return redirect()->back()->with('success', 'Chapter created successfully');
    }

    public function update(Request $request, Chapter $chapter)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'is_premium' => 'boolean',
            'coin_price' => 'nullable|integer|min:1',
        ]);

        $validated['is_premium'] = $request->boolean('is_premium');
        $validated['content'] = $this->sanitizeHtmlContent($validated['content']);
        
        if (!$validated['is_premium']) {
            $validated['coin_price'] = 0;
        } else {
            $validated['coin_price'] = $validated['coin_price'] ?? 45;
        }

        $chapter->update($validated);

        return redirect()->back()->with('success', 'Chapter updated successfully');
    }

    public function destroy(Chapter $chapter)
    {
        $chapter->delete();
        return redirect()->back()->with('success', 'Chapter deleted successfully');
    }
}
