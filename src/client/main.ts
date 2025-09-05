import {
  DailyQuestionResponse,
  VoteResponse,
} from "../shared/types/api";
import { context } from "@devvit/web/client";
import { AutoComment, autoComments } from '../shared/data/autoComments';

const loader = document.getElementById("loader") as HTMLDivElement;
const autoComment = document.getElementById("auto-comment") as HTMLDivElement;
const contentContainer = document.getElementById("content-container") as HTMLHeadingElement;
const title = document.getElementById("title") as HTMLHeadingElement;
const dailyQuestion = document.getElementById("daily-question") as HTMLHeadingElement;

// Button objects with all text elements
const optionWrapper1 = document.getElementById("option-wrapper1") as HTMLDivElement;
const optionWrapper2 = document.getElementById("option-wrapper2") as HTMLDivElement;
const optionWrapper3 = document.getElementById("option-wrapper3") as HTMLDivElement;
const optionWrapper4 = document.getElementById("option-wrapper4") as HTMLDivElement;
const optionWrappers = [
  optionWrapper1,
  optionWrapper2,
  optionWrapper3,
  optionWrapper4
];

// Button objects
const dailyOption1 = document.getElementById("daily-option1") as HTMLButtonElement;
const dailyOption2 = document.getElementById("daily-option2") as HTMLButtonElement;
const dailyOption3 = document.getElementById("daily-option3") as HTMLButtonElement;
const dailyOption4 = document.getElementById("daily-option4") as HTMLButtonElement;
const dailyOptions = [
  dailyOption1,
  dailyOption2,
  dailyOption3,
  dailyOption4
];

// Percentage text elements
const percentage1 = document.getElementById("percentage1") as HTMLDivElement;
const percentage2 = document.getElementById("percentage2") as HTMLDivElement;
const percentage3 = document.getElementById("percentage3") as HTMLDivElement;
const percentage4 = document.getElementById("percentage4") as HTMLDivElement;
const percentages = [
  percentage1,
  percentage2,
  percentage3,
  percentage4
];

// Player selection text elements
const choiceLabel1 = document.getElementById("choice-label1") as HTMLDivElement;
const choiceLabel2 = document.getElementById("choice-label2") as HTMLDivElement;
const choiceLabel3 = document.getElementById("choice-label3") as HTMLDivElement;
const choiceLabel4 = document.getElementById("choice-label4") as HTMLDivElement;
const choiceLabels = [
  choiceLabel1,
  choiceLabel2,
  choiceLabel3,
  choiceLabel4
];

const postDataQuestionID = context.postData?.questionID;
const questionID = postDataQuestionID ? Number(postDataQuestionID) : null;

if (!questionID) {
  dailyQuestion.textContent = "No active question found";
  hideLoader();
  showContent();
} else {
  loadQuestion(questionID);
}

async function loadQuestion(questioID: number) {
  showLoader();
  try {
    const response = await fetch(`/api/daily-question/${questioID}`);
    if (!response.ok) throw new Error("Failed to load question");

    const data = (await response.json()) as DailyQuestionResponse;

    /// Show current day
    const today = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric' } as const;
    const formattedDate = today.toLocaleDateString('en-US', options);
    title.textContent = formattedDate;

    /// Show daily question
    dailyQuestion.textContent = data.dailyQuestion.question;

    showOptions(questioID, data.dailyQuestion.options);

    if (data.userVote != null) {
      showResults(data.userVote, data.totals);
    }

  } catch (err) {
    dailyQuestion.textContent = "Error loading question";
    console.error(err);
  } finally {
    hideLoader();
    showContent();
  }
}

async function vote(questioID: number, option: number) {
  showLoader();
  try {
    const response = await fetch(`/api/daily-question/${questioID}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answerOption: option }),
    });
    if (!response.ok) throw new Error("Failed to vote");

    const data = (await response.json()) as VoteResponse;

    showResults(data.userVote, data.totals);
  } catch (err) {
    console.error("Vote failed", err);
  } finally {
    hideLoader();
  }
}

function showOptions(questioID: number, options: string[]) {
  options.forEach((opt, idx) => {
    const optionWrapper = optionWrappers[idx];
    const currentButton = dailyOptions[idx];

    if (currentButton && optionWrapper) {
      optionWrapper.classList.remove('hidden-element');

      currentButton.textContent = opt;
      currentButton.onclick = async () => {
        await vote(questioID, idx);
      };
    }
  });
}

function disableButtons() {
  dailyOptions.forEach((button) => {
    button.disabled = true;
  });
}

function showResults(userVote: number, totals: Record<string, number | string>) {
  disableButtons();

  // Convert totals to an array { idx, count } and calculate the total total
  const entries = Object.entries(totals).map(([idx, val]) => ({
    idx: Number(idx),
    count: Number(val),
  }));
  const totalVotes = entries.reduce((sum, e) => sum + e.count, 0);

  // Calculate the percentage once
  const entriesWithPercent = entries.map(e => ({
    ...e,
    percent: totalVotes > 0 ? (e.count / totalVotes) * 100 : 0
  }));

  /// Show user vote
  choiceLabels[userVote]?.classList.remove('invisible');

  // Render each line
  entriesWithPercent.forEach(({ idx, percent }) => {
    const percentage = percentages[idx];
    if (percentage) {
      percentage.classList.remove('invisible');
      percentage.textContent = `${Math.round(percent)}%`;
    }
  });

  // === Auto-comment ===
  if (totalVotes > 0) {
    // sort in descending order
    const sorted = [...entriesWithPercent].sort((a, b) => b.percent - a.percent);
    const first = sorted[0] ?? { idx: 0, percent: 0 };
    const second = sorted[1] ?? { idx: 0, percent: 0 };

    const diffPercent = first.percent - second.percent;

    let type: string;
    if (diffPercent < 10 && sorted.length > 1) type = "neck_and_neck";
    else if (first.percent > 70) type = "consensus";
    else if (first.percent >= 60) type = "close";
    else if (first.percent >= 40) type = "balanced";
    else type = "fresh";

    const commentObj: AutoComment | undefined = autoComments.find(c => c.commentType === type);

    let comment = "";
    if (commentObj && commentObj.comments.length > 0) {
      comment = commentObj.comments[Math.floor(Math.random() * commentObj.comments.length)] ?? "";
    }

    autoComment.textContent = comment;
  }
}

function showLoader() {
  loader.style.display = 'block';
}

function hideLoader() {
  loader.style.display = 'none';
}

function showContent() {
  contentContainer.classList.remove('hidden-element');
}