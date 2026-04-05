import { ApiProperty } from '@nestjs/swagger';

export class AuditLogResponseDto {
  @ApiProperty({ example: '65f1c2a3b4d5e6f7a8b9c0d1' })
  id: string;

  @ApiProperty({
    example: '65f1c2a3b4d5e6f7a8b9c0d2',
    description: 'The ID of the admin who performed the action',
  })
  adminId: string;

  @ApiProperty({
    example: 'APPROVE_SELF_NOMINATION',
    enum: [
      'APPROVE_SELF_NOMINATION',
      'REJECT_SELF_NOMINATION',
      'ADD_VOTER',
      'REMOVE_CANDIDATE',
    ],
  })
  action: string;

  @ApiProperty({ example: 'ELECTION', enum: ['ELECTION', 'POLL'] })
  targetType: string;

  @ApiProperty({
    example: '65f1c2a3b4d5e6f7a8b9c0d3',
    description: 'ID of the target election/poll',
  })
  targetId: string;

  @ApiProperty({
    description: 'Dynamic JSON details of the action',
    example: {
      candidateId: '65f1c2a3b4d5e6f7a8b9c0d4',
      reason: 'Does not meet requirements',
    },
  })
  details: any;

  @ApiProperty({ example: '2026-04-01T16:00:00.000Z' })
  createdAt: Date;
}
