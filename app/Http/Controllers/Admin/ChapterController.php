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
        
        // Set definition cache for custom elements
        $config->set('HTML.DefinitionID', 'ckeditor-content');
        $config->set('HTML.DefinitionRev', 1);
        
        // Enhanced allowed HTML tags for chapter content
        $config->set('HTML.Allowed', 
            'p,br,strong,em,b,i,u,s,sup,sub,' .
            'h1,h2,h3,h4,h5,h6,' .
            'ul,ol,li,' .
            'img[src|alt|title|width|height|style|class],' .
            'a[href|title|target],' .
            'blockquote,code,pre,' .
            'span[style|class],div[style|class],' .
            'hr'
        );
        
        // Use more permissive CSS - allow all safe properties
        $config->set('CSS.AllowTricky', true);
        $config->set('CSS.Proprietary', true);
        
        // Allow target="_blank" for links
        $config->set('Attr.AllowedFrameTargets', ['_blank']);
        
        // Allow data URIs for images (base64)
        $config->set('URI.AllowedSchemes', [
            'http' => true,
            'https' => true,
            'data' => true, // Allow base64 images
        ]);
        
        // Preserve line breaks and whitespace
        $config->set('AutoFormat.RemoveEmpty', false);
        $config->set('AutoFormat.RemoveEmpty.RemoveNbsp', false);
        $config->set('Core.NormalizeNewlines', false);
        $config->set('AutoFormat.Linkify', false);
        $config->set('AutoFormat.AutoParagraph', false);
        $config->set('HTML.TidyLevel', 'none');
        $config->set('Output.TidyFormat', false);
        
        // Get definition object and add custom elements
        if ($def = $config->maybeGetRawHTMLDefinition()) {
            // Add figure element (block-level, can contain img and figcaption)
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
        $cleanContent = $purifier->purify($content);
        
        // Return clean content without auto-formatting to preserve plain text
        return $cleanContent;
    }

    public function store(Request $request, Series $series)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'is_premium' => 'required|boolean',
            'volume' => 'nullable|numeric|min:0',
            'chapter_number' => 'nullable|numeric|min:0',
            'use_volume' => 'nullable|boolean',
        ]);

        $validated['series_id'] = $series->id;
        
        // Ensure is_premium is treated as boolean
        $validated['is_premium'] = (bool) $validated['is_premium'];
        $validated['content'] = $this->sanitizeHtmlContent($validated['content']);
        
        // Set coin_price to 0 (deprecated field, kept for backward compatibility)
        $validated['coin_price'] = 0;

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
            'is_premium' => 'required|boolean',
            'volume' => 'nullable|numeric|min:0',
            'chapter_number' => 'nullable|numeric|min:0',
            'use_volume' => 'nullable|boolean',
        ]);

        // Ensure is_premium is treated as boolean
        $validated['is_premium'] = (bool) $validated['is_premium'];
        $validated['content'] = $this->sanitizeHtmlContent($validated['content']);
        
        // Set coin_price to 0 (deprecated field, kept for backward compatibility)
        $validated['coin_price'] = 0;

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

    /**
     * Toggle premium status of a chapter
     */
    public function togglePremium(Request $request, Chapter $chapter)
    {
        $request->validate([
            'is_premium' => 'required|boolean'
        ]);

        $chapter->update([
            'is_premium' => $request->is_premium
        ]);

        return redirect()->back()->with('success', 'Chapter premium status updated successfully');
    }

    /**
     * Upload image for chapter content (CKEditor)
     */
    public function uploadImage(Request $request)
    {
        $request->validate([
            'upload' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max
        ]);

        if ($request->hasFile('upload')) {
            $image = $request->file('upload');
            $path = $image->store('chapter-images', 'public');
            $url = asset('storage/' . $path);

            // CKEditor expects this specific response format
            return response()->json([
                'url' => $url
            ]);
        }

        return response()->json([
            'error' => [
                'message' => 'Image upload failed'
            ]
        ], 400);
    }
}
