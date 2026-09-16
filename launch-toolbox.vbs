' launch-toolbox.vbs
' Launches the NFL Dashboard Toolbox in a clean, standalone desktop window
' with ZERO terminal or command prompt windows flashing or running.
' Always kills any existing server on port 4567 first, so a relaunch never silently
' reuses a stale process from before the latest code changes.

Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
AppDir = "E:\dev\projects\NFL_Dashboard"
WshShell.CurrentDirectory = AppDir

' 1. Kill whatever is currently bound to port 4567 (synchronous - waits for it to finish)
Dim killCmd
killCmd = "powershell -NoProfile -Command ""Get-NetTCPConnection -LocalPort 4567 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"""
WshShell.Run killCmd, 0, True

' 2. Start the server fresh, silently (0 = vbHide)
Dim startCmd
startCmd = "cmd /c cd /d """ & AppDir & """ && node scripts\toolbox-app-server.mjs > .nfl\toolbox-server.log 2>&1"
WshShell.Run startCmd, 0, False

' Active polling: wait up to 10 seconds (20 iterations * 500ms) for server to respond
Dim isRunning
isRunning = False
Dim attempts
For attempts = 1 To 20
  WScript.Sleep 500
  On Error Resume Next
  Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
  http.Open "GET", "http://127.0.0.1:4567/api/status", False
  http.setTimeouts 500, 500, 500, 500
  http.Send
  If Err.Number = 0 Then
    If http.Status = 200 Then
      isRunning = True
      Exit For
    End If
  End If
  Err.Clear
  On Error GoTo 0
Next

If Not isRunning Then
  MsgBox "NFL Toolbox Server failed to start on port 4567 within 10 seconds." & vbCrLf & _
         "Check E:\dev\projects\NFL_Dashboard\.nfl\toolbox-server.log for details.", vbExclamation, "NFL Toolbox Error"
  WScript.Quit 1
End If

' 3. Launch Brave (or fallback to Microsoft Edge) in standalone Frameless App Mode
Dim BrowserPath
BrowserPath = "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
If Not FSO.FileExists(BrowserPath) Then
  BrowserPath = "C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe"
End If
If Not FSO.FileExists(BrowserPath) Then
  BrowserPath = WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\BraveSoftware\Brave-Browser\Application\brave.exe"
End If

If FSO.FileExists(BrowserPath) Then
  WshShell.Run """" & BrowserPath & """ --app=http://127.0.0.1:4567", 1, False
Else
  ' Fallback to Edge
  Dim EdgePath
  EdgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
  If Not FSO.FileExists(EdgePath) Then
    EdgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
  End If
  If FSO.FileExists(EdgePath) Then
    WshShell.Run """" & EdgePath & """ --app=http://127.0.0.1:4567", 1, False
  Else
    WshShell.Run "cmd /c start msedge --app=http://127.0.0.1:4567", 0, False
  End If
End If
