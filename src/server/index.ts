import {
  context,
  createServer,
  getServerPort,
  reddit,
  redis,
} from "@devvit/web/server";
import express from "express";
import {
  DailyQuestionResponse,
  VoteResponse,
} from "../shared/types/api";
import { createPost } from "./core/post";
import { DailyQuestion, dailyQuestions } from '../shared/data/questions';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

const votesKey = (id: number) => `question:${id}:votes`;
const votedUserKey = (id: number, userId: string) => `question:${id}:user:${userId}`;

router.post("/internal/on-app-install", async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: "success",
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: "error",
      message: "Failed to create post",
    });
  }
});

router.post("/internal/menu/post-create", async (_req, res): Promise<void> => {
  try {
    const dailyQuestion = getCurrentDailyQuestionID();
    if (!dailyQuestion) res.status(404).json({ status: "error", message: 'question not found' });

    const post = await createDailyPost(dailyQuestion);

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post?.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: "error",
      message: "Failed to create post",
    });
  }
});

///
///
///////// APIs
///
///

// Returns the question of the day
// If the user has previously voted, it also returns the results
router.get<
  { id: string },
  DailyQuestionResponse | { status: string; message: string }
>('/api/daily-question/:id', async (req, res) => {
  const { userId } = context;

  const dailyQuestionID = Number(req.params.id);
  const dailyQuestion = getQuestionById(dailyQuestionID);

  if (!dailyQuestion) return res.status(404).json({ status: "error", message: 'Question not found' });

  // Will be empty for those who are not logged in
  const currentUserID = userId ?? '';
  const alreadyVoted = currentUserID
    ? Boolean(await redis.exists(votedUserKey(dailyQuestionID, currentUserID)))
    : false;

  // If voted—return results
  var totals: Record<string, string> = {};
  var totalCount = 0;
  var answerOption = null;

  // Get results
  if (alreadyVoted) {
    answerOption = await redis.get(votedUserKey(dailyQuestionID, currentUserID));
    const results = await getResults(dailyQuestionID, dailyQuestion.options.length);
    totals = results.totals;
    totalCount = results.totalCount;
  }

  const response: DailyQuestionResponse = {
    type: "dailyQuestion",
    dailyQuestion: dailyQuestion,
    totals: totals,
    totalCount: totalCount,
    userVote: Number(answerOption),
  };

  res.status(200).json(response);
});

// If the user did not vote, count their vote.
// Also return the voting results
router.post<
  { id: string },                                             //  parameters from the URL
  VoteResponse | { status: string; message: string },         // what res.json() will return
  { answerOption: number }                                    // what it expects in the request body
>('/api/daily-question/:id/vote', async (req, res) => {
  const { userId } = context;

  const dailyQuestionID = Number(req.params.id);
  const answerOption = Number(req.body.answerOption);

  const dailyQuestion = getQuestionById(dailyQuestionID);
  if (!dailyQuestion) return res.status(404).json({ status: "error", message: 'question not found' });

  if (answerOption < 0 || answerOption >= dailyQuestion.options.length) {
    return res.status(400).json({ status: "error", message: 'Invalid option' });
  }

  if (!userId) return res.status(401).json({ status: "error", message: 'Login required' });

  // NX - Create the key if it does not exist yet
  // Transaction not needed
  // If key already exists - ok = null
  // If key does not exist - ok = true
  const ok = await redis.set(votedUserKey(dailyQuestionID, userId), String(answerOption), { nx: true });
  if (ok) {
    // New voice - increase the counter
    await redis.hIncrBy(votesKey(dailyQuestionID), String(answerOption), 1);
  }

  // Get results
  const { totals, totalCount } = await getResults(
    dailyQuestionID,
    dailyQuestion.options.length
  );

  // if ok == false - means the vote has already been cast
  const response: VoteResponse = {
    type: "vote",
    alreadyVoted: !ok,
    totals: totals,
    totalCount: totalCount,
    userVote: answerOption,
  };

  return res.status(200).json(response);
});


// Automatic post creation
//The question of the day is selected based on the current date
router.post('/internal/cron/create-daily-post', async (_req, res) => {
  try {
    const dailyQuestion = getCurrentDailyQuestionID();
    if (!dailyQuestion) return res.status(404).json({ status: "error", message: 'question not found' });

    const post = await createDailyPost(dailyQuestion);

    res.status(200).json({ status: 'ok', postId: post?.id, dailyQuestion: dailyQuestion.id });
  } catch (err) {
    console.error('Failed to create daily post:', err);
    res.status(500).json({ status: "error", message: 'failed to create post' });
  }
});

///
///
///////// Methods
///
///

// Creating a daily post for reuse
async function createDailyPost(dailyQuestion: DailyQuestion | null) {
  const { subredditName } = context;

  if (!dailyQuestion) return;

  const shortDesc = dailyQuestion.question.length > 20
    ? dailyQuestion.question.slice(0, 20) + "..."
    : dailyQuestion.question;

  const post = await reddit.submitCustomPost({
    subredditName: subredditName,
    title: `Today’s Dilemma — ${dailyQuestion.date}`,
    splash: {
      appDisplayName: 'Daily Quest',
      buttonLabel: 'Make Your Choice',
      heading: 'What Would You Do?',
      description: shortDesc,
      backgroundUri: 'background.png',
      appIconUri: 'app-icon.png'
    },
    postData: { questionID: dailyQuestion.id }
  });

  return post;
}

// Search for a question by today's date
function getCurrentDailyQuestionID(): DailyQuestion | null {
  const todayStr = new Date().toISOString().slice(0, 10);
  const match = dailyQuestions.find(q => q.date === todayStr);

  return match ? match : null;
}

// Receiving a question by ID
function getQuestionById(id: number | null): DailyQuestion | undefined {
  return dailyQuestions.find(q => q.id === id);
}

async function getResults(dailyQuestionID: number, optionsCount: number) {
  let totals = (await redis.hGetAll(votesKey(dailyQuestionID))) || {};

  // Normalization
  for (let i = 0; i < optionsCount; i++) {
    if (!(String(i) in totals)) totals[String(i)] = "0";
  }

  const totalCount = Object.values(totals).reduce(
    (a, b) => a + Number(b), 0
  );

  return { totals, totalCount };
}

app.use(router);

const server = createServer(app);
server.on("error", (err) => console.error(`server error; ${err.stack}`));
server.listen(getServerPort());
