<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Chapter;
use App\Models\Series;
use App\Services\DocxParser;
use HTMLPurifier;
use HTMLPurifier_Config;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BatchController extends Controller
{
    // ── Pages ────────────────────────────────────────────────────────────────

    public function batchUploadPage(Series $series)
    {
        return Inertia::render('Admin/Series/BatchUpload', [
            'series' => [
                'id'    => $series->id,
                'title' => $series->title,
                'slug'  => $series->slug,
            ],
        ]);
    }

    public function batchManagerPage(Series $series)
    {
        $chapters = Chapter::where('series_id', $series->id)
            ->orderBy('volume')
            ->orderBy('chapter_number')
            ->get(['id', 'chapter_number', 'volume', 'chapter_link', 'title', 'is_premium']);

        return Inertia::render('Admin/Series/BatchManager', [
            'series'   => [
                'id'    => $series->id,
                'title' => $series->title,
                'slug'  => $series->slug,
            ],
            'chapters' => $chapters,
        ]);
    }

    // ── API: Parse DOCX files ─────────────────────────────────────────────────

    public function parseDocx(Request $request)
    {
        $request->validate([
            'files'            => 'required|array|min:1',
            'files.*.filename' => 'required|string',
            'files.*.content'  => 'required|string',
        ]);

        $parser  = new DocxParser();
        $results = [];

        foreach ($request->input('files') as $fileData) {
            $filename = $fileData['filename'];

            if (strtolower(pathinfo($filename, PATHINFO_EXTENSION)) !== 'docx') {
                $results[] = ['filename' => $filename, 'error' => 'Not a .docx file'];
                continue;
            }

            try {
                $decoded = base64_decode($fileData['content'], strict: true);
                if ($decoded === false) {
                    throw new \RuntimeException('Invalid file encoding');
                }

                $tmpPath = tempnam(sys_get_temp_dir(), 'docx_');
                file_put_contents($tmpPath, $decoded);

                try {
                    $parsed = $parser->parse($tmpPath);
                } finally {
                    @unlink($tmpPath);
                }

                $results[] = [
                    'filename' => $filename,
                    'title'    => $parsed['title'],
                    'content'  => $parsed['content'],
                ];
            } catch (\Throwable $e) {
                $results[] = ['filename' => $filename, 'error' => $e->getMessage()];
            }
        }

        return response()->json($results);
    }

    // ── API: Batch store chapters ─────────────────────────────────────────────

    public function batchStore(Request $request, Series $series)
    {
        $request->validate([
            'chapters'                  => 'required|array|min:1',
            'chapters.*.title'          => 'required|string|max:255',
            'chapters.*.content'        => 'required|string',
            'chapters.*.is_premium'     => 'boolean',
            'chapters.*.chapter_number' => 'nullable|numeric|min:0',
            'chapters.*.volume'         => 'nullable|numeric|min:0',
        ]);

        $created = [];

        DB::transaction(function () use ($request, $series, &$created) {
            foreach ($request->chapters as $item) {
                $volume        = isset($item['volume']) && $item['volume'] !== '' ? (float) $item['volume'] : null;
                $chapterNumber = isset($item['chapter_number']) && $item['chapter_number'] !== ''
                    ? (float) $item['chapter_number']
                    : null;

                if ($chapterNumber === null) {
                    $query = Chapter::where('series_id', $series->id)->lockForUpdate();
                    if ($volume !== null) {
                        $query->where('volume', $volume);
                    } else {
                        $query->whereNull('volume');
                    }
                    $max           = $query->max('chapter_number');
                    $chapterNumber = $max ? $max + 1 : 1;
                }

                $chapterLink = $this->buildChapterLink($volume, $chapterNumber);
                $content     = $this->sanitize($item['content']);

                $chapter = Chapter::create([
                    'series_id'      => $series->id,
                    'title'          => $item['title'],
                    'content'        => $content,
                    'is_premium'     => (bool) ($item['is_premium'] ?? false),
                    'coin_price'     => 0,
                    'is_published'   => true,
                    'chapter_number' => $chapterNumber,
                    'chapter_link'   => $chapterLink,
                    'volume'         => $volume,
                    'views'          => 0,
                ]);

                $created[] = [
                    'id'             => $chapter->id,
                    'title'          => $chapter->title,
                    'chapter_number' => $chapter->chapter_number,
                    'volume'         => $chapter->volume,
                    'chapter_link'   => $chapter->chapter_link,
                    'is_premium'     => $chapter->is_premium,
                ];
            }
        });

        return response()->json(['success' => true, 'created' => $created]);
    }

    // ── API: Batch update chapters ────────────────────────────────────────────

    public function batchUpdate(Request $request, Series $series)
    {
        $request->validate([
            'chapters'                  => 'required|array',
            'chapters.*.id'             => 'required|integer|exists:chapters,id',
            'chapters.*.title'          => 'required|string|max:255',
            'chapters.*.chapter_number' => 'required|numeric|min:0',
            'chapters.*.volume'         => 'nullable|numeric|min:0',
            'chapters.*.is_premium'     => 'boolean',
        ]);

        DB::transaction(function () use ($request, $series) {
            foreach ($request->chapters as $item) {
                $chapter = Chapter::where('id', $item['id'])
                    ->where('series_id', $series->id)
                    ->firstOrFail();

                $volume        = isset($item['volume']) && $item['volume'] !== '' ? (float) $item['volume'] : null;
                $chapterNumber = (float) $item['chapter_number'];
                $chapterLink   = $this->buildChapterLink($volume, $chapterNumber);

                $chapter->update([
                    'title'          => $item['title'],
                    'chapter_number' => $chapterNumber,
                    'volume'         => $volume,
                    'chapter_link'   => $chapterLink,
                    'is_premium'     => (bool) ($item['is_premium'] ?? false),
                ]);
            }
        });

        return response()->json(['success' => true]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function buildChapterLink(?float $volume, float $chapterNumber): string
    {
        $num = rtrim(rtrim(number_format($chapterNumber, 2, '.', ''), '0'), '.');
        if ($volume !== null) {
            $vol = rtrim(rtrim(number_format($volume, 2, '.', ''), '0'), '.');
            return "v{$vol}c{$num}";
        }
        return $num;
    }

    private function sanitize(string $content): string
    {
        $config = HTMLPurifier_Config::createDefault();
        $config->set('HTML.DefinitionID', 'batch-chapter');
        $config->set('HTML.DefinitionRev', 1);
        $config->set('HTML.Allowed',
            'p,br,strong,em,b,i,u,s,sup,sub,' .
            'h1,h2,h3,h4,h5,h6,' .
            'ul,ol,li,' .
            'blockquote,code,pre,' .
            'span[style|class],' .
            'hr'
        );
        $config->set('AutoFormat.RemoveEmpty', false);
        $config->set('AutoFormat.AutoParagraph', false);

        return (new HTMLPurifier($config))->purify($content);
    }
}
