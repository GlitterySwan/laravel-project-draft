<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DeveloperContactController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'min:5'],
        ]);

        Log::info('Developer contact message received.', [
            'user_id' => $request->user()?->id,
            'message' => $data['message'],
        ]);

        return redirect()->back()->with('success', 'Thanks! Your message has been sent to the development team.');
    }
}
