import { BrowserWindow } from 'electron';
import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface DiscordProcess {
  pid: number;
  name: string;
  path: string;
}

export class ProcessMonitor extends EventEmitter {
  private checkInterval: NodeJS.Timeout | null = null;
  private mainWindow: BrowserWindow | null = null;
  private currentDiscordProcess: DiscordProcess | null = null;

  constructor(mainWindow: BrowserWindow) {
    super();
    this.mainWindow = mainWindow;
  }

  start(): void {
    // Check immediately
    this.checkForDiscord();
    
    // Then check every 3 seconds
    this.checkInterval = setInterval(() => {
      this.checkForDiscord();
    }, 3000);
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  isDiscordRunning(): boolean {
    return this.currentDiscordProcess !== null;
  }

  private async checkForDiscord(): Promise<void> {
    try {
      const discordProcess = await this.findDiscordProcess();
      
      if (discordProcess && !this.currentDiscordProcess) {
        // Discord started
        this.currentDiscordProcess = discordProcess;
        this.notifyDiscordStatus(true, discordProcess);
        this.emit('discord-detected', discordProcess);
      } else if (!discordProcess && this.currentDiscordProcess) {
        // Discord stopped
        this.currentDiscordProcess = null;
        this.notifyDiscordStatus(false, null);
        this.emit('discord-lost');
      }
    } catch (error) {
      console.error('Error checking for Discord:', error);
    }
  }

  private async findDiscordProcess(): Promise<DiscordProcess | null> {
    try {
      if (process.platform === 'win32') {
        return await this.findDiscordWindows();
      } else if (process.platform === 'darwin') {
        return await this.findDiscordMacOS();
      } else {
        return await this.findDiscordLinux();
      }
    } catch (error) {
      return null;
    }
  }

  private async findDiscordWindows(): Promise<DiscordProcess | null> {
    try {
      const { stdout } = await execAsync(
        'wmic process where "name=\'Discord.exe\' or name=\'DiscordCanary.exe\' or name=\'DiscordPTB.exe\' or name=\'DiscordDevelopment.exe\'" get ProcessId,ExecutablePath,Name /format:csv'
      );

      const lines = stdout.split('\n').filter(line => line.trim() && !line.startsWith('Node'));
      
      for (const line of lines) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 3) {
          const path = parts[1];
          const name = parts[2];
          const pid = parseInt(parts[3]);

          if (path && name && !isNaN(pid) && name.toLowerCase().includes('discord')) {
            return { pid, name, path };
          }
        }
      }
    } catch (error) {
      // Try alternative method using tasklist
      try {
        const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq Discord.exe" /FO CSV /NH');
        const lines = stdout.split('\n').filter(line => line.includes('Discord'));
        
        if (lines.length > 0) {
          const parts = lines[0].split(',');
          const name = parts[0]?.replace(/"/g, '').trim();
          const pid = parseInt(parts[1]?.replace(/"/g, '').trim());
          
          if (name && !isNaN(pid)) {
            return { pid, name, path: 'Unknown' };
          }
        }
      } catch (e) {
        // Ignore
      }
    }

    return null;
  }

  private async findDiscordMacOS(): Promise<DiscordProcess | null> {
    try {
      const { stdout } = await execAsync('ps aux | grep -i "[D]iscord.app"');
      const lines = stdout.split('\n').filter(line => line.trim());

      if (lines.length > 0) {
        const parts = lines[0].trim().split(/\s+/);
        const pid = parseInt(parts[1]);
        const path = parts.slice(10).join(' ');

        if (!isNaN(pid)) {
          return {
            pid,
            name: 'Discord',
            path: path || 'Unknown'
          };
        }
      }
    } catch (error) {
      // Ignore
    }

    return null;
  }

  private async findDiscordLinux(): Promise<DiscordProcess | null> {
    try {
      const { stdout } = await execAsync('ps aux | grep -i "[d]iscord"');
      const lines = stdout.split('\n').filter(line => line.trim() && line.toLowerCase().includes('discord'));

      if (lines.length > 0) {
        const parts = lines[0].trim().split(/\s+/);
        const pid = parseInt(parts[1]);
        const path = parts.slice(10).join(' ');

        if (!isNaN(pid)) {
          return {
            pid,
            name: 'Discord',
            path: path || 'Unknown'
          };
        }
      }
    } catch (error) {
      // Ignore
    }

    return null;
  }

  private notifyDiscordStatus(isRunning: boolean, process: DiscordProcess | null): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('discord-status-changed', {
        isRunning,
        process
      });
    }
  }

  getCurrentProcess(): DiscordProcess | null {
    return this.currentDiscordProcess;
  }
}

