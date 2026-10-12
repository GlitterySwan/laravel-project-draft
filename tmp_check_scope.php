<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$model = new App\Models\Booking();
$ref = new ReflectionClass($model);
var_dump($ref->hasMethod('scopeForUser'));
var_dump($ref->getMethod('scopeForUser')->class);
