/** Sample level-check questions for local trial and browser tests (see seed-sample-level-check.ts). */
export type Sample = {
  stem: string
  options: [string, string, string, string]
  correct: 'A' | 'B' | 'C' | 'D'
  en: string
  ja: string
}

export const SAMPLE_LEVEL_CHECK: Record<'N5' | 'N4' | 'N3', Sample[]> = {
  N5: [
    {
      stem: '「{本|ほん}」の 読み方は どれですか。',
      options: ['もと', 'ほん', 'き', 'ひと'],
      correct: 'B',
      en: '本 is read ほん (book).',
      ja: '本は「ほん」と読みます。',
    },
    {
      stem: 'わたしは まいあさ パンを ＿＿。',
      options: ['のみます', 'よみます', 'たべます', 'ききます'],
      correct: 'C',
      en: 'You eat (たべます) bread.',
      ja: 'パンは「たべます」。',
    },
    {
      stem: '「やま」を 漢字で 書くと どれですか。',
      options: ['山', '川', '田', '木'],
      correct: 'A',
      en: 'やま is written 山 (mountain).',
      ja: '「やま」は「山」と書きます。',
    },
    {
      stem: 'きょうは {月曜日|げつようび}です。あしたは ＿＿です。',
      options: ['日曜日', '水曜日', '金曜日', '火曜日'],
      correct: 'D',
      en: 'The day after Monday is Tuesday (火曜日).',
      ja: '月曜日の次は火曜日です。',
    },
    {
      stem: 'えきは どこ ＿＿ か。',
      options: ['を', 'です', 'が', 'ます'],
      correct: 'B',
      en: 'どこですか means "where is it?".',
      ja: '「どこですか」と聞きます。',
    },
  ],
  N4: [
    {
      stem: '{雨|あめ}が {降|ふ}って いる ＿＿、{出|で}かけません。',
      options: ['ので', 'のに', 'けれど', 'ても'],
      correct: 'A',
      en: 'ので gives the reason: because it is raining.',
      ja: '理由を表す「ので」です。',
    },
    {
      stem: 'この {本|ほん}は {字|じ}が {大|おお}きくて、{読|よ}み＿＿です。',
      options: ['にくい', 'やすい', 'たい', 'すぎ'],
      correct: 'B',
      en: 'Big letters make it easy to read (読みやすい).',
      ja: '字が大きいので「読みやすい」です。',
    },
    {
      stem: '「{急|いそ}ぐ」の 意味に 近いのは どれですか。',
      options: ['ゆっくり する', 'やすむ', 'はやく する', 'まつ'],
      correct: 'C',
      en: '急ぐ means to hurry (はやくする).',
      ja: '「急ぐ」は「はやくする」という意味です。',
    },
    {
      stem: '「{経験|けいけん}」の 読み方は どれですか。',
      options: ['けいげん', 'きょうけん', 'けいかん', 'けいけん'],
      correct: 'D',
      en: '経験 is read けいけん (experience).',
      ja: '経験は「けいけん」と読みます。',
    },
    {
      stem: '{窓|まど}が {開|あ}いて ＿＿ので、{閉|し}めました。',
      options: ['いた', 'おいた', 'しまった', 'みた'],
      correct: 'A',
      en: '開いていた: the window was (in the state of being) open.',
      ja: '状態を表す「開いていた」です。',
    },
  ],
  N3: [
    {
      stem: '{彼|かれ}は {忙|いそが}しい ＿＿、{毎日|まいにち}ジムに {通|かよ}っている。',
      options: ['からこそ', 'にもかかわらず', 'ばかりか', 'おかげで'],
      correct: 'B',
      en: 'にもかかわらず: despite being busy.',
      ja: '「忙しいのに」という意味の「にもかかわらず」です。',
    },
    {
      stem: '「{偶然|ぐうぜん}」の 意味は どれですか。',
      options: [
        '思いがけなく起こること',
        '毎日決まって起こること',
        '計画どおりに進むこと',
        '何度も繰り返すこと',
      ],
      correct: 'A',
      en: '偶然 means by chance.',
      ja: '「偶然」は思いがけなく起こることです。',
    },
    {
      stem: '{説明|せつめい}を {聞|き}いた ＿＿、よく {分|わ}かりませんでした。',
      options: ['ものだから', 'ことに', 'ものの', 'わけで'],
      correct: 'C',
      en: 'ものの: although I listened, I did not understand.',
      ja: '逆接の「ものの」です。',
    },
    {
      stem: '「{確認|かくにん}」の 読み方は どれですか。',
      options: ['かくじん', 'こうにん', 'かくい', 'かくにん'],
      correct: 'D',
      en: '確認 is read かくにん (confirmation).',
      ja: '確認は「かくにん」と読みます。',
    },
    {
      stem: '{会議|かいぎ}は {予定|よてい}＿＿ {午後|ごご}{三時|さんじ}に {始|はじ}まった。',
      options: ['どおり', 'ばかり', 'ほど', 'だけ'],
      correct: 'A',
      en: '予定どおり: as planned.',
      ja: '「予定どおり」は予定のとおりという意味です。',
    },
  ],
}
