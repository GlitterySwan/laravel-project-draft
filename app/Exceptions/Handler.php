<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<\Throwable>>
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed for validation exceptions.
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
     *
     * @return void
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $exception) {
            Log::debug('Exception reported', ['exception' => $exception]);
        });
    }

    /**
     * Render an exception into an HTTP response.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Throwable  $exception
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function render($request, Throwable $exception)
    {
        if ($request->header('X-Inertia')) {
            $status = $exception instanceof HttpExceptionInterface ? $exception->getStatusCode() : 500;
            $message = $exception->getMessage() ?: $this->defaultErrorMessage($status);

            return Inertia::render('Error/HttpError', [
                'status' => $status,
                'message' => $message,
            ])->toResponse($request)->setStatusCode($status);
        }

        return parent::render($request, $exception);
    }

    protected function defaultErrorMessage(int $status): string
    {
        return match ($status) {
            403 => 'Sorry, you do not have permission to view this page.',
            404 => 'We could not find the page you were looking for.',
            500 => 'Something went wrong on our end. Please try again later.',
            default => 'An unexpected error occurred. Please try again.',
        };
    }
}
