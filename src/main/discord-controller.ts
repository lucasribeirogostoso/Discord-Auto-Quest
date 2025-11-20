import { exec } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import tcpPortUsed from 'tcp-port-used';

const DISCORD_VARIANTS = [
  { folder: 'Discord', exe: 'Discord.exe' },
  { folder: 'DiscordCanary', exe: 'DiscordCanary.exe' },
  { folder: 'DiscordPTB', exe: 'DiscordPTB.exe' },
  { folder: 'DiscordDevelopment', exe: 'DiscordDevelopment.exe' },
];

export const DISCORD_DEBUG_PORT = 9223;
const PORT_CHECK_TIMEOUT = 20000;

interface DiscordInstall {
  exePath: string;
  processName: string;
}

function getDiscordInstallPath(): DiscordInstall {
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) {
    throw new Error('LOCALAPPDATA environment variable is not set.');
  }

  for (const variant of DISCORD_VARIANTS) {
    const basePath = path.join(localAppData, variant.folder);
    if (!existsSync(basePath)) continue;

    const entries = readdirSync(basePath, { withFileTypes: true })
      .filter((dir) => dir.isDirectory() && dir.name.startsWith('app-'))
      .sort((a, b) => a.name.localeCompare(b.name));

    const latestVersion = entries.pop();
    if (!latestVersion) continue;

    const discordExe = path.join(basePath, latestVersion.name, variant.exe);
    if (!existsSync(discordExe)) continue;

    return {
      exePath: discordExe,
      processName: variant.exe,
    };
  }

  throw new Error('Discord installation not found. Please install Discord desktop app.');
}

async function killExistingDiscord(): Promise<void> {
  await new Promise<void>((resolve) => {
    const commands = DISCORD_VARIANTS.map((variant) => `taskkill /F /IM ${variant.exe} /T`).join(' & ');
    exec(commands, () => resolve());
  });
}

async function waitForPort(port: number, timeout = PORT_CHECK_TIMEOUT): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const inUse = await tcpPortUsed.check(port, '127.0.0.1');
    if (inUse) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timeout waiting for Discord debug port ${port} to become available.`);
}

export async function ensureDiscordRunningWithDebug(): Promise<void> {
  const portOpen = await tcpPortUsed.check(DISCORD_DEBUG_PORT, '127.0.0.1');
  if (portOpen) {
    return;
  }

  await killExistingDiscord();

  const install = getDiscordInstallPath();

  await new Promise<void>((resolve, reject) => {
    try {
      const child = spawn(install.exePath, [`--remote-debugging-port=${DISCORD_DEBUG_PORT}`], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      resolve();
    } catch (error) {
      reject(error);
    }
  });

  await waitForPort(DISCORD_DEBUG_PORT);
}

