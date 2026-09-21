' Runs a .cmd file with no console window (window style 0) and waits for it,
' so Task Scheduler still sees the task as Running until the job finishes.
' Usage: wscript.exe run-hidden.vbs "C:\path\to\job.cmd"
If WScript.Arguments.Count < 1 Then WScript.Quit 2
Set shell = CreateObject("WScript.Shell")
WScript.Quit shell.Run("cmd.exe /c """ & WScript.Arguments(0) & """", 0, True)
