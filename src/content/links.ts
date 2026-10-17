import type { LinkRef } from "./types";

// External resources used across badges. All checked working (Oct 2026).
export const L = {
  radioGarden: { label: "Radio Garden", url: "https://radio.garden/", note: "Spin the globe to hear live radio" },
  radioExplained: {
    label: "How radio works (Explain that Stuff)",
    url: "https://www.explainthatstuff.com/radio.html",
    note: "Simple explanation of radio waves",
  },
  rsgb: {
    label: "RSGB: Get started in amateur radio",
    url: "https://rsgb.org/main/get-started-in-amateur-radio/",
    note: "Radio Society of Great Britain",
  },
  jotaJoti: { label: "JOTA-JOTI official site", url: "https://www.jotajoti.info/" },
  qCodes: { label: "Q codes (Wikipedia)", url: "https://en.wikipedia.org/wiki/Q_code" },
  phonetic: { label: "Phonetic alphabet (Wikipedia)", url: "https://en.wikipedia.org/wiki/NATO_phonetic_alphabet" },
  semaphore: { label: "Flag semaphore (Wikipedia)", url: "https://en.wikipedia.org/wiki/Flag_semaphore" },
  morseWorld: {
    label: "Morse code translator (morsecode.world)",
    url: "https://morsecode.world/international/translator.html",
    note: "Hear and see any message in Morse",
  },
  bslAlphabet: {
    label: "BSL fingerspelling charts",
    url: "https://www.british-sign.co.uk/fingerspelling-alphabet-charts/",
  },
  bslSigns: { label: "SignBSL video dictionary", url: "https://www.signbsl.com/", note: "Search any word to see it signed" },
  britishSign: { label: "British-Sign.co.uk", url: "https://www.british-sign.co.uk/" },
  makaton: { label: "Makaton", url: "https://makaton.org/" },
  rnib: { label: "RNIB (Braille & sight loss)", url: "https://www.rnib.org.uk/" },
  newsround: { label: "BBC Newsround", url: "https://www.bbc.co.uk/newsround", note: "See how real news reports are written" },
  youngReporter: { label: "BBC Young Reporter", url: "https://www.bbc.co.uk/teach/young-reporter" },
  childnet: { label: "Childnet: advice for young people", url: "https://www.childnet.com/young-people/" },
  thinkuknow: { label: "Thinkuknow", url: "https://www.thinkuknow.co.uk/", note: "Online safety advice by age" },
  childline: {
    label: "Childline",
    url: "https://www.childline.org.uk/",
    note: "Free, private help any time: call 0800 1111",
  },
  ceop: {
    label: "CEOP Safety Centre",
    url: "https://www.ceop.police.uk/Safety-Centre/",
    note: "Report if an adult online is making you feel unsafe",
  },
  reportHarmful: { label: "Report Harmful Content", url: "https://reportharmfulcontent.com/" },
  saferInternet: { label: "UK Safer Internet Centre", url: "https://www.saferinternet.org.uk/" },
  ncscPasswords: {
    label: "NCSC: strong passwords (three random words)",
    url: "https://www.ncsc.gov.uk/collection/top-tips-for-staying-secure-online/use-a-strong-and-separate-password-for-email",
  },
  cyberAware: { label: "Cyber Aware", url: "https://www.ncsc.gov.uk/cyberaware/home" },
  fiveRights: {
    label: "5Rights Foundation",
    url: "https://5rightsfoundation.com/",
    note: "A charity that stands up for young people's rights online",
  },
  persuasionActivity: {
    label: "Scouts: Discover the power of digital persuasion",
    url: "https://www.scouts.org.uk/activities/discover-the-power-of-digital-persuasion/",
  },
  scratch: { label: "Scratch", url: "https://scratch.mit.edu/", note: "Click Create to start a new project" },
  leafStarter: {
    label: "Leaf identifier starter project",
    url: "https://scratch.mit.edu/projects/298377073/editor/",
  },
  leafStarterAlt: { label: "Leaf identifier (Raspberry Pi link)", url: "https://rpf.io/scouts-leaf-id-on" },
  leafComplete: { label: "Finished leaf identifier (to peek)", url: "https://rpf.io/scouts-leaf-id-complete" },
  hourOfCode: {
    label: "Hour of Code activities",
    url: "https://hourofai.org/en-US/hour-of-code/activities",
  },
  hourOfAi: { label: "Hour of AI activities", url: "https://hourofai.org/en-US/activities" },
  makecode: { label: "MakeCode for micro:bit", url: "https://makecode.microbit.org/", note: "No account or download needed" },
  coinFlipper: { label: "Coin Flipper tutorial", url: "https://makecode.microbit.org/projects/coin-flipper" },
  tugOfLed: { label: "Tug-of-LED tutorial", url: "https://makecode.microbit.org/projects/tug-of-led" },

  // --- Digital Citizen Stage 4
  scoutsShareDontShare: {
    label: "Scouts: Share, don't share",
    url: "https://www.scouts.org.uk/activities/share-don-t-share/",
    note: "A quick game about what to share online",
  },
  scoutsDigitalDetectives: { label: "Scouts: Digital detectives", url: "https://www.scouts.org.uk/activities/digital-detectives/" },
  scoutsSponsored: { label: "Scouts: Spot the sponsored content", url: "https://www.scouts.org.uk/activities/spot-the-sponsored-content/" },
  scoutsTwoSides: { label: "Scouts: Two sides to every story", url: "https://www.scouts.org.uk/activities/two-sides-to-every-story/" },
  scoutsTeachYou: { label: "Scouts: That'll teach you", url: "https://www.scouts.org.uk/activities/that-ll-teach-you/" },
  yourOnlineChoices: {
    label: "Your Online Choices",
    url: "https://www.youronlinechoices.com/uk/",
    note: "How targeted adverts work, and how to control them",
  },
  icoPublic: { label: "ICO: your data rights", url: "https://ico.org.uk/for-the-public/", note: "The UK's information watchdog" },
  childnetTrustMe: { label: "Childnet: Trust Me", url: "https://www.childnet.com/resources/trust-me/", note: "Spotting misleading content online" },
  fullFact: { label: "Full Fact", url: "https://fullfact.org/", note: "UK fact-checking charity" },
  factCheckExplorer: {
    label: "Google Fact Check Explorer",
    url: "https://toolbox.google.com/factcheck/explorer",
    note: "Search what fact-checkers have said about a claim",
  },
  saferInternetYoung: { label: "Safer Internet: advice for young people", url: "https://www.saferinternet.org.uk/advice-centre/young-people" },
  khanAcademy: { label: "Khan Academy", url: "https://www.khanacademy.org/", note: "Free courses on almost anything" },
  codeOrg: { label: "Code.org", url: "https://code.org/", note: "Free coding courses" },
  bitesize: { label: "BBC Bitesize", url: "https://www.bbc.co.uk/bitesize" },
  rpiProjects: {
    label: "Raspberry Pi projects",
    url: "https://projects.raspberrypi.org/en/projects",
    note: "Hundreds of free, step-by-step coding projects",
  },

  // --- Digital Maker Stages 4 and 5 (all run in a web browser)
  wokwi: {
    label: "Wokwi electronics simulator",
    url: "https://wokwi.com/",
    note: "Wire up LEDs, buttons, buzzers, servos and sensors on screen",
  },
  wokwiArduino: { label: "Wokwi: new Arduino Uno project", url: "https://wokwi.com/projects/new/arduino-uno" },
  wokwiPico: { label: "Wokwi: new Raspberry Pi Pico (MicroPython) project", url: "https://wokwi.com/projects/new/micropython-pi-pico" },
  makecodeRadio: {
    label: "MakeCode: radio blocks",
    url: "https://makecode.microbit.org/reference/radio",
    note: "Make two on-screen micro:bits talk to each other",
  },
  makecodeProjects: { label: "MakeCode project ideas", url: "https://makecode.microbit.org/projects" },
  rpiEditor: {
    label: "Raspberry Pi Code Editor",
    url: "https://editor.raspberrypi.org/",
    note: "Write Python or build a web page in your browser",
  },
  tinkercadCircuits: {
    label: "Tinkercad Circuits",
    url: "https://www.tinkercad.com/circuits",
    note: "Needs an account (under 13s join through a leader's class code)",
  },
  piskel: { label: "Piskel", url: "https://www.piskelapp.com/", note: "Free pixel-art and sprite editor" },
  photopea: { label: "Photopea", url: "https://www.photopea.com/", note: "Free image editor in the browser" },
  coolestProjects: {
    label: "Coolest Projects",
    url: "https://coolestprojects.org/",
    note: "Raspberry Pi's free online showcase. Mention you're a Scout!",
  },
  codeClub: { label: "Code Club", url: "https://codeclub.org/" },
  coderDojo: { label: "CoderDojo", url: "https://coderdojo.com/" },
  raspberryJam: { label: "Raspberry Jam events", url: "https://www.raspberrypi.org/jam/" },
  scoutsMakeIt: {
    label: "Scouts: Make it 'til you've made it",
    url: "https://www.scouts.org.uk/activities/make-it-til-you-ve-made-it/",
  },
  scoutsGetReal: { label: "Scouts: Let's get real", url: "https://www.scouts.org.uk/activities/let-s-get-real/" },
  sdgs: { label: "UN Sustainable Development Goals", url: "https://sdgs.un.org/goals", note: "Ideas for problems worth solving" },
  instructables: { label: "Instructables", url: "https://www.instructables.com/", note: "Check the age rules first; a leader may need to post for you" },
} satisfies Record<string, LinkRef>;

export const sheet = (label: string, file: string): LinkRef => ({
  label,
  url: `/resources/${file}`,
  note: "Printable PDF",
});
