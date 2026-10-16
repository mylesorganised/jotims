import { L, sheet } from "./links";
import type { BadgeDef, TaskDef } from "./types";

const stayingSafe =
  "If anything online ever makes you feel worried, upset or uncomfortable, stop, don't reply, and tell a trusted adult.";

const common = {
  family: "digital-citizen" as const,
  title: "Digital Citizen",
  sections: ["beavers", "cubs", "scouts"] as BadgeDef["sections"],
  color: "#1a6fc4",
  ring: "#5b3fa8",
  ink: "#ffffff",
  officialUrl: "https://www.scouts.org.uk/staged-badges/digital-citizen/",
};

// ---------------------------------------------------------------- Stage 1

const stage1: TaskDef[] = [
  {
    id: "you-online",
    title: "You online",
    summary: "What did you do online this week, and what did you share?",
    emoji: "🌐",
    minutes: 15,
    review: "self",
    steps: [
      {
        title: "Think about this week",
        body: ["What did you do online this week? Think about consoles, laptops, phones and tablets."],
        fields: [
          {
            kind: "list",
            id: "activities",
            label: "Things I did online this week",
            count: 6,
            min: 3,
            placeholder: "e.g. played Minecraft, watched YouTube…",
            required: true,
          },
        ],
      },
      {
        title: "What did you share?",
        bullets: [
          "Did you chat to people on games?",
          "Did you fill out information on a website?",
          "Did you use an app to chat with people you didn't already know?",
        ],
        fields: [
          {
            kind: "text",
            id: "shared",
            label: "What information did you give away?",
            hint: "Things like your name, age, photos, where you live or go to school, what you like…",
            long: true,
            required: true,
          },
        ],
      },
      {
        title: "Who could see it?",
        body: ["Did you give information to people you don't actually know? Who could have seen or heard what you said or typed?"],
        tip: stayingSafe,
        fields: [
          { kind: "text", id: "who", label: "Who could have seen it?", long: true, required: true },
          { kind: "text", id: "ok", label: "Do you think that's OK? Why?", long: true },
          {
            kind: "upload",
            id: "paper",
            label: "Did it on paper? Add a photo of your page (optional)",
            accept: "image/*",
          },
        ],
      },
    ],
  },
  {
    id: "tech-timeline",
    title: "Technology timeline",
    summary: "Look at how tech has changed, then draw its future.",
    emoji: "🕰️",
    minutes: 25,
    review: "self",
    steps: [
      {
        title: "Look back in time",
        body: ["Look at how technology has changed over the last 40 years. Tap through the cards below (or look at the pictures on the wall)."],
        tools: ["timeline"],
        links: [sheet("Technology timeline cards", "technology-timeline-cards.pdf")],
      },
      {
        title: "Pick one",
        fields: [
          {
            kind: "choice",
            id: "type",
            label: "Which technology will you design the future of?",
            options: ["Computers", "Phones", "Games", "Music"],
            required: true,
          },
        ],
      },
      {
        title: "Draw the future",
        body: ["Draw what you think it will look like in **20 years**. Use paper, or draw on the computer."],
        bullets: [
          "What features will it have?",
          "What will it be made of?",
          "Will it look like the ones in the pictures, or totally different?",
        ],
        fields: [{ kind: "upload", id: "drawing", label: "Upload a photo of your drawing", accept: "image/*", required: true }],
      },
      {
        title: "Tell us about it",
        fields: [
          { kind: "text", id: "features", label: "What features will it have and what will it be made of?", long: true, required: true },
          { kind: "text", id: "better", label: "How will it make life better?", long: true, required: true },
        ],
      },
    ],
  },
  {
    id: "be-kind",
    title: "When people are unkind",
    summary: "Three positive ways to respond when someone's unkind or dishonest.",
    emoji: "💛",
    minutes: 15,
    review: "self",
    steps: [
      {
        title: "The games you play",
        body: ["Think about the games you play, online or in the playground."],
        fields: [
          { kind: "text", id: "games", label: "What games do you play?", required: true },
          {
            kind: "choice",
            id: "talk",
            label: "Do you talk to people in these games?",
            options: ["Yes", "Sometimes", "No"],
            required: true,
          },
        ],
      },
      {
        title: "Are people always nice?",
        body: ["Are people always nice? Do they always tell the truth?"],
        fields: [{ kind: "text", id: "experience", label: "What have you noticed?", long: true }],
      },
      {
        title: "Three positive ways to respond",
        body: ["What could you do when someone is being unkind or dishonest? Think of three good ways."],
        tip: "Ideas: don't reply unkindly, block or mute them, report them, take a break, stick up for the person being picked on, and always tell a trusted adult if someone makes you feel uncomfortable.",
        fields: [{ kind: "list", id: "ways", label: "Three ways to respond", count: 3, min: 3, required: true }],
      },
    ],
  },
  {
    id: "passwords",
    title: "Secure passwords: learn and teach",
    summary: "Learn what makes a strong password, then make a poster.",
    emoji: "🔐",
    minutes: 30,
    review: "self",
    steps: [
      {
        title: "Learn about passwords",
        body: ["Look online and find out about secure passwords. Do this with a trusted adult."],
        links: [L.ncscPasswords, L.childnet],
        tools: ["password"],
        fields: [
          { kind: "text", id: "how", label: "How do you create a secure password?", long: true, required: true },
          { kind: "text", id: "why", label: "Why is it important?", long: true, required: true },
          {
            kind: "text",
            id: "warning",
            label: "What are the warning signs that someone has got into your account or knows your password?",
            long: true,
            required: true,
          },
        ],
      },
      {
        title: "Make a poster",
        body: ["Create a poster, on paper or on the computer, to show what you've learnt and teach others."],
        warning: "Don't put your real password on your poster!",
        fields: [{ kind: "upload", id: "poster", label: "Upload a photo of your poster", accept: "image/*,application/pdf", required: true }],
      },
    ],
  },
];

export const digitalCitizen1: BadgeDef = {
  ...common,
  id: "digital-citizen-1",
  stage: 1,
  recommendedFor: ["beavers", "cubs"],
  tagline: "Staying safe and kind online.",
  intro: "Complete every task, thinking about the risks of each activity and how to stay safe.",
  tasks: stage1,
  parts: stage1.map((t) => ({ kind: "task" as const, taskId: t.id })),
};

// ---------------------------------------------------------------- Stage 2

function learnAndShare(id: string, emoji: string, mix: boolean): TaskDef {
  return {
    id,
    title: "Learn and share",
    summary: "Learn about any topic you like and share it with others.",
    emoji,
    minutes: 40,
    review: "leader",
    leaderCheck: mix
      ? "The Scout presented what they learnt to other Scouts or a leader using a mix of ways."
      : "The young person shared what they learnt with others or a leader.",
    steps: [
      {
        title: "Pick a topic",
        body: ["Pick any topic you like and learn some more about it. Space, dinosaurs, football, a country you chatted to on JOTI…"],
        fields: [{ kind: "text", id: "topic", label: "My topic", required: true }],
      },
      {
        title: "Learn about it",
        body: ["Use the internet (and books!) to find out more. Check your facts come from websites you can trust."],
        fields: [{ kind: "text", id: "learned", label: "What did you learn?", long: true, required: true }],
      },
      {
        title: "Plan how to share it",
        body: [mix ? "Come up with a mix of ways to share it." : "Come up with a couple of ways to share it."],
        bullets: ["Posters", "Drawings", "Stories", "Presentations", "A quiz", "A short video"],
        fields: [{ kind: "list", id: "ways", label: "How I'll share it", count: 3, min: 2, required: true }],
      },
      {
        title: "Present it",
        body: [`Present what you've learnt to ${mix ? "other Scouts" : "others"} or a leader.`],
        withLeader: true,
        fields: [{ kind: "upload", id: "work", label: "Upload your poster, slides or photos", multiple: true }],
      },
    ],
  };
}

const stage2: TaskDef[] = [
  {
    id: "online-rights",
    title: "Your rights online",
    summary: "What rights should young people have online?",
    emoji: "⚖️",
    minutes: 15,
    review: "self",
    steps: [
      {
        title: "Make a list",
        body: ["What rights do you think you should have as a young person when you're online?"],
        tip: "Need ideas? \"The right to delete things I've posted.\" \"The right to know who has my information.\" \"The right to be safe from bullying.\"",
        links: [L.fiveRights, L.childnet],
        fields: [{ kind: "list", id: "rights", label: "My online rights", count: 6, min: 4, required: true }],
      },
    ],
  },
  {
    id: "screen-time",
    title: "How much time do you spend online?",
    summary: "Look back at your week online.",
    emoji: "⏱️",
    minutes: 15,
    review: "self",
    steps: [
      {
        title: "Think about last week",
        body: ["How much time did you spend online, and what were you doing?"],
        fields: [
          {
            kind: "table",
            id: "week",
            label: "My week online",
            columns: [
              { id: "what", label: "What I did", placeholder: "Gaming" },
              { id: "time", label: "About how long", placeholder: "5 hours" },
            ],
            rows: 5,
            minRows: 2,
            required: true,
          },
          { kind: "text", id: "total", label: "Roughly how many hours altogether?", required: true },
        ],
      },
      {
        title: "Are you happy with that?",
        fields: [
          {
            kind: "choice",
            id: "feel",
            label: "Was it…",
            options: ["Too much time online", "About right", "Not enough"],
            required: true,
          },
          {
            kind: "text",
            id: "reflection",
            label: "Was it a good use of time? What else could you have been doing?",
            long: true,
            required: true,
          },
        ],
      },
    ],
  },
  {
    id: "fact-opinion",
    title: "Facts, opinions and digital persuasion",
    summary: "Spot facts, opinions and the tricks apps use on you.",
    emoji: "🧐",
    minutes: 35,
    review: "self",
    steps: [
      {
        title: "Fact or opinion?",
        body: [
          "A **fact** is something that can be checked and proved true.",
          "An **opinion** is what someone thinks or feels. People can disagree with it.",
        ],
        tools: ["fact-opinion"],
      },
      {
        title: "Where do you get facts?",
        body: ["Think about where you read and watch things online."],
        fields: [
          { kind: "list", id: "facts", label: "Places I can usually get facts", count: 4, min: 2, required: true },
          {
            kind: "list",
            id: "opinions",
            label: "Places that are mostly opinions, or might not be true",
            count: 4,
            min: 2,
            required: true,
          },
        ],
      },
      {
        title: "The digital persuasion game",
        body: [
          "Designers use clever tricks to make you click, buy and keep playing. This is called **digital persuasion**.",
          "Get into threes and play the game: match each trick to what it is.",
        ],
        tools: ["persuasion"],
        links: [sheet("Printable persuasion game cards", "digital-persuasion-cards.pdf"), L.persuasionActivity],
      },
      {
        title: "How does it affect you?",
        fields: [
          {
            kind: "text",
            id: "affect",
            label: "How does persuasion affect what you see online, what you buy, and how long you play games?",
            long: true,
            required: true,
          },
        ],
      },
    ],
  },
  {
    id: "people-online",
    title: "How do people act online?",
    summary: "Tell three stories and see how people react.",
    emoji: "🎭",
    minutes: 25,
    review: "self",
    steps: [
      {
        title: "All sorts of people",
        body: ["Think about all the people who are online. What sort of differences are there between them? Have a really good think."],
        fields: [{ kind: "list", id: "differences", label: "Differences between people online", count: 6, min: 4, required: true }],
      },
      {
        title: "Three stories",
        body: [
          "Come up with three short stories. They can be true, like \"I was late for school this morning\", or made up, like \"my grandma was in a rock band\".",
        ],
        fields: [{ kind: "list", id: "stories", label: "My three stories", count: 3, min: 3, required: true }],
      },
      {
        title: "Get reactions",
        body: ["Tell each story to at least 2 different people. Ask them to point to an emoji to show how they feel about it."],
        tools: ["emoji"],
        fields: [
          {
            kind: "table",
            id: "reactions",
            label: "Their reactions",
            columns: [
              { id: "story", label: "Story" },
              { id: "person", label: "Who" },
              { id: "reaction", label: "Reaction" },
            ],
            rows: 6,
            minRows: 6,
            required: true,
          },
        ],
      },
      {
        title: "Why different?",
        fields: [
          {
            kind: "text",
            id: "why",
            label: "Did everyone react the same way? If not, why do you think people reacted differently?",
            long: true,
            required: true,
          },
        ],
      },
    ],
  },
  learnAndShare("learn-share", "🎓", false),
];

export const digitalCitizen2: BadgeDef = {
  ...common,
  id: "digital-citizen-2",
  stage: 2,
  prerequisite: "digital-citizen-1",
  recommendedFor: ["cubs", "scouts"],
  tagline: "Rights, screen time, facts and persuasion.",
  intro: "Complete every task, thinking about the risks of each activity and how to stay safe.",
  tasks: stage2,
  parts: stage2.map((t) => ({ kind: "task" as const, taskId: t.id })),
};

// ---------------------------------------------------------------- Stage 3

const stage3: TaskDef[] = [
  {
    id: "uncomfortable",
    title: "Feeling uncomfortable online",
    summary: "Make something that helps others know what to do and where to get help.",
    emoji: "🛟",
    minutes: 30,
    review: "self",
    steps: [
      {
        title: "What should you do?",
        body: ["If someone is made to feel uncomfortable online, what should they do, and where can they find support?"],
        bullets: [
          "Stop: don't reply",
          "Screenshot it, then block and report",
          "Tell a trusted adult: a parent, carer, teacher or leader",
          "Get help from Childline or CEOP",
        ],
        links: [L.childline, L.ceop, L.reportHarmful, L.thinkuknow],
      },
      {
        title: "Create something",
        body: ["Create something that helps other young people know what to do. It could be a poster, leaflet, comic, video or slideshow."],
        fields: [
          { kind: "upload", id: "creation", label: "Upload what you made", multiple: true, required: true },
          { kind: "text", id: "about", label: "What did you make, and what does it tell people?", long: true, required: true },
        ],
      },
    ],
  },
  {
    id: "opinions",
    title: "What impacts your opinions?",
    summary: "How do the people you meet online shape what you think?",
    emoji: "🧠",
    minutes: 20,
    review: "self",
    steps: [
      {
        title: "Who do you interact with?",
        fields: [
          {
            kind: "text",
            id: "similar",
            label: "Are the people you interact with most online similar to you, or different?",
            long: true,
            required: true,
          },
          {
            kind: "text",
            id: "same",
            label: "Are they the same ages, genders and ethnicities? Do they have the same hobbies?",
            long: true,
            required: true,
          },
        ],
      },
      {
        title: "Impress or avoid?",
        fields: [
          { kind: "text", id: "impress", label: "Are there some people you'd like to impress or avoid?", long: true },
          {
            kind: "text",
            id: "affect",
            label: "How does this affect how you act and what your opinions are?",
            long: true,
            required: true,
          },
        ],
      },
    ],
  },
  {
    id: "who-online",
    title: "Who do you deal with online?",
    summary: "Think about who you game and chat with, then discuss it with a leader.",
    emoji: "👥",
    minutes: 20,
    review: "leader",
    leaderCheck: "The Scout discussed who they interact with online, and how that compares to real life.",
    steps: [
      {
        title: "Think about it",
        body: ["Think about what you do online and who you interact with."],
        fields: [
          { kind: "text", id: "who", label: "Who do you play games with? Who do you talk to?", long: true, required: true },
          {
            kind: "text",
            id: "similar",
            label: "Are they similar to you or quite different? (ages, genders, ethnicities, hobbies…) Do you know?",
            long: true,
            required: true,
          },
          {
            kind: "text",
            id: "irl",
            label: "Is this the same as when you play in real life, like at school or at the weekend?",
            long: true,
            required: true,
          },
        ],
      },
      {
        title: "Talk to a leader",
        body: ["What do you think about that? Talk to a leader and discuss it."],
        withLeader: true,
        fields: [{ kind: "text", id: "thoughts", label: "What did you think or decide?", long: true }],
      },
    ],
  },
  {
    id: "safe-happy",
    title: "Help people stay safe and happy online",
    summary: "Make a poster for the Scout hut.",
    emoji: "🪧",
    minutes: 35,
    review: "self",
    steps: [
      {
        title: "Think about games",
        body: ["Think about playing games, online or at school."],
        bullets: [
          "What games do you play?",
          "Do you talk to people in these games?",
          "Are people always nice? Do they always tell the truth?",
          "Do you really know them?",
          "Do you ever feel uncomfortable?",
        ],
        fields: [{ kind: "text", id: "thoughts", label: "Your thoughts", long: true, required: true }],
      },
      {
        title: "Ways to deal with it",
        fields: [
          {
            kind: "list",
            id: "ways",
            label: "Ways to deal with people when they're being unkind",
            count: 4,
            min: 3,
            required: true,
          },
        ],
        links: [L.childnet, L.saferInternet],
      },
      {
        title: "Make a poster",
        body: [
          "Create a poster that helps other young people know what to do if they're made to feel unhappy or unsafe online, or someone is unkind. Make it good enough to go up in the Scout hut!",
        ],
        fields: [{ kind: "upload", id: "poster", label: "Upload your poster", accept: "image/*,application/pdf", required: true }],
      },
    ],
  },
  learnAndShare("learn-share", "🎤", true),
  {
    id: "campaign",
    title: "Let's get people involved!",
    summary: "Plan a campaign for something you care about.",
    emoji: "📣",
    minutes: 45,
    review: "leader",
    leaderCheck: "The Scout planned a campaign with a leader and made posters/flyers or recorded a short video.",
    steps: [
      {
        title: "Pick a cause",
        body: ["By yourself or in a small group, pick something you care about and want other people to get involved in: Scouting, football, dance… anything!"],
        fields: [{ kind: "text", id: "cause", label: "My campaign is about…", required: true }],
      },
      {
        title: "Plan your campaign",
        fields: [
          { kind: "text", id: "pitch", label: "How will you sell it so people want to get involved?", long: true, required: true },
          {
            kind: "checklist",
            id: "formats",
            label: "What will you make?",
            items: ["Posters", "Flyers", "A short video", "A social media post", "A talk"],
            required: true,
          },
        ],
      },
      {
        title: "Make it",
        body: ["Discuss it with a leader, then make your posters or flyers, or plan a short video clip and record it with a leader."],
        withLeader: true,
        fields: [
          { kind: "text", id: "video_plan", label: "Video plan, scene by scene (if you're making one)", long: true },
          { kind: "upload", id: "work", label: "Upload your posters, flyers or video", multiple: true, required: true },
        ],
      },
    ],
  },
];

export const digitalCitizen3: BadgeDef = {
  ...common,
  id: "digital-citizen-3",
  stage: 3,
  prerequisite: "digital-citizen-2",
  recommendedFor: ["scouts"],
  tagline: "Support, opinions and campaigns.",
  intro: "Complete every task, thinking about the risks of each activity and how to stay safe.",
  tasks: stage3,
  parts: stage3.map((t) => ({ kind: "task" as const, taskId: t.id })),
};

