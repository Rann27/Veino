<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class ErrorController extends Controller
{
    /**
     * Show the 404 error page
     */
    public function notFound()
    {
        return Inertia::render('Errors/NotFound')
            ->with([
                'title' => 'Page Not Found - VeiNovel',
                'status' => 404
            ]);
    }

    /**
     * Show the 500 error page
     */
    public function serverError()
    {
        return Inertia::render('Errors/ServerError')
            ->with([
                'title' => 'Server Error - VeiNovel',
                'status' => 500
            ]);
    }

    /**
     * Show the 403 error page
     */
    public function forbidden()
    {
        return Inertia::render('Errors/Forbidden')
            ->with([
                'title' => 'Access Forbidden - VeiNovel',
                'status' => 403
            ]);
    }
}
