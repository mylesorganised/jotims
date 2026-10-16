import { L, sheet } from "./links";
import type { BadgeDef, StepImage, TaskDef } from "./types";

const common = {
  family: "digital-maker" as const,
  title: "Digital Maker",
  sections: ["beavers", "cubs", "scouts"] as BadgeDef["sections"],
  color: "#1062b0",
  ring: "#4b2c94",
  ink: "#ffffff",
  officialUrl: "https://www.scouts.org.uk/staged-badges/digital-maker/",
};

const dance = (name: string, alt: string, caption?: string): StepImage => ({
  src: `/guides/dance/${name}.webp`,
  alt,
  caption,
});
const microbit = (name: string, alt: string, caption?: string): StepImage => ({
  src: `/guides/microbit/${name}.webp`,
  alt,
  caption,
});

const screenshotTip =
  "Take a screenshot: Windows: Windows + Shift + S. Mac: Cmd + Shift + 4. Chromebook: Ctrl + Shift + Show windows. iPad: top button + volume up.";

// ---------------------------------------------------------------- Stage 1

const stage1: TaskDef[] = [
  {
    id: "computers-everyday",
    title: "Computers in everyday life",
    summary: "What is a computer, and where do you use technology?",
    emoji: "💻",
    minutes: 15,
    review: "self",
    steps: [
      {
        title: "What is a computer?",
        body: [
          "A computer is a machine that takes in information (**input**), follows instructions (a **program**) and gives something back (**output**).",
          "Laptops are computers, but so are phones, tablets, games consoles and smart speakers. There are even computers inside washing machines, cars and traffic lights!",
        ],
        fields: [{ kind: "text", id: "what", label: "In your own words, what is a computer?", long: true, required: true }],
      },
      {
        title: "Your day with technology",
        body: ["Where do you use computers and technology every day? Make a list of everything you've done today using technology."],
        fields: [
          {
            kind: "list",
            id: "today",
            label: "Things I've done today with technology",
            count: 8,
            min: 4,
            placeholder: "e.g. my alarm woke me up",
            required: true,
          },
        ],
      },
      {
        title: "Does it make life easier?",
        fields: [
          {
            kind: "choice",
            id: "easier",
            label: "Does technology make things easier?",
            options: ["Yes, a lot easier", "A bit", "Not really"],
            required: true,
          },
          { kind: "text", id: "why", label: "Why do you think that?", long: true },
        ],
      },
      {
        title: "No-tech challenge",
        body: ["Pick a few things you did today. How could you do them **without** technology?"],
        fields: [
          {
            kind: "table",
            id: "without",
            label: "Without technology",
            columns: [
              { id: "thing", label: "What I did", placeholder: "Checked the weather" },
              { id: "how", label: "How I could do it without tech", placeholder: "Look out of the window!" },
            ],
            rows: 3,
            minRows: 2,
            required: true,
          },
        ],
      },
    ],
  },
  {
    id: "scratch-picture",
    title: "Create a picture for a game, app or website",
    summary: "Design your own graphics in Scratch.",
    emoji: "🎨",
    minutes: 30,
    review: "self",
    steps: [
      {
        title: "Open Scratch",
        body: ["You're going to make graphics for a computer game, app or website using Scratch.", "Open Scratch in the web browser and click **Create**."],
        links: [L.scratch],
      },
      {
        title: "Choose a sprite",
        todo: [
          "In the bottom right, find the **cat icon**.",
          "Hover your mouse over it (don't click yet). Some more buttons pop up.",
          "Click the **magnifying glass** to choose a sprite to edit.",
          "The one you choose appears in the list of sprites on the right.",
        ],
        images: [
          { src: "/guides/scratch/sprite-menu.webp", alt: "Hovering over the cat icon shows the magnifying glass", caption: "Hover over the cat, then click the magnifying glass." },
          { src: "/guides/scratch/sprite-list.webp", alt: "The sprite list in Scratch", caption: "Your sprite appears in the sprite list." },
        ],
      },
      {
        title: "Make it your own",
        todo: [
          "Find the cat icon again and hover over it.",
          "Click the **paintbrush**.",
          "Click the sprite you chose in the list on the right.",
          "Now change it! Add things, colour it in, make it yours.",
        ],
        images: [dance("paint-tools", "Scratch paint tools", "The paint tools: select, brush, fill, line, circle, rectangle and colour.")],
        tip: "Made a mistake? Click the curved undo arrow at the top.",
      },
      {
        title: "Save your picture",
        body: ["Take a screenshot of your finished picture and upload it here."],
        tip: screenshotTip,
        fields: [
          { kind: "text", id: "for", label: "What is your picture for: a game, an app or a website?", required: true },
          { kind: "upload", id: "screenshot", label: "Upload your screenshot", accept: "image/*", required: true },
        ],
      },
    ],
  },
];

export const digitalMaker1: BadgeDef = {
  ...common,
  id: "digital-maker-1",
  stage: 1,
  recommendedFor: ["beavers", "cubs"],
  tagline: "Computers all around us, and your first Scratch art.",
  intro: "Complete both tasks to achieve Stage 1.",
  tasks: stage1,
  parts: stage1.map((t) => ({ kind: "task" as const, taskId: t.id })),
};

// ---------------------------------------------------------------- Stage 2

const stage2: TaskDef[] = [
  {
    id: "dance-party",
    title: "JOTI Dance Party",
    summary: "Make an animated, interactive dancing character in Scratch.",
    emoji: "💃",
    minutes: 60,
    review: "leader",
    leaderCheck: "Show the leader the animation playing and at least one interaction working (click, key press or stage click).",
    steps: [
      {
        title: "What you'll make",
        body: [
          "A character that dances on a backdrop **you** draw. Click it and it changes colour and says hello in another language. Press the arrow keys and it moves. Click the stage and the scene changes.",
          "Parts A to C already meet the badge. Part D is extra challenge. It takes about 45–60 minutes.",
        ],
        links: [L.scratch, sheet("JOTI Dance Party picture guide", "joti-dance-party.pdf")],
        images: [dance("editor-map", "Map of the Scratch editor", "1 Tabs · 2 Block categories · 3 Code area · 4 Green flag & stop · 5 Stage · 6 Sprites · 7 Backdrops · 8 Extensions · 9 Sprite button · 10 Backdrop button")],
      },
      {
        title: "A1. Delete the cat",
        todo: ["Open Scratch. A new project opens with an orange cat in the sprite panel (bottom right).", "Right-click the cat, then click **delete**."],
        images: [dance("delete-cat", "Right-click the cat sprite and choose delete")],
      },
      {
        title: "A2. Add a dancing character",
        todo: [
          "Find the round purple button with a cat and a plus at the bottom right of the sprite panel.",
          "Click it (the tooltip says **Choose a Sprite**).",
          "In the sprite library, click the **Dance** filter at the top.",
          "Click **Anina Dance** (or Ballerina, Cassy Dance or Champ99). It appears on the stage.",
        ],
        images: [
          dance("choose-sprite", "The Choose a Sprite button"),
          dance("dance-filter", "The Dance filter in the sprite library"),
        ],
      },
      {
        title: "A3. Look at the costumes",
        body: ["Each **costume** is one frame of the dance, like a flip book."],
        todo: ["Click the **Costumes** tab at the top left.", "Count the costumes in the list down the left.", "Click the **Code** tab to go back."],
        images: [dance("costumes-tab", "The Costumes tab and list of costumes")],
        fields: [{ kind: "text", id: "costumes", label: "How many costumes (frames) does your character have?", required: true }],
      },
      {
        title: "B1. Draw a backdrop",
        body: ["This is what makes it **your** art, not just a library character. Don't skip it!"],
        todo: [
          "At the far right, at the bottom of the Stage panel, hover over the round purple button with a picture and a plus.",
          "Click the **paintbrush** that pops up. The paint editor opens.",
        ],
        images: [dance("choose-backdrop", "The backdrop button with the paintbrush")],
      },
      {
        title: "B2. Use the paint editor",
        todo: [
          "Click the **Fill** colour box and pick a colour.",
          "Click the **Rectangle** tool and drag across the whole drawing area to colour the background.",
          "Add shapes with Circle, Rectangle and Line, and draw with Brush. Change the colour first each time.",
        ],
        bullets: ["A campsite at night", "A stage with lights", "A world map", "Flags of countries you chatted to on JOTI"],
        images: [dance("paint-tools", "Paint editor tools"), dance("vector-mode", "Convert to Bitmap button", "If the button says Convert to Bitmap, you're in vector mode. Leave it.")],
        tip: "Made a mistake? Use the curved undo arrow, or select a shape and press Delete.",
      },
      {
        title: "B3. Edit the costumes (optional)",
        todo: [
          "Select your character, then click the **Costumes** tab.",
          "Right-click a costume and click **duplicate**.",
          "Click the copy and add something of your own, like a Scout hat or necker.",
          "To add a brand new frame, hover over the purple button at the bottom left and click the paintbrush.",
        ],
        images: [dance("duplicate-costume", "Duplicate a costume"), dance("new-costume", "Paint a new costume")],
        tip: "Anina Dance's costumes are photos, so the Fill tool won't recolour her clothes. For easy recolouring, pick a cartoon character like Ballerina.",
      },
      {
        title: "C. Make it dance",
        body: ["Blocks live in the palette. The coloured circles pick the type: **Events** is yellow, **Control** is orange, **Looks** is purple. Drag a block into the code area and drop it under another so it clicks into place."],
        todo: [
          "Events: drag **when green flag clicked** into the code area.",
          "Control: drag **forever** under it.",
          "Looks: drag **next costume** inside the forever block.",
          "Control: drag **wait 1 seconds** under next costume.",
          "Click the 1, type **0.2** and press Enter.",
        ],
        images: [dance("block-categories", "Block categories"), dance("dance-script", "The finished dance script")],
      },
      {
        title: "C3. Run it and experiment",
        todo: [
          "Click the **green flag**. Your character should dance!",
          "Click the red stop button to stop.",
          "Try 0.05 (faster) or 0.5 (slower).",
          "To make it travel, add **move 10 steps** and **if on edge, bounce** (Motion, blue) inside the forever loop.",
        ],
        images: [dance("green-flag", "Green flag and stop buttons"), dance("direction-box", "The direction box", "Upside down when it bounces? Click Direction and pick the middle button.")],
      },
      {
        title: "D. Make it interactive (extra challenge)",
        todo: [
          "**Click the character:** Events: when this sprite clicked → Looks: change color effect by 25 → Looks: say Hello! for 2 seconds. Change Hello! to a greeting from a country you chatted to on JOTI.",
          "**Arrow keys:** Events: when space key pressed. Change space to right arrow → Motion: change x by 20. Duplicate it for left (-20), up (change y by 20) and down (change y by -20).",
          "**Click the stage:** Paint a second backdrop. Select the Stage, then Events: when stage clicked → Looks: next backdrop.",
          "**Sound (optional):** Sound: start sound, under the click script.",
        ],
        images: [
          dance("sprite-clicked", "When this sprite clicked script"),
          dance("key-dropdown", "Choosing the right arrow key"),
          dance("arrow-key", "Change x by 20 script"),
          dance("stage-clicked", "When stage clicked, next backdrop"),
        ],
        fields: [{ kind: "text", id: "greeting", label: "What greeting did you use, and which language is it?" }],
      },
      {
        title: "Save it and show a leader",
        todo: [
          "Click **File → Save to your computer**. Name it YourName_JOTI_Dance.",
          "Take a screenshot of your finished stage.",
          "Show a leader the animation playing and at least one interaction working.",
        ],
        images: [dance("save-file", "File, Save to your computer")],
        tip: screenshotTip,
        withLeader: true,
        stuck: [
          { problem: "Character spins or flips upside down", fix: "Click the Direction box and choose the middle (left/right) button." },
          { problem: "Dance is too fast to see", fix: "Make the number in the wait block bigger." },
          { problem: "Nothing happens when I press a key", fix: "Click the stage once so Scratch notices the keyboard, then press the key." },
          { problem: "Colour effect never resets", fix: "Add clear graphic effects (Looks) under the green flag block." },
          { problem: "Blocks won't click together", fix: "Drop the block closer to the bottom of the block above." },
          { problem: "Can't find the paint editor", fix: "Hover over the purple button (sprite, backdrop or costume) and click the paintbrush." },
          { problem: "The 'when stage clicked' block is missing", fix: "Click the Stage on the far right of the sprite panel first." },
        ],
        fields: [
          { kind: "upload", id: "screenshot", label: "Upload a screenshot of your stage", accept: "image/*", required: true },
          { kind: "upload", id: "project", label: "Upload your .sb3 project file (optional)", accept: ".sb3" },
          {
            kind: "checklist",
            id: "working",
            label: "Tick what works",
            items: [
              "My character dances when I click the green flag",
              "I drew my own backdrop",
              "At least one interaction works (click, key press or stage click)",
            ],
            required: true,
          },
        ],
      },
    ],
  },
  {
    id: "leaf-identifier",
    title: "Leaf identifier program",
    summary: "Finish a Scratch program that identifies leaves, then test it.",
    emoji: "🍃",
    minutes: 45,
    review: "self",
    steps: [
      {
        title: "How a leaf guide works",
        body: [
          "A leaf identification guide asks **yes or no** questions to work out which tree a leaf is from. Try it below with a real leaf, or a picture.",
          "Your Scratch program will do the same job: when you answer a question, it hides all the leaves that don't match.",
        ],
        tools: ["leaf-guide"],
        links: [sheet("Leaf identifier worksheet", "leaf-identifier.pdf")],
      },
      {
        title: "Open the project",
        todo: ["Open the starter project.", "Click the **green flag** and answer the question. What happens?"],
        links: [L.leafStarter, L.leafStarterAlt],
        images: [{ src: "/guides/leaf/project.webp", alt: "The leaf identifier project in Scratch" }],
        fields: [{ kind: "text", id: "what_happens", label: "What happened when you answered?", long: true, required: true }],
      },
      {
        title: "Read the first script",
        body: [
          "Find the **when green flag clicked** script. It asks \"Is it a single leaf on its own?\"",
          "If you answer **yes**, all the compound leaves hide. If you answer **no**, all the simple leaves hide.",
        ],
        tip: "The only scripts you need to change are on the Scratch Cat sprite.",
        images: [{ src: "/guides/leaf/first-script.webp", alt: "The first script: is it a single leaf on its own?" }],
      },
      {
        title: "Build the lobes script",
        body: [
          "Find the loose blocks for the lobes question. Arrange them so the program hides the leaves **without** lobes, or the leaves **with** lobes.",
          "Lobes are the bumps around the edge of a leaf. Test it with the green flag.",
        ],
        images: [{ src: "/guides/leaf/lobes-script.webp", alt: "The lobes script" }],
      },
      {
        title: "Finish the rest",
        body: [
          "Make the remaining scripts the same way: \"Do the lobes spread from one point?\", \"Is it long and thin?\", \"Do the leaves spread from a point?\" and \"Are there just a few leaves?\". You'll need to choose the right broadcasts.",
          "Try it yourself first. Stuck? Peek at the finished code.",
        ],
        spoiler: [{ src: "/guides/leaf/finished-code.webp", alt: "All the finished scripts" }],
        links: [L.leafComplete],
      },
      {
        title: "Try it out",
        body: [
          "Work with a partner. One of you secretly picks a leaf and answers the questions; the other types the answers. Does the right leaf show? Then swap.",
        ],
        tip: screenshotTip,
        fields: [
          {
            kind: "table",
            id: "tests",
            label: "Our tests",
            columns: [
              { id: "leaf", label: "Leaf we picked" },
              { id: "result", label: "What the program said" },
              { id: "right", label: "Right?" },
            ],
            rows: 3,
            minRows: 2,
            required: true,
          },
          { kind: "upload", id: "screenshot", label: "Screenshot of your finished code", accept: "image/*", required: true },
          {
            kind: "text",
            id: "ideas",
            label: "What other kind of identifier could you make? (birds, bugs, rocks…) What problems might you hit?",
            long: true,
          },
        ],
      },
    ],
  },
  {
    id: "clear-instructions",
    title: "Clear instructions",
    summary: "Complete 2 Hour of Code games and show a leader.",
    emoji: "🧩",
    minutes: 40,
    review: "leader",
    leaderCheck: "The young person showed a leader that they finished 2 Hour of Code games.",
    steps: [
      {
        title: "Pick your games",
        body: ["Go to the Hour of Code activities and choose **2 games** to complete.", "As you play, think about how important clear instructions are to get the computer to do what you want."],
        links: [L.hourOfCode],
      },
      {
        title: "Game 1",
        tip: screenshotTip,
        fields: [
          { kind: "text", id: "game1", label: "Which game did you play?", required: true },
          { kind: "upload", id: "game1_proof", label: "Screenshot of your finished game or certificate", accept: "image/*" },
        ],
      },
      {
        title: "Game 2",
        fields: [
          { kind: "text", id: "game2", label: "Which game did you play?", required: true },
          { kind: "upload", id: "game2_proof", label: "Screenshot of your finished game or certificate", accept: "image/*" },
        ],
      },
      {
        title: "Think about it",
        withLeader: true,
        body: ["Show a leader that you've done each game."],
        fields: [
          {
            kind: "text",
            id: "instructions",
            label: "Why are clear instructions so important when you program a computer?",
            long: true,
            required: true,
          },
        ],
      },
    ],
  },
];

export const digitalMaker2: BadgeDef = {
  ...common,
  id: "digital-maker-2",
  stage: 2,
  recommendedFor: ["cubs", "scouts"],
  tagline: "Animated art, a leaf identifier and Hour of Code.",
  intro: "Complete every task to achieve Stage 2.",
  sheet: sheet("JOTI Dance Party picture guide", "joti-dance-party.pdf"),
  tasks: stage2,
  parts: stage2.map((t) => ({ kind: "task" as const, taskId: t.id })),
};

// ---------------------------------------------------------------- Stage 3

const stage3: TaskDef[] = [
  {
    id: "microbit-games",
    title: "micro:bit games",
    summary: "Build the Coin Flipper and Tug-of-LED games in MakeCode.",
    emoji: "🪙",
    minutes: 40,
    review: "self",
    steps: [
      {
        title: "Open MakeCode",
        body: ["Go to MakeCode for micro:bit. It has a **virtual micro:bit** on screen, so you don't need a real one."],
        links: [L.makecode],
        images: [microbit("editor-map", "The MakeCode editor", "1 Virtual micro:bit · 2 SHAKE button · 3 Toolbox · 4 Workspace · 5 Download")],
      },
      {
        title: "Coin Flipper",
        body: ["Follow the Coin Flipper tutorial. It flips a virtual coin: heads or tails?"],
        links: [L.coinFlipper],
        tip: screenshotTip,
        fields: [
          { kind: "upload", id: "coin", label: "Screenshot of your Coin Flipper code", accept: "image/*", required: true },
          {
            kind: "text",
            id: "coin_use",
            label: "How could a coin flipper help at Scouts?",
            placeholder: "e.g. deciding which patrol goes first",
            required: true,
          },
        ],
      },
      {
        title: "Tug-of-LED",
        body: ["Follow the Tug-of-LED tutorial. Two players race to pull the light to their side!"],
        links: [L.tugOfLed],
        fields: [{ kind: "upload", id: "tug", label: "Screenshot of your Tug-of-LED code", accept: "image/*", required: true }],
      },
      {
        title: "Try them out",
        fields: [{ kind: "text", id: "tested", label: "Test them with a friend. What worked? What went wrong?", long: true, required: true }],
      },
    ],
  },
  {
    id: "learn-ai",
    title: "Learn about AI",
    summary: "Complete 2 Hour of AI games and show a leader.",
    emoji: "🤖",
    minutes: 40,
    review: "leader",
    leaderCheck: "The Scout showed a leader that they finished 2 Hour of AI games and can explain how AI learns.",
    steps: [
      {
        title: "Pick your games",
        body: [
          "Go to the Hour of AI activities and complete **2 games**.",
          "As you play, think about how important clear instructions are, how AI learns, and what it can get wrong.",
        ],
        links: [L.hourOfAi],
      },
      {
        title: "Your two games",
        fields: [
          { kind: "text", id: "game1", label: "Game 1", required: true },
          { kind: "upload", id: "game1_proof", label: "Screenshot (optional)", accept: "image/*" },
          { kind: "text", id: "game2", label: "Game 2", required: true },
          { kind: "upload", id: "game2_proof", label: "Screenshot (optional)", accept: "image/*" },
        ],
      },
      {
        title: "What did you learn?",
        withLeader: true,
        body: ["Show a leader that you've done each one."],
        fields: [
          { kind: "text", id: "learns", label: "How does AI learn?", long: true, required: true },
          { kind: "text", id: "wrong", label: "What can AI get wrong?", long: true, required: true },
        ],
      },
    ],
  },
  {
    id: "step-tracker",
    title: "micro:bit step tracker",
    summary: "Build a gadget that counts your steps and celebrates your goal.",
    emoji: "👟",
    minutes: 75,
    review: "leader",
    leaderCheck:
      "Program counts shakes and shows the number · icon appears at 10 steps · planned how it would be worn · can explain a problem and how they fixed it.",
    steps: [
      {
        title: "The plan",
        body: [
          "A step tracker has a sensor that notices when you move. The micro:bit has one built in called an **accelerometer**.",
          "Each time it feels a shake, your program adds 1 to a number called **steps** and shows it on the 25 red lights. When you hit your goal, it flashes a picture you've designed.",
          "You need a laptop with internet. No account, no download, no real micro:bit. About 60–75 minutes.",
        ],
        links: [sheet("Step tracker worksheet", "microbit-step-tracker.pdf")],
      },
      {
        title: "Part 0. Open the editor",
        todo: [
          "Go to makecode.microbit.org.",
          "Click **New Project**, type the name **Step Tracker**, and click Create.",
          "Find each of the five parts in the picture on your own screen.",
        ],
        links: [L.makecode],
        images: [microbit("editor-map", "The MakeCode editor", "1 Virtual micro:bit · 2 SHAKE button · 3 Toolbox · 4 Workspace · 5 Download")],
      },
      {
        title: "Part 1. Say hello",
        todo: [
          "Click the blue **Basic** drawer. Drag **show string** into the **on start** block.",
          "Click Hello! and type your own message, like your name.",
          "Watch the virtual micro:bit scroll your message.",
          "Click the restart button under the simulator to watch it again.",
        ],
        images: [microbit("hello", "on start, show string Hello world")],
        fields: [
          {
            kind: "text",
            id: "q_start",
            label: "The on start block runs once when the micro:bit switches on. Why might a step tracker need something to happen on start?",
            long: true,
            required: true,
          },
        ],
      },
      {
        title: "Part 2A. Make a variable",
        body: ["A **variable** is a labelled box that remembers a number. Ours is called steps."],
        todo: [
          "Click the red **Variables** drawer.",
          "Click **Make a Variable…**, type steps, and click OK.",
          "Drag the show string block from Part 1 back to the toolbox to remove it.",
          "Drag **set steps to 0** into on start.",
        ],
        images: [microbit("set-steps", "on start, set steps to 0")],
      },
      {
        title: "Part 2B. Count each shake",
        todo: [
          "Input drawer: drag **on shake** into an empty part of the workspace.",
          "Variables: drag **change steps by 1** inside on shake.",
          "Basic: drag **show number** underneath.",
          "Variables: drag the round **steps** block onto the 0 in show number.",
          "Click the **SHAKE** button on the virtual micro:bit a few times.",
        ],
        images: [microbit("on-shake", "on shake, change steps by 1, show number steps")],
        stuck: [
          {
            problem: "Nothing happens when I shake",
            fix: "Check change and show number are inside the on shake block (its C shape wraps round them), and that there are no red error marks.",
          },
        ],
        fields: [
          {
            kind: "text",
            id: "test1",
            label: "Test 1: click SHAKE 5 times. What does the display show?",
            required: true,
            check: { kind: "equals", answer: "5", success: "Yes! It counted all 5 shakes." },
          },
          {
            kind: "text",
            id: "test2",
            label: "Test 2: click restart, then shake twice. What number do you see?",
            required: true,
            check: { kind: "equals", answer: "2", success: "Correct, it started again from 0." },
          },
          { kind: "text", id: "why_reset", label: "Why do you think the number went back to the start?", long: true, required: true },
        ],
      },
      {
        title: "Part 3. Design your icon",
        body: [
          "A good tracker rewards you! Your gadget will show a picture when you reach **10 steps**. (A real tracker might use 10,000, but 10 is quicker to test.)",
          "Design a picture that means something to Scouts or your goal: a boot, a star, a tent, a fleur-de-lis, a flame, a smiley. Tap the lights to switch them on.",
        ],
        fields: [{ kind: "led", id: "icon", label: "My icon", required: true }],
      },
      {
        title: "Part 3. Add the if block",
        todo: [
          "Logic drawer: drag **if true then** under show number, still inside on shake.",
          "Logic: drop the **0 = 0** comparison block onto the word true.",
          "Variables: drag the round **steps** block into the left slot.",
          "Click the right slot and type **10**. It now reads: if steps = 10 then…",
          "Basic: drag **show leds** inside the if. Click the squares to match your design.",
          "Click restart, then SHAKE ten times. Your icon should appear on the tenth shake!",
        ],
        images: [microbit("finished", "The finished program with a heart icon")],
        fields: [
          {
            kind: "text",
            id: "q_moment",
            label: "The number 10 shows first, then your icon. Why does the display need a moment before the icon shows? What would happen if you kept shaking to 11?",
            long: true,
            required: true,
          },
        ],
      },
      {
        title: "Part 4. Turn it into a gadget",
        body: ["A program on its own isn't a gadget. A real step tracker needs to be worn or carried. On a real micro:bit you'd add a battery pack and a strap. Plan yours."],
        fields: [
          { kind: "text", id: "where", label: "Where will it be used? Which Scouting activity: a hike, a wide game, a camp?", required: true },
          { kind: "text", id: "worn", label: "How will it be worn or carried? Wrist, pocket, bootlace, rucksack strap?", required: true },
          { kind: "text", id: "materials", label: "What materials would you use? (strap, card, battery pack, velcro, tape, waterproof bag…)", required: true },
          { kind: "upload", id: "drawing", label: "Draw it, label the parts, and upload a photo (optional)", accept: "image/*" },
        ],
      },
      {
        title: "Extension challenges",
        body: ["Finished early? Try these."],
        todo: [
          "**Reset button:** Input: on button A pressed → set steps to 0 → show number 0. Test it on the virtual micro:bit.",
          "**Second milestone:** add a second if for 20 steps with a different icon.",
          "**Show progress:** on button B pressed → show number steps.",
        ],
        images: [microbit("reset-button", "on button A pressed, set steps to 0")],
        fields: [
          {
            kind: "checklist",
            id: "extensions",
            label: "Extensions I did",
            items: ["Reset button", "Second milestone", "Show progress on button B"],
          },
        ],
      },
      {
        title: "Part 5. Problems and fixes",
        body: ["The badge asks you to explain the challenges you met and how you solved them."],
        fields: [
          {
            kind: "table",
            id: "problems",
            label: "Problems and fixes",
            columns: [
              { id: "problem", label: "What went wrong or was tricky?" },
              { id: "tried", label: "What did you try?" },
              { id: "fixed", label: "What fixed it?" },
            ],
            rows: 3,
            minRows: 1,
            required: true,
          },
        ],
      },
      {
        title: "Save it and show a leader",
        todo: [
          "At the bottom of the editor, check the project is called Step Tracker. Add your name.",
          "Click **Download**. A file ending in .hex is saved. That's the program a real micro:bit would run.",
          "Upload the .hex file or a screenshot of your blocks, then show a leader.",
        ],
        withLeader: true,
        fields: [
          { kind: "upload", id: "program", label: "Upload your .hex file or a screenshot", accept: "image/*,.hex", multiple: true, required: true },
        ],
      },
    ],
  },
];

export const digitalMaker3: BadgeDef = {
  ...common,
  id: "digital-maker-3",
  stage: 3,
  recommendedFor: ["scouts"],
  prerequisite: "digital-maker-2",
  tagline: "micro:bit games, AI and a step tracker gadget.",
  intro: "Complete every task to achieve Stage 3. You must have completed Stage 2 first.",
  sheet: sheet("Step tracker worksheet", "microbit-step-tracker.pdf"),
  tasks: stage3,
  parts: stage3.map((t) => ({ kind: "task" as const, taskId: t.id })),
};
