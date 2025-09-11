<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Inertia\Inertia;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into an HTTP response.
     */
    public function render($request, Throwable $e)
    {
        $response = parent::render($request, $e);

        // Only handle web requests (not API)
        if ($request->expectsJson() === false) {
            $statusCode = $response->getStatusCode();
            
            // Handle different error types with custom Inertia pages
            switch ($statusCode) {
                case 404:
                    return Inertia::render('Errors/NotFound')
                        ->toResponse($request)
                        ->setStatusCode(404);
                        
                case 403:
                    return Inertia::render('Errors/Forbidden')
                        ->toResponse($request)
                        ->setStatusCode(403);
                        
                case 500:
                    return Inertia::render('Errors/ServerError')
                        ->toResponse($request)
                        ->setStatusCode(500);
            }
        }

        return $response;
    }
}
