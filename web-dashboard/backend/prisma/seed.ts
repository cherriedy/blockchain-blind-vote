import { PrismaClient } from '@prisma/client';
import { faker, fakerVI } from '@faker-js/faker';
import { VotingEventStatus } from '../src/enums';

const prisma = new PrismaClient();

function randomStatus() {
  const statuses = Object.values(VotingEventStatus);
  return statuses[Math.floor(Math.random() * statuses.length)];
}

function randomVisibility() {
  const visibilities = ['public', 'private'];
  return visibilities[Math.floor(Math.random() * visibilities.length)];
}

const candidateBios = [
  'Sinh viên năm cuối ngành Công nghệ thông tin, từng là chủ nhiệm CLB Lập trình.',
  'Thành viên tích cực của Đoàn trường, đam mê hoạt động thiện nguyện.',
  'Đạt giải Nhất cuộc thi Hùng biện tiếng Anh cấp trường.',
  'Thủ lĩnh đội bóng đá khoa Kinh tế.',
  'Tình nguyện viên chương trình Mùa hè xanh 2025.',
  'Chủ nhiệm CLB Sách và Hành động, yêu thích đọc sách.',
  'Thành viên Ban tổ chức Ngày hội Việc làm 2026.',
  'Đại diện sinh viên tham dự hội thảo quốc tế về đổi mới sáng tạo.',
];
const candidateAvatars = [
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/men/45.jpg',
  'https://randomuser.me/api/portraits/women/46.jpg',
  'https://randomuser.me/api/portraits/men/47.jpg',
  'https://randomuser.me/api/portraits/women/48.jpg',
  'https://randomuser.me/api/portraits/men/49.jpg',
  'https://randomuser.me/api/portraits/women/50.jpg',
];

async function main() {
  console.log('Starting seed...');

  // ── Voter ─────────────────────────────────────────────────────────────────
  let voter = await prisma.voter.findFirst({
    where: { studentId: '2254810059' },
  });
  if (!voter) {
    voter = await prisma.voter.create({
      data: {
        studentId: '2254810059',
        walletAddress: '0x0b9392f828396fae906330f352eb9db5e387ec01',
        name: 'Ho Dinh Huy',
        email: 'nn17101945@gmail.com',
        isActive: true,
      },
    });
  }
  console.log('Seeded voter:', voter.studentId);

  // ── Candidates ────────────────────────────────────────────────────────────
  const candidateSeeds = Array.from({ length: 8 }, (_, i) => ({
    studentId: `225481000${i + 1}`,
    name: fakerVI.person.fullName(),
    bio: candidateBios[i],
    avatarUrl: candidateAvatars[i],
    walletAddress: `0xabc100000000000000000000000000000000000${i + 1}`,
  }));
  const candidateRecords: { id: string; name: string }[] = [];
  for (const c of candidateSeeds) {
    let candidate = await prisma.candidate.findFirst({
      where: { studentId: c.studentId },
    });
    if (!candidate) {
      candidate = await prisma.candidate.create({ data: c });
    }
    candidateRecords.push(candidate);
  }
  console.log(
    'Seeded candidates:',
    candidateRecords.map((c) => c.name).join(', '),
  );

  // ── ELECTIONS ───────────────────────────────────────────────────
  const now = new Date();
  const electionNames = [
    'Bầu Ban chấp hành Đoàn trường nhiệm kỳ 2026-2028',
    'Bầu Chủ tịch Hội sinh viên nhiệm kỳ 2026-2028',
    'Bầu Ban chủ nhiệm CLB Sách và Hành động',
    'Bầu Ban tổ chức Ngày hội Việc làm 2026',
    'Bầu Ban chấp hành Liên chi hội Khoa Kinh tế',
    'Bầu Ban chủ nhiệm CLB Tiếng Anh',
    'Bầu Ban chấp hành Đoàn khoa Công nghệ thông tin',
    'Bầu Ban chủ nhiệm CLB Bóng đá',
  ];
  const electionDescriptions = [
    'Bầu chọn những sinh viên xuất sắc, có năng lực lãnh đạo và tinh thần trách nhiệm cao để dẫn dắt Đoàn trường.',
    'Tìm kiếm Chủ tịch Hội sinh viên năng động, sáng tạo, đại diện tiếng nói của sinh viên toàn trường.',
    'Bầu ra Ban chủ nhiệm mới cho CLB Sách và Hành động, thúc đẩy phong trào đọc sách.',
    'Chọn lựa những sinh viên có kinh nghiệm tổ chức sự kiện cho Ngày hội Việc làm 2026.',
    'Bầu Ban chấp hành Liên chi hội Khoa Kinh tế nhiệm kỳ mới.',
    'Bầu Ban chủ nhiệm CLB Tiếng Anh, phát triển các hoạt động ngoại ngữ.',
    'Bầu Ban chấp hành Đoàn khoa CNTT, thúc đẩy phong trào học tập và nghiên cứu.',
    'Bầu Ban chủ nhiệm CLB Bóng đá, tổ chức các giải đấu nội bộ.',
  ];
  const elections = Array.from({ length: 8 }, (_, i) => {
    const year = 2026 + Math.floor(i / 3);
    // Randomly pick 1–3 candidates for each election
    const shuffled = [...candidateRecords].sort(() => Math.random() - 0.5);
    const pickedIds = shuffled
      .slice(0, fakerVI.number.int({ min: 1, max: candidateRecords.length }))
      .map((c) => c.id);
    return {
      name: electionNames[i],
      description: electionDescriptions[i],
      startAt: new Date(now.getTime() + i * 86400000).getTime(),
      endAt: new Date(now.getTime() + (i + 10) * 86400000).getTime(),
      status: randomStatus(),
      visibility: randomVisibility(),
      isAutomatic: faker.datatype.boolean(),
      candidateIds: pickedIds,
      allowSelfNomination: faker.datatype.boolean(),
      votes: {},
    };
  });
  const electionRecords = [];
  for (const e of elections) {
    let election = await prisma.election.findFirst({ where: { name: e.name } });
    if (!election) {
      election = await prisma.election.create({ data: e });
    }
    electionRecords.push(election);
  }
  console.log(
    'Seeded elections:',
    electionRecords.map((e) => e.name).join(', '),
  );

  // ── POLLS ───────────────────────────────────────────────────────
  const pollQuestions = [
    'Bạn đánh giá thế nào về chất lượng giảng dạy của giảng viên?',
    'Bạn có hài lòng với cơ sở vật chất của trường không?',
    'Bạn mong muốn hoạt động ngoại khóa nào được tổ chức nhiều hơn?',
    'Bạn có gặp khó khăn khi đăng ký môn học trực tuyến?',
    'Bạn đánh giá thế nào về dịch vụ hỗ trợ sinh viên?',
    'Bạn có đề xuất gì để cải thiện thư viện trường?',
  ];
  const pollOptions = [
    ['Rất tốt', 'Tốt', 'Bình thường', 'Chưa tốt', 'Kém'],
    [
      'Rất hài lòng',
      'Hài lòng',
      'Bình thường',
      'Không hài lòng',
      'Rất không hài lòng',
    ],
    [
      'Hoạt động thể thao',
      'CLB học thuật',
      'Chương trình thiện nguyện',
      'Hội thảo kỹ năng',
      'Sự kiện văn nghệ',
    ],
    [
      'Không gặp khó khăn',
      'Khó về kỹ thuật',
      'Khó về thời gian',
      'Khó về thông tin',
      'Khác',
    ],
    [
      'Rất hài lòng',
      'Hài lòng',
      'Bình thường',
      'Không hài lòng',
      'Rất không hài lòng',
    ],
    [
      'Tăng số lượng sách',
      'Cải thiện không gian',
      'Kéo dài thời gian mở cửa',
      'Tổ chức workshop',
      'Khác',
    ],
  ];
  const polls = Array.from({ length: 6 }, (_, i) => {
    return {
      name: 'Khảo sát ' + (2026 + Math.floor(i / 3)),
      description:
        'Khảo sát ý kiến sinh viên về các vấn đề nổi bật trong trường.',
      question: pollQuestions[i],
      startAt: new Date(now.getTime() + i * 86400000).getTime(),
      endAt: new Date(now.getTime() + (i + 1) * 86400000).getTime(),
      status: randomStatus(),
      visibility: 'public',
      isAutomatic: false,
      options: pollOptions[i],
      votes: [0, 0, 0, 0, 0],
    };
  });
  const pollRecords = [];
  for (const p of polls) {
    let poll = await prisma.poll.findFirst({ where: { name: p.name } });
    if (!poll) {
      poll = await prisma.poll.create({ data: p });
    }
    pollRecords.push(poll);
  }
  console.log('Seeded polls:', pollRecords.map((p) => p.name).join(', '));

  // ── EVENT_VOTER FOR VOTER ────────────────────────────────────────────────
  // Assign last 3 elections and last 3 polls to the voter
  const assignedElections = electionRecords.slice(-3);
  const assignedPolls = pollRecords.slice(-3);

  for (const election of assignedElections) {
    let eventVoter = await prisma.eventVoter.findFirst({
      where: { voteType: 'election', voteId: election.id, voterId: voter.id },
    });
    if (!eventVoter) {
      eventVoter = await prisma.eventVoter.create({
        data: {
          voterId: voter.id,
          voteType: 'election',
          voteId: election.id,
          canVote: true,
        },
      });
    }
  }

  for (const poll of assignedPolls) {
    let pollEventVoter = await prisma.eventVoter.findFirst({
      where: { voteType: 'poll', voteId: poll.id, voterId: voter.id },
    });
    if (!pollEventVoter) {
      pollEventVoter = await prisma.eventVoter.create({
        data: {
          voterId: voter.id,
          voteType: 'poll',
          voteId: poll.id,
          canVote: true,
        },
      });
    }
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
