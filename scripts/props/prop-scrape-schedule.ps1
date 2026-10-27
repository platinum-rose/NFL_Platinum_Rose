# scripts/props/prop-scrape-schedule.ps1
# Shared weekly cadence for the NFL prop scrapers (Bookmaker, BetOnline, DraftKings Predictions).
# Dot-sourced by register-bkr-cron.ps1, register-bol-cron.ps1 and register-dkp-cron.ps1. Defines data and
# one helper only; it never registers, changes or deletes a scheduled task.
#
# Times are the computer's local clock (Pacific; Task Scheduler follows PST/PDT automatically).
# Each register script adds its own stagger offset (Bookmaker +0, BetOnline +10, DraftKings +20 min) so
# the three browser scrapes never start at the same moment.

$PropScrapeWeeklyCadence = [ordered]@{
    Monday    = @('10:00', '13:00', '16:00')
    Tuesday   = @('13:00')
    Wednesday = @('10:00', '14:00', '20:00')
    Thursday  = @('10:00', '13:00', '16:00')
    Friday    = @('13:00')
    Saturday  = @('10:00', '14:00', '20:00')
    Sunday    = @('08:00', '12:00', '15:00', '16:00', '21:00')
}

function New-PropScrapeTriggers {
    # Returns one weekly trigger per distinct time of day, covering every day that runs at that time.
    # No intra-day repetition: each trigger fires once on each of its days.
    param([ValidateRange(0, 59)][int]$OffsetMinutes = 0)
    $byTime = [ordered]@{}
    foreach ($day in $PropScrapeWeeklyCadence.Keys) {
        foreach ($time in $PropScrapeWeeklyCadence[$day]) {
            if (-not $byTime.Contains($time)) { $byTime[$time] = New-Object System.Collections.Generic.List[string] }
            $byTime[$time].Add($day)
        }
    }
    foreach ($time in ($byTime.Keys | Sort-Object)) {
        $at = [datetime]::ParseExact($time, 'HH:mm', $null).AddMinutes($OffsetMinutes)
        New-ScheduledTaskTrigger -Weekly -WeeksInterval 1 -DaysOfWeek $byTime[$time].ToArray() -At $at
    }
}

function Get-PropScrapeCadenceSummary {
    param([int]$OffsetMinutes = 0)
    ($PropScrapeWeeklyCadence.Keys | ForEach-Object {
        $d = $_
        '{0} {1}' -f $d.Substring(0, 3), (($PropScrapeWeeklyCadence[$d] | ForEach-Object {
            [datetime]::ParseExact($_, 'HH:mm', $null).AddMinutes($OffsetMinutes).ToString('HH:mm') }) -join '/')
    }) -join '; '
}
