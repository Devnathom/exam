import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

class WebSocketService {
  private socket: Socket | null = null;
  private schoolId: string | null = null;

  connect(schoolId: string) {
    if (this.socket?.connected && this.schoolId === schoolId) return;

    this.disconnect();
    this.schoolId = schoolId;

    this.socket = io(`${WS_URL}/events`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket เชื่อมต่อสำเร็จ');
      this.socket?.emit('join.school', { schoolId });
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket ตัดการเชื่อมต่อ');
    });

    this.socket.on('connect_error', (err) => {
      console.error('WebSocket เชื่อมต่อผิดพลาด:', err.message);
    });
  }

  joinExam(examId: string) {
    this.socket?.emit('join.exam', { examId });
  }

  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (data: any) => void) {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.schoolId = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const wsService = new WebSocketService();
export default wsService;
