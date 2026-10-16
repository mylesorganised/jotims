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
} satisfies Record<string, LinkRef>;

export const sheet = (label: string, file: string): LinkRef => ({
  label,
  url: `/resources/${file}`,
  note: "Printable PDF",
});
