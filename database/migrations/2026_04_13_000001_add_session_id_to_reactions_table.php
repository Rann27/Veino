<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reactions', function (Blueprint $table) {
            // Drop the existing FK and unique constraint so we can alter user_id
            $table->dropForeign(['user_id']);
            $table->dropUnique('reactions_user_id_reactable_type_reactable_id_unique');

            // Make user_id nullable (anonymous reactions have no user)
            $table->unsignedBigInteger('user_id')->nullable()->change();

            // Re-add the FK as nullable (SET NULL when user is deleted)
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');

            // Session ID for anonymous user identification
            $table->string('session_id', 255)->nullable()->after('user_id');

            // Unique: one reaction per authenticated user per item
            $table->unique(['user_id', 'reactable_type', 'reactable_id'], 'reactions_user_unique');

            // Unique: one reaction per anonymous session per item
            $table->unique(['session_id', 'reactable_type', 'reactable_id'], 'reactions_session_unique');
        });
    }

    public function down(): void
    {
        Schema::table('reactions', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropUnique('reactions_user_unique');
            $table->dropUnique('reactions_session_unique');
            $table->dropColumn('session_id');

            $table->unsignedBigInteger('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['user_id', 'reactable_type', 'reactable_id']);
        });
    }
};
