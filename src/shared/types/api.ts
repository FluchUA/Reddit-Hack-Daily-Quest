import { DailyQuestion } from "../data/questions";

export type VoteResponse = {
  type: "vote";
  alreadyVoted: boolean;
  totals: Record<string, string>;
  totalCount: number;
  userVote: number;
};

export type DailyQuestionResponse = {
  type: "dailyQuestion";
  dailyQuestion: DailyQuestion;
  totals: Record<string, string>;
  totalCount: number;
  userVote: number | null;
};