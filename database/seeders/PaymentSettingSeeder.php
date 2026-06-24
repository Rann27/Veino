<?php

namespace Database\Seeders;

use App\Models\PaymentSetting;
use Illuminate\Database\Seeder;

class PaymentSettingSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            [
                'key'         => 'premium_chapter_price',
                'value'       => '10',
                'type'        => 'integer',
                'description' => 'Global coin price for unlocking a premium chapter',
            ],
        ];

        foreach ($defaults as $setting) {
            PaymentSetting::firstOrCreate(
                ['key' => $setting['key']],
                [
                    'value'       => $setting['value'],
                    'type'        => $setting['type'],
                    'description' => $setting['description'],
                ]
            );
        }
    }
}
