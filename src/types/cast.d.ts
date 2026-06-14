// Tipos mínimos para el SDK web de Google Cast (cargado en runtime desde gstatic)
// y para las APIs de AirPlay de WebKit. Solo declaramos lo que usamos.

interface CastMediaInfo {
  contentId: string;
  contentType: string;
  streamType?: string;
  metadata?: unknown;
}

interface CastRemotePlayer {
  isConnected: boolean;
  isPaused: boolean;
  duration: number;
  currentTime: number;
}

interface CastSession {
  loadMedia(request: unknown): Promise<void>;
}

interface CastContext {
  setOptions(options: Record<string, unknown>): void;
  getCurrentSession(): CastSession | null;
  requestSession(): Promise<void>;
  addEventListener(type: string, handler: (event: unknown) => void): void;
}

interface Window {
  __onGCastApiAvailable?: (isAvailable: boolean) => void;
  chrome?: {
    cast?: {
      isAvailable: boolean;
      media: {
        MediaInfo: new (contentId: string, contentType: string) => CastMediaInfo;
        LoadRequest: new (mediaInfo: CastMediaInfo) => unknown;
        DEFAULT_MEDIA_RECEIVER_APP_ID: string;
      };
      AutoJoinPolicy: { ORIGIN_SCOPED: string };
    };
  };
  cast?: {
    framework: {
      CastContext: { getInstance(): CastContext };
      CastContextEventType: { SESSION_STATE_CHANGED: string };
      RemotePlayer: new () => CastRemotePlayer;
      RemotePlayerController: new (player: CastRemotePlayer) => {
        addEventListener(type: string, handler: () => void): void;
      };
      RemotePlayerEventType: { IS_CONNECTED_CHANGED: string };
      SessionState: { SESSION_STARTED: string; SESSION_RESUMED: string };
    };
  };
}

interface HTMLVideoElement {
  webkitShowPlaybackTargetPicker?: () => void;
}
