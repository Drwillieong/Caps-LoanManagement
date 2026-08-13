<?php

use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
|
| This file is where you may define all of your Closure based console
| commands. Each Closure is bound to a command instance, providing a
| convenient place to define your command's logic.
|
*/

Schedule::command('loans:auto-reject-expired')->hourly();
