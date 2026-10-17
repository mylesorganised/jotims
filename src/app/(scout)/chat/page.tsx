import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ExternalLink, Mail, MessagesSquare, ShieldCheck, Sparkles, Users } from "lucide-react";
import { AgePath, CopyMessage } from "@/components/chat/bits";
import { ChatScreen } from "@/components/chat/chat-screen";
import { PracticeChat } from "@/components/chat/practice-chat";
import { Callout, Card, cn } from "@/components/ui";
import { CHAT_LINKS, CHAT_ROOMS, CHAT_WORDS, SAFETY_RULES, STARTER_MESSAGES } from "@/content/chat";
import { getCurrentScout } from "@/lib/auth";
import { ageOn } from "@/lib/data";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "JOTI chat" };
// Reads who's logged in (to skip the age question), so it's allowed to block.
export const instant = false;

function Out({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn("font-bold text-brand-600 underline decoration-brand-200 underline-offset-2 hover:decoration-brand-500", className)}>
      {children}
    </a>
  );
}

function Step({ n, title, children, tour }: { n: number; title: string; children: ReactNode; tour?: string }) {
  return (
    <Card className="p-5 sm:p-6" data-tour={tour}>
      <div className="flex gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-500 text-lg font-black text-white">{n}</span>
        <div className="min-w-0 flex-1 space-y-3 text-[15px] leading-relaxed">
          <h3 className="pt-1.5 text-lg font-extrabold">{title}</h3>
          {children}
        </div>
      </div>
    </Card>
  );
}

function Field({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line py-2.5 last:border-0 sm:grid-cols-[10rem_1fr] sm:gap-3">
      <dt className="font-bold">{name}</dt>
      <dd className="text-[15px]">{children}</dd>
    </div>
  );
}

function SectionTitle({ id, title, subtitle }: { id: string; title: string; subtitle?: string }) {
  return (
    <div id={id} className="scroll-mt-24">
      <h2 className="text-xl font-extrabold sm:text-2xl">{title}</h2>
      {subtitle && <p className="text-muted">{subtitle}</p>}
    </div>
  );
}

export default async function ChatGuidePage() {
  const [scout, settings] = await Promise.all([getCurrentScout(), getSettings()]);
  const initial = scout ? (ageOn(scout.dob) >= 13 ? "older" : "younger") : null;

  return (
    <div className="space-y-10">
      {/* hero */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-lift sm:p-8">
        <p className="text-sm font-black uppercase tracking-widest text-brand-200">JOTA-JOTI chat</p>
        <h1 className="mt-1 text-3xl font-black sm:text-4xl">Chat with Scouts all over the world 🌍</h1>
        <p className="mt-2 max-w-2xl text-brand-100">
          The official JOTA-JOTI chat has rooms full of Scouts from every country. This guide shows you how to get in, how the chat
          works, and how to stay safe. You can practise here first!
        </p>
        <div className="mt-5 flex flex-wrap gap-2" data-tour="chat-open">
          <a
            href={CHAT_LINKS.chat.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 font-extrabold text-brand-700 shadow-sm hover:bg-brand-50"
          >
            <MessagesSquare className="size-5" /> Open the JOTA-JOTI chat <ExternalLink className="size-4" />
          </a>
          <a href="#practise" className="inline-flex h-12 items-center gap-2 rounded-xl px-5 font-bold text-white ring-1 ring-white/40 hover:bg-white/10">
            <Sparkles className="size-5" /> Practise first
          </a>
        </div>
        <p className="mt-3 text-sm text-brand-200">
          The chat opens in a new tab. Tip: put the chat and this page side by side so you can follow the steps.
        </p>
      </div>

      {/* getting in */}
      <section className="space-y-4">
        <SectionTitle id="get-in" title="Getting in" subtitle="You need a free Scout.org account to use the chat." />
        <AgePath
          initial={initial}
          younger={
            <div className="space-y-4" data-tour="chat-younger">
              <Callout tone="info" title="You can join in with a leader! 🙌">
                To keep everyone safe, you have to be <b>13 or older</b> to make your own JOTA-JOTI chat account. That&apos;s the rule
                for every Scout in the world, not just us.
              </Callout>
              <Card className="space-y-3 p-5 text-[15px] leading-relaxed sm:p-6">
                <p className="text-lg font-extrabold">How you can still chat</p>
                <ul className="space-y-2">
                  <li>👩‍💻 <b>At Scouts:</b> a leader logs in on one of our laptops and sits with you while you chat. Just ask!</li>
                  <li>🏠 <b>At home:</b> a grown-up can make the account and chat with you, side by side, the whole time.</li>
                  <li>🧑‍🤝‍🧑 You decide what to say and type it; the grown-up helps you stay safe.</li>
                </ul>
                <p>
                  While you wait for a leader, have a go at the <a href="#practise" className="font-bold text-brand-600 underline">practice chat</a> and
                  pick some <a href="#starters" className="font-bold text-brand-600 underline">messages to send</a>.
                </p>
              </Card>
              <Callout tone="tip" title="Grown-ups and leaders">
                Register with your own email at the chat&apos;s <b>Login with Scout.org → Register</b> page, then chat together. See{" "}
                <Out href={CHAT_LINKS.beSafe.url}>Be safe during JOTA-JOTI</Out>.
              </Callout>
            </div>
          }
          older={
            <div className="space-y-4">
              <Callout tone="tip" title="Ask your grown-up first">
                Tell your parent or carer you&apos;re making an account, and give them a copy of your password. Scout.org and email
                accounts for under-18s need a grown-up&apos;s OK.
              </Callout>

              <Step n={1} title="Get an email address" tour="chat-email">
                <p>Scout.org needs an email address. Already have one you&apos;re allowed to use? Skip to step 2.</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-canvas p-4 ring-1 ring-line">
                    <p className="flex items-center gap-2 font-extrabold">
                      <Mail className="size-5 text-brand-500" /> Free Proton Mail
                    </p>
                    <p className="text-sm text-muted">No phone number needed. Best if you don&apos;t have an email yet.</p>
                    <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[15px]">
                      <li>
                        Open <Out href={CHAT_LINKS.protonSignup.url}>Proton&apos;s free sign-up page</Out>.
                      </li>
                      <li>
                        <b>Username:</b> make one up, but not your full name or age. Something like <code>sam.pgscouts</code>.
                      </li>
                      <li>
                        <b>Password:</b> three random words joined together, like <code>OtterPizzaRocket</code>. Write it down and give a
                        copy to your grown-up.
                      </li>
                      <li>
                        Press <b>Start using Proton Mail now</b>.
                      </li>
                      <li>
                        If it asks you to prove you&apos;re human, choose <b>CAPTCHA</b> and slide the puzzle piece.
                      </li>
                      <li>
                        It may ask for a display name or recovery email: you can press <b>Skip</b> or <b>Maybe later</b> (or let your grown-up
                        add theirs).
                      </li>
                      <li>
                        Done! Your address is <b>yourusername@proton.me</b>.
                      </li>
                    </ol>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-xl bg-canvas p-4 ring-1 ring-line">
                      <p className="font-extrabold">🟦 Already have Google, Microsoft or Apple?</p>
                      <p className="text-[15px]">
                        If you have a Gmail, Outlook or Apple account you&apos;re allowed to use, you don&apos;t need a new email: on the
                        Scout.org page just press the <b>Google</b>, <b>Microsoft</b> or <b>Sign in with Apple</b> button.
                      </p>
                    </div>
                    <div className="rounded-xl bg-canvas p-4 ring-1 ring-line">
                      <p className="font-extrabold">📧 Want Gmail instead?</p>
                      <p className="text-[15px]">
                        You can <Out href={CHAT_LINKS.googleSignup.url}>make a Google account</Out> if you&apos;re 13 or over, but Google
                        sometimes asks for a phone number. If it does, ask your grown-up, or use Proton instead.
                      </p>
                    </div>
                  </div>
                </div>
              </Step>

              <Step n={2} title="Make your Scout.org account" tour="chat-scoutorg">
                <ol className="list-decimal space-y-1.5 pl-5">
                  <li>
                    Open the <Out href={CHAT_LINKS.chat.url}>JOTA-JOTI chat</Out> and press the purple <b>Login with Scout.org</b> button.
                  </li>
                  <li>
                    On the purple World Scouting page, under the green Login button, press <b>NOT A MEMBER YET? REGISTER</b>.
                  </li>
                  <li>
                    Using Google, Microsoft or Apple? Press that button and follow the steps. Otherwise, fill in the form:
                  </li>
                </ol>
                <dl className="rounded-xl bg-canvas px-4 ring-1 ring-line">
                  <Field name="Username">A fun name that isn&apos;t your full name or age, e.g. <code>SamTheOtter</code>. You&apos;ll use it to log in.</Field>
                  <Field name="Password">A strong one (three random words). Not the same as your email password!</Field>
                  <Field name="Confirm password">Type it again.</Field>
                  <Field name="Email">Your email from step 1.</Field>
                  <Field name="First name">Your first name.</Field>
                  <Field name="Last name">
                    Just the <b>first letter</b> of your last name is fine (e.g. <b>R</b>). Your name shows in the chat, so keep it short.
                  </Field>
                  <Field name="Select country">United Kingdom</Field>
                  <Field name="I'm scout">
                    Tick it. In <b>NSO</b>, start typing <b>The Scout Association</b> and pick it from the list.
                  </Field>
                  <Field name="Language">English. In <b>Spoken languages</b> pick English (and any others you speak).</Field>
                  <Field name="Scouting interests">Pick any you like, or leave it.</Field>
                  <Field name="Date of birth">Your real birthday.</Field>
                  <Field name="I'm not a robot">Tick the box and do the picture puzzle if one appears.</Field>
                  <Field name="Terms">
                    Tick to say you&apos;ve read them. Read the <Out href={CHAT_LINKS.childOnline.url}>Child Online Protection Guidelines</Out> with your
                    grown-up first.
                  </Field>
                </dl>
                <p>
                  Press <b>REGISTER</b>. If it says to check your email, open your inbox, find the email from World Scouting (look in Spam too)
                  and press the link inside.
                </p>
              </Step>

              <Step n={3} title="Log in to the chat" tour="chat-login">
                <ol className="list-decimal space-y-1.5 pl-5">
                  <li>
                    Go to <Out href={CHAT_LINKS.chat.url}>chat.jotajoti.info</Out> and press <b>Login with Scout.org</b>.
                  </li>
                  <li>
                    Type your <b>username or email</b> and <b>password</b>, then press the green <b>LOGIN</b> button (or press Google,
                    Microsoft or Apple if you signed up that way).
                  </li>
                  <li>You&apos;ll land on the chat&apos;s <b>Home</b> page with a list of chat rooms. You&apos;re in! 🎉</li>
                </ol>
              </Step>

              <Step n={4} title="Check what others can see" tour="chat-profile">
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    Tap your letter in the <b>top right</b>, then <b>Profile</b>. Check your <b>Name</b> doesn&apos;t show your full surname.
                  </li>
                  <li>Don&apos;t add a photo of your face. The coloured letter is perfect.</li>
                  <li>Leave the bio and status message empty, or keep them about Scouts (e.g. &quot;PG Scouts, England 🇬🇧&quot;).</li>
                </ul>
              </Step>
            </div>
          }
        />
      </section>

      {/* how it works */}
      <section className="space-y-4">
        <SectionTitle id="how" title="How the chat works" subtitle="This is what the chat looks like. Tap the numbers to find out what everything does." />
        <ChatScreen />
        <div className="grid gap-3 md:grid-cols-3">
          <Card className="p-4">
            <p className="font-extrabold">🚪 Going into a room</p>
            <p className="mt-1 text-[15px]">
              On <b>Home</b>, tap a room&apos;s name. Read the rules banner, then press <b>Join</b> at the bottom to start typing.
            </p>
          </Card>
          <Card className="p-4">
            <p className="font-extrabold">💬 Replying to someone</p>
            <p className="mt-1 text-[15px]">
              Busy rooms move fast! Start your message with <b>@</b> and their name (e.g. <code>@NairobiRovers hi!</code>) so they see
              it&apos;s for them, or hover over their message and press the reply button.
            </p>
          </Card>
          <Card className="p-4">
            <p className="font-extrabold">🚩 Reporting</p>
            <p className="mt-1 text-[15px]">
              Hover over a message, press <b>⋮</b> and choose <b>Report</b>. Then tell a leader. Moderators remove unkind messages and
              block people who break the rules.
            </p>
          </Card>
        </div>
      </section>

      {/* practice */}
      <section className="space-y-4">
        <SectionTitle id="practise" title="Practise here first" subtitle="A pretend chat room. Nothing you type here goes anywhere." />
        <PracticeChat />
      </section>

      {/* rooms */}
      <section className="space-y-4" data-tour="chat-rooms">
        <SectionTitle id="rooms" title="Rooms to try" subtitle="Log in first, then these open straight into the room." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CHAT_ROOMS.map((room) => (
            <a
              key={room.url}
              href={room.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-2xl bg-white p-4 ring-1 ring-line shadow-card transition hover:shadow-lift hover:ring-brand-200"
            >
              <span className="text-3xl">{room.emoji}</span>
              <span className="mt-2 font-extrabold">{room.name}</span>
              <span className="text-sm text-muted">{room.about}</span>
              <span className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-brand-600">
                Open <ExternalLink className="size-3.5" />
              </span>
            </a>
          ))}
        </div>
        <p className="text-[15px] text-muted">
          There are more rooms, in other languages too: see the list on the chat&apos;s Home page, or the{" "}
          <Out href={CHAT_LINKS.directory.url}>Directory</Out>.
        </p>
      </section>

      {/* starters */}
      <section className="space-y-4" data-tour="chat-starters">
        <SectionTitle id="starters" title="Not sure what to say?" subtitle="Tap a message to copy it, then paste it in the chat (Ctrl + V, or ⌘ + V on a Mac)." />
        <div className="grid gap-5 md:grid-cols-2">
          {STARTER_MESSAGES.map((group) => (
            <div key={group.group} className="space-y-2">
              <p className="font-extrabold">{group.group}</p>
              {group.items.map((text) => (
                <CopyMessage key={text} text={text} />
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* JID + words */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-2 p-5 sm:p-6" data-tour="chat-jid">
          <h2 className="text-xl font-extrabold">What&apos;s a JID? 🔁</h2>
          <p className="text-[15px] leading-relaxed">
            A <b>JID</b> (Jamboree ID) is a short code of numbers and letters for a Scout group taking part in JOTA-JOTI, a bit like a
            postcode for Scouts. People swap them to collect how many countries they&apos;ve met.
          </p>
          <p className="text-[15px]">
            Only swap JIDs in the <Out href={CHAT_ROOMS.find((r) => r.name === "JID Exchange")!.url}>JID Exchange</Out> room.
          </p>
          <p className="rounded-xl bg-brand-50 p-3 text-[15px] ring-1 ring-brand-100">
            Our group&apos;s JID:{" "}
            {settings.groupJid ? <b className="font-mono text-lg tracking-wider">{settings.groupJid}</b> : <b>ask a leader</b>}
          </p>
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="mb-2 text-xl font-extrabold">Chat words 💬</h2>
          <dl className="divide-y divide-line">
            {CHAT_WORDS.map(([word, meaning]) => (
              <div key={word} className="flex gap-3 py-1.5 text-[15px]">
                <dt className="w-16 shrink-0 font-mono font-bold">{word}</dt>
                <dd>{meaning}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </section>

      {/* safety */}
      <section className="space-y-4" data-tour="chat-safety">
        <SectionTitle id="safe" title="Stay safe 🛡️" subtitle="The JOTA-JOTI safety pledge, in short." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SAFETY_RULES.map((rule) => (
            <Card key={rule.title} className="p-4">
              <p className="text-2xl">{rule.emoji}</p>
              <p className="mt-1 font-extrabold">{rule.title}</p>
              <p className="text-[15px]">{rule.text}</p>
            </Card>
          ))}
        </div>
        <Callout tone="warning" title="If something worries you">
          Stop chatting and tell a leader or your grown-up straight away. You can also email the JOTA-JOTI Safe From Harm team at{" "}
          <Out href={CHAT_LINKS.safeEmail.url}>{CHAT_LINKS.safeEmail.label}</Out>. More help:{" "}
          <Out href={CHAT_LINKS.beSafe.url}>Be safe during JOTA-JOTI</Out>.
        </Callout>
      </section>

      <Card className="flex items-start gap-3 p-4 text-sm text-muted">
        <Users className="mt-0.5 size-5 shrink-0 text-brand-500" />
        <p>
          <b className="text-ink">For leaders:</b> the chat runs on JOTA-JOTI&apos;s own site. It can&apos;t be shown inside this one (their
          site blocks that, and logins only work there), so it always opens in its own tab.{" "}
          <ShieldCheck className="inline size-4 text-teal-brand" /> Under-13s need an adult to register and stay with them.
        </p>
      </Card>
    </div>
  );
}
