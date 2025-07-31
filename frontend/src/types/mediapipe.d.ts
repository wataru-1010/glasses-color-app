declare module '@mediapipe/face_detection' {
  export class FaceDetection {
    constructor(config: any);
    setOptions(options: any): void;
    send(input: any): Promise<any>;
    onResults(callback: (results: any) => void): void;
  }
}

declare module '@mediapipe/camera_utils' {
  export class Camera {
    constructor(videoElement: HTMLVideoElement, config: any);
    start(): void;
    stop(): void;
  }
}

declare module '@mediapipe/drawing_utils' {
  export function drawConnectors(ctx: CanvasRenderingContext2D, landmarks: any[], connections: any[], options?: any): void;
  export function drawLandmarks(ctx: CanvasRenderingContext2D, landmarks: any[], options?: any): void;
}
