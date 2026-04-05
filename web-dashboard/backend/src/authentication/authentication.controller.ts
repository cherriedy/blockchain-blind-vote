import {
  Controller,
  Post,
  Body,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import {
  EligibilityChallengeRequestDto,
  EligibilityService,
  EligibilityVerifyRequestDto,
} from '../eligibility';
import { Public } from '../shared/decorations';

@Controller('auth')
@Public()
export class AuthenticationController {
  constructor(private readonly eligibilityService: EligibilityService) {}

  @Post('challenge')
  @ApiOperation({ summary: 'Create eligibility challenge' })
  @ApiBody({ type: EligibilityChallengeRequestDto })
  @ApiResponse({ status: 201, description: 'Eligibility challenge created.' })
  createEligibilityChallenge(@Body() body: EligibilityChallengeRequestDto) {
    try {
      return this.eligibilityService.createEligibilityChallenge(
        body.studentId,
        body.walletAddress,
        body.voteType,
        body.voteId,
      );
    } catch (e) {
      console.log('Error creating eligibility challenge:', e);
      throw new InternalServerErrorException(
        'There was an error during handling your request. Please try again.',
      );
    }
  }

  @Post('verify-challenge')
  @ApiOperation({ summary: 'Verify eligibility signature' })
  @ApiBody({ type: EligibilityVerifyRequestDto })
  @ApiResponse({ status: 200, description: 'Eligibility verified.' })
  verifyEligibilitySignature(@Body() body: EligibilityVerifyRequestDto) {
    try {
      return this.eligibilityService.verifyEligibilitySignature(
        body.studentId,
        body.walletAddress,
        body.signature,
        body.voteType,
        body.voteId,
      );
    } catch (e) {
      console.log('Error verifying eligibility signature:', e);
      throw new InternalServerErrorException(
        'There was an error during handling your request. Please try again.',
      );
    }
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout and clear login challenge state' })
  @ApiBody({ type: EligibilityChallengeRequestDto })
  @ApiResponse({ status: 200, description: 'Logout processed.' })
  async logout(@Body() body: EligibilityChallengeRequestDto) {
    try {
      return await this.eligibilityService.logout(
        body.studentId,
        body.walletAddress,
      );
    } catch (e) {
      console.log('Error processing logout:', e);
      throw new InternalServerErrorException(
        'There was an error during handling your request. Please try again.',
      );
    }
  }
}
