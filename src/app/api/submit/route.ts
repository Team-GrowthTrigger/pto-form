import { NextRequest, NextResponse } from 'next/server';

interface TeamMember {
  name: string;
  slackId: string;
}

interface SubmitBody {
  member: TeamMember;
  type: string;
  startDate: string;
  endDate: string;
  backup: TeamMember;
  notes?: string;
}

function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-').map(Number);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[month - 1]} ${day}`;
}

const TYPE_LABELS: Record<string, string> = {
  pto: 'PTO',
  unpaid: 'Unpaid Time Off',
  sick: 'Sick Leave',
  personal: 'Personal Day',
};

const TYPE_EMOJI: Record<string, string> = {
  pto: '🏖️',
  unpaid: '🏝️',
  sick: '🤒',
  personal: '🧘',
};

export async function POST(req: NextRequest) {
  const body: SubmitBody = await req.json();
  const { member, type, startDate, endDate, backup, notes } = body;

  if (!member?.slackId || !type || !startDate || !backup?.slackId) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_CHANNEL_ID || 'C06PR6VQECS';

  if (!token) {
    return NextResponse.json(
      { error: 'Slack is not configured. Add SLACK_BOT_TOKEN to env vars.' },
      { status: 500 }
    );
  }

  const isSingleDay = startDate === endDate;
  const dateRange = isSingleDay
    ? formatDate(startDate)
    : `${formatDate(startDate)} → ${formatDate(endDate)}`;
  const typeLabel = TYPE_LABELS[type] || type;
  const typeEmoji = TYPE_EMOJI[type] || '📋';

  // --- Immediate notification ---
  const immediateBlocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '🏝️  *New OOO Request*',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          `<@${member.slackId}> just locked in some time off`,
          '',
          `📅  *${dateRange}*`,
          `${typeEmoji}  ${typeLabel}`,
          `🫡  Backup: <@${backup.slackId}>`,
          notes ? `\n💬  _${notes}_` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      },
    },
    { type: 'divider' },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: 'Handle your business before then 💪  ·  _GT Time Off Portal_',
        },
      ],
    },
  ];

  const immediateRes = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel,
      text: `🏝️ ${member.name} just requested time off (${dateRange}). Backup: ${backup.name}`,
      blocks: immediateBlocks,
      unfurl_links: false,
    }),
  });

  const immediateData = await immediateRes.json();

  if (!immediateData.ok) {
    console.error('Slack postMessage error:', immediateData.error);
    return NextResponse.json(
      { error: `Slack error: ${immediateData.error}` },
      { status: 500 }
    );
  }

  // --- Schedule day-of reminder ---
  // Send at 9:00 AM COT (14:00 UTC) on the start date
  const reminderTime = new Date(`${startDate}T14:00:00Z`);
  const now = new Date();
  const minScheduleTime = now.getTime() + 60_000; // at least 1 min from now

  if (reminderTime.getTime() > minScheduleTime) {
    const throughText = isSingleDay
      ? 'Out for the day'
      : `Out through ${formatDate(endDate)}`;

    const reminderBlocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '⚡  *OOO Reminder*',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: [
            `Heads up — <@${member.slackId}> is out of office starting today`,
            '',
            `📅  *${throughText}*`,
            `🔄  Need something? Hit up <@${backup.slackId}>`,
          ].join('\n'),
        },
      },
      { type: 'divider' },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: 'We got this 🤙  ·  _GT Time Off Portal_',
          },
        ],
      },
    ];

    const postAt = Math.floor(reminderTime.getTime() / 1000);

    const scheduleRes = await fetch(
      'https://slack.com/api/chat.scheduleMessage',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel,
          text: `⚡ Reminder: ${member.name} is OOO today. Backup: ${backup.name}`,
          blocks: reminderBlocks,
          post_at: postAt,
          unfurl_links: false,
        }),
      }
    );

    const scheduleData = await scheduleRes.json();
    if (!scheduleData.ok) {
      console.error('Slack scheduleMessage error:', scheduleData.error);
      // Don't fail the whole request - the immediate notification was sent
    }
  }

  return NextResponse.json({ success: true });
}
