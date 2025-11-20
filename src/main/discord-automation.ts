import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const POWERSHELL = 'powershell.exe';

export async function injectScriptViaSendKeys(script: string): Promise<void> {
  const base64Script = Buffer.from(script, 'utf8').toString('base64');

  const psScript = `
$ErrorActionPreference = "Stop"
$base64 = "${base64Script}"
$code = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($base64))
$discord = $null
$maxTries = 120
for ($i=0; $i -lt $maxTries; $i++) {
  $discord = Get-Process Discord -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($discord -and $discord.MainWindowHandle -ne 0) { break }
  Start-Sleep -Milliseconds 500
}
if (-not $discord) { throw "Discord is not running." }
if ($discord.MainWindowHandle -eq 0) {
  for ($j=0; $j -lt $maxTries; $j++) {
    Start-Sleep -Milliseconds 500
    $discord = Get-Process Discord -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($discord -and $discord.MainWindowHandle -ne 0) { break }
  }
}
if ($discord.MainWindowHandle -eq 0) { throw "Discord window handle not available yet." }
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class Win32 {
  [DllImport("user32.dll")]
  public static extern bool SetForegroundWindow(IntPtr hWnd);
}
"@
[Win32]::SetForegroundWindow($discord.MainWindowHandle)
Add-Type -AssemblyName System.Windows.Forms
$previousClipboard = $null
try { $previousClipboard = Get-Clipboard -Raw } catch {}
Set-Clipboard -Value $code
Start-Sleep -Milliseconds 600
[System.Windows.Forms.SendKeys]::SendWait("^+i")
Start-Sleep -Milliseconds 900
[System.Windows.Forms.SendKeys]::SendWait("^+j")
Start-Sleep -Milliseconds 900
[System.Windows.Forms.SendKeys]::SendWait("^v")
Start-Sleep -Milliseconds 300
[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
Start-Sleep -Milliseconds 500
if ($previousClipboard) { Set-Clipboard -Value $previousClipboard }
`;

  await execFileAsync(POWERSHELL, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psScript], {
    windowsHide: true,
  });
}

