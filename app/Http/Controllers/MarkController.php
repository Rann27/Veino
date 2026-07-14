<?php

namespace App\Http\Controllers;

use App\Models\Chapter;
use App\Models\Mark;
use App\Models\Series;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MarkController extends Controller
{
    /**
     * Create a mark on a paragraph.
     */
    public function store(Request $request, string $seriesSlug, string $chapterLink)
    {
        $request->validate([
            'paragraph_index'   => 'required|integer|min:0|max:9999',
            'paragraph_preview' => 'nullable|string|max:200',
        ]);

        $series  = Series::where('slug', $seriesSlug)->firstOrFail();
        $chapter = Chapter::where('series_id', $series->id)
            ->where('chapter_link', $chapterLink)
            ->firstOrFail();

        $user = Auth::user();

        // If mark already exists for this paragraph, delete it (toggle off)
        $existing = Mark::where('user_id', $user->id)
            ->where('chapter_id', $chapter->id)
            ->where('paragraph_index', $request->paragraph_index)
            ->first();

        if ($existing) {
            $existing->delete();
            return response()->json(['action' => 'removed', 'id' => $existing->id]);
        }

        $mark = Mark::create([
            'user_id'           => $user->id,
            'series_id'         => $series->id,
            'chapter_id'        => $chapter->id,
            'paragraph_index'   => $request->paragraph_index,
            'paragraph_preview' => mb_substr(strip_tags($request->paragraph_preview ?? ''), 0, 200),
        ]);

        return response()->json(['action' => 'added', 'id' => $mark->id]);
    }

    /**
     * Get all marks for a series (for current auth user).
     */
    public function forSeries(string $seriesSlug)
    {
        $series = Series::where('slug', $seriesSlug)->firstOrFail();
        $user   = Auth::user();

        $marks = Mark::where('user_id', $user->id)
            ->where('series_id', $series->id)
            ->with('chapter:id,title,chapter_number,chapter_link,volume')
            ->orderBy('chapter_id')
            ->orderBy('paragraph_index')
            ->get()
            ->map(fn($m) => [
                'id'                => $m->id,
                'chapter_id'        => $m->chapter_id,
                'chapter_title'     => $m->chapter->title,
                'chapter_number'    => $m->chapter->chapter_number,
                'chapter_link'      => $m->chapter->chapter_link,
                'chapter_volume'    => $m->chapter->volume,
                'paragraph_index'   => $m->paragraph_index,
                'paragraph_preview' => $m->paragraph_preview,
                'created_at'        => $m->created_at->toISOString(),
            ]);

        return response()->json($marks);
    }

    /**
     * Delete a mark by ID.
     */
    public function destroy(int $markId)
    {
        $mark = Mark::where('id', $markId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $mark->delete();

        return response()->json(['action' => 'removed']);
    }
}
