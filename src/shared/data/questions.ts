export type DailyQuestion = {
  id: number;
  date: string;       // YYYY-MM-DD
  question: string;
  options: string[];
};

export const dailyQuestions: DailyQuestion[] = [
  {
    "id": 1,
    "date": "2025-09-01",
    "question": "Question 1",
    "options": [
      "Option 1",
      "Option 2"
    ],
  },
  {
    "id": 2,
    "date": "2025-09-02",
    "question": "Question 2",
    "options": [
      "Option 1",
      "Option 2"
    ],
  },
  {
    "id": 3,
    "date": "2025-09-03",
    "question": "Question 3",
    "options": [
      "Option 1",
      "Option 2",
      "Option 3",
      "Option 4"
    ],
  },
  {
    "id": 4,
    "date": "2025-09-04",
    "question": "You find a wallet on the street with cash inside. What do you do?",
    "options": [
      "Keep the money",
      "Try to return it"
    ],
  },
  {
    "id": -1,
    "date": "2025-09-05",
    "question": "You are late for work but see a stranger who needs help. What do you do?",
    "options": [
      "Stop to help",
      "Keep going"
    ],
  },
  {
    "id": 6,
    "date": "2025-09-06",
    "question": "You find a wallet on the street with cash inside. What do you do?",
    "options": [
      "Keep the money",
      "Try to return it"
    ],
  },
    {
    "id": 7,
    "date": "2025-09-07",
    "question": "You are offered your dream job, but it is in another country far from your family. Do you take it?",
    "options": [
      "Accept the job",
      "Stay near family"
    ],
  },
];