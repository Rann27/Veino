<?php

namespace App\Services;

use DOMDocument;
use DOMXPath;
use Illuminate\Support\Facades\Storage;

class DocxParser
{
    private const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    private const A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
    private const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    private const V = 'urn:schemas-microsoft-com:vml';

    /** Formats a browser can actually render. Word also embeds EMF/WMF for
     *  pasted vector art; emitting those would just produce broken images. */
    private const WEB_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

    /** Where extracted images land — the same folder CKEditor uploads use. */
    private const IMAGE_DIR = 'chapter-images';

    private ?\ZipArchive $archive = null;

    /** Raw bytes of the .docx, only populated on the pure-PHP path. */
    private string $rawZip = '';

    /** @var array<string, array{method: int, size: int, offset: int}> */
    private array $zipIndex = [];

    /** Relationship id → target path inside `word/`. @var array<string, string> */
    private array $relations = [];

    /**
     * Parse a .docx file. Returns ['title' => string, 'content' => string].
     * Title  = first Heading-1 paragraph (or first non-empty paragraph if none found).
     * Content = everything after the title, converted to HTML.
     *
     * Embedded images are written to public storage and referenced with <img>,
     * so a chapter imported from Word keeps its illustrations at the fidelity
     * Word stored them — no clipboard round-trip to degrade them.
     *
     * Works without ext-zip — falls back to a pure-PHP ZIP reader (needs only zlib).
     */
    public function parse(string $filePath): array
    {
        $this->openZip($filePath);

        try {
            $xml = $this->readEntry('word/document.xml');

            if ($xml === null) {
                throw new \RuntimeException('Invalid DOCX: word/document.xml not found');
            }

            $this->relations = $this->loadRelations();

            return $this->buildHtml($xml);
        } finally {
            $this->closeZip();
        }
    }

    /** @return array{title: string, content: string} */
    private function buildHtml(string $xml): array
    {
        $dom = new DOMDocument();
        @$dom->loadXML($xml, LIBXML_NOERROR | LIBXML_NOWARNING);

        $xpath = new DOMXPath($dom);
        $xpath->registerNamespace('w', self::W);
        $xpath->registerNamespace('a', self::A);
        $xpath->registerNamespace('r', self::R);
        $xpath->registerNamespace('v', self::V);

        $title = '';
        $titleFound = false;
        $parts = [];

        foreach ($xpath->query('//w:body/w:p') as $para) {
            $styleVal = $this->getParagraphStyle($xpath, $para);
            $inner = $this->runHtml($xpath, $para);

            // An image-only paragraph has no text but must not be dropped.
            if (trim(strip_tags($inner)) === '' && ! str_contains($inner, '<img')) {
                continue;
            }

            // Heading 1 → chapter title (first occurrence only)
            if (! $titleFound && $this->isHeading($styleVal, 1) && ! str_contains($inner, '<img')) {
                $title = html_entity_decode(strip_tags($inner), ENT_QUOTES | ENT_HTML5, 'UTF-8');
                $titleFound = true;
                continue;
            }

            // Other headings
            if (preg_match('/^(heading|heading\s*)(\d)/i', $styleVal, $m)) {
                $level = (int) $m[2];
                $parts[] = "<h{$level}>{$inner}</h{$level}>";
                continue;
            }

            $align = $this->getParagraphAlign($xpath, $para);
            $alignAttr = $align ? " style=\"text-align:{$align}\"" : '';
            $parts[] = "<p{$alignAttr}>{$inner}</p>";
        }

        // Fallback: no Heading 1 → promote the first paragraph that has text.
        // Skipping image-only paragraphs keeps an illustration out of the title.
        if (! $titleFound) {
            foreach ($parts as $i => $part) {
                $text = trim(strip_tags($part));

                if ($text !== '') {
                    $title = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                    unset($parts[$i]);
                    break;
                }
            }
        }

        return [
            'title' => trim($title),
            'content' => implode("\n", array_values($parts)),
        ];
    }

    // ── Images ────────────────────────────────────────────────────────────────

    /** Maps relationship ids to their targets inside the `word/` folder. */
    private function loadRelations(): array
    {
        $xml = $this->readEntry('word/_rels/document.xml.rels');

        if ($xml === null) {
            return [];
        }

        $dom = new DOMDocument();
        @$dom->loadXML($xml, LIBXML_NOERROR | LIBXML_NOWARNING);

        $map = [];

        foreach ($dom->getElementsByTagName('Relationship') as $rel) {
            // External images live on someone else's server; nothing to extract.
            if (strtolower((string) $rel->getAttribute('TargetMode')) === 'external') {
                continue;
            }

            $id = $rel->getAttribute('Id');
            $target = ltrim($rel->getAttribute('Target'), '/');

            if ($id !== '' && $target !== '') {
                $map[$id] = $target;
            }
        }

        return $map;
    }

    /** Returns the <img> tag for a run's embedded picture, or '' if there isn't one. */
    private function imageHtml(DOMXPath $xpath, \DOMNode $run): string
    {
        $embed = $xpath->query('.//a:blip/@r:embed', $run);
        $relId = $embed->length > 0 ? (string) $embed->item(0)->nodeValue : '';

        if ($relId === '') {
            // Legacy VML pictures (older Word documents)
            $vml = $xpath->query('.//v:imagedata/@r:id', $run);
            $relId = $vml->length > 0 ? (string) $vml->item(0)->nodeValue : '';
        }

        if ($relId === '' || ! isset($this->relations[$relId])) {
            return '';
        }

        $target = $this->relations[$relId];
        $extension = strtolower(pathinfo($target, PATHINFO_EXTENSION));

        if (! in_array($extension, self::WEB_IMAGE_EXTENSIONS, true)) {
            return '';
        }

        $bytes = $this->readEntry('word/'.$target);

        if ($bytes === null || $bytes === '') {
            return '';
        }

        // Content-addressed name: the same picture used twice in one document —
        // or re-imported later — is stored once.
        $path = self::IMAGE_DIR.'/docx-'.sha1($bytes).'.'.$extension;

        if (! Storage::disk('public')->exists($path)) {
            Storage::disk('public')->put($path, $bytes);
        }

        $url = asset('storage/'.$path);

        // No width/height: the reader caps images at container width, and
        // pinning Word's display size would throw away the resolution that
        // makes small text in illustrations readable.
        return '<img src="'.htmlspecialchars($url, ENT_QUOTES | ENT_HTML5, 'UTF-8').'" alt="">';
    }

    // ── ZIP access ────────────────────────────────────────────────────────────

    private function openZip(string $filePath): void
    {
        $this->archive = null;
        $this->rawZip = '';
        $this->zipIndex = [];
        $this->relations = [];

        if (class_exists('ZipArchive')) {
            $zip = new \ZipArchive();

            if ($zip->open($filePath) === true) {
                $this->archive = $zip;

                return;
            }
        }

        $this->indexZip($filePath);
    }

    private function closeZip(): void
    {
        $this->archive?->close();
        $this->archive = null;
        $this->rawZip = '';
        $this->zipIndex = [];
    }

    private function readEntry(string $entryName): ?string
    {
        if ($this->archive !== null) {
            $contents = $this->archive->getFromName($entryName);

            return $contents === false ? null : $contents;
        }

        if (! isset($this->zipIndex[$entryName])) {
            return null;
        }

        ['method' => $method, 'size' => $size, 'offset' => $offset] = $this->zipIndex[$entryName];

        $localNameLen = unpack('v', substr($this->rawZip, $offset + 26, 2))[1];
        $localExtraLen = unpack('v', substr($this->rawZip, $offset + 28, 2))[1];
        $compressed = substr($this->rawZip, $offset + 30 + $localNameLen + $localExtraLen, $size);

        if ($method === 0) {
            return $compressed; // stored
        }

        if ($method === 8) {
            $result = @gzinflate($compressed);

            return $result === false ? null : $result;
        }

        return null;
    }

    /**
     * Minimal pure-PHP ZIP directory reader, for hosts without ext-zip.
     * Indexes every entry once so images can be pulled without re-scanning.
     */
    private function indexZip(string $zipPath): void
    {
        $data = file_get_contents($zipPath);

        if ($data === false) {
            throw new \RuntimeException('Cannot read DOCX file');
        }

        $eocd = strrpos($data, "PK\x05\x06");

        if ($eocd === false) {
            throw new \RuntimeException('Not a valid ZIP/DOCX file');
        }

        $count = unpack('v', substr($data, $eocd + 10, 2))[1];
        $pos = unpack('V', substr($data, $eocd + 16, 4))[1];

        for ($i = 0; $i < $count; $i++) {
            if (substr($data, $pos, 4) !== "PK\x01\x02") {
                break;
            }

            $method = unpack('v', substr($data, $pos + 10, 2))[1];
            $compressedSize = unpack('V', substr($data, $pos + 20, 4))[1];
            $nameLen = unpack('v', substr($data, $pos + 28, 2))[1];
            $extraLen = unpack('v', substr($data, $pos + 30, 2))[1];
            $commentLen = unpack('v', substr($data, $pos + 32, 2))[1];
            $localOffset = unpack('V', substr($data, $pos + 42, 4))[1];
            $name = substr($data, $pos + 46, $nameLen);

            $this->zipIndex[$name] = [
                'method' => $method,
                'size' => $compressedSize,
                'offset' => $localOffset,
            ];

            $pos += 46 + $nameLen + $extraLen + $commentLen;
        }

        $this->rawZip = $data;
    }

    // ── DOCX XML helpers ──────────────────────────────────────────────────────

    private function getParagraphStyle(DOMXPath $xpath, \DOMNode $para): string
    {
        $nodes = $xpath->query('w:pPr/w:pStyle/@w:val', $para);

        return $nodes->length > 0 ? strtolower((string) $nodes->item(0)->nodeValue) : '';
    }

    private function getParagraphAlign(DOMXPath $xpath, \DOMNode $para): string
    {
        $nodes = $xpath->query('w:pPr/w:jc/@w:val', $para);

        if ($nodes->length === 0) {
            return '';
        }

        return match (strtolower($nodes->item(0)->nodeValue)) {
            'center' => 'center',
            'right' => 'right',
            'both', 'justify' => 'justify',
            default => '',
        };
    }

    private function isHeading(string $style, int $level): bool
    {
        return $style === "heading{$level}" || $style === "heading {$level}";
    }

    private function runHtml(DOMXPath $xpath, \DOMNode $para): string
    {
        $html = '';

        foreach ($xpath->query('w:r', $para) as $run) {
            $image = $this->imageHtml($xpath, $run);

            if ($image !== '') {
                $html .= $image;

                continue;
            }

            $tNodes = $xpath->query('w:t', $run);

            if ($tNodes->length === 0) {
                continue;
            }

            $text = '';

            foreach ($tNodes as $t) {
                $text .= $t->nodeValue;
            }

            if ($text === '') {
                continue;
            }

            $text = htmlspecialchars($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $html .= $this->applyRunFormatting($xpath, $run, $text);
        }

        return $html;
    }

    private function applyRunFormatting(DOMXPath $xpath, \DOMNode $run, string $text): string
    {
        $bold = $xpath->query('w:rPr/w:b', $run)->length > 0;
        $italic = $xpath->query('w:rPr/w:i', $run)->length > 0;
        $strike = $xpath->query('w:rPr/w:strike', $run)->length > 0
               || $xpath->query('w:rPr/w:dstrike', $run)->length > 0;
        $under = $xpath->query('w:rPr/w:u', $run)->length > 0;

        $superscript = false;
        $subscript = false;
        $va = $xpath->query('w:rPr/w:vertAlign/@w:val', $run);

        if ($va->length > 0) {
            $v = strtolower($va->item(0)->nodeValue);
            $superscript = ($v === 'superscript');
            $subscript = ($v === 'subscript');
        }

        if ($superscript) $text = "<sup>{$text}</sup>";
        if ($subscript)   $text = "<sub>{$text}</sub>";
        if ($strike)      $text = "<s>{$text}</s>";
        if ($under)       $text = "<u>{$text}</u>";
        if ($italic)      $text = "<em>{$text}</em>";
        if ($bold)        $text = "<strong>{$text}</strong>";

        return $text;
    }
}
