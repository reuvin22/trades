/**
 * Everything the AI Coach page says in its own voice, per language.
 *
 * The coach's *replies* were translated from the start — the model is told
 * which language to write in. The page around them was not: the greeting, the
 * opening bubble and the three starter questions were English string literals,
 * so a trader who picked Korean got a Korean coach sitting inside an English
 * page, and the questions it offered to answer were in a language they had
 * just said they did not want.
 *
 * Static rather than translated at request time. There are a dozen languages
 * and a dozen strings, all of them known before anyone opens the page; sending
 * them through the model would cost a round trip to render a greeting, and
 * come back slightly different every time.
 *
 * English is the fallback for a language with no entry — including one saved
 * on a profile before it was offered here — so a missing translation is a
 * sentence in the wrong language rather than a blank page.
 */

export type CoachCopy = {
  morning: string
  afternoon: string
  evening: string
  /** Shown when nothing has been logged yet and there is nothing to read. */
  ledeEmpty: string
  lede: (count: number) => string
  intro: string
  suggestions: readonly [string, string, string]
  placeholder: string
  /** In the composer while the language has still to be picked. */
  placeholderLocked: string
  replyingIn: string
  change: string
  /** The picker, the first time it is ever shown. */
  pickFirst: string
  /** The picker, reopened to change a language already in force. */
  pickAgain: string
  saveWarning: string
  /** Attaching a chart to a message. */
  chartAdd: string
  chartReady: string
  chartHint: string
  chartRemove: string
  chartFailed: string
  /** Composer placeholder while a chart is waiting to go. */
  placeholderChart: string
  composerLabel: string
  sendLabel: string
  thinkingLabel: string
}

const ENGLISH: CoachCopy = {
  morning: 'Good morning',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
  ledeEmpty:
    'Log a few trades and I can start telling you what your numbers actually say.',
  lede: (count) =>
    `I've read your ${count} logged ${count === 1 ? 'trade' : 'trades'}. Ask me anything about how you're doing.`,
  intro:
    'I only talk about your trading here — your results, your habits, and what the journal shows. Ask me why a week went badly, or where your money is actually going.',
  suggestions: [
    'How am I actually doing?',
    'Where is my money going?',
    'What should I stop doing?',
  ],
  placeholder: 'Ask about a session, a habit, or a losing streak…',
  placeholderLocked: 'Pick a language to begin…',
  replyingIn: 'Replying in',
  change: 'change',
  pickFirst:
    "Before we start — which language would you like me to use? I'll stick with it from here.",
  pickAgain:
    "Which language would you like me to use? I'll switch from my next reply onwards.",
  saveWarning: "I couldn't save that preference, so I'll ask again next time.",
  chartAdd: "Add a chart",
  chartReady: "Chart ready to send",
  chartHint: "Ask about it, or just send it",
  chartRemove: "Remove chart",
  chartFailed: "That image could not be used.",
  placeholderChart: "Ask about this chart…",
  composerLabel: 'Message the AI coach',
  sendLabel: 'Send message',
  thinkingLabel: 'Coach is thinking',
}

const FILIPINO: CoachCopy = {
  morning: 'Magandang umaga',
  afternoon: 'Magandang hapon',
  evening: 'Magandang gabi',
  ledeEmpty:
    'Mag-log ka muna ng ilang trade para masimulan kong sabihin sa iyo kung ano talaga ang sinasabi ng mga numero mo.',
  lede: (count) =>
    `Nabasa ko na ang ${count} na naka-log mong trade. Itanong mo sa akin kung kumusta ka na.`,
  intro:
    'Dito, ang trading mo lang ang pinag-uusapan natin — ang mga resulta mo, ang mga ugali mo, at ang nakikita sa journal. Itanong mo kung bakit masama ang isang linggo, o kung saan talaga napupunta ang pera mo.',
  suggestions: [
    'Kumusta ba talaga ako?',
    'Saan napupunta ang pera ko?',
    'Ano ang dapat kong itigil?',
  ],
  placeholder: 'Magtanong tungkol sa isang session, ugali, o sunod-sunod na talo…',
  placeholderLocked: 'Pumili ng wika para magsimula…',
  replyingIn: 'Sumasagot sa',
  change: 'palitan',
  pickFirst:
    'Bago tayo magsimula — anong wika ang gusto mong gamitin ko? Dito na ako mananatili.',
  pickAgain:
    'Anong wika ang gusto mong gamitin ko? Papalitan ko simula sa susunod kong sagot.',
  saveWarning:
    'Hindi ko na-save ang setting na iyon, kaya itatanong ko ulit sa susunod.',
  chartAdd: "Maglagay ng chart",
  chartReady: "Handa nang ipadala ang chart",
  chartHint: "Magtanong tungkol dito, o ipadala na lang",
  chartRemove: "Alisin ang chart",
  chartFailed: "Hindi magamit ang larawang iyon.",
  placeholderChart: "Magtanong tungkol sa chart na ito…",
  composerLabel: 'Mag-message sa AI Coach',
  sendLabel: 'Ipadala',
  thinkingLabel: 'Nag-iisip ang coach',
}

const SPANISH: CoachCopy = {
  morning: 'Buenos días',
  afternoon: 'Buenas tardes',
  evening: 'Buenas noches',
  ledeEmpty:
    'Registra algunas operaciones y podré empezar a decirte qué dicen realmente tus números.',
  lede: (count) =>
    count === 1
      ? 'He leído tu operación registrada. Pregúntame lo que quieras sobre cómo vas.'
      : `He leído tus ${count} operaciones registradas. Pregúntame lo que quieras sobre cómo vas.`,
  intro:
    'Aquí solo hablo de tu trading: tus resultados, tus hábitos y lo que muestra el diario. Pregúntame por qué fue mal una semana, o adónde se va realmente tu dinero.',
  suggestions: [
    '¿Cómo voy realmente?',
    '¿Adónde se va mi dinero?',
    '¿Qué debería dejar de hacer?',
  ],
  placeholder: 'Pregunta por una sesión, un hábito o una racha de pérdidas…',
  placeholderLocked: 'Elige un idioma para empezar…',
  replyingIn: 'Respondiendo en',
  change: 'cambiar',
  pickFirst:
    'Antes de empezar: ¿en qué idioma quieres que hable? Me quedaré con él a partir de ahora.',
  pickAgain:
    '¿En qué idioma quieres que hable? Cambiaré a partir de mi próxima respuesta.',
  saveWarning:
    'No pude guardar esa preferencia, así que te lo preguntaré otra vez la próxima vez.',
  chartAdd: "Añadir un gráfico",
  chartReady: "Gráfico listo para enviar",
  chartHint: "Pregunta algo o envíalo sin más",
  chartRemove: "Quitar gráfico",
  chartFailed: "No se pudo usar esa imagen.",
  placeholderChart: "Pregunta sobre este gráfico…",
  composerLabel: 'Escribir al AI Coach',
  sendLabel: 'Enviar mensaje',
  thinkingLabel: 'El coach está pensando',
}

const INDONESIAN: CoachCopy = {
  morning: 'Selamat pagi',
  afternoon: 'Selamat siang',
  evening: 'Selamat malam',
  ledeEmpty:
    'Catat beberapa transaksi dulu, nanti saya bisa mulai memberi tahu apa yang sebenarnya dikatakan angka-angkamu.',
  lede: (count) =>
    `Saya sudah membaca ${count} transaksi yang kamu catat. Tanya apa saja tentang perkembanganmu.`,
  intro:
    'Di sini saya hanya membahas trading kamu — hasilmu, kebiasaanmu, dan apa yang terlihat di jurnal. Tanyakan kenapa satu minggu berjalan buruk, atau ke mana sebenarnya uangmu pergi.',
  suggestions: [
    'Sebenarnya bagaimana perkembangan saya?',
    'Ke mana perginya uang saya?',
    'Apa yang harus saya hentikan?',
  ],
  placeholder: 'Tanya tentang satu sesi, kebiasaan, atau rentetan kerugian…',
  placeholderLocked: 'Pilih bahasa untuk memulai…',
  replyingIn: 'Menjawab dalam',
  change: 'ubah',
  pickFirst:
    'Sebelum mulai — bahasa apa yang kamu ingin saya pakai? Saya akan memakainya terus.',
  pickAgain:
    'Bahasa apa yang kamu ingin saya pakai? Saya akan beralih mulai dari jawaban berikutnya.',
  saveWarning:
    'Saya tidak bisa menyimpan preferensi itu, jadi saya akan bertanya lagi lain kali.',
  chartAdd: "Tambahkan grafik",
  chartReady: "Grafik siap dikirim",
  chartHint: "Tanyakan sesuatu, atau kirim saja",
  chartRemove: "Hapus grafik",
  chartFailed: "Gambar itu tidak bisa digunakan.",
  placeholderChart: "Tanya tentang grafik ini…",
  composerLabel: 'Kirim pesan ke AI Coach',
  sendLabel: 'Kirim pesan',
  thinkingLabel: 'Coach sedang berpikir',
}

const CHINESE: CoachCopy = {
  morning: '早上好',
  afternoon: '下午好',
  evening: '晚上好',
  ledeEmpty: '先记录几笔交易，我才能开始告诉你这些数字究竟说明了什么。',
  lede: (count) => `我看完了你记录的 ${count} 笔交易。想知道自己做得怎么样，随便问。`,
  intro:
    '在这里我只谈你的交易——你的结果、你的习惯，以及日志里显示的东西。可以问我某一周为什么很糟，或者你的钱到底花在了哪里。',
  suggestions: ['我到底做得怎么样？', '我的钱都去哪了？', '我应该停止做什么？'],
  placeholder: '问问某次交易、某个习惯，或者一段连亏…',
  placeholderLocked: '先选一种语言…',
  replyingIn: '回复语言：',
  change: '更改',
  pickFirst: '开始之前——你希望我用哪种语言？之后我就一直用它。',
  pickAgain: '你希望我用哪种语言？从下一条回复开始切换。',
  saveWarning: '这个偏好没能保存，下次我会再问一遍。',
  chartAdd: "添加图表",
  chartReady: "图表已就绪",
  chartHint: "可以提问，也可以直接发送",
  chartRemove: "移除图表",
  chartFailed: "这张图片无法使用。",
  placeholderChart: "问问这张图表…",
  composerLabel: '给 AI 教练发消息',
  sendLabel: '发送',
  thinkingLabel: '教练正在思考',
}

const JAPANESE: CoachCopy = {
  morning: 'おはようございます',
  afternoon: 'こんにちは',
  evening: 'こんばんは',
  ledeEmpty:
    'まずは取引をいくつか記録してください。そうすれば、数字が実際に何を示しているかを話せます。',
  lede: (count) => `記録された${count}件の取引を読みました。調子について何でも聞いてください。`,
  intro:
    'ここではあなたのトレードの話だけをします——結果、習慣、そして記録が示していること。ある週がなぜ悪かったのか、お金が実際どこへ消えているのか、聞いてください。',
  suggestions: [
    '実際のところ、調子はどうですか？',
    'お金はどこへ消えていますか？',
    '何をやめるべきですか？',
  ],
  placeholder: '取引、習慣、連敗について聞いてください…',
  placeholderLocked: '始めるには言語を選んでください…',
  replyingIn: '返答する言語：',
  change: '変更',
  pickFirst: '始める前に——どの言語で話しましょうか。これからはその言語を使い続けます。',
  pickAgain: 'どの言語で話しましょうか。次の返答から切り替えます。',
  saveWarning: 'その設定を保存できなかったので、次回もう一度お聞きします。',
  chartAdd: "チャートを添付",
  chartReady: "チャートの準備ができました",
  chartHint: "質問を書くか、そのまま送信してください",
  chartRemove: "チャートを削除",
  chartFailed: "その画像は使用できませんでした。",
  placeholderChart: "このチャートについて聞いてください…",
  composerLabel: 'AIコーチにメッセージを送る',
  sendLabel: '送信',
  thinkingLabel: 'コーチが考えています',
}

const KOREAN: CoachCopy = {
  morning: '좋은 아침입니다',
  afternoon: '안녕하세요',
  evening: '좋은 저녁입니다',
  ledeEmpty:
    '먼저 거래를 몇 건 기록해 주세요. 그래야 숫자가 실제로 무엇을 말하는지 알려드릴 수 있습니다.',
  lede: (count) => `기록하신 거래 ${count}건을 모두 읽었습니다. 요즘 어떤지 무엇이든 물어보세요.`,
  intro:
    '여기서는 당신의 매매 이야기만 합니다 — 결과, 습관, 그리고 일지에 드러난 것들. 어떤 주가 왜 나빴는지, 돈이 실제로 어디로 가는지 물어보세요.',
  suggestions: [
    '제 성적은 실제로 어떤가요?',
    '제 돈은 어디로 가고 있나요?',
    '무엇을 그만둬야 할까요?',
  ],
  placeholder: '한 번의 매매, 습관, 연속 손실에 대해 물어보세요…',
  placeholderLocked: '시작하려면 언어를 선택하세요…',
  replyingIn: '답변 언어:',
  change: '변경',
  pickFirst: '시작하기 전에 — 어떤 언어로 말할까요? 앞으로 계속 그 언어를 쓰겠습니다.',
  pickAgain: '어떤 언어로 말할까요? 다음 답변부터 바꾸겠습니다.',
  saveWarning: '설정을 저장하지 못했습니다. 다음에 다시 여쭤보겠습니다.',
  chartAdd: "차트 첨부",
  chartReady: "차트를 보낼 준비가 되었습니다",
  chartHint: "질문을 적거나 그대로 보내세요",
  chartRemove: "차트 제거",
  chartFailed: "그 이미지는 사용할 수 없습니다.",
  placeholderChart: "이 차트에 대해 물어보세요…",
  composerLabel: 'AI 코치에게 메시지 보내기',
  sendLabel: '보내기',
  thinkingLabel: '코치가 생각 중입니다',
}

const HINDI: CoachCopy = {
  morning: 'सुप्रभात',
  afternoon: 'नमस्कार',
  evening: 'शुभ संध्या',
  ledeEmpty:
    'पहले कुछ ट्रेड दर्ज करें, फिर मैं बता पाऊँगा कि आपके आँकड़े असल में क्या कह रहे हैं।',
  lede: (count) =>
    `मैंने आपके दर्ज किए हुए ${count} ट्रेड पढ़ लिए हैं। अपनी प्रगति के बारे में कुछ भी पूछिए।`,
  intro:
    'यहाँ मैं सिर्फ़ आपकी ट्रेडिंग की बात करता हूँ — आपके नतीजे, आपकी आदतें, और जो जर्नल दिखाता है। पूछिए कि कोई हफ़्ता ख़राब क्यों गया, या आपका पैसा असल में कहाँ जा रहा है।',
  suggestions: [
    'असल में मैं कैसा कर रहा हूँ?',
    'मेरा पैसा कहाँ जा रहा है?',
    'मुझे क्या करना बंद करना चाहिए?',
  ],
  placeholder: 'किसी सेशन, आदत, या लगातार घाटे के बारे में पूछिए…',
  placeholderLocked: 'शुरू करने के लिए भाषा चुनिए…',
  replyingIn: 'जवाब की भाषा:',
  change: 'बदलें',
  pickFirst:
    'शुरू करने से पहले — आप चाहते हैं मैं किस भाषा में बात करूँ? आगे मैं वही इस्तेमाल करता रहूँगा।',
  pickAgain: 'आप चाहते हैं मैं किस भाषा में बात करूँ? अगले जवाब से बदल दूँगा।',
  saveWarning: 'मैं यह पसंद सहेज नहीं सका, इसलिए अगली बार फिर पूछूँगा।',
  chartAdd: "चार्ट जोड़ें",
  chartReady: "चार्ट भेजने के लिए तैयार है",
  chartHint: "कुछ पूछिए, या बस भेज दीजिए",
  chartRemove: "चार्ट हटाएँ",
  chartFailed: "वह छवि इस्तेमाल नहीं की जा सकी।",
  placeholderChart: "इस चार्ट के बारे में पूछिए…",
  composerLabel: 'AI कोच को संदेश भेजें',
  sendLabel: 'भेजें',
  thinkingLabel: 'कोच सोच रहा है',
}

const PORTUGUESE: CoachCopy = {
  morning: 'Bom dia',
  afternoon: 'Boa tarde',
  evening: 'Boa noite',
  ledeEmpty:
    'Registre algumas operações e eu poderei começar a te dizer o que os seus números realmente mostram.',
  lede: (count) =>
    count === 1
      ? 'Já li a sua operação registrada. Pergunte o que quiser sobre como você está indo.'
      : `Já li as suas ${count} operações registradas. Pergunte o que quiser sobre como você está indo.`,
  intro:
    'Aqui eu só falo sobre o seu trading — seus resultados, seus hábitos e o que o diário mostra. Pergunte por que uma semana foi ruim, ou para onde o seu dinheiro está indo de verdade.',
  suggestions: [
    'Como eu estou indo de verdade?',
    'Para onde está indo o meu dinheiro?',
    'O que eu deveria parar de fazer?',
  ],
  placeholder: 'Pergunte sobre uma sessão, um hábito ou uma sequência de perdas…',
  placeholderLocked: 'Escolha um idioma para começar…',
  replyingIn: 'Respondendo em',
  change: 'alterar',
  pickFirst:
    'Antes de começarmos — em que idioma você quer que eu fale? Vou manter esse daqui em diante.',
  pickAgain:
    'Em que idioma você quer que eu fale? Vou mudar a partir da próxima resposta.',
  saveWarning:
    'Não consegui salvar essa preferência, então vou perguntar de novo na próxima vez.',
  chartAdd: "Adicionar um gráfico",
  chartReady: "Gráfico pronto para enviar",
  chartHint: "Pergunte algo, ou apenas envie",
  chartRemove: "Remover gráfico",
  chartFailed: "Não foi possível usar essa imagem.",
  placeholderChart: "Pergunte sobre este gráfico…",
  composerLabel: 'Enviar mensagem ao AI Coach',
  sendLabel: 'Enviar mensagem',
  thinkingLabel: 'O coach está pensando',
}

const FRENCH: CoachCopy = {
  morning: 'Bonjour',
  afternoon: 'Bon après-midi',
  evening: 'Bonsoir',
  ledeEmpty:
    'Enregistrez quelques trades et je pourrai commencer à vous dire ce que vos chiffres racontent vraiment.',
  lede: (count) =>
    count === 1
      ? "J'ai lu votre trade enregistré. Demandez-moi ce que vous voulez sur votre progression."
      : `J'ai lu vos ${count} trades enregistrés. Demandez-moi ce que vous voulez sur votre progression.`,
  intro:
    "Ici, je ne parle que de votre trading — vos résultats, vos habitudes, et ce que montre le journal. Demandez-moi pourquoi une semaine s'est mal passée, ou où part réellement votre argent.",
  suggestions: [
    "Où j'en suis vraiment ?",
    'Où part mon argent ?',
    'Que devrais-je arrêter de faire ?',
  ],
  placeholder: 'Posez une question sur une séance, une habitude, une série de pertes…',
  placeholderLocked: 'Choisissez une langue pour commencer…',
  replyingIn: 'Réponses en',
  change: 'changer',
  pickFirst:
    "Avant de commencer — dans quelle langue voulez-vous que je parle ? Je m'y tiendrai ensuite.",
  pickAgain:
    'Dans quelle langue voulez-vous que je parle ? Je changerai dès ma prochaine réponse.',
  saveWarning:
    "Je n'ai pas pu enregistrer cette préférence, je vous le redemanderai la prochaine fois.",
  chartAdd: "Ajouter un graphique",
  chartReady: "Graphique prêt à envoyer",
  chartHint: "Posez une question, ou envoyez-le tel quel",
  chartRemove: "Retirer le graphique",
  chartFailed: "Cette image n'a pas pu être utilisée.",
  placeholderChart: "Posez une question sur ce graphique…",
  composerLabel: 'Écrire au coach IA',
  sendLabel: 'Envoyer',
  thinkingLabel: 'Le coach réfléchit',
}

const GERMAN: CoachCopy = {
  morning: 'Guten Morgen',
  afternoon: 'Guten Tag',
  evening: 'Guten Abend',
  ledeEmpty:
    'Trage ein paar Trades ein, dann kann ich dir sagen, was deine Zahlen wirklich aussagen.',
  lede: (count) =>
    count === 1
      ? 'Ich habe deinen erfassten Trade gelesen. Frag mich alles dazu, wie es läuft.'
      : `Ich habe deine ${count} erfassten Trades gelesen. Frag mich alles dazu, wie es läuft.`,
  intro:
    'Hier geht es nur um dein Trading — deine Ergebnisse, deine Gewohnheiten und das, was das Journal zeigt. Frag mich, warum eine Woche schlecht lief oder wohin dein Geld tatsächlich geht.',
  suggestions: ['Wie läuft es wirklich?', 'Wohin geht mein Geld?', 'Was sollte ich lassen?'],
  placeholder: 'Frag nach einer Session, einer Gewohnheit oder einer Verlustserie…',
  placeholderLocked: 'Wähle eine Sprache, um zu starten…',
  replyingIn: 'Antwortet auf',
  change: 'ändern',
  pickFirst:
    'Bevor wir anfangen — in welcher Sprache soll ich sprechen? Dabei bleibe ich dann.',
  pickAgain:
    'In welcher Sprache soll ich sprechen? Ich wechsle ab meiner nächsten Antwort.',
  saveWarning:
    'Ich konnte die Einstellung nicht speichern, also frage ich beim nächsten Mal noch einmal.',
  chartAdd: "Chart hinzufügen",
  chartReady: "Chart bereit zum Senden",
  chartHint: "Stell eine Frage oder schick ihn einfach",
  chartRemove: "Chart entfernen",
  chartFailed: "Dieses Bild konnte nicht verwendet werden.",
  placeholderChart: "Frag etwas zu diesem Chart…",
  composerLabel: 'Dem KI-Coach schreiben',
  sendLabel: 'Senden',
  thinkingLabel: 'Der Coach denkt nach',
}

/** Keyed by the `code` in LANGUAGES — the same string stored on the profile. */
const COPY: Record<string, CoachCopy> = {
  English: ENGLISH,
  Filipino: FILIPINO,
  Spanish: SPANISH,
  'Bahasa Indonesia': INDONESIAN,
  'Simplified Chinese': CHINESE,
  Japanese: JAPANESE,
  Korean: KOREAN,
  Hindi: HINDI,
  Portuguese: PORTUGUESE,
  French: FRENCH,
  German: GERMAN,
}

/**
 * The page's copy in one language.
 *
 * `null` — nobody has chosen yet — gets English, because the picker has to be
 * written in something and that is the only language available before the
 * choice exists.
 */
export function coachCopy(language: string | null): CoachCopy {
  return (language && COPY[language]) || ENGLISH
}
