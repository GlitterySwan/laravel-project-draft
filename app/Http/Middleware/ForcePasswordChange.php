<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForcePasswordChange
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Allow the password-change page itself and logout to load normally,
        // otherwise the user would be stuck in an infinite redirect loop.
        $exemptRoutes = ['password.force.edit', 'password.force.update', 'logout'];

        if ($user && $user->must_change_password && !$request->routeIs(...$exemptRoutes)) {
            return redirect()->route('password.force.edit');
        }

        return $next($request);
    }
}