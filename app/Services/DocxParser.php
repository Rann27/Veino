<?php

namespace App\Services;

use DOMDocument;
use DOMXPath;

class DocxParser
{
    private const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

    /**
     * Parse a .docx file. Returns ['title' => string, 'content' => string].
     * Title  = first Heading-1 paragraph (or first non-empty paragraph if none found).
     * Content = everything after the title, converted to HTML.
     * Works without ext-zip — uses a pure-PHP ZIP reader (only needs ext-zlib).
     */
    public function parse(string $filePath): array
    {
        $xml = $this->extractDocumentXml($filePath);

        $dom = new DOMDocument();
        @$dom->loadXML($xml, LIBXML_NOERROR | LIBXML_NOWARNING);
        $xpath = new DOMXPath($dom);
        $xpath->registerNamespace('w', self::W);

        $paragraphs = $xpath->query('//w:body/w:p');

        $title      = '';
        $titleFound = false;
        $parts      = [];

        foreach ($paragraphs as $para) {
            $styleVal = $this->getParagraphStyle($xpath, $para);
            $inner    = $this->runHtml($xpath, $para);

            if (trim(strip_tags($inner)) === '') {
                continue;
            }

            // Heading 1 → chapter title (first occurrence only)
            if (!$titleFound && $this->isHeading($styleVal, 1)) {
                $title      = strip_tags($inner);
                $titleFound = true;
                continue;
            }

            // Other headings
            if (preg_match('/^(heading|heading\s*)(\d)/i', $styleVal, $m)) {
                $level   = (int) $m[2];
                $parts[] = "<h{$level}>{$inner}</h{$level}>";
                continue;
            }

            // Alignment
            $align     = $this->getParagraphAlign($xpath, $para);
            $alignAttr = $align ? " style=\"text-align:{$align}\"" : '';
            $parts[]   = "<p{$alignAttr}>{$inner}</p>";
        }

        // Fallback: no heading-1 found → use first paragraph as title
        if (!$titleFound && count($parts) > 0) {
            $title = strip_tags(array_shift($parts));
        }

        return [
            'title'   => trim($title),
            'content' => implode("\n", $parts),
        ];
    }

    // ── ZIP extraction ────────────────────────────────────────────────────────

    private function extractDocumentXml(string $filePath): string
    {
        // Use ZipArchive when ext-zip is available (fastest)
        if (class_exists('ZipArchive')) {
            $zip = new \ZipArchive();
            if ($zip->open($filePath) !== true) {
                throw new \RuntimeException('Cannot open DOCX file');
            }
            $xml = $zip->getFromName('word/document.xml');
            $zip->close();
            if ($xml === false) {
                throw new \RuntimeException('Invalid DOCX: word/document.xml not found');
            }
            return $xml;
        }

        // Pure-PHP fallback: parse ZIP binary directly.
        // Requires only ext-zlib (gzinflate) — always available.
        return $this->readFromZip($filePath, 'word/document.xml');
    }

    /**
     * Minimal pure-PHP ZIP reader.
     * Supports stored (method 0) and deflated (method 8) entries.
     */
    private function readFromZip(string $zipPath, string $entryName): string
    {
        $data = file_get_contents($zipPath);
        if ($data === false) {
            throw new \RuntimeException('Cannot read DOCX file');
        }

        // End of Central Directory record
        $eocd = strrpos($data, "PK\x05\x06");
        if ($eocd === false) {
            throw new \RuntimeException('Not a valid ZIP/DOCX file');
        }

        $cdCount  = unpack('v', substr($data, $eocd + 10, 2))[1];
        $cdOffset = unpack('V', substr($data, $eocd + 16, 4))[1];

        $pos = $cdOffset;
        for ($i = 0; $i < $cdCount; $i++) {
            if (substr($data, $pos, 4) !== "PK\x01\x02") {
                break;
            }

            $method         = unpack('v', substr($data, $pos + 10, 2))[1];
            $compressedSize = unpack('V', substr($data, $pos + 20, 4))[1];
            $nameLen        = unpack('v', substr($data, $pos + 28, 2))[1];
            $extraLen       = unpack('v', substr($data, $pos + 30, 2))[1];
            $commentLen     = unpack('v', substr($data, $pos + 32, 2))[1];
            $localOffset    = unpack('V', substr($data, $pos + 42, 4))[1];
            $name           = substr($data, $pos + 46, $nameLen);

            if ($name === $entryName) {
                $localNameLen  = unpack('v', substr($data, $localOffset + 26, 2))[1];
                $localExtraLen = unpack('v', substr($data, $localOffset + 28, 2))[1];
                $dataStart     = $localOffset + 30 + $localNameLen + $localExtraLen;
                $compressed    = substr($data, $dataStart, $compressedSize);

                if ($method === 0) {
                    return $compressed; // stored
                }
                if ($method === 8) {
                    $result = @gzinflate($compressed);
                    if ($result === false) {
                        throw new \RuntimeException('Decompression failed');
                    }
                    return $result;
                }
                throw new \RuntimeException("Unsupported ZIP compression method: {$method}");
            }

            $pos += 46 + $nameLen + $extraLen + $commentLen;
        }

        throw new \RuntimeException('Invalid DOCX: word/document.xml not found');
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
        if ($nodes->length === 0) return '';
        return match (strtolower($nodes->item(0)->nodeValue)) {
            'center'  => 'center',
            'right'   => 'right',
            'both', 'justify' => 'justify',
            default   => '',
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
            $tNodes = $xpath->query('w:t', $run);
            if ($tNodes->length === 0) continue;

            $text = '';
            foreach ($tNodes as $t) {
                $text .= $t->nodeValue;
            }
            if ($text === '') continue;

            $text  = htmlspecialchars($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $html .= $this->applyRunFormatting($xpath, $run, $text);
        }
        return $html;
    }

    private function applyRunFormatting(DOMXPath $xpath, \DOMNode $run, string $text): string
    {
        $bold   = $xpath->query('w:rPr/w:b',      $run)->length > 0;
        $italic = $xpath->query('w:rPr/w:i',      $run)->length > 0;
        $strike = $xpath->query('w:rPr/w:strike', $run)->length > 0
               || $xpath->query('w:rPr/w:dstrike',$run)->length > 0;
        $under  = $xpath->query('w:rPr/w:u',      $run)->length > 0;

        $superscript = false;
        $subscript   = false;
        $va = $xpath->query('w:rPr/w:vertAlign/@w:val', $run);
        if ($va->length > 0) {
            $v = strtolower($va->item(0)->nodeValue);
            $superscript = ($v === 'superscript');
            $subscript   = ($v === 'subscript');
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
