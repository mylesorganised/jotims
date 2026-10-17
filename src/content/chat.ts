// The JOTA-JOTI chat guide: getting an account, logging in and using the
// Rocket.Chat rooms at chat.jotajoti.info. Checked against the live sites in
// October 2026; if a screen changes, update the words here.

export const CHAT_LINKS = {
  chat: { label: "JOTA-JOTI Chat", url: "https://chat.jotajoti.info/home" },
  directory: { label: "All the rooms (Directory)", url: "https://chat.jotajoti.info/directory/channels" },
  protonSignup: { label: "Make a free Proton Mail address", url: "https://account.proton.me/mail/signup?plan=free" },
  googleSignup: { label: "Make a Google account", url: "https://accounts.google.com/signup" },
  familyLink: { label: "Google Family Link (for grown-ups)", url: "https://families.google/familylink/" },
  beSafe: { label: "Be safe during JOTA-JOTI", url: "https://www.jotajoti.info/be-safe" },
  childOnline: { label: "Child Online Protection Guidelines", url: "https://www.scout.org/node/5028" },
  safeEmail: { label: "safejotajoti@scout.org", url: "mailto:safejotajoti@scout.org" },
};

/** Rooms whose web addresses we've checked. Everything else is on the chat's Home page. */
export const CHAT_ROOMS = [
  {
    name: "Global Meet and Greet (English)",
    emoji: "🌍",
    about: "The big room. Say hello and meet Scouts from everywhere. Busy and fast!",
    url: "https://chat.jotajoti.info/channel/Global_Meet_and_Greet_English_Only",
  },
  {
    name: "Global Meet and Greet 2 (English)",
    emoji: "🌏",
    about: "A second English room, often a bit calmer. Good if the first one is too fast.",
    url: "https://chat.jotajoti.info/channel/Global_Meet_and_Greet_English_2",
  },
  {
    name: "JID Exchange",
    emoji: "🔁",
    about: "The only room for swapping JID codes (see below).",
    url: "https://chat.jotajoti.info/channel/JID_Exchange__Only",
  },
  {
    name: "Campfire Tales and Jokes",
    emoji: "🏕️",
    about: "Share your best (clean!) jokes and campfire stories.",
    url: "https://chat.jotajoti.info/channel/Campfire_Tales_And_Jokes",
  },
  {
    name: "Camp Recipes",
    emoji: "🍳",
    about: "What do Scouts cook at camp around the world? Swap recipes.",
    url: "https://chat.jotajoti.info/channel/Camp_Recipes",
  },
];

export const STARTER_MESSAGES = [
  { group: "Say hello", items: ["Hi everyone! 👋 Hello from PG Scouts in Berkshire, England 🇬🇧", "Hello from the UK! Where is everyone chatting from today? 🌍"] },
  {
    group: "Ask a question",
    items: [
      "What's your favourite thing to cook at camp? 🏕️",
      "What badges are you working on this weekend?",
      "What's the weather like where you are? It's ☔ here, of course!",
      "How do you say hello in your language?",
      "What's the best Scout game you play at your meetings?",
    ],
  },
  {
    group: "Tell them about us",
    items: [
      "We're a Scout group near Reading in England. We're doing JOTA-JOTI badges today!",
      "At our group we have Beavers (6-8), Cubs (8-10) and Scouts (10-14).",
      "Our favourite camp food is s'mores and beans on toast 😄",
    ],
  },
  { group: "Say goodbye", items: ["I've got to go now. It was great chatting! 👋", "Thanks for chatting! Have a great JOTA-JOTI! 73 📻"] },
];

export const CHAT_WORDS = [
  ["JID", "Jamboree ID: a code for your Scout group (see below)"],
  ["73", "Radio talk for \"best wishes\". Lots of Scouts sign off with it"],
  ["BRB", "Be right back"],
  ["GTG", "Got to go"],
  ["LOL", "Laughing out loud"],
  ["TY / NP", "Thank you / No problem"],
  ["IDK", "I don't know"],
  ["@name", "Mentions someone so they get a notification"],
  ["#room", "The name of a room (a \"channel\")"],
] as const;

export const SAFETY_RULES = [
  { emoji: "🙈", title: "Keep yourself private", text: "Never share your full name, address, school, phone number, social media, or photos of yourself. Your first name and \"PG Scouts, England\" is plenty." },
  { emoji: "🔐", title: "Keep your password secret", text: "Don't tell anyone your password, not even a friend. Only your grown-up should know it." },
  { emoji: "🚪", title: "Stay in the public rooms", text: "If someone you don't know sends you a private message or asks you to move to another app, don't reply. Show a leader straight away." },
  { emoji: "🔗", title: "Don't click links from strangers", text: "Links in the chat can lead to scams or horrible things. The rooms don't allow links anyway." },
  { emoji: "😊", title: "Be kind, like a Scout", text: "Follow the Scout Law. Stick to the room's rules (they're in the coloured banner at the top), e.g. English only in the English rooms." },
  { emoji: "🙋", title: "If in doubt, shout out", text: "If anything makes you feel uncomfortable, stop and tell a leader or your grown-up. You won't be in trouble." },
];

export type HotspotId =
  | "home"
  | "directory"
  | "search"
  | "avatar"
  | "sidebar"
  | "room"
  | "banner"
  | "tools"
  | "message"
  | "composer"
  | "join"
  | "emoji";

/** What each part of the chat screen does (used by the clickable picture). */
export const CHAT_SCREEN: Record<HotspotId, { n: number; title: string; text: string }> = {
  home: { n: 1, title: "Home", text: "The house button takes you to the welcome page, which lists the main chat rooms. Tap a room's name to go in." },
  directory: { n: 2, title: "Directory", text: "Shows every room. Make sure \"Channels\" is selected, then tap a room to open it. You can search for a room too." },
  search: { n: 3, title: "Search rooms", text: "Type part of a room's name to jump to it (shortcut: Ctrl + K, or ⌘ + K on a Mac)." },
  avatar: { n: 4, title: "You", text: "Your letter in a circle. Tap it for your Profile, your status (online, away, busy), Preferences (like language) and Logout." },
  sidebar: { n: 5, title: "Your rooms", text: "Rooms you've joined appear under Channels. Direct messages are private chats: only talk privately to people you know, like your own leaders." },
  room: { n: 6, title: "Room name", text: "The room you're in. A # means it's a public room that anyone can read." },
  banner: { n: 7, title: "Room rules", text: "The coloured banner is the room's rules, e.g. \"English only, no personal contacts, no links\". Read it before you chat!" },
  tools: { n: 8, title: "Room buttons", text: "Room info (i), search messages (magnifier), your mentions (@), who's here (people) and shared files. You won't need these much." },
  message: { n: 9, title: "Messages", text: "Each message shows who sent it and when. Hover over (or long-press) a message to add an emoji reaction or reply to it in a thread. The ⋮ menu has Report if something's wrong." },
  join: { n: 10, title: "Join", text: "Before you can type in a room, press the blue Join button at the bottom. You only need to do it once per room." },
  composer: { n: 11, title: "Message box", text: "Type here and press Enter to send. Shift + Enter makes a new line. Keep it short and friendly; it's a busy room!" },
  emoji: { n: 12, title: "Emoji", text: "The smiley face opens the emoji picker. You can also type a colon and a word, like :wave: 👋." },
};
