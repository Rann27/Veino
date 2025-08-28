<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('display_name')->after('name');
            $table->string('uid')->unique()->after('id');
            $table->enum('role', ['user', 'admin'])->default('user')->after('email');
            $table->integer('coins')->default(0)->after('role');
            $table->boolean('is_banned')->default(false)->after('coins');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['display_name', 'uid', 'role', 'coins', 'is_banned']);
        });
    }
};
