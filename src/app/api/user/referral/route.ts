import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const REFERRAL_REWARD_NEW = 500;
const REFERRAL_REWARD_REFERRER = 300;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { code } = await request.json();
  if (!code) {
    return NextResponse.json({ error: "추천인 코드를 입력해주세요." }, { status: 400 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { referredById: true },
  });

  if (currentUser?.referredById) {
    return NextResponse.json({ error: "이미 추천인 코드를 사용했습니다." }, { status: 400 });
  }

  const referrer = await prisma.user.findUnique({
    where: { referralCode: code.toUpperCase() },
    select: { id: true },
  });

  if (!referrer) {
    return NextResponse.json({ error: "유효하지 않은 추천인 코드입니다." }, { status: 404 });
  }

  if (referrer.id === session.user.id) {
    return NextResponse.json({ error: "자기 자신을 추천할 수 없습니다." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        referredById: referrer.id,
        coins: { increment: REFERRAL_REWARD_NEW },
      },
    }),
    prisma.user.update({
      where: { id: referrer.id },
      data: { coins: { increment: REFERRAL_REWARD_REFERRER } },
    }),
    prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: "EARN",
        amount: REFERRAL_REWARD_NEW,
        reason: "referral_new",
      },
    }),
    prisma.transaction.create({
      data: {
        userId: referrer.id,
        type: "EARN",
        amount: REFERRAL_REWARD_REFERRER,
        reason: "referral_referrer",
      },
    }),
  ]);

  return NextResponse.json({ reward: REFERRAL_REWARD_NEW });
}
