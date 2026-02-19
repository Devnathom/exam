import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/events',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  afterInit() {
    this.logger.log('WebSocket Gateway เริ่มทำงาน');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client เชื่อมต่อ: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ตัดการเชื่อมต่อ: ${client.id}`);
  }

  @SubscribeMessage('join.school')
  handleJoinSchool(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { schoolId: string },
  ) {
    client.join(`school:${data.schoolId}`);
    this.logger.log(`Client ${client.id} เข้าร่วมห้อง school:${data.schoolId}`);
    return { event: 'joined', data: { schoolId: data.schoolId } };
  }

  @SubscribeMessage('join.exam')
  handleJoinExam(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { examId: string },
  ) {
    client.join(`exam:${data.examId}`);
    this.logger.log(`Client ${client.id} เข้าร่วมห้อง exam:${data.examId}`);
    return { event: 'joined', data: { examId: data.examId } };
  }

  emitToSchool(schoolId: string, event: string, data: any) {
    this.server.to(`school:${schoolId}`).emit(event, data);
  }

  emitToExam(examId: string, event: string, data: any) {
    this.server.to(`exam:${examId}`).emit(event, data);
  }

  emitToAll(event: string, data: any) {
    this.server.emit(event, data);
  }
}
