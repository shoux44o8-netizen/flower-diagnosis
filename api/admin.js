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
    process.env.SUPABASE_SECRET_KEY;

  if (
    !supabaseUrl ||
    !supabaseSecretKey
  ) {
    throw new Error(
      "Supabaseの管理用設定がありません。"
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
    process.env.LOTTERY_ADMIN_PIN;

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
      headers
    });

  if (!eventResponse.ok) {
    throw new Error(
      await eventResponse.text()
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
        headers
      }
    );

  if (!participantsResponse.ok) {
    throw new Error(
      await participantsResponse.text()
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
          a.winner_number -
          b.winner_number
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

  const rpcResponse =
    await fetch(
      `${supabaseUrl}` +
      `/rest/v1/rpc/` +
      `draw_golden_winners`,
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

    console.error(
      "Draw RPC failed:",
      details
    );

    throw new Error(
      "抽選処理を実行できませんでした。"
    );
  }

  return await rpcResponse.json();
}

export async function GET() {
  try {
    const status =
      await getWeddingStatus();

    return createJsonResponse({
      ok: true,
      ...status
    });
  } catch (error) {
    console.error(
      "Admin status error:",
      error
    );

    return createJsonResponse(
      {
        ok: false,
        message:
          "管理情報を取得できませんでした。"
      },
      500
    );
  }
}

export async function POST(request) {
  try {
    const body =
      await readJsonBody(request);

    const pin =
      typeof body.pin === "string"
        ? body.pin.trim()
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
  } catch (error) {
    console.error(
      "Admin draw error:",
      error
    );

    return createJsonResponse(
      {
        ok: false,
        message:
          "抽選を実行できませんでした。"
      },
      500
    );
  }
}
