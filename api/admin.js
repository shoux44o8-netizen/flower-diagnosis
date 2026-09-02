const WEDDING_EVENT_CODE =
  "wedding-2026-09-19";

function createJsonResponse(
  body,
  status = 200
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      }
    }
  );
}

function getSupabaseSettings() {
  const supabaseUrl =
    process.env.SUPABASE_URL;

  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !supabaseSecretKey
  ) {
    throw new Error(
      "Supabaseの管理用環境変数が設定されていません。"
    );
  }

  return {
    supabaseUrl,
    supabaseSecretKey
  };
}

function createSupabaseHeaders(
  supabaseSecretKey
) {
  return {
    apikey: supabaseSecretKey,
    "Content-Type": "application/json"
  };
}

function verifyAdminPin(pin) {
  const expectedPin =
    process.env.LOTTERY_ADMIN_PIN ||
    process.env.ADMIN_SECRET;

  return (
    typeof pin === "string" &&
    typeof expectedPin === "string" &&
    pin === expectedPin
  );
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function getWeddingStatus() {
  const {
    supabaseUrl,
    supabaseSecretKey
  } = getSupabaseSettings();

  const headers =
    createSupabaseHeaders(
      supabaseSecretKey
    );

  const eventUrl =
    new URL(
      "/rest/v1/lottery_events",
      supabaseUrl
    );

  eventUrl.searchParams.set(
    "select",
    [
      "id",
      "name",
      "event_code",
      "starts_at",
      "ends_at",
      "is_open",
      "draw_finished",
      "closed_at",
      "drawn_at",
      "max_winners"
    ].join(",")
  );

  eventUrl.searchParams.set(
    "event_code",
    `eq.${WEDDING_EVENT_CODE}`
  );

  eventUrl.searchParams.set(
    "limit",
    "1"
  );

  const eventResponse =
    await fetch(eventUrl, {
      method: "GET",
      headers
    });

  if (!eventResponse.ok) {
    const details =
      await eventResponse.text();

    throw new Error(
      `イベント取得エラー: ${details}`
    );
  }

  const events =
    await eventResponse.json();

  const event =
    Array.isArray(events)
      ? events[0]
      : null;

  if (!event) {
    throw new Error(
      "本番イベントが見つかりません。"
    );
  }

  const participantsUrl =
    new URL(
      "/rest/v1/participants",
      supabaseUrl
    );

  participantsUrl.searchParams.set(
    "select",
    [
      "id",
      "guest_name",
      "flower_result",
      "lottery_status",
      "winner_number"
    ].join(",")
  );

  participantsUrl.searchParams.set(
    "event_id",
    `eq.${event.id}`
  );

  const participantsResponse =
    await fetch(
      participantsUrl,
      {
        method: "GET",
        headers
      }
    );

  if (!participantsResponse.ok) {
    const details =
      await participantsResponse.text();

    throw new Error(
      `参加者取得エラー: ${details}`
    );
  }

  const participants =
    await participantsResponse.json();

  const sandersoniaCount =
    participants.filter(
      (participant) =>
        participant.flower_result ===
        "sandersonia"
    ).length;

  const winners =
    participants
      .filter(
        (participant) =>
          participant.lottery_status ===
          "winner"
      )
      .sort(
        (a, b) =>
          Number(a.winner_number) -
          Number(b.winner_number)
      );

  return {
    event,
    totalParticipants:
      participants.length,
    sandersoniaCount,
    winners
  };
}

async function executeDraw() {
  const {
    supabaseUrl,
    supabaseSecretKey
  } = getSupabaseSettings();

  const rpcUrl =
    new URL(
      "/rest/v1/rpc/draw_golden_winners",
      supabaseUrl
    );

  const rpcResponse =
    await fetch(
      rpcUrl,
      {
        method: "POST",
        headers:
          createSupabaseHeaders(
            supabaseSecretKey
          ),
        body: JSON.stringify({
          target_event_code:
            WEDDING_EVENT_CODE
        })
      }
    );

  if (!rpcResponse.ok) {
    const details =
      await rpcResponse.text();

    throw new Error(
      `抽選実行エラー: ${details}`
    );
  }

  return await rpcResponse.json();
}

export async function GET() {
  return createJsonResponse(
    {
      ok: true,
      endpoint: "admin",
      message:
        "Wedding lottery admin API is running."
    },
    200
  );
}

export async function POST(request) {
  try {
    const body =
      await readJsonBody(request);

    const pin =
      typeof body.pin === "string"
        ? body.pin.trim()
        : "";

    const action =
      typeof body.action === "string"
        ? body.action.trim()
        : "";

    if (!verifyAdminPin(pin)) {
      return createJsonResponse(
        {
          ok: false,
          code: "INVALID_PIN",
          message:
            "管理PINが正しくありません。"
        },
        401
      );
    }

    if (action === "status") {
      const status =
        await getWeddingStatus();

      return createJsonResponse({
        ok: true,
        ...status
      });
    }

    if (action === "draw") {
      const winners =
        await executeDraw();

      const status =
        await getWeddingStatus();

      return createJsonResponse({
        ok: true,
        message:
          "受付を締め切り、抽選を完了しました。",
        winners,
        ...status
      });
    }

    return createJsonResponse(
      {
        ok: false,
        code: "INVALID_ACTION",
        message:
          "管理操作の種類が正しくありません。"
      },
      400
    );
  } catch (error) {
    console.error(
      "Admin API error:",
      error
    );

    return createJsonResponse(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "管理操作を実行できませんでした。"
      },
      500
    );
  }
}
