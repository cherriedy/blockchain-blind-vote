import { Logger, OnApplicationBootstrap } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { BlockchainService } from './blockchain';

@WebSocketGateway({
  namespace: '/voting',
  cors: { origin: '*', credentials: false },
})
export class VoteGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnApplicationBootstrap
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(VoteGateway.name);

  constructor(private readonly blockchainService: BlockchainService) {}

  // On application bootstrap, subscribe to blockchain events and set up real-time broadcasting
  onApplicationBootstrap() {
    this.blockchainService.subscribeToVoteEvents((payload) => {
      const room = `${payload.voteType}:${payload.voteId}`;
      this.server.to(room).emit('vote:update', payload);
      this.logger.log(
        `vote:update → room ${room} | ` +
          (payload.candidateId
            ? `candidate ${payload.candidateId}`
            : `option ${payload.optionIndex}`) +
          ` newTotal=${payload.newTotal}`,
      );
    });
    this.logger.log('VoteGateway subscribed to contract events');
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  /** Client sends { voteType, voteId } to subscribe to a specific event room. */
  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() data: { voteType: string; voteId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `${data.voteType}:${data.voteId}`;
    void client.join(room);
    this.logger.debug(`${client.id} joined room ${room}`);
    return { joined: room };
  }
}
