// Browser APIs the engine and the AUDIO dialog use that TypeScript's DOM lib doesn't have yet. Each is optional
// at run time: the code feature-checks before calling it.
export {};

declare global {
  // Audio Output Devices API on AudioContext (Chromium): open on a device, switch devices, hear about changes
  interface AudioContextOptions { sinkId?: string }
  interface AudioContext { readonly sinkId?: string; setSinkId?(sinkId: string): Promise<void> }
  // iOS Safari's audio session; "playback" keeps sound on with the ring/silent switch set to silent
  interface Navigator { audioSession?: { type: string } }
  // Audio Output Devices API on MediaDevices (Firefox): pick an output device, which also reveals its label
  interface MediaDevices { selectAudioOutput?(options?: { deviceId?: string }): Promise<MediaDeviceInfo> }
}
