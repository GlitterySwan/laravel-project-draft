<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\UserConcern;
use Inertia\Inertia;
use Inertia\Response;

class ConcernManagementController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Concerns', [
            'concerns' => UserConcern::with('user:id,name,email')->latest()->paginate(20),
        ]);
    }

    public function resolve(UserConcern $concern)
    {
        $concern->update(['status' => 'resolved']);

        return redirect()->back()->with('toast', ['type' => 'success', 'message' => 'Concern marked as resolved.']);
    }
}
