<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
class SystemSettingsController extends Controller { public function edit() { return Inertia::render('Admin/SystemSettings', ['settings' => SystemSetting::current()]); } public function update(Request $request) { $data = $request->validate(['auto_approve_bookings'=>['required','boolean'], 'overtime_fee_per_hour'=>['required','numeric','min:0']]); SystemSetting::current()->update($data); return back()->with('toast',['type'=>'success','message'=>'Booking settings saved.']); } }
