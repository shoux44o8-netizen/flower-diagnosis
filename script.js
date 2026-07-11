const screens = Array.from(document.querySelectorAll(".screen"));

const flowers = {

  sandersonia: {
    name: "サンダーソニア",
    english: "Sandersonia",
    scientific: "Sandersonia aurantiaca",
    language: "祝福・祈り",
    keywords: [
      "祝福",
      "希望",
      "ぬくもり"
    ],
    quote: "祝福は、大きな言葉ではなく、小さな優しさの中に咲く。",
    image: "assets/sandersonia.PNG",
    description:
      "人の幸せを自分のことのように喜び、静かに灯りを渡せる人。あなたのあたたかさは、大切な時間をそっと照らしています。"
  },

  sunflower: {
    name: "ひまわり",
    english: "Sunflower",
    scientific: "Helianthus annuus",
    language: "憧れ・光",
    keywords: [
      "前向き",
      "笑顔",
      "希望"
    ],
    quote: "あなたが向くその先には、きっと誰かの笑顔が咲いている。",
    image: "assets/sunflower.PNG",
    description:
      "まっすぐ太陽へ向かうように、人を明るく照らす存在。あなたの前向きなエネルギーは、自然と周囲を笑顔にし、新しい一歩を踏み出す勇気を与えています。"
  },

  mimosa: {
    name: "ミモザ",
    english: "Mimosa",
    scientific: "Acacia dealbata",
    language: "感謝・友情",
    keywords: [
      "感謝",
      "友情",
      "思いやり"
    ],
    quote: "ありがとうは、何度咲いても美しい花。",
    image: "assets/mimosa.PNG",
    description:
      "小さな優しさを見逃さず、人とのつながりを大切にできる人。あなたの温かな気遣いは、何気ない日常を特別な思い出へと変えてくれます。"
  },

  ranunculus: {
    name: "ラナンキュラス",
    english: "Ranunculus",
    scientific: "Ranunculus asiaticus",
    language: "晴れやかな魅力",
    keywords: [
      "魅力",
      "感性",
      "美しさ"
    ],
    quote: "美しさは、飾るものではなく、自然にあふれ出るもの。",
    image: "assets/ranunculus.PNG",
    description:
      "繊細な感性と美しいものを見つける力を持つ人。あなたらしい価値観やセンスは、周りの人の心をやさしく惹きつけています。"
  },

  marigold: {
    name: "マリーゴールド",
    english: "Marigold",
    scientific: "Tagetes erecta",
    language: "変わらぬ愛・温かな心",
    keywords: [
      "誠実",
      "安心",
      "変わらぬ愛"
    ],
    quote: "変わらない想いは、時を越えて花を咲かせる。",
    image: "assets/marigold.PNG",
    description:
      "一度結んだ縁を大切にし、長い時間をかけて信頼を育てられる人。あなたの誠実さは、大切な人にとって心から安心できる居場所になっています。"
  },

  oncidium: {
    name: "オンシジウム",
    english: "Oncidium",
    scientific: "Oncidium sphacelatum",
    language: "幸福・一緒に踊って",
    keywords: [
      "幸福",
      "自由",
      "楽しさ"
    ],
    quote: "心が踊る瞬間こそ、人生でいちばん美しい。",
    image: "assets/oncidium.PNG",
    description:
      "軽やかな発想と明るい雰囲気で、人を自然と笑顔にできる人。あなたの存在は、その場の空気を柔らかくし、幸せな時間を広げてくれます。"
  }

};

/*
  質問はあとから自由に変更できます。

  各回答の最後にある点数が、
  どの花にどれだけ近いかを決めています。

  例：
  {
    sunflower: 3,
    oncidium: 1
  }

  なら、その回答を選ぶと
  ひまわりに3点、オンシジウムに1点入ります。
*/

const questions = [
  {
    text: "初対面の人が多い場所で、あなたに近いのは？",
    answers: [
      {
        label: "自分から声をかけ、その場を明るくする",
        points: {
          sunflower: 3,
          oncidium: 1
        }
      },
      {
        label: "近くの人とゆっくり距離を縮める",
        points: {
          mimosa: 3,
          marigold: 1
        }
      },
      {
        label: "まず雰囲気を感じ、自然なタイミングを待つ",
        points: {
          ranunculus: 2,
          sandersonia: 2
        }
      }
    ]
  },

  {
    text: "誰かを喜ばせたいとき、何を大切にしますか？",
    answers: [
      {
        label: "驚きと楽しさのある演出",
        points: {
          oncidium: 3,
          sunflower: 1
        }
      },
      {
        label: "相手の好みを考えた丁寧な贈り物",
        points: {
          mimosa: 2,
          ranunculus: 2
        }
      },
      {
        label: "必要なときに、そっと寄り添うこと",
        points: {
          sandersonia: 3,
          marigold: 1
        }
      }
    ]
  },

  {
    text: "心が満たされる休日の過ごし方は？",
    answers: [
      {
        label: "外へ出て、にぎやかな時間を楽しむ",
        points: {
          sunflower: 2,
          oncidium: 2
        }
      },
      {
        label: "好きなものを見たり、つくったりする",
        points: {
          ranunculus: 3,
          mimosa: 1
        }
      },
      {
        label: "大切な人と穏やかに過ごす",
        points: {
          marigold: 2,
          sandersonia: 2
        }
      }
    ]
  },

  {
    text: "周りから言われて、いちばん嬉しい言葉は？",
    answers: [
      {
        label: "一緒にいると元気になる",
        points: {
          sunflower: 2,
          oncidium: 2
        }
      },
      {
        label: "センスがいい、見方が素敵",
        points: {
          ranunculus: 3,
          mimosa: 1
        }
      },
      {
        label: "優しくて、信頼できる",
        points: {
          marigold: 2,
          sandersonia: 2
        }
      }
    ]
  },

  {
    text: "困っている人に出会ったとき、どうしますか？",
    answers: [
      {
        label: "すぐに声をかけ、行動する",
        points: {
          sunflower: 2,
          oncidium: 1,
          sandersonia: 1
        }
      },
      {
        label: "相手が本当に必要としていることを考える",
        points: {
          mimosa: 3,
          marigold: 1
        }
      },
      {
        label: "安心できるよう、静かにそばにいる",
        points: {
          sandersonia: 3,
          ranunculus: 1
        }
      }
    ]
  },

  {
    text: "あなたが大切にしたい時間は？",
    answers: [
      {
        label: "みんなで笑い合う時間",
        points: {
          oncidium: 3,
          sunflower: 1
        }
      },
      {
        label: "美しいものに触れ、心が動く時間",
        points: {
          ranunculus: 3,
          mimosa: 1
        }
      },
      {
        label: "気持ちが通じ合い、安心できる時間",
        points: {
          sandersonia: 2,
          marigold: 2
        }
      }
    ]
  },

  {
    text: "贈り物を選ぶとき、最もあなたらしいのは？",
    answers: [
      {
        label: "思わず笑顔になる意外なもの",
        points: {
          oncidium: 3,
          sunflower: 1
        }
      },
      {
        label: "見た目や物語まで美しいもの",
        points: {
          ranunculus: 3,
          mimosa: 1
        }
      },
      {
        label: "相手との思い出や関係が伝わるもの",
        points: {
          marigold: 2,
          sandersonia: 2
        }
      }
    ]
  },

  {
    text: "結婚式で、特に心に残るものは？",
    answers: [
      {
        label: "会場全体の盛り上がりと笑顔",
        points: {
          sunflower: 2,
          oncidium: 2
        }
      },
      {
        label: "装花や衣装、空間の美しさ",
        points: {
          ranunculus: 3,
          mimosa: 1
        }
      },
      {
        label: "新郎新婦とゲストの間に流れる想い",
        points: {
          sandersonia: 3,
          marigold: 1
        }
      }
    ]
  }
];

let currentQuestionIndex = 0;
let guestName = "";
let scores = {};
let latestResultKey = null;

function createEmptyScores() {
  return {
    sandersonia: 0,
    sunflower: 0,
    mimosa: 0,
    ranunculus: 0,
    marigold: 0,
    oncidium: 0
  };
}

function resetQuizState() {
  currentQuestionIndex = 0;
  scores = createEmptyScores();
  latestResultKey = null;
}

function showScreen(screenId) {
  screens.forEach((screen) => {
    const shouldShow = screen.id === screenId;

    screen.classList.toggle("screen-active", shouldShow);
  });

  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "instant"
  });
}

function startQuiz() {
  const input = document.getElementById("guestName");

  guestName = input.value.trim();

  if (!guestName) {
    guestName = "ゲスト";
  }

  resetQuizState();
  showScreen("quizScreen");
  renderQuestion();
}

function renderQuestion() {
  const question = questions[currentQuestionIndex];

  const questionNumber = document.getElementById("questionNumber");
  const progressBar = document.getElementById("progressBar");
  const questionText = document.getElementById("questionText");
  const answerList = document.getElementById("answerList");

  questionNumber.textContent =
    `${String(currentQuestionIndex + 1).padStart(2, "0")} / ` +
    `${String(questions.length).padStart(2, "0")}`;

  progressBar.style.width =
    `${((currentQuestionIndex + 1) / questions.length) * 100}%`;

  questionText.textContent = question.text;

  answerList.innerHTML = "";

  question.answers.forEach((answer) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "answer-button";
    button.textContent = answer.label;

    button.addEventListener("click", () => {
      addPoints(answer.points);

      currentQuestionIndex += 1;

      if (currentQuestionIndex < questions.length) {
        animateNextQuestion();
      } else {
        finishQuiz();
      }
    });

    answerList.appendChild(button);
  });
}

function addPoints(points) {
  Object.entries(points).forEach(([flowerKey, point]) => {
    scores[flowerKey] += point;
  });
}

function animateNextQuestion() {
  const quizCard = document.querySelector(".quiz-card");

  if (!quizCard) {
    renderQuestion();
    return;
  }

  quizCard.style.opacity = "0";
  quizCard.style.transform = "translateY(5px)";

  window.setTimeout(() => {
    renderQuestion();

    quizCard.style.opacity = "1";
    quizCard.style.transform = "translateY(0)";
  }, 180);
}

function resolveResult() {
  const scoreEntries = Object.entries(scores);

  const highestScore = Math.max(
    ...scoreEntries.map(([, score]) => score)
  );

  const highestFlowers = scoreEntries
    .filter(([, score]) => score === highestScore)
    .map(([flowerKey]) => flowerKey);

  if (highestFlowers.length === 1) {
    return highestFlowers[0];
  }

  /*
    同点時の処理です。

    サンダーソニアが同点に含まれる場合は、
    少しだけ選ばれやすくしています。
  */

  if (
    highestFlowers.includes("sandersonia") &&
    highestFlowers.length > 1
  ) {
    const chooseSandersonia = Math.random() < 0.55;

    if (chooseSandersonia) {
      return "sandersonia";
    }

    const otherFlowers = highestFlowers.filter(
      (flowerKey) => flowerKey !== "sandersonia"
    );

    return otherFlowers[
      Math.floor(Math.random() * otherFlowers.length)
    ];
  }

  return highestFlowers[
    Math.floor(Math.random() * highestFlowers.length)
  ];
}

function finishQuiz() {
  latestResultKey = resolveResult();

  displayResult(latestResultKey);
  showScreen("resultScreen");

  /*
    現在はデモ抽選です。

    サンダーソニアになった人だけ、
    15％の確率で黄金演出が出ます。

    本番ではSupabaseに接続し、
    全参加者のうち3名だけに固定します。
  */

  const searchParameters = new URLSearchParams(
    window.location.search
  );

  const forceGolden =
    searchParameters.get("golden") === "1";

  const demoWinner =
    Math.random() < 0.15;

  const resultQuote =
document.getElementById("resultQuote");

  if (
  latestResultKey === "sandersonia" &&
  (forceGolden || demoWinner)
) {
  window.setTimeout(() => {
    showGoldenCelebration();
  }, 2300);
}
}

function displayResult(resultKey) {
  const flower = flowers[resultKey];

  const resultImage =
    document.getElementById("resultImage");

  const resultFlowerName =
    document.getElementById("resultFlowerName");

  const resultFlowerLanguage =
    document.getElementById("resultFlowerLanguage");

  const resultDescription =
    document.getElementById("resultDescription");

  const resultGuestName =
    document.getElementById("resultGuestName");

  const resultKeywords =
  document.getElementById("resultKeywords");
  
  const resultEnglishName =
  document.getElementById("resultEnglishName");

const resultScientificName =
  document.getElementById("resultScientificName");

  resultImage.src = flower.image;
  resultImage.alt = flower.name;

 resultFlowerName.textContent =
  flower.name;

resultEnglishName.textContent =
  flower.english.toUpperCase();

resultScientificName.textContent =
  flower.scientific;

resultFlowerLanguage.textContent =
  `「${flower.language}」`;

  resultDescription.textContent =
    flower.description;

  resultQuote.textContent =
flower.quote;

  resultKeywords.innerHTML = "";

flower.keywords.forEach((keyword) => {
  const span = document.createElement("span");

  span.className = "keyword-chip";
  span.textContent = keyword;

  resultKeywords.appendChild(span);
});

  resultGuestName.textContent =
    `${guestName}さんへ`;
}

function returnToCover() {
  resetQuizState();

  document.getElementById("guestName").value = "";

  showScreen("coverScreen");
}

function restartQuiz() {
  resetQuizState();
  showScreen("nameScreen");
}

document
  .getElementById("openBookButton")
  .addEventListener("click", () => {
    showScreen("nameScreen");
  });

document
  .getElementById("startQuizButton")
  .addEventListener("click", startQuiz);

document
  .getElementById("guestName")
  .addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      startQuiz();
    }
  });

document
  .getElementById("restartButton")
  .addEventListener("click", restartQuiz);

document
  .getElementById("returnTopButton")
  .addEventListener("click", returnToCover);

document
  .querySelectorAll("[data-screen]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      const targetScreen =
        button.getAttribute("data-screen");

      showScreen(targetScreen);
    });
  });

resetQuizState();
showScreen("coverScreen");

/* =====================================================
   RESULT IMAGE EXPORT
===================================================== */

const saveResultButton =
  document.getElementById("saveResultButton");

const saveResultStatus =
  document.getElementById("saveResultStatus");

async function waitForResultImage() {
  const resultImage =
    document.getElementById("resultImage");

  if (!resultImage) {
    return;
  }

  if (resultImage.complete) {
    return;
  }

  await new Promise((resolve, reject) => {
    resultImage.addEventListener("load", resolve, {
      once: true
    });

    resultImage.addEventListener("error", reject, {
      once: true
    });
  });
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(
            new Error("画像ファイルを作成できませんでした。")
          );
        }
      },
      "image/png",
      1
    );
  });
}

function createResultFileName() {
  const safeGuestName =
    guestName
      ? guestName.replace(
          /[\\/:*?"<>|]/g,
          ""
        )
      : "guest";

  const safeFlowerName =
    latestResultKey &&
    flowers[latestResultKey]
      ? flowers[latestResultKey].english
      : "flower";

  return (
    `flower-result-` +
    `${safeGuestName}-` +
    `${safeFlowerName}.png`
  );
}

async function shareOrDownloadResult(blob) {
  const fileName =
    createResultFileName();

  const file = new File(
    [blob],
    fileName,
    {
      type: "image/png"
    }
  );

  const shareData = {
    files: [file],
    title: "今日、あなたに咲く一輪",
    text: "私に咲いた一輪の診断結果です。"
  };

  if (
    navigator.share &&
    navigator.canShare &&
    navigator.canShare({
      files: [file]
    })
  ) {
    await navigator.share(shareData);
    return;
  }

  const downloadUrl =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = downloadUrl;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
  }, 1000);
}

async function saveResultAsImage() {
  const resultCard =
    document.querySelector(
      "#resultScreen .result-card"
    );

  if (
    !resultCard ||
    typeof html2canvas === "undefined"
  ) {
    saveResultStatus.textContent =
      "画像保存機能を読み込めませんでした。";
    return;
  }

  saveResultButton.disabled = true;
  saveResultButton.textContent =
    "画像を作成しています…";

  saveResultStatus.textContent =
    "少しだけお待ちください。";

  resultCard.classList.add(
    "is-exporting"
  );

  try {
    await waitForResultImage();

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const canvas =
      await html2canvas(resultCard, {
        backgroundColor: "#fbf4e5",
        scale: Math.min(
          window.devicePixelRatio || 2,
          3
        ),
        useCORS: true,
        allowTaint: false,
        logging: false,
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth:
          document.documentElement.scrollWidth
      });

    const blob =
      await canvasToBlob(canvas);

    await shareOrDownloadResult(blob);

    saveResultStatus.textContent =
      "共有画面から「画像を保存」を選んでください。";
  } catch (error) {
    if (error?.name === "AbortError") {
      saveResultStatus.textContent =
        "保存をキャンセルしました。";
    } else {
      console.error(error);

      saveResultStatus.textContent =
        "画像を保存できませんでした。もう一度お試しください。";
    }
  } finally {
    resultCard.classList.remove(
      "is-exporting"
    );

    saveResultButton.disabled = false;
    saveResultButton.textContent =
      "結果を画像として保存";
  }
}

if (saveResultButton) {
  saveResultButton.addEventListener(
    "click",
    saveResultAsImage
  );
}
