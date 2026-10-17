import { L, sheet } from "./links";
import type { BadgeDef, TaskDef } from "./types";

const gotItRight = {
  kind: "choice" as const,
  id: "got_it",
  label: "Did they get it right?",
  options: ["Yes, first time!", "Not at first, but we tried again", "Not yet"],
};

// ---------------------------------------------------------------- Beavers

const beaverTasks: TaskDef[] = [
  {
    id: "phone-call",
    title: "Make a phone call",
    summary: "Call someone on a mobile or a home phone.",
    emoji: "📞",
    minutes: 10,
    review: "leader",
    leaderCheck: "The Beaver made a phone call on a mobile or landline.",
    steps: [
      {
        title: "Get ready",
        body: [
          "Ask a leader or a grown-up which phone to use. It can be a **mobile** or a **home phone** (a landline).",
          "Decide who you are going to call.",
        ],
        tip: "Think about what you'll say first: \"Hello! It's me, …\"",
        withLeader: true,
      },
      {
        title: "Make the call",
        todo: [
          "Dial the number, or tap the person's name.",
          "Wait for them to answer.",
          "Say hello and tell them who you are.",
          "Have a little chat!",
          "Say goodbye before you hang up.",
        ],
      },
      {
        title: "Tell us about it",
        fields: [
          { kind: "text", id: "who", label: "Who did you call?", placeholder: "My Gran, a leader…", required: true },
          { kind: "text", id: "talk", label: "What did you talk about?", long: true },
        ],
      },
    ],
  },
  {
    id: "home-number",
    title: "Learn your home phone number",
    summary: "Learn it off by heart and say it to a leader.",
    emoji: "🏠",
    minutes: 10,
    review: "leader",
    leaderCheck: "The Beaver said their home (or grown-up's) phone number from memory.",
    steps: [
      {
        title: "Find out your number",
        body: [
          "Do you know your home phone number, or your grown-up's mobile number?",
          "If you're not sure, ask a leader or your grown-up.",
        ],
        warning: "Don't type your phone number into this website. Keep it in your head!",
      },
      {
        title: "Practise it",
        todo: [
          "Say it out loud three times.",
          "Split it into small chunks, like 01234 … 567 … 890.",
          "Close your eyes and say it again.",
        ],
      },
      {
        title: "Say it to a leader",
        body: ["Find a leader and say the number from memory. No peeking!"],
        withLeader: true,
        fields: [
          {
            kind: "checklist",
            id: "done",
            label: "Tick when you've done it",
            items: ["I practised my number", "I said it to a leader from memory"],
            requireAll: true,
            required: true,
          },
        ],
      },
    ],
  },
  {
    id: "message-leader",
    title: "Send an email or text to a leader",
    summary: "Use a phone or computer to send a message.",
    emoji: "✉️",
    minutes: 10,
    review: "leader",
    leaderCheck: "The leader received an email or text from the Beaver.",
    steps: [
      {
        title: "Choose how",
        body: ["Will you send an **email** or a **text message**? Ask a leader which phone or computer to use, and who to send it to."],
        fields: [{ kind: "choice", id: "how", label: "I'm going to send…", options: ["An email", "A text message"], required: true }],
      },
      {
        title: "Write your message",
        body: ["Keep it short and friendly."],
        bullets: ["Say hello", "Say who you are", "Say one thing you've enjoyed at JOTI"],
        fields: [{ kind: "text", id: "message", label: "What did your message say?", long: true, required: true }],
      },
      {
        title: "Send it!",
        simulate: {
          kind: "either",
          points: [
            "Says hello (or another greeting)",
            "Says who they are (their first name is fine)",
            "Says one thing they've enjoyed at JOTA-JOTI or Beavers",
          ],
          fills: { body: "message", how: { field: "how", email: "An email", sms: "A text message" } },
        },
        body: [
          "Send your message to **Akela**, our AI leader, with the pretend email or phone below. Akela will write back!",
          "Sent a real one to a leader instead? Ask them to check they got it, and add a photo if you like.",
        ],
        fields: [
          { kind: "upload", id: "proof", label: "Got a screenshot or photo? Add it here (optional)", accept: "image/*" },
        ],
      },
    ],
  },
  {
    id: "morse-name",
    title: "Spell your name in Morse code",
    summary: "Turn your name into dots and dashes.",
    emoji: "✳️",
    minutes: 15,
    review: "self",
    steps: [
      {
        title: "What is Morse code?",
        body: [
          "Morse code sends letters using just **dots** (short) and **dashes** (long). You can send it with **light** or **sound**.",
          "Ships still use Morse code, flashing big lights to send signals.",
          "Every letter and number has its own code. For example **HI** is `.... ..` (4 dots, a gap, then 2 dots).",
        ],
        tools: ["morse"],
      },
      {
        title: "Write your name in Morse",
        body: [
          "Look up each letter of your first name in the chart. Write the dots and dashes for each letter, with a space between letters.",
        ],
        tip: "Use a full stop . for a dot and a minus sign - for a dash.",
        tools: ["morse"],
        fields: [
          {
            kind: "text",
            id: "name_morse",
            label: "My first name in Morse code",
            placeholder: "e.g. .... ..",
            mono: true,
            required: true,
            check: { kind: "morse-of-name", success: "Perfect! That's your name in Morse code! 🎉" },
          },
        ],
      },
      {
        title: "Send it to a friend",
        body: [
          "Send your name to another Beaver or a leader. Tap it on the table (short tap = dot, long tap = dash), beep it, or flash a torch.",
          "Did they work out your name?",
        ],
        fields: [
          gotItRight,
          {
            kind: "text",
            id: "received",
            label: "Now they send you a message. What letters did they send?",
          },
        ],
      },
    ],
  },
  {
    id: "morse-message",
    title: "Send and write a Morse message",
    summary: "Crack a secret message, then send your own.",
    emoji: "📡",
    minutes: 20,
    review: "leader",
    leaderCheck: "The Beaver sent a short Morse message to someone and decoded one back.",
    steps: [
      {
        title: "Crack the secret message",
        body: [
          "Here's a secret message in Morse code. It has **4 words**. Each `/` is a gap between words.",
          "`..  /  .-  --  /  .-  /  -...  .  .-  ...-  .  .-.`",
        ],
        tools: ["morse"],
        fields: [
          {
            kind: "text",
            id: "decoded",
            label: "What does it say?",
            required: true,
            check: { kind: "equals", answer: "I AM A BEAVER", success: "You cracked it! Brilliant code-breaking! 🎉" },
          },
        ],
      },
      {
        title: "Write your own message",
        body: ["Think of a short message, 2 to 4 words, like HELLO FRIEND. Write it in letters, then in Morse code."],
        tools: ["morse"],
        fields: [
          { kind: "text", id: "my_message", label: "My message in letters", required: true },
          { kind: "text", id: "my_morse", label: "My message in Morse code", mono: true, required: true },
        ],
      },
      {
        title: "Send it",
        body: [
          "Send your message to another Beaver or a leader by tapping, beeping or flashing a torch. Did they get it right?",
          "Now they send one to you. What did it say?",
        ],
        withLeader: true,
        fields: [gotItRight, { kind: "text", id: "received", label: "What message did they send you?" }],
      },
    ],
  },
];

export const beaversCommunicator: BadgeDef = {
  id: "beavers-communicator",
  title: "Communicator",
  family: "communicator",
  sections: ["beavers"],
  recommendedFor: ["beavers"],
  color: "#ffe627",
  ring: "#003982",
  ink: "#003982",
  tagline: "Phone calls, messages and secret Morse code!",
  intro:
    "There are lots of ways to talk to people. In this badge you'll make a phone call, send a message to a leader and use Morse code like a sailor.",
  sheet: sheet("Beavers Communicator sheet", "beavers-communicator.pdf"),
  officialUrl: "https://www.scouts.org.uk/beavers/activity-badges/communicator/",
  tasks: beaverTasks,
  parts: beaverTasks.map((t) => ({ kind: "task" as const, taskId: t.id })),
};

// ---------------------------------------------------------------- Cubs

const cubTasks: TaskDef[] = [
  {
    id: "swap-instructions",
    title: "Swap instructions",
    summary: "Give instructions to another Cub, then follow theirs.",
    emoji: "🧭",
    minutes: 20,
    review: "self",
    steps: [
      {
        title: "Think of some instructions",
        body: ["Think of some instructions to give someone else."],
        bullets: ["Directions around the green", "A picture to draw", "How to play a game"],
        fields: [
          {
            kind: "text",
            id: "my_instructions",
            label: "Write your instructions",
            hint: "Number each step: 1. … 2. … 3. …",
            long: true,
            required: true,
          },
        ],
      },
      {
        title: "Give them to someone",
        body: ["Give your instructions to another Cub and watch them follow them."],
        fields: [
          {
            kind: "choice",
            id: "worked",
            label: "Did they follow them correctly?",
            options: ["Yes, perfectly", "Mostly", "No, it went wrong"],
            required: true,
          },
          {
            kind: "text",
            id: "what_wrong",
            label: "If not, what went wrong? Could you have explained it better?",
            long: true,
          },
        ],
      },
      {
        title: "Swap!",
        body: ["Now another Cub gives **you** instructions. How did it go?"],
        fields: [
          { kind: "text", id: "their_instructions", label: "What were their instructions about?" },
          {
            kind: "text",
            id: "reflection",
            label: "Did you manage to follow them? If not, what went wrong?",
            long: true,
            required: true,
          },
        ],
      },
    ],
  },
  {
    id: "take-a-call",
    title: "Take a phone message",
    summary: "A leader calls you. Write down every detail.",
    emoji: "☎️",
    minutes: 10,
    review: "leader",
    leaderCheck: "The Cub took a call and wrote down the key details of the message correctly.",
    steps: [
      {
        title: "Get ready",
        body: ["A leader will call you and give you a message. Keep this page open so you can write it down."],
        tip: "Listen for: who is calling, what the message is, and any times, places or numbers. It's fine to ask them to repeat or spell something.",
        withLeader: true,
      },
      {
        title: "Write down the details",
        fields: [
          { kind: "text", id: "caller", label: "Who called?", required: true },
          { kind: "text", id: "message", label: "What was the message?", long: true, required: true },
          { kind: "text", id: "details", label: "Important details (times, places, numbers)" },
        ],
      },
      {
        title: "Check it",
        body: ["Read it back to the leader. Did you get all the important points?"],
        fields: [
          {
            kind: "choice",
            id: "correct",
            label: "How did you do?",
            options: ["I got everything", "I missed a bit"],
            required: true,
          },
        ],
      },
    ],
  },
  {
    id: "email-and-text",
    title: "Send an email and a text",
    summary: "Send a leader one of each.",
    emoji: "📨",
    minutes: 15,
    review: "leader",
    leaderCheck: "The leader received both an email and a text message from the Cub.",
    steps: [
      {
        title: "Send an email",
        body: ["Send an email to **Akela**, our AI leader, in the pretend inbox below. A good email has:"],
        bullets: ["A subject line", "A greeting (Hi Akela!)", "Your message", "Your name at the end"],
        simulate: {
          kind: "email",
          points: [
            "Has a subject line that says what the email is about",
            "Starts with a greeting, like Hi Akela",
            "Has a clear, friendly message",
            "Ends with their name",
          ],
          fills: { subject: "email_subject", body: "email" },
        },
        fields: [
          { kind: "text", id: "email_subject", label: "Email subject", required: true },
          { kind: "text", id: "email", label: "What did your email say?", long: true, required: true },
        ],
      },
      {
        title: "Send a text",
        body: ["Now send a text message to **Akela** on the pretend phone below. Texts are shorter, so keep it clear and friendly."],
        simulate: {
          kind: "sms",
          points: ["Is a clear, friendly text message that makes sense", "Says who it's from or what it's about"],
          fills: { body: "text" },
        },
        fields: [{ kind: "text", id: "text", label: "What did your text say?", required: true }],
      },
      {
        title: "Proof (optional)",
        fields: [{ kind: "upload", id: "proof", label: "Add screenshots if you have them", accept: "image/*", multiple: true }],
      },
    ],
  },
  {
    id: "introduce-yourself",
    title: "Introduce yourself to a leader",
    summary: "Talk to a leader for two minutes about you.",
    emoji: "🙋",
    minutes: 10,
    review: "leader",
    leaderCheck: "The Cub talked to a leader for about two minutes about themselves, clearly and confidently.",
    steps: [
      {
        title: "Plan what to say",
        body: ["You're going to talk to a leader for **two minutes** about you. What will you say?"],
        bullets: [
          "Your family and pets",
          "Your school and favourite subject",
          "Your hobbies and what you do at weekends",
          "Something you're proud of",
          "What you'd like to do when you're older",
        ],
        fields: [{ kind: "list", id: "points", label: "Things I'll talk about", count: 5, min: 3, required: true }],
      },
      {
        title: "Talk to a leader",
        body: ["Find a leader and chat for two minutes. Look at them, speak clearly, and ask them a question too!"],
        withLeader: true,
        tools: ["timer-2"],
      },
    ],
  },
  {
    id: "write-report",
    title: "Write a report",
    summary: "Report on an event like a real journalist.",
    emoji: "📰",
    minutes: 25,
    review: "self",
    steps: [
      {
        title: "Pick your event",
        body: ["Choose something to report on: a school event, a Cubs night, a football match, or JOTI itself!"],
        links: [L.newsround],
        fields: [{ kind: "text", id: "event", label: "What are you reporting on?", required: true }],
      },
      {
        title: "Write it like a reporter",
        body: ["Good reports answer these questions:"],
        bullets: ["What happened?", "Who was there?", "When and where was it?", "What was the best bit?", "What did people say?"],
        fields: [
          { kind: "text", id: "headline", label: "Headline", placeholder: "e.g. Cubs chat to the world at JOTI!", required: true },
          { kind: "text", id: "report", label: "Your report", long: true, minWords: 50, required: true },
          { kind: "upload", id: "photo", label: "Add a photo (optional)", accept: "image/*" },
        ],
      },
    ],
  },
  {
    id: "sign-language",
    title: "Learn about sign language and Braille",
    summary: "Find out how people with sight or hearing loss communicate.",
    emoji: "🤟",
    minutes: 25,
    review: "leader",
    leaderCheck: "The Cub explained what they found out and showed a simple phrase.",
    steps: [
      {
        title: "Find out",
        body: [
          "Using the internet, find out how people with a visual or hearing impairment communicate. You might learn about **Braille**, **Makaton** or **British Sign Language (BSL)**.",
        ],
        links: [L.bslAlphabet, L.makaton, L.rnib, L.bslSigns],
        fields: [{ kind: "text", id: "learned", label: "What did you find out?", long: true, required: true }],
      },
      {
        title: "Learn a phrase",
        body: ["Learn a simple phrase, like \"Hello, my name is…\" in BSL fingerspelling or Makaton."],
        fields: [
          { kind: "choice", id: "method", label: "Which did you use?", options: ["BSL", "Makaton", "Braille"], required: true },
          { kind: "text", id: "phrase", label: "What phrase did you learn?", required: true },
        ],
      },
      {
        title: "Show an adult",
        body: ["Show your phrase to a leader or another adult."],
        withLeader: true,
      },
    ],
  },
  {
    id: "remember-message",
    title: "Remember a message",
    summary: "Remember a message for 10 minutes, then say it back.",
    emoji: "🧠",
    minutes: 15,
    review: "leader",
    leaderCheck: "The Cub repeated the message back correctly about 10 minutes later.",
    steps: [
      {
        title: "Get a message",
        body: ["Ask an adult to give you a message. Listen carefully, and **don't write it down**!"],
        tip: "Memory trick: say it in your head a few times, or picture it like a little film.",
        withLeader: true,
      },
      {
        title: "Wait 10 minutes",
        body: ["Go and do something else while you wait. Use the timer below."],
        tools: ["timer-10"],
      },
      {
        title: "Say it back",
        body: ["Go back to the adult and repeat the message. Did you get it right?"],
        withLeader: true,
        fields: [
          {
            kind: "choice",
            id: "correct",
            label: "How did you do?",
            options: ["Word perfect!", "I got most of it", "I forgot some"],
            required: true,
          },
          { kind: "text", id: "message", label: "Now you can write it down: what was the message?" },
        ],
      },
    ],
  },
  {
    id: "cubs-codes",
    title: "Morse code or semaphore messages",
    summary: "Write three coded messages and crack three more.",
    emoji: "🚩",
    minutes: 25,
    review: "self",
    steps: [
      {
        title: "Pick your code",
        body: [
          "**Morse code** sends letters with dots and dashes, by light or sound.",
          "**Semaphore** sends letters by holding two flags in different positions.",
          "Both are still used on ships today.",
        ],
        tools: ["morse", "semaphore"],
        fields: [
          { kind: "choice", id: "method", label: "I'm going to use…", options: ["Morse code", "Semaphore"], required: true },
        ],
      },
      {
        title: "Write three messages",
        body: ["Write three simple messages and turn each one into code."],
        tip: "For semaphore, you can write the letters and practise the flag positions, or draw them and upload a photo.",
        tools: ["morse", "semaphore"],
        fields: [
          {
            kind: "table",
            id: "mine",
            label: "My messages",
            columns: [
              { id: "plain", label: "Message", placeholder: "HELLO" },
              { id: "code", label: "In code", placeholder: ".... . .-.. .-.. ---" },
            ],
            rows: 3,
            minRows: 3,
            required: true,
          },
        ],
      },
      {
        title: "Crack three messages",
        body: ["Swap with another Cub. Try to work out their three messages."],
        fields: [
          {
            kind: "table",
            id: "theirs",
            label: "Their messages",
            columns: [
              { id: "code", label: "Their code" },
              { id: "plain", label: "What it means" },
            ],
            rows: 3,
            minRows: 3,
            required: true,
          },
          { kind: "upload", id: "photo", label: "Photo of your work (optional)", accept: "image/*" },
        ],
      },
    ],
  },
];

export const cubsCommunicator: BadgeDef = {
  id: "cubs-communicator",
  title: "Communicator",
  family: "communicator",
  sections: ["cubs"],
  recommendedFor: ["cubs"],
  color: "#e9461b",
  ring: "#ffe627",
  ink: "#ffffff",
  tagline: "Instructions, phone messages, reports and codes.",
  intro:
    "Good communicators listen carefully and explain things clearly. Do the four main tasks, then pick three extra activities you like the look of.",
  sheet: sheet("Cubs Communicator sheet", "cubs-communicator.pdf"),
  officialUrl: "https://www.scouts.org.uk/cubs/activity-badges/communicator/",
  tasks: cubTasks,
  parts: [
    { kind: "task", taskId: "swap-instructions" },
    { kind: "task", taskId: "take-a-call" },
    { kind: "task", taskId: "email-and-text" },
    { kind: "task", taskId: "introduce-yourself" },
    {
      kind: "choice",
      id: "extras",
      title: "Choose 3 more activities",
      description: "Pick any three of these four.",
      pick: 3,
      options: [
        { id: "report", title: "Write a report", emoji: "📰", summary: "Be a reporter for a day.", taskIds: ["write-report"] },
        {
          id: "sign",
          title: "Sign language and Braille",
          emoji: "🤟",
          summary: "Learn how people with sight or hearing loss communicate.",
          taskIds: ["sign-language"],
        },
        {
          id: "remember",
          title: "Remember a message",
          emoji: "🧠",
          summary: "Test your memory for 10 minutes.",
          taskIds: ["remember-message"],
        },
        { id: "codes", title: "Secret codes", emoji: "🚩", summary: "Morse code or semaphore.", taskIds: ["cubs-codes"] },
      ],
    },
  ],
};

// ---------------------------------------------------------------- Scouts

const phoneticTask: TaskDef = {
  id: "phonetic",
  title: "Learn the phonetic alphabet",
  summary: "Alpha, Bravo, Charlie… decode a message and send your own.",
  emoji: "🔤",
  minutes: 20,
  review: "leader",
  leaderCheck: "The Scout read their own message out using the phonetic alphabet and the listener understood it.",
  note: "This task is in both Radio Communication and Communication Codes. Do it once and it counts for both.",
  steps: [
    {
      title: "What is it?",
      body: [
        "The phonetic alphabet spells words out clearly when it's hard to hear, like on a radio or a bad phone line. There's a word for each of the 26 letters and 10 numbers.",
        "Amateur radio users and organisations like the military use it so messages get through clearly.",
      ],
      tools: ["phonetic"],
      links: [L.phonetic],
    },
    {
      title: "Decode the message",
      body: [
        "Work out what this message says:",
        "*Whisky, Echo, Lima, Charlie, Oscar, Mike, Echo – Tango, Oscar – Papa, Golf – Sierra, Charlie, Oscar, Uniform, Tango, Sierra.*",
        "*Whisky, Echo – Alpha, Romeo, Echo – India, November – Bravo, Echo, Romeo, Kilo, Sierra, Hotel, India, Romeo, Echo – Uniform, Kilo.*",
      ],
      tools: ["phonetic"],
      fields: [
        {
          kind: "text",
          id: "decoded",
          label: "The message says…",
          long: true,
          required: true,
          check: {
            kind: "equals",
            answer: "WELCOME TO PG SCOUTS WE ARE IN BERKSHIRE UK",
            success: "Spot on! Welcome to PG Scouts! 🎉",
          },
        },
      ],
    },
    {
      title: "Make your own message",
      body: ["Write your own short message, then turn it into the phonetic alphabet. The converter below can check your work."],
      tools: ["phonetic"],
      fields: [
        { kind: "text", id: "my_message", label: "My message", required: true },
        { kind: "text", id: "my_phonetic", label: "In the phonetic alphabet", long: true, required: true },
      ],
    },
    {
      title: "Read it out",
      body: ["Read your message to another Scout or a leader using the phonetic alphabet. Can they understand it and write it down?"],
      withLeader: true,
      fields: [gotItRight],
    },
  ],
};

const scoutTasks: TaskDef[] = [
  {
    id: "radio-garden",
    title: "Find and listen to some radio",
    summary: "Find 10 UK radio stations on Radio Garden.",
    emoji: "📻",
    minutes: 25,
    review: "self",
    steps: [
      {
        title: "Open Radio Garden",
        body: ["Open a web browser (Chrome, Firefox or Edge) and go to Radio Garden. Every green dot is a live radio station!"],
        links: [L.radioGarden],
      },
      {
        title: "Explore the UK",
        body: [
          "Spin the globe to the UK. Find **10 radio stations** from different parts of the country.",
          "Listen to a little bit of each one. What sort of station is it?",
        ],
        bullets: ["Music? Which type?", "Talk show?", "News?", "Sport?"],
        fields: [
          {
            kind: "table",
            id: "stations",
            label: "My 10 stations",
            columns: [
              { id: "name", label: "Station name" },
              { id: "where", label: "Where in the UK" },
              { id: "type", label: "What sort of station" },
            ],
            rows: 10,
            minRows: 10,
            required: true,
          },
        ],
      },
    ],
  },
  {
    id: "radio-signals",
    title: "Explain how radio signals work",
    summary: "Research radio waves, HF and VHF, then explain it.",
    emoji: "📶",
    minutes: 30,
    review: "leader",
    leaderCheck: "The Scout explained, in simple terms, how radio signals travel and what HF and VHF are used for.",
    steps: [
      {
        title: "Research",
        body: ["Use the internet to find out, in simple terms:"],
        bullets: [
          "How do radio signals travel round the world?",
          "Is there a limit to how far they can go?",
          "What is HF and VHF radio? What are they used for?",
        ],
        links: [L.radioExplained, L.rsgb, L.jotaJoti],
        fields: [
          { kind: "text", id: "travel", label: "How do signals travel round the world?", long: true, required: true },
          { kind: "text", id: "limit", label: "Is there a limit to how far they go?", long: true, required: true },
          { kind: "text", id: "hf_vhf", label: "What are HF and VHF, and what are they used for?", long: true, required: true },
        ],
      },
      {
        title: "Explain it to an adult",
        body: ["Explain it all back to a leader and see if you got it right. You can use paper, a presentation, or however you like."],
        withLeader: true,
        explain: {
          topic: "how radio signals travel round the world, whether there's a limit to how far they go, and what HF and VHF radio are used for",
          points: [
            { idea: "Radio signals are waves (radio waves) that travel through the air and space, very fast (at the speed of light).", ask: "What actually is a radio signal, and how fast does it go?" },
            { idea: "HF signals can bounce off the ionosphere (a layer high up in the sky) and back down to Earth, hopping round the world.", ask: "How can a radio signal get all the way round the curve of the Earth?" },
            { idea: "There is a limit: signals get weaker and lose energy, and how far they go depends on things like power, time of day, the Sun or weather.", ask: "Can a radio signal go on forever? What stops it?" },
            { idea: "HF (high frequency) is used for long-distance radio, such as amateur radio and JOTA, ships, planes or shortwave broadcasts.", ask: "What would you use HF radio for?" },
            { idea: "VHF (very high frequency) travels in straight lines (line of sight), so it's used for local things like FM radio, walkie-talkies or emergency services.", ask: "How is VHF different from HF, and what is it used for?" },
          ],
          need: 4,
        },
        fields: [{ kind: "upload", id: "notes", label: "Upload your notes or slides (optional)", multiple: true, studio: ["slides", "poster"] }],
      },
    ],
  },
  {
    id: "tune-radio",
    title: "Find a radio station",
    summary: "Tune a real radio to a station you know.",
    emoji: "🎛️",
    minutes: 10,
    review: "leader",
    leaderCheck: "The Scout tuned a normal radio to the station they chose.",
    steps: [
      {
        title: "Pick a station",
        body: ["Think of a radio station you've heard of. If you know its frequency, great. If not, look it up (try the station's website)."],
        fields: [
          { kind: "text", id: "station", label: "Station", required: true },
          { kind: "text", id: "frequency", label: "Frequency", placeholder: "e.g. 97.6 FM", required: true },
        ],
      },
      {
        title: "Tune in",
        body: ["Show a leader that you can tune into this station on a normal radio."],
        withLeader: true,
      },
    ],
  },
  phoneticTask,
  {
    id: "code-message",
    title: "Send a message at 5 words a minute",
    summary: "Send a 10-word message in Morse or semaphore.",
    emoji: "🔦",
    minutes: 30,
    review: "leader",
    leaderCheck: "The Scout sent a message of 10+ words in Morse or semaphore at around 5 words per minute, and it was understood.",
    steps: [
      {
        title: "Two old-school codes",
        body: [
          "There are lots of ways of sending messages short distances. Two that are still used on ships are:",
          "**Morse code**: letters as dots and dashes, by light or sound.",
          "**Semaphore**: letters shown by holding two flags in different positions.",
        ],
        tools: ["morse", "semaphore"],
        fields: [
          { kind: "choice", id: "method", label: "I'm going to use…", options: ["Morse code", "Semaphore"], required: true },
        ],
      },
      {
        title: "Write your message",
        body: ["Come up with a message at least **10 words** long."],
        fields: [{ kind: "text", id: "message", label: "My message", long: true, minWords: 10, required: true }],
      },
      {
        title: "Translate it",
        body: ["Translate it into Morse code or semaphore. The translators below can help you check it."],
        tools: ["morse", "semaphore"],
        fields: [
          { kind: "text", id: "translated", label: "My translated message", long: true, mono: true, required: true },
        ],
      },
      {
        title: "Send it",
        body: [
          "Send it to another Scout or leader and get them to translate it. You may need to send it more than once.",
          "5 words per minute means a 10-word message takes about **2 minutes**.",
        ],
        tools: ["timer-2"],
        withLeader: true,
        fields: [
          gotItRight,
          { kind: "text", id: "time", label: "How long did it take?", placeholder: "e.g. 1 min 50 s" },
        ],
      },
    ],
  },
  {
    id: "q-codes",
    title: "Q codes",
    summary: "Find out what Q codes are and explain them.",
    emoji: "📟",
    minutes: 15,
    review: "leader",
    leaderCheck: "The Scout explained what Q codes are and gave some examples.",
    steps: [
      {
        title: "Who's out there?",
        body: [
          "Lots of people might pick up a radio or Morse transmission. How do they know who they're talking to, and how do they keep messages short?",
          "The title is a big hint! Look up **Q codes**.",
        ],
        links: [L.qCodes, L.rsgb],
        fields: [
          { kind: "text", id: "what", label: "What are Q codes and why are they used?", long: true, required: true },
          {
            kind: "table",
            id: "examples",
            label: "Three Q codes",
            columns: [
              { id: "code", label: "Q code", placeholder: "QTH" },
              { id: "meaning", label: "What it means" },
            ],
            rows: 3,
            minRows: 3,
            required: true,
          },
        ],
      },
      {
        title: "Explain it to a leader",
        body: ["Tell a leader what Q codes are and what yours mean."],
        withLeader: true,
        explain: {
          topic: "what Q codes are, why radio operators use them, and what some Q codes mean",
          points: [
            { idea: "Q codes are short codes of three letters that start with Q.", ask: "What does a Q code look like?" },
            { idea: "They keep messages short and quick, and people who speak different languages can all understand them.", ask: "Why do radio operators use Q codes instead of normal words?" },
            { idea: "Gives at least two real Q codes with their correct meanings (for example QTH = my location, QSL = I confirm I got your message, QRM = interference, QRZ = who is calling me?).", ask: "Can you tell me two or three Q codes and what they mean?" },
          ],
        },
      },
    ],
  },
  {
    id: "mobile-safety",
    title: "Mobile safety",
    summary: "Explain how to use a mobile phone safely.",
    emoji: "🛡️",
    minutes: 15,
    review: "leader",
    leaderCheck: "The Scout explained sensible ways to use a mobile phone safely.",
    steps: [
      {
        title: "Think it through",
        body: ["How do you stay safe on a mobile? Think about:"],
        bullets: [
          "Who you give your number to",
          "Passcodes and screen locks",
          "Location sharing and privacy settings",
          "Messages or calls from people you don't know",
          "Thinking before you post or share",
          "What to do if something worries you",
        ],
        links: [L.childnet, L.thinkuknow],
        fields: [{ kind: "text", id: "tips", label: "My top tips for staying safe on a mobile", long: true, required: true }],
      },
      {
        title: "Explain it to a leader",
        withLeader: true,
        body: ["Talk a leader through your tips."],
        explain: {
          topic: "your tips for using a mobile phone safely",
          points: [
            { idea: "Only give your number to people you know and trust.", ask: "Who should you give your phone number to?" },
            { idea: "Use a passcode or screen lock so other people can't get into your phone.", ask: "How can you stop other people getting into your phone?" },
            { idea: "Be careful with location sharing and privacy settings.", ask: "What settings on your phone could show where you are or who can see your stuff?" },
            { idea: "Don't reply to messages or calls from people you don't know, and think before you post or share things.", ask: "What would you do if someone you don't know messages you?" },
            { idea: "Tell a trusted adult if something online or on your phone worries you.", ask: "What should you do if something on your phone worries you?" },
          ],
          need: 3,
        },
      },
    ],
  },
  {
    id: "common-terms",
    title: "Common terms",
    summary: "What do SMS, MMS, 5G and friends mean?",
    emoji: "📖",
    minutes: 10,
    review: "self",
    steps: [
      {
        title: "What do they mean?",
        body: ["Find out what each of these means. Look them up if you need to."],
        fields: [
          { kind: "text", id: "sms", label: "SMS", required: true },
          { kind: "text", id: "mms", label: "MMS", required: true },
          { kind: "text", id: "g", label: "3G / 4G / 5G", required: true },
          { kind: "text", id: "bluetooth", label: "Bluetooth", required: true },
          { kind: "text", id: "imessage", label: "iMessage", required: true },
        ],
      },
    ],
  },
  {
    id: "video-message",
    title: "Video message",
    summary: "Record a sensible video message and send it to a leader.",
    emoji: "🎥",
    minutes: 10,
    review: "leader",
    leaderCheck: "The leader received a sensible video message from the Scout.",
    steps: [
      {
        title: "Record and send",
        body: [
          "Record a short video message and send it to **Akela** (our AI leader) on the pretend phone below. It uses this computer's camera and microphone. Keep it sensible!",
          "Recorded one on a real phone instead? Send it to a leader, or upload it below.",
        ],
        warning: "Don't include personal details like your full name, address or school. Only Akela and your leaders see it.",
        withLeader: true,
        simulate: { kind: "video", points: [], fills: { body: "about" }, video: { field: "video", maxSeconds: 60 } },
        fields: [
          { kind: "text", id: "about", label: "What was your video about?", required: true },
          { kind: "upload", id: "video", label: "Upload the video too (optional)", accept: "video/*,image/*" },
        ],
      },
    ],
  },
  {
    id: "texting",
    title: "Texting",
    summary: "Text a 25-word message quickly and accurately while a leader watches.",
    emoji: "💬",
    minutes: 10,
    review: "leader",
    leaderCheck: "The leader watched the Scout text a 25+ word message quickly and accurately.",
    steps: [
      {
        title: "Plan your message",
        body: ["Think of a message at least **25 words** long. You can write it here first."],
        fields: [{ kind: "text", id: "message", label: "My message", long: true, minWords: 25 }],
        tip: "Not a fast texter yet? Practise a few times first!",
      },
      {
        title: "Text it",
        body: [
          "Show you can text the whole message quickly and accurately. Type it on the pretend phone below: it times you, and Akela (our AI leader) checks it. You need **25 words or more**.",
          "Or a real leader can watch you type it on a phone.",
        ],
        withLeader: true,
        simulate: {
          kind: "sms",
          points: ["Is written clearly and accurately: it makes sense, words are spelled correctly, and it isn't mostly abbreviations"],
          speedTest: { minWords: 25, minWpm: 12 },
        },
      },
    ],
  },
  {
    id: "chat-abbreviations",
    title: "Chat abbreviations",
    summary: "Ten abbreviations like BRB, and what they mean.",
    emoji: "🔠",
    minutes: 10,
    review: "leader",
    leaderCheck: "The Scout told a leader 10 chat abbreviations and what they mean.",
    steps: [
      {
        title: "List ten",
        body: ["Think of 10 common chat abbreviations (like BRB) and what they mean. Look some up if you need to."],
        fields: [
          {
            kind: "table",
            id: "abbr",
            label: "My abbreviations",
            columns: [
              { id: "abbr", label: "Abbreviation", placeholder: "BRB" },
              { id: "meaning", label: "Meaning", placeholder: "Be right back" },
            ],
            rows: 10,
            minRows: 10,
            required: true,
          },
        ],
      },
      { title: "Tell a leader", body: ["Tell a leader your 10 abbreviations and what they mean."], withLeader: true },
    ],
  },
  {
    id: "share-photos",
    title: "Share photos and videos",
    summary: "Share photos of a Scout activity in two different ways.",
    emoji: "🖼️",
    minutes: 15,
    review: "leader",
    leaderCheck: "The Scout discussed ways to share photos and shared some by at least two methods.",
    steps: [
      {
        title: "Get some photos",
        body: ["Find or take some photos and videos of a Scout activity. JOTI is perfect!"],
        warning: "Only share photos of people who are happy for you to. Never share where you live.",
        fields: [{ kind: "upload", id: "photos", label: "Add a few here", accept: "image/*,video/*", multiple: true, required: true }],
      },
      {
        title: "How could you share them?",
        body: ["List some ways you could share them, then discuss them with a leader. Share by at least 2 methods."],
        withLeader: true,
        fields: [
          {
            kind: "list",
            id: "methods",
            label: "Ways to share",
            count: 4,
            min: 2,
            placeholder: "e.g. email, AirDrop, a shared album…",
            required: true,
          },
        ],
      },
    ],
  },
  {
    id: "bsl-makaton",
    title: "Learn about BSL and Makaton",
    summary: "What are they, and how are they different?",
    emoji: "👐",
    minutes: 20,
    review: "self",
    steps: [
      {
        title: "Not everyone can hear",
        body: [
          "In the UK, about 1.2 million people have some form of hearing loss, almost 2% of people.",
          "Two common kinds of sign language in the UK help people who are deaf or hard of hearing: **British Sign Language (BSL)** and **Makaton**.",
        ],
        links: [L.britishSign, L.makaton, L.bslSigns],
        fields: [
          { kind: "text", id: "what", label: "What are BSL and Makaton?", long: true, required: true },
          { kind: "text", id: "differences", label: "What are the differences?", long: true, required: true },
        ],
      },
    ],
  },
  {
    id: "learn-sign",
    title: "Learn to sign",
    summary: "Pick BSL or Makaton and learn some sentences about Scouting.",
    emoji: "🤲",
    minutes: 40,
    review: "self",
    steps: [
      {
        title: "Pick one",
        fields: [{ kind: "choice", id: "which", label: "I'm going to learn…", options: ["BSL", "Makaton"], required: true }],
        links: [L.bslSigns, L.bslAlphabet, L.makaton],
      },
      {
        title: "Write your sentences",
        body: [
          "Come up with a few sentences about Scouting. When you sign them, they should take at least 5 minutes.",
          "Translate them into BSL or Makaton and practise. Make notes if it helps.",
        ],
        fields: [
          { kind: "text", id: "sentences", label: "My sentences about Scouting", long: true, required: true },
          { kind: "text", id: "notes", label: "Notes to help me remember the signs", long: true },
        ],
      },
    ],
  },
  {
    id: "communicate-sign",
    title: "Communicate in sign",
    summary: "Sign your messages to a leader.",
    emoji: "🗣️",
    minutes: 15,
    review: "leader",
    leaderCheck: "The Scout signed their sentences to a leader in BSL or Makaton.",
    steps: [
      {
        title: "Sign to a leader",
        body: ["Once you've learnt your messages, sign them to a leader and explain what they mean."],
        withLeader: true,
        fields: [
          { kind: "choice", id: "understood", label: "Did they understand you?", options: ["Yes", "Mostly", "Not really"], required: true },
          { kind: "text", id: "reflection", label: "How do you think deaf people find communicating?", long: true, required: true },
        ],
      },
    ],
  },
];

export const scoutsCommunicator: BadgeDef = {
  id: "scouts-communicator",
  title: "Communicator",
  family: "communicator",
  sections: ["scouts"],
  recommendedFor: ["scouts"],
  color: "#0a4ea2",
  ring: "#d6173e",
  ink: "#ffffff",
  tagline: "Radio, codes, mobiles and sign language.",
  intro: "Pick three of the four subjects and complete every activity in each one. Radio Communication is perfect for JOTA!",
  sheet: sheet("Scouts Communicator sheet", "scouts-communicator.pdf"),
  officialUrl: "https://www.scouts.org.uk/scouts/activity-badges/communicator/",
  tasks: scoutTasks,
  parts: [
    {
      kind: "choice",
      id: "subjects",
      title: "Choose 3 subjects",
      description: "Pick three of these four subjects and finish every activity in each.",
      pick: 3,
      options: [
        {
          id: "radio",
          title: "Radio Communication",
          emoji: "📻",
          summary: "Radio stations, how signals work, and the phonetic alphabet.",
          taskIds: ["radio-garden", "radio-signals", "tune-radio", "phonetic"],
        },
        {
          id: "codes",
          title: "Communication Codes",
          emoji: "🔦",
          summary: "Morse or semaphore, the phonetic alphabet and Q codes.",
          taskIds: ["code-message", "phonetic", "q-codes"],
        },
        {
          id: "mobile",
          title: "Mobile & Internet",
          emoji: "📱",
          summary: "Phone safety, texting, video messages and sharing photos.",
          taskIds: ["mobile-safety", "common-terms", "video-message", "texting", "chat-abbreviations", "share-photos"],
        },
        {
          id: "translation",
          title: "Translation",
          emoji: "🤟",
          summary: "Learn about BSL and Makaton and sign about Scouting.",
          taskIds: ["bsl-makaton", "learn-sign", "communicate-sign"],
        },
      ],
    },
  ],
};
