<?php

namespace App\Http\Controllers;

use App\Models\Series;
use App\Models\Chapter;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Carbon\Carbon;

class SitemapController extends Controller
{
    public function index()
    {
        // Static URLs dengan prioritas dan frekuensi update
        $staticUrls = [
            [
                'url' => route('home'),
                'lastmod' => Carbon::now()->toISOString(),
                'changefreq' => 'daily',
                'priority' => '1.0'
            ],
            [
                'url' => route('explore'),
                'lastmod' => Carbon::now()->toISOString(),
                'changefreq' => 'daily',
                'priority' => '0.9'
            ],
            [
                'url' => route('shop'),
                'lastmod' => Carbon::now()->toISOString(),
                'changefreq' => 'weekly',
                'priority' => '0.7'
            ],
            [
                'url' => route('privacy'),
                'lastmod' => Carbon::now()->toISOString(),
                'changefreq' => 'monthly',
                'priority' => '0.5'
            ],
            [
                'url' => route('dmca'),
                'lastmod' => Carbon::now()->toISOString(),
                'changefreq' => 'monthly',
                'priority' => '0.5'
            ],
            [
                'url' => route('contact'),
                'lastmod' => Carbon::now()->toISOString(),
                'changefreq' => 'monthly',
                'priority' => '0.5'
            ]
        ];

        // URLs dinamis untuk series
        $seriesUrls = [];
        $series = Series::select('slug', 'updated_at')->get();
        
        foreach ($series as $singleSeries) {
            $seriesUrls[] = [
                'url' => route('series.show', $singleSeries->slug),
                'lastmod' => $singleSeries->updated_at->toISOString(),
                'changefreq' => 'weekly',
                'priority' => '0.8'
            ];
        }

        // URLs dinamis untuk chapter gratis (premium chapter tidak diindeks)
        $chapterUrls = [];
        $chapters = Chapter::select('chapter_link', 'series_id', 'updated_at')
            ->where('is_premium', false)
            ->where('is_published', true)
            ->with('series:id,slug')
            ->get();

        foreach ($chapters as $chapter) {
            if ($chapter->series) {
                $chapterUrls[] = [
                    'url' => route('chapters.show', [$chapter->series->slug, $chapter->chapter_link]),
                    'lastmod' => $chapter->updated_at->toISOString(),
                    'changefreq' => 'monthly',
                    'priority' => '0.6'
                ];
            }
        }

        // Gabungkan semua URLs
        $urls = array_merge($staticUrls, $seriesUrls, $chapterUrls);

        // Generate XML
        $xml = $this->generateSitemapXml($urls);

        return response($xml, 200, [
            'Content-Type' => 'application/xml'
        ]);
    }

    private function generateSitemapXml($urls)
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        foreach ($urls as $url) {
            $xml .= '  <url>' . "\n";
            $xml .= '    <loc>' . htmlspecialchars($url['url']) . '</loc>' . "\n";
            $xml .= '    <lastmod>' . $url['lastmod'] . '</lastmod>' . "\n";
            $xml .= '    <changefreq>' . $url['changefreq'] . '</changefreq>' . "\n";
            $xml .= '    <priority>' . $url['priority'] . '</priority>' . "\n";
            $xml .= '  </url>' . "\n";
        }

        $xml .= '</urlset>';

        return $xml;
    }
}