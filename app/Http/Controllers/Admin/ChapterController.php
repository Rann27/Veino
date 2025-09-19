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
        
        // Return clean content without auto-formatting to preserve plain text
        return $cleanContent;
    }

    public function store(Request $request, Series $series)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'is_premium' => 'required|in:0,1,true,false', // Accept multiple formats
            'coin_price' => 'nullable|integer|min:0', // Changed from min:1 to min:0
            'volume' => 'nullable|numeric|min:0',
            'chapter_number' => 'nullable|numeric|min:0',
            'use_volume' => 'nullable|boolean',
        ]);

        $validated['series_id'] = $series->id;
        
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

        // Use database transaction to prevent race conditions
        $maxRetries = 3;
        $attempt = 0;
        
        while ($attempt < $maxRetries) {
            try {
                \DB::transaction(function () use (&$validated, $series) {
                    // If volume is being used
                    if (!empty($validated['volume'])) {
                        // If chapter_number is provided, use it; otherwise auto-increment within volume
                        if (empty($validated['chapter_number'])) {
                            $maxChapterInVolume = Chapter::where('series_id', $series->id)
                                ->where('volume', $validated['volume'])
                                ->lockForUpdate()
                                ->max('chapter_number');
                            
                            $validated['chapter_number'] = $maxChapterInVolume ? $maxChapterInVolume + 1 : 1;
                        }
                    } else {
                        // Traditional webnovel style - no volume, auto-increment chapter
                        $validated['volume'] = null;
                        
                        if (empty($validated['chapter_number'])) {
                            $maxChapterNumber = Chapter::where('series_id', $series->id)
                                ->whereNull('volume')
                                ->lockForUpdate()
                                ->max('chapter_number');
                            
                            $validated['chapter_number'] = $maxChapterNumber ? $maxChapterNumber + 1 : 1;
                        }
                    }
                    
                    // Remove the use_volume flag before creating
                    unset($validated['use_volume']);
                    
                    Chapter::create($validated);
                });
                
                // If we get here, transaction succeeded
                break;
                
            } catch (\Illuminate\Database\QueryException $e) {
                $attempt++;
                
                // If it's a duplicate key error and we have retries left, try again
                if ($e->getCode() == '23000' && $attempt < $maxRetries) {
                    // Wait a small random time before retry
                    usleep(rand(10000, 50000)); // 10-50ms
                    continue;
                }
                
                // If it's not a duplicate error or we're out of retries, rethrow
                throw $e;
            }
        }

        return redirect()->back()->with('success', 'Chapter created successfully');
    }

    public function update(Request $request, Chapter $chapter)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'is_premium' => 'required|in:0,1,true,false', // Accept multiple formats
            'coin_price' => 'nullable|integer|min:0', // Changed from min:1 to min:0
            'volume' => 'nullable|numeric|min:0',
            'chapter_number' => 'nullable|numeric|min:0',
            'use_volume' => 'nullable|boolean',
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

        // Handle volume/chapter_number logic for updates
        if (!empty($validated['volume'])) {
            // Keep volume, validate chapter_number if provided
            if (empty($validated['chapter_number'])) {
                $validated['chapter_number'] = $chapter->chapter_number; // Keep existing
            }
        } else {
            // No volume - traditional webnovel style
            $validated['volume'] = null;
            if (empty($validated['chapter_number'])) {
                $validated['chapter_number'] = $chapter->chapter_number; // Keep existing
            }
        }

        // Remove the use_volume flag before updating
        unset($validated['use_volume']);

        $chapter->update($validated);

        return redirect()->back()->with('success', 'Chapter updated successfully');
    }

    public function destroy(Chapter $chapter)
    {
        $chapter->delete();
        return redirect()->back()->with('success', 'Chapter deleted successfully');
    }
}
