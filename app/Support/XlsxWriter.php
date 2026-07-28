<?php

namespace App\Support;

/**
 * Minimal XLSX writer with no external dependencies.
 *
 * PhpSpreadsheet would be the obvious choice, but it requires ext-zip, which is
 * not guaranteed on shared hosting. This builds the OOXML package and its ZIP
 * container by hand using only zlib (gzdeflate), so exports work anywhere PHP
 * runs — and no `composer install` is needed to deploy them.
 *
 * Strings are written inline, which skips the shared-string table entirely.
 *
 * Usage:
 *     $xlsx = new XlsxWriter();
 *     $xlsx->addSheet('Summary', ['Metric', 'Value'], [['Pageviews', 1234]]);
 *     return response($xlsx->build(), 200, $xlsx->headers('report.xlsx'));
 */
class XlsxWriter
{
    /** @var array<int, array{name: string, headers: array, rows: array, widths: array}> */
    private array $sheets = [];

    /**
     * @param  array<int, string>  $headers
     * @param  array<int, array<int, string|int|float|null>>  $rows
     * @param  array<int, int>  $widths  Optional column widths in characters.
     */
    public function addSheet(string $name, array $headers, array $rows, array $widths = []): self
    {
        $this->sheets[] = [
            'name' => $this->sanitizeSheetName($name),
            'headers' => $headers,
            'rows' => $rows,
            'widths' => $widths,
        ];

        return $this;
    }

    public function headers(string $filename): array
    {
        return [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="'.str_replace('"', '', $filename).'"',
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
            'Pragma' => 'no-cache',
        ];
    }

    public function build(): string
    {
        if (! $this->sheets) {
            $this->addSheet('Sheet1', ['No data'], []);
        }

        $files = [
            '[Content_Types].xml' => $this->contentTypes(),
            '_rels/.rels' => $this->rootRels(),
            'xl/workbook.xml' => $this->workbook(),
            'xl/_rels/workbook.xml.rels' => $this->workbookRels(),
            'xl/styles.xml' => $this->styles(),
        ];

        foreach ($this->sheets as $i => $sheet) {
            $files['xl/worksheets/sheet'.($i + 1).'.xml'] = $this->sheetXml($sheet);
        }

        return $this->zip($files);
    }

    // ─── OOXML parts ─────────────────────────────────────────────────────────

    private function contentTypes(): string
    {
        $overrides = '';

        foreach ($this->sheets as $i => $sheet) {
            $overrides .= '<Override PartName="/xl/worksheets/sheet'.($i + 1).'.xml"'
                .' ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
        }

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            .'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            .'<Default Extension="xml" ContentType="application/xml"/>'
            .'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            .'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
            .$overrides
            .'</Types>';
    }

    private function rootRels(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            .'</Relationships>';
    }

    private function workbook(): string
    {
        $sheets = '';

        foreach ($this->sheets as $i => $sheet) {
            $sheets .= '<sheet name="'.$this->esc($sheet['name']).'" sheetId="'.($i + 1).'" r:id="rId'.($i + 1).'"/>';
        }

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
            .' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            .'<sheets>'.$sheets.'</sheets></workbook>';
    }

    private function workbookRels(): string
    {
        $rels = '';

        foreach ($this->sheets as $i => $sheet) {
            $rels .= '<Relationship Id="rId'.($i + 1).'"'
                .' Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"'
                .' Target="worksheets/sheet'.($i + 1).'.xml"/>';
        }

        // Styles takes the id after the last sheet.
        $rels .= '<Relationship Id="rId'.(count($this->sheets) + 1).'"'
            .' Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles"'
            .' Target="styles.xml"/>';

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .$rels.'</Relationships>';
    }

    /** Two cell formats: 0 = normal, 1 = bold on a light fill (header row). */
    private function styles(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .'<fonts count="2">'
            .'<font><sz val="11"/><name val="Calibri"/></font>'
            .'<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>'
            .'</fonts>'
            .'<fills count="3">'
            .'<fill><patternFill patternType="none"/></fill>'
            .'<fill><patternFill patternType="gray125"/></fill>'
            .'<fill><patternFill patternType="solid"><fgColor rgb="FF2A78D6"/><bgColor indexed="64"/></patternFill></fill>'
            .'</fills>'
            .'<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
            .'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
            .'<cellXfs count="2">'
            .'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
            .'<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>'
            .'</cellXfs>'
            .'</styleSheet>';
    }

    private function sheetXml(array $sheet): string
    {
        $cols = '';

        if ($sheet['widths']) {
            $cols .= '<cols>';
            foreach ($sheet['widths'] as $i => $width) {
                $cols .= '<col min="'.($i + 1).'" max="'.($i + 1).'" width="'.(float) $width.'" customWidth="1"/>';
            }
            $cols .= '</cols>';
        }

        $rowsXml = '';
        $rowNumber = 1;

        if ($sheet['headers']) {
            $rowsXml .= $this->rowXml($sheet['headers'], $rowNumber++, 1);
        }

        foreach ($sheet['rows'] as $row) {
            $rowsXml .= $this->rowXml(array_values($row), $rowNumber++, 0);
        }

        // Freeze the header row so long tables stay readable while scrolling.
        $pane = $sheet['headers']
            ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
            : '';

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .$pane.$cols
            .'<sheetData>'.$rowsXml.'</sheetData>'
            .'</worksheet>';
    }

    private function rowXml(array $values, int $rowNumber, int $styleId): string
    {
        $cells = '';

        foreach (array_values($values) as $col => $value) {
            $ref = $this->columnName($col).$rowNumber;
            $style = $styleId ? ' s="'.$styleId.'"' : '';

            if ($value === null || $value === '') {
                $cells .= '<c r="'.$ref.'"'.$style.'/>';

                continue;
            }

            if (is_int($value) || is_float($value)) {
                $cells .= '<c r="'.$ref.'"'.$style.'><v>'.$value.'</v></c>';

                continue;
            }

            // Numeric-looking strings stay text unless they really are numbers.
            if (is_numeric($value) && ! str_starts_with((string) $value, '0') && ! str_contains((string) $value, 'e')) {
                $cells .= '<c r="'.$ref.'"'.$style.'><v>'.(0 + $value).'</v></c>';

                continue;
            }

            $cells .= '<c r="'.$ref.'"'.$style.' t="inlineStr"><is><t xml:space="preserve">'
                .$this->esc((string) $value).'</t></is></c>';
        }

        return '<row r="'.$rowNumber.'">'.$cells.'</row>';
    }

    /** 0 → A, 25 → Z, 26 → AA … */
    private function columnName(int $index): string
    {
        $name = '';

        for ($i = $index + 1; $i > 0; $i = intdiv($i - 1, 26)) {
            $name = chr(65 + ($i - 1) % 26).$name;
        }

        return $name;
    }

    private function esc(string $value): string
    {
        // Control characters are illegal in XML 1.0 and would corrupt the file.
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $value) ?? $value;

        return htmlspecialchars($value, ENT_QUOTES | ENT_XML1, 'UTF-8');
    }

    private function sanitizeSheetName(string $name): string
    {
        $name = preg_replace('/[\\\\\\/\\*\\[\\]:\\?]/', '-', $name) ?? $name;

        return mb_substr(trim($name) ?: 'Sheet', 0, 31);
    }

    // ─── ZIP container (deflate via zlib, no ext-zip) ─────────────────────────

    /** @param array<string, string> $files path => contents */
    private function zip(array $files): string
    {
        $local = '';
        $central = '';
        $offset = 0;
        $count = 0;

        foreach ($files as $path => $contents) {
            $crc = crc32($contents);
            $uncompressed = strlen($contents);
            $deflated = gzdeflate($contents, 6);

            // Fall back to STORE if deflate somehow grows the payload.
            if ($deflated === false || strlen($deflated) >= $uncompressed) {
                $deflated = $contents;
                $method = 0;
            } else {
                $method = 8;
            }

            $compressed = strlen($deflated);
            $nameLength = strlen($path);

            $header = pack('V', 0x04034b50)   // local file header signature
                .pack('v', 20)                // version needed
                .pack('v', 0)                 // flags
                .pack('v', $method)
                .pack('v', 0)                 // mod time
                .pack('v', 0)                 // mod date
                .pack('V', $crc)
                .pack('V', $compressed)
                .pack('V', $uncompressed)
                .pack('v', $nameLength)
                .pack('v', 0);                // extra field length

            $local .= $header.$path.$deflated;

            $central .= pack('V', 0x02014b50) // central directory signature
                .pack('v', 20)                // version made by
                .pack('v', 20)                // version needed
                .pack('v', 0)
                .pack('v', $method)
                .pack('v', 0)
                .pack('v', 0)
                .pack('V', $crc)
                .pack('V', $compressed)
                .pack('V', $uncompressed)
                .pack('v', $nameLength)
                .pack('v', 0)                 // extra
                .pack('v', 0)                 // comment
                .pack('v', 0)                 // disk number
                .pack('v', 0)                 // internal attributes
                .pack('V', 32)                // external attributes
                .pack('V', $offset)
                .$path;

            $offset += strlen($header) + $nameLength + $compressed;
            $count++;
        }

        $eocd = pack('V', 0x06054b50)
            .pack('v', 0)
            .pack('v', 0)
            .pack('v', $count)
            .pack('v', $count)
            .pack('V', strlen($central))
            .pack('V', $offset)
            .pack('v', 0);

        return $local.$central.$eocd;
    }
}
