<?php

namespace App\Http\Controllers;

use App\Models\UserConcern;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class UserConcernController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'min:1'],
        ]);

        UserConcern::create([
            'user_id' => $request->user()?->id,
            'message' => $validated['message'],
            'status' => 'pending',
        ]);

        return redirect()->back()->with('toast', [
            'type' => 'success',
            'message' => 'Your concern has been submitted directly to the Super Admin!',
        ]);
    }
}
