' launch-toolbox.vbs
' Launches the NFL Dashboard Toolbox in a clean, standalone desktop window
' with ZERO terminal or command prompt windows flashing or running.

Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
AppDir = "E:\dev\projects\NFL_Dashboard"
WshShell.CurrentDirectory = AppDir

' 1. Check if the Toolbox server is already active on port 4567
Dim isRunning
isRunning = False

On Error Resume Next
Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
http.Open "GET", "http://127.0.0.1:4567/api/status", False
http.setTimeouts 500, 500, 500, 500
http.Send
If Err.Number = 0 Then
  If http.Status = 200 Then
    isRunning = True
  End If
End If
Err.Clear
On Error GoTo 0

' 2. If not running, start the server silently (0 = vbHide)
If Not isRunning Then
  Dim startCmd
  startCmd = "cmd /c cd /d """ & AppDir & """ && node scripts\toolbox-app-server.mjs > .nfl\toolbox-server.log 2>&1"
  WshShell.Run startCmd, 0, False

  ' Active polling: wait up to 10 seconds (20 iterations * 500ms) for server to respond
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
End If

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
  WshShell.Run """" & BrowserPath & """ --app=http://127.0.0.1:4567 --window-size=1520,960", 1, False
Else
  ' Fallback to Edge
  Dim EdgePath
  EdgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
  If Not FSO.FileExists(EdgePath) Then
    EdgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
  End If
  If FSO.FileExists(EdgePath) Then
    WshShell.Run """" & EdgePath & """ --app=http://127.0.0.1:4567 --window-size=1520,960", 1, False
  Else
    WshShell.Run "cmd /c start msedge --app=http://127.0.0.1:4567", 0, False
  End If
End If
