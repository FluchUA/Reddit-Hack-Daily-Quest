export type AutoComment = {
    commentType: string;
    comments: string[];
};

export const autoComments: AutoComment[] = [
    {
        commentType: "consensus", // >70%
        comments: [
            "Strong consensus today — most of you think alike!",
            "Clear winner! Looks like Reddit agrees on this one",
            "No dilemma here, the choice was obvious for most",
            "United we stand — almost everyone chose the same path"
        ]
    },
    {
        commentType: "close", // 60–70%
        comments: [
            "A slight majority leans one way, but it was a tough call",
            "Interesting! One option edges ahead, but it’s close",
            "Not a landslide, but we do have a leader",
            "Majority rules — but it was a tight race"
        ]
    },
    {
        commentType: "balanced", // 40–60%
        comments: [
            "A real dilemma — the community is split!",
            "Close call! Opinions are nearly evenly divided",
            "Fifty-fifty vibes — no clear winner today",
            "Perfect balance, as all things should be"
        ]
    },
    {
        commentType: "fresh", // <40%
        comments: [
            "A fresh start — let’s see how the community decides",
            "Not many votes yet, the story is still unfolding",
            "Too early to tell — cast your vote!"
        ]
    },
    {
        commentType: "neck_and_neck", // difference between first and second place < 10%
        comments: [
            "Neck and neck! Two options are almost tied",
            "It’s basically a draw — tough choice indeed",
            "Two favorites are battling for the top spot"
        ]
    },
];