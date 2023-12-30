import React, { useState } from "react";
import './App.css';
import styles from './faq.module.css'

import Header from "./Header";
import Footer from "./Footer";

const questionTopics = [
  {topic: 1, text: "サービス全般に関して"},
  {topic: 2, text: "採血について"},
  {topic: 3, text: "検査結果について"},
]

const questions = [
  {id: 1, topic: 1, question:  "選べるモニタリング検査とはどのようなものですか？", answer: "選べるモニタリング検査とは、検査項目を最大3項目まで選ぶことができる検査サービスです。ご自身の気になる不調から、関連する検査項目を選んでいただくことが可能です。検査結果は、選んだ検査項目それぞれについての報告書をマイページで確認できます。"},
  {id: 2, topic: 1, question:  "検査方法は？", answer: "ウェルミルの検査サービスは、病院や検査センターと同等の精度を持つ最新の機器と検査試薬を用いて行います。検査方法は、ELISA法という手法を用いています。使用する検査試薬は、体外診断薬として承認を受けたものがほとんどで、高精度であることが担保されています。"},
  {id: 3, topic: 1, question:  "検査キットを購入し、他の人の家に送ることは可能か", answer: "可能です。ECサイト内で、配送先に別の送り先をご記入ください。"},
  {id: 4, topic: 2, question:  "採血が上手くいかない。血が出ない。", answer: `採血手順はこちらをご確認ください
  上手く採血するためには、血行を良くする必要があります。
  やけどに注意して、カイロや温かい飲み物のカップなどを手に持ち、手を温めることで血行を良くすることができます。
  また、階段の昇降、スクワット、肩を大きく回す運動を複数回行うと血行が良くなります。
  採血をする際の室温が低いと、冷えて血行が悪くなってしまいますので、空調を調整し、寒さで手が冷えないようにしてください。
  以上を試しても、上手く採血ができなかった場合、問い合わせフォームよりご連絡ください。`},
  {id: 5, topic: 2, question:  "検査キットの内容物が不足している。", answer: "すぐに新しいキットをお送りします。お問い合わせフォームよりご連絡ください。"},
  {id: 6, topic: 2, question:  "採血キットを無くしてしまった。", answer: "お客様都合での採血キットの交換は、有償でのご対応となります。状況を伺いますので、お問い合わせフォームよりご連絡ください。"},
  {id: 7, topic: 2, question:  "採血管などに、血液がたくさん付着してしまった。どうしたらよいか。", answer: "採血管のふたが、パチンと音がするまで閉められていれば返送可能です。できればお手持ちのウエットティッシュ等で付着した血液を拭き取っていただけますと助かりますが、難しい場合は、採血管のふたが閉まっていることを確認して、そのまま梱包して返送してください。"},
  {id: 8, topic: 2, question:  "採血は痛いですか？", answer: "一般的に、本サービスで使用している穿刺器具を利用した場合、1週間もかからず傷口が消え、元通りになる方がほとんどです。痛みに関しては個人差が大きいため、明確な指標をお示しはできませんが、正しい位置に穿刺した場合、一瞬ちくっと感じる程度であることが多いようです。もし、採血後、お身体に異常を感じた場合は、速やかに医師の診察を受けてください。"},
  {id: 9, topic: 3, question:  "検査結果はどこで確認できるか", answer: "マイページにログインし、「検査結果確認」へ進んでください。マイページのログインには会員登録が必要です。お済みでない方は会員登録の後に、マイページへログインしてください。"},
  {id: 10, topic: 3, question: "検査結果の見方を教えてほしい", answer: "検査結果は、実際に測定された数値とその数値が、一般的にどのようなランクに当てはまるかを表示しています。また、生活習慣のメモとして、検査をお申込みいただいた際にご回答いただいた問診内容の一覧も掲載します。生活習慣のメモと検査結果は、長期でログを残すことができ、ご自身の数値の変化を確認していただくことが可能です。"},
  {id: 11, topic: 3, question: "検査結果が基準値外になった", answer: "ウェルミルの検査サービスは、あくまでご自身の体内データを見える化し、モニタリングすることを目的とした検査で、病院やクリニックでの病気の診断を目的とした検査ではありません。検査の結果に関わらず、ご自身のお身体に異常がある場合は、速やかに医師の診察を受けてください。"},
  {id: 12, topic: 3, question: "健康診断の代わりになるか？", answer: "健康診断の代わりに本検査サービスを利用していただくことはできません。ウェルミルの検査サービスは、セルフケアの一助になるような結果をお返しするのみで、医師の診断を含みません。"},
]


function Faq() {
  const breadcrumbs = [
    { text: "ホーム", url: "/" },
    { text: "よくある質問", url: "/qa" },
  ];

  const [currentQuestionTopic, setCurrentQuestionTopic] = useState<number | null>(null);

  const topicSelectors = (
    <div className={styles.topicSelectors}>
    {questionTopics.map(questionTopic => {
      return (
        <span className={`${styles.topicSelector} ${currentQuestionTopic === questionTopic.topic ? styles.currentTopicSelector : ""}`} onClick={() => {setCurrentQuestionTopic(questionTopic.topic === currentQuestionTopic ? null : questionTopic.topic)}}>{questionTopic.text}</span>
      )
    })}
    </div>
  )

  const questionList = questions.map(question => {return (
    <details style={{display: (currentQuestionTopic === question.topic || currentQuestionTopic === null) ? "flex" : "none"}}>
      <summary>Q {question.question}</summary>
      <span className={styles.answer}>A {question.answer}</span>
    </details>
  )})
  
  return(
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs}/>
      <span className="topHeader">よくある質問</span>
      <div className={styles.content}>
        {topicSelectors}
        {questionList}
      </div>
      <Footer />
    </>
  )
}

export default Faq;