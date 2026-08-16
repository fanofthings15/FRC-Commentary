import { spawn } from "child_process";
import { writeFileSync } from "fs";
import path from "path";
import os from "os";
import pkg from "../../package.json" with { type: "json" };
import { isCompiledExe } from "./util.js";

const REPO = "fanofthings15/FRC-Commentary-Dashboard";
const RELEASES_API = `https://api.github.com/repos/${REPO}/releases/latest`;

export const CURRENT_VERSION: string = pkg.version;

// Compares two "x.y.z"-ish version strings (a leading "v" is tolerated).
// Returns >0 if a is newer than b, 0 if equal, <0 if a is older.
function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/, "").split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.replace(/^v/, "").split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

interface GitHubRelease {
  tag_name: string;
  assets: { name: string; browser_download_url: string }[];
}

// Checks GitHub for a newer tagged release and, if one exists, downloads it
// and stages it to replace the running .exe. Only does anything when this
// process actually IS the compiled Windows .exe - `bun run dev`/`bun run
// start` have no .exe to replace, and self-updating mid-development would
// just be confusing.
//
// Deliberately a single check at launch, not a background poller: a
// commentary session runs for a few hours at most, and swapping the binary
// out from under a live broadcast would be actively disruptive. Next launch
// picks up whatever was staged.
export async function checkForUpdate(): Promise<void> {
  if (!isCompiledExe() || process.platform !== "win32") return;

  let release: GitHubRelease;
  try {
    const res = await fetch(RELEASES_API, {
      headers: { "User-Agent": "FRC-Commentary-Dashboard-updater" },
    });
    if (!res.ok) {
      console.error(`Update check failed: GitHub returned ${res.status}.`);
      return;
    }
    release = (await res.json()) as GitHubRelease;
  } catch (err: any) {
    console.error(`Update check failed: could not reach GitHub. (${err.message})`);
    return;
  }

  if (compareVersions(release.tag_name, CURRENT_VERSION) <= 0) {
    console.log(`Up to date (running v${CURRENT_VERSION}).`);
    return;
  }

  const asset = release.assets.find((a) => a.name.endsWith(".exe"));
  if (!asset) {
    console.error(`Update check: release ${release.tag_name} has no .exe asset attached.`);
    return;
  }

  console.log(`Update available: v${CURRENT_VERSION} -> ${release.tag_name}. Downloading...`);
  try {
    await downloadAndStage(asset.browser_download_url);
  } catch (err: any) {
    console.error(`Update download/install failed, staying on v${CURRENT_VERSION}. (${err.message})`);
  }
}

async function downloadAndStage(downloadUrl: string): Promise<void> {
  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error(`download returned HTTP ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());

  const currentExe = process.execPath;
  const exeDir = path.dirname(currentExe);
  const newExe = path.join(exeDir, "FRC-Commentary-Dashboard.new.exe");
  writeFileSync(newExe, bytes);

  const stamp = Date.now();
  const logPath = path.join(os.tmpdir(), `frc-commentary-update-${stamp}.log`);
  const scriptPath = path.join(os.tmpdir(), `frc-commentary-update-${stamp}.bat`);
  const vbsPath = path.join(os.tmpdir(), `frc-commentary-update-${stamp}.vbs`);

  // Windows holds an exclusive lock on a running .exe, so this process can't
  // overwrite (or reliably rename) its own file while it's still executing.
  // Standard workaround: a tiny batch script polls `tasklist` for this PID to
  // disappear, then moves the new file over the old one and relaunches - and
  // this process exits to release the lock so that move can succeed.
  //
  // Two things this got wrong the first time around (a host reported a
  // visible cmd.exe window stuck showing the tasklist/find line forever):
  //   - The wait loop had no bound, so if the parent somehow never exits
  //     (or `tasklist`'s "no tasks found" message happens to contain the
  //     PID as a substring on some locale/output format) it spins forever.
  //   - `if not errorlevel 1 ( ... goto ... )` - a goto inside a
  //     parenthesized block - is a known-fragile batch pattern; switched to
  //     plain `if errorlevel 1 goto`.
  const script = [
    "@echo off",
    `>>"${logPath}" echo update helper started`,
    "set /a TRIES=0",
    ":wait",
    `tasklist /FI "PID eq ${process.pid}" 2>NUL | find "${process.pid}" >NUL`,
    "if errorlevel 1 goto swap",
    "set /a TRIES+=1",
    "if %TRIES% GEQ 60 goto giveup",
    "timeout /t 1 /nobreak >NUL",
    "goto wait",
    ":swap",
    "rem give Windows a moment to fully release the file handle after exit",
    "timeout /t 1 /nobreak >NUL",
    `move /Y "${newExe}" "${currentExe}" >>"${logPath}" 2>&1`,
    `start "" "${currentExe}"`,
    "goto cleanup",
    ":giveup",
    `>>"${logPath}" echo gave up waiting for the old process to exit after 60s`,
    ":cleanup",
    `del "${vbsPath}" >NUL 2>&1`,
    `del "%~f0"`,
  ].join("\r\n");
  writeFileSync(scriptPath, script);

  // Launch the batch script via the Windows Script Host's Run(...,0,False)
  // instead of spawning cmd.exe directly. Bun's `windowsHide`/`detached`
  // spawn options were unreliable here and left a visible (and effectively
  // orphaned-looking) console window behind; WScript.Shell.Run's window-style
  // argument is a native OS-level hide that doesn't depend on Bun's own
  // Windows spawn handling.
  const vbs = `CreateObject("WScript.Shell").Run "${scriptPath.replace(/"/g, '""')}", 0, False`;
  writeFileSync(vbsPath, vbs);

  spawn("wscript.exe", ["//B", vbsPath], {
    detached: true,
    stdio: "ignore",
  }).unref();

  console.log("Update staged. Restarting to apply it...");
  process.exit(0);
}
