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
        
        // Enhanced allowed HTML tags for chapter content
        $config->set('HTML.Allowed', 
            'p,br,strong,em,b,i,u,s,sup,sub,' .
            'h1,h2,h3,h4,h5,h6,' .
            'ul,ol,li,' .
            'img[src|alt|title|width|height|style],' .
            'a[href|title|target],' .
            'blockquote,code,pre,' .
            'span[style],div[style],' .
            'hr'
        );
        
        // Allow safe CSS properties
        $config->set('CSS.AllowedProperties', 
            'color,background-color,text-align,font-weight,font-style,text-decoration,' .
            'margin,margin-top,margin-bottom,margin-left,margin-right,' .
            'padding,padding-top,padding-bottom,padding-left,padding-right,' .
            'width,height,max-width,max-height,' .
            'border,border-radius,' .
            'display,float,clear'
        );
        
        // Allow target="_blank" for links
        $config->set('Attr.AllowedFrameTargets', ['_blank']);
        
        // Preserve line breaks and whitespace
        $config->set('AutoFormat.RemoveEmpty', false);
        $config->set('AutoFormat.RemoveEmpty.RemoveNbsp', false);
        $config->set('Core.NormalizeNewlines', false);
        $config->set('AutoFormat.Linkify', false);
        $config->set('AutoFormat.AutoParagraph', false);
        $config->set('HTML.TidyLevel', 'none');
        $config->set('Output.TidyFormat', false);
        
        $purifier = new HTMLPurifier($config);
        $cleanContent = $purifier->purify($content);
        
        // Additional processing to preserve line breaks
        // Convert double line breaks to proper paragraph breaks
        $cleanContent = preg_replace('/\n\s*\n/', '</p><p>', $cleanContent);
        
        // Ensure content is wrapped in paragraphs if not already
        if (!preg_match('/^<p>/', trim($cleanContent))) {
            $cleanContent = '<p>' . $cleanContent . '</p>';
        }
        
        // Convert single line breaks to <br> tags within paragraphs
        $cleanContent = preg_replace('/(?<!>)\n(?!<)/', '<br>', $cleanContent);
        
        return $cleanContent;
    }

    public function store(Request $request, Series $series)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'is_premium' => 'required|in:0,1,true,false', // Accept multiple formats
            'coin_price' => 'nullable|integer|min:0', // Changed from min:1 to min:0
        ]);

        $validated['series_id'] = $series->id;
        $validated['chapter_number'] = $series->getNextChapterNumber();
        
        // Ensure is_premium is treated as boolean regardless of input format
        $validated['is_premium'] = in_array($validated['is_premium'], [1, '1', true, 'true']);
        $validated['content'] = $this->sanitizeHtmlContent($validated['content']);
        
        if (!$validated['is_premium']) {
            $validated['coin_price'] = 0;
        } else {
            // For premium chapters, ensure coin_price is at least 1
            if (!isset($validated['coin_price']) || $validated['coin_price'] < 1) {
                $validated['coin_price'] = 45; // Default value
            }
        }

        Chapter::create($validated);

        return redirect()->back()->with('success', 'Chapter created successfully');
    }

    public function update(Request $request, Chapter $chapter)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'is_premium' => 'required|in:0,1,true,false', // Accept multiple formats
            'coin_price' => 'nullable|integer|min:0', // Changed from min:1 to min:0
        ]);

        // Ensure is_premium is treated as boolean regardless of input format
        $validated['is_premium'] = in_array($validated['is_premium'], [1, '1', true, 'true']);
        $validated['content'] = $this->sanitizeHtmlContent($validated['content']);
        
        if (!$validated['is_premium']) {
            $validated['coin_price'] = 0;
        } else {
            // For premium chapters, ensure coin_price is at least 1
            if (!isset($validated['coin_price']) || $validated['coin_price'] < 1) {
                $validated['coin_price'] = 45; // Default value
            }
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
