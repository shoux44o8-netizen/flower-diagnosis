"use strict";

/* =====================================================
   REHEARSAL SETTINGS
===================================================== */

const REHEARSAL_EVENT_CODE =
  "rehearsal-2026";

const RESET_CONFIRMATION_TEXT =
  "RESET_REHEARSAL";


/* =====================================================
   RESPONSE
===================================================== */

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

        "Cache-Control":
          "no-store, no-cache, must-revalidate"
      }
    }
  );
}


/* =====================================================
   SUPABASE SETTINGS
===================================================== */

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
      "Supabaseの管理用環境変数が設定されていません。"
    );
  }

  return {
    supabaseUrl,
    supabaseSecretKey
  };
}


function createSupabaseHeaders(
  supabaseSecretKey,
  extraHeaders = {}
) {
  return {
    apikey:
      supabaseSecretKey,

    "Content-Type":
      "application/json",

    ...extraHeaders
  };
}


/* =====================================================
   ADMIN PIN
===================================================== */

function verifyAdminPin(pin) {
  const expectedPin =
    process.env.LOTTERY_ADMIN_PIN;

  return (
    typeof pin === "string" &&
    typeof expectedPin === "string" &&
    expectedPin.length > 0 &&
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


/* =====================================================
   EVENT
===================================================== */

async function getRehearsalEvent() {
  const {
    supabaseUrl,
    supabaseSecretKey
  } = getSupabaseSettings();

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
    `eq.${REHEARSAL_EVENT_CODE}`
  );

  eventUrl.searchParams.set(
    "limit",
    "1"
  );

  const response =
    await fetch(
      eventUrl,
      {
        method: "GET",

        headers:
          createSupabaseHeaders(
            supabaseSecretKey
          ),

        cache: "no-store"
      }
    );

  if (!response.ok) {
    const details =
      await response.text();

    throw new Error(
      `リハーサルイベント取得エラー: ${details}`
    );
  }

  const events =
    await response.json();

  const event =
    Array.isArray(events)
      ? events[0]
      : null;

  if (!event) {
    throw new Error(
      "リハーサルイベントが見つかりません。"
    );
  }

  return event;
}


/* =====================================================
   STATUS
===================================================== */

async function getRehearsalStatus() {
  const {
    supabaseUrl,
    supabaseSecretKey
  } = getSupabaseSettings();

  const event =
    await getRehearsalEvent();

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
      "device_id",
      "flower_result",
      "lottery_status",
      "winner_number",
      "created_at"
    ].join(",")
  );

  participantsUrl.searchParams.set(
    "event_id",
    `eq.${event.id}`
  );

  participantsUrl.searchParams.set(
    "order",
    "created_at.asc"
  );

  const response =
    await fetch(
      participantsUrl,
      {
        method: "GET",

        headers:
          createSupabaseHeaders(
            supabaseSecretKey
          ),

        cache: "no-store"
      }
    );

  if (!response.ok) {
    const details =
      await response.text();

    throw new Error(
      `リハーサル参加者取得エラー: ${details}`
    );
  }

  const participants =
    await response.json();

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
    winners,
    participants
  };
}


/* =====================================================
   DRAW
===================================================== */

async function executeRehearsalDraw() {
  const {
    supabaseUrl,
    supabaseSecretKey
  } = getSupabaseSettings();

  const rpcUrl =
    new URL(
      "/rest/v1/rpc/draw_golden_winners",
      supabaseUrl
    );

  const response =
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
            REHEARSAL_EVENT_CODE
        })
      }
    );

  if (!response.ok) {
    const details =
      await response.text();

    throw new Error(
      `リハーサル抽選エラー: ${details}`
    );
  }

  return await response.json();
}


/* =====================================================
   RESET PARTICIPANTS
===================================================== */

async function resetRehearsalParticipants(
  eventId
) {
  const {
    supabaseUrl,
    supabaseSecretKey
  } = getSupabaseSettings();

  const participantsUrl =
    new URL(
      "/rest/v1/participants",
      supabaseUrl
    );

  participantsUrl.searchParams.set(
    "event_id",
    `eq.${eventId}`
  );

  const response =
    await fetch(
      participantsUrl,
      {
        method: "PATCH",

        headers:
          createSupabaseHeaders(
            supabaseSecretKey,
            {
              Prefer:
                "return=minimal"
            }
          ),

        body: JSON.stringify({
          lottery_status:
            "pending",

          winner_number:
            null
        })
      }
    );

  if (!response.ok) {
    const details =
      await response.text();

    throw new Error(
      `リハーサル参加者初期化エラー: ${details}`
    );
  }
}


/* =====================================================
   RESET EVENT
===================================================== */

async function resetRehearsalEvent(
  eventId
) {
  const {
    supabaseUrl,
    supabaseSecretKey
  } = getSupabaseSettings();

  const eventUrl =
    new URL(
      "/rest/v1/lottery_events",
      supabaseUrl
    );

  eventUrl.searchParams.set(
    "id",
    `eq.${eventId}`
  );

  const response =
    await fetch(
      eventUrl,
      {
        method: "PATCH",

        headers:
          createSupabaseHeaders(
            supabaseSecretKey,
            {
              Prefer:
                "return=minimal"
            }
          ),

        body: JSON.stringify({
          is_open:
            true,

          draw_finished:
            false,

          closed_at:
            null,

          drawn_at:
            null,

          max_winners:
            3
        })
      }
    );

  if (!response.ok) {
    const details =
      await response.text();

    throw new Error(
      `リハーサルイベント初期化エラー: ${details}`
    );
  }
}


/* =====================================================
   RESET ALL
===================================================== */

async function resetRehearsal() {
  const event =
    await getRehearsalEvent();

  await resetRehearsalParticipants(
    event.id
  );

  await resetRehearsalEvent(
    event.id
  );

  return await getRehearsalStatus();
}


/* =====================================================
   GET
===================================================== */

export async function GET() {
  return createJsonResponse(
    {
      ok: true,
      endpoint:
        "admin-test",

      eventCode:
        REHEARSAL_EVENT_CODE,

      message:
        "Wedding lottery rehearsal API is running."
    },
    200
  );
}


/* =====================================================
   POST
===================================================== */

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
          code:
            "INVALID_PIN",

          message:
            "管理PINが正しくありません。"
        },
        401
      );
    }

    if (action === "status") {
      const status =
        await getRehearsalStatus();

      return createJsonResponse({
        ok: true,
        mode:
          "rehearsal",
        ...status
      });
    }

    if (action === "draw") {
      const drawResult =
        await executeRehearsalDraw();

      const status =
        await getRehearsalStatus();

      return createJsonResponse({
        ok: true,
        mode:
          "rehearsal",

        message:
          "リハーサル抽選を完了しました。",

        drawResult,
        ...status
      });
    }

    if (action === "reset") {
      const confirmation =
        typeof body.confirmation ===
          "string"
          ? body.confirmation
          : "";

      if (
        confirmation !==
        RESET_CONFIRMATION_TEXT
      ) {
        return createJsonResponse(
          {
            ok: false,

            code:
              "RESET_CONFIRMATION_REQUIRED",

            message:
              "リハーサル初期化の確認情報が正しくありません。"
          },
          400
        );
      }

      const status =
        await resetRehearsal();

      return createJsonResponse({
        ok: true,
        mode:
          "rehearsal",

        message:
          "リハーサル抽選を初期化しました。",

        ...status
      });
    }

    return createJsonResponse(
      {
        ok: false,

        code:
          "INVALID_ACTION",

        message:
          "リハーサル管理操作の種類が正しくありません。"
      },
      400
    );
  } catch (error) {
    console.error(
      "Rehearsal admin API error:",
      error
    );

    return createJsonResponse(
      {
        ok: false,

        message:
          error instanceof Error
            ? error.message
            : "リハーサル管理操作を実行できませんでした。"
      },
      500
    );
  }
}
