import { DailyQuestion } from "../data/questions";

export type VoteResponse = {
  type: "vote";
  alreadyVoted: boolean;
  totals: Record<string, string>;
  totalCount: number;
};

export type DailyQuestionResponse = {
  type: "dailyQuestion";
  dailyQuestion: DailyQuestion;
  alreadyVoted: boolean;
  totals: Record<string, string>;
  totalCount: number;
};