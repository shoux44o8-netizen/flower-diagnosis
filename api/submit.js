const ALLOWED_FLOWERS = new Set([
  "sandersonia",
  "sunflower",
  "mimosa",
  "ranunculus",
  "marigold",
  "oncidium"
]);

function createJsonResponse(body, status = 200) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      }
    }
  );
}

function normalizeText(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

export async function POST(request) {
  try {
    const supabaseUrl =
      process.env.SUPABASE_URL;

    const supabasePublishableKey =
      process.env.SUPABASE_PUBLISHABLE_KEY;

    if (
      !supabaseUrl ||
      !supabasePublishableKey
    ) {
      console.error(
        "Supabase environment variables are missing."
      );

      return createJsonResponse(
        {
          ok: false,
          code: "SERVER_CONFIG_ERROR",
          message:
            "保存先の設定を確認できませんでした。"
        },
        500
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return createJsonResponse(
        {
          ok: false,
          code: "INVALID_JSON",
          message:
            "送信内容の形式が正しくありません。"
        },
        400
      );
    }

    const guestName =
      normalizeText(body.guestName);

    const deviceId =
      normalizeText(body.deviceId);

    const flowerResult =
      normalizeText(body.flowerResult);

    if (
      guestName.length < 1 ||
      guestName.length > 20
    ) {
      return createJsonResponse(
        {
          ok: false,
          code: "INVALID_GUEST_NAME",
          message:
            "お名前は1文字以上20文字以内で入力してください。"
        },
        400
      );
    }

    if (
      deviceId.length < 10 ||
      deviceId.length > 100
    ) {
      return createJsonResponse(
        {
          ok: false,
          code: "INVALID_DEVICE_ID",
          message:
            "端末情報の形式が正しくありません。"
        },
        400
      );
    }

    if (
      !ALLOWED_FLOWERS.has(flowerResult)
    ) {
      return createJsonResponse(
        {
          ok: false,
          code: "INVALID_FLOWER",
          message:
            "診断結果の形式が正しくありません。"
        },
        400
      );
    }

    const commonHeaders = {
      apikey: supabasePublishableKey,
      "Content-Type": "application/json"
    };

    /*
      現在受付中で、まだ抽選が終わっていない
      最新のイベントを1件取得します。
    */

    const eventUrl =
      new URL(
        "/rest/v1/lottery_events",
        supabaseUrl
      );

    eventUrl.searchParams.set(
      "select",
      "id"
    );

    const currentTime =
  new Date().toISOString();

eventUrl.searchParams.set(
  "is_open",
  "eq.true"
);

eventUrl.searchParams.set(
  "draw_finished",
  "eq.false"
);

eventUrl.searchParams.set(
  "starts_at",
  `lte.${currentTime}`
);

eventUrl.searchParams.set(
  "ends_at",
  `gt.${currentTime}`
);

eventUrl.searchParams.set(
  "order",
  "starts_at.desc"
);

eventUrl.searchParams.set(
  "limit",
  "1"
);

    const eventResponse =
      await fetch(eventUrl, {
        method: "GET",
        headers: commonHeaders
      });

    if (!eventResponse.ok) {
      const errorText =
        await eventResponse.text();

      console.error(
        "lottery_events request failed:",
        eventResponse.status,
        errorText
      );

      return createJsonResponse(
        {
          ok: false,
          code: "EVENT_LOOKUP_FAILED",
          message:
            "抽選受付の状態を確認できませんでした。"
        },
        502
      );
    }

    const events =
      await eventResponse.json();

    const activeEvent =
      Array.isArray(events)
        ? events[0]
        : null;

    if (!activeEvent?.id) {
      return createJsonResponse(
        {
          ok: false,
          code: "LOTTERY_CLOSED",
          message:
            "現在、抽選の受付時間外です。"
        },
        403
      );
    }

    /*
      API側で参加者IDを先に作ります。

      Supabaseから登録行を読み返さなくても、
      このIDをブラウザへ返せるためです。
    */

    const participantId =
      crypto.randomUUID();

    const participantUrl =
      new URL(
        "/rest/v1/participants",
        supabaseUrl
      );

    const participantResponse =
      await fetch(participantUrl, {
        method: "POST",
        headers: {
          ...commonHeaders,
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
  id: participantId,
  event_id: activeEvent.id,
  guest_name: guestName,
  device_id: deviceId,
  flower_result: flowerResult,

  lottery_status:
    flowerResult === "sandersonia"
      ? "pending"
      : "not_selected",

  winner_number: null
})
      });

    if (!participantResponse.ok) {
      const errorText =
        await participantResponse.text();

      console.error(
        "participants insert failed:",
        participantResponse.status,
        errorText
      );

      const isDuplicate =
        participantResponse.status === 409 ||
        errorText.includes(
          "participants_device_unique"
        ) ||
        errorText.includes(
          "duplicate key"
        );

      if (isDuplicate) {
        return createJsonResponse(
          {
            ok: false,
            code: "ALREADY_ENTERED",
            message:
              "この端末では、すでに診断結果が登録されています。"
          },
          409
        );
      }

      return createJsonResponse(
        {
          ok: false,
          code: "SAVE_FAILED",
          message:
            "診断結果を保存できませんでした。"
        },
        502
      );
    }

    return createJsonResponse({
  ok: true,
  participantId,

  lotteryStatus:
    flowerResult === "sandersonia"
      ? "pending"
      : "not_selected"
});
  } catch (error) {
    console.error(
      "Unexpected submit error:",
      error
    );

    return createJsonResponse(
      {
        ok: false,
        code: "UNEXPECTED_ERROR",
        message:
          "診断結果の保存中にエラーが発生しました。"
      },
      500
    );
  }
}

export function GET() {
  return createJsonResponse(
    {
      ok: true,
      endpoint: "submit",
      message:
        "Flower diagnosis submit API is running."
    },
    200
  );
}
