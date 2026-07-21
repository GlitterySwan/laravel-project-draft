<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserConcern extends Model
{
    protected $fillable = ['user_id', 'message', 'appeal_date', 'category', 'detailed_info', 'status', 'admin_reply'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
