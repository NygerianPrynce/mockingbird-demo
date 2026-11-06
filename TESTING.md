# Mockingbird: test path (laptop + phone)

Everything lives in `app/`. Voice lines are already cached in `app/public/voice/`, and the ElevenLabs key is in `app/.env.local`.

## 0. One-time setup
```bash
cd app
npm install
```
Use Chrome on the laptop (mic and speech recognition need Chrome or Edge). The phone: Chrome on Android or Safari on iPhone.

## Presenter keys (the live show)
| Key | What it does |
|---|---|
| **W** (on Profile) | Take over. The AI voice fades out, stops asking, mic goes off, profile saves as is ("Mockingbird picks up the rest by text later") |
| **N** or Right arrow | Next screen (Profile, Storm, Call, Plan, Map) |
| Left arrow | Previous screen |
| **B** (on Storm) | Transformer blows, sound cuts, "Power out." |
| **P** | Show or hide the "Say something like..." cue for the caller |
| **H** | Hide all on-screen controls and the timer for recording |
| **T** | Reset the demo timer (it starts on the first Start press) |

Run of show: partner answers the profile questions, you interject at question 4 (rent or own and insurance), press **W**, then **N** to the Storm screen. Narrate over the snow and sound. Press **B** when you want the power to cut. Ammar dials from the phone while the Storm screen is up: the laptop jumps to the call screen, rings, and the AI answers. Then **N** through Plan and Map, moving fast.

Before the demo: go to **3 Call** and press **Open the phone line** once. It stays open on this browser, so it re-opens by itself when the call screen loads. Close it there if you want laptop-only testing again.

Optional real footage: save a clip as `app/public/storm.mp4`. It plays behind the snow automatically.

## 1. Laptop-only run (5 min). Do this first
```bash
npm run dev
```
Open http://localhost:5173. Press **H** any time to hide the controls, **P** to show the "Say something like..." cue.

1. **1 Profile.** Press "Start the conversation". Allow the mic. Answer out loud (cue lines on P). At the keypad step, tap a date of birth. You should hear phone keypad tones and see only dots. Check: profile fills on the right, Mockingbird ID appears, "Ready to pre-fill" list shows.
2. **2 Storm.** Press Play. Sound on. Wind and ice crackle, a pop, then blackout, then "Next: the call".
3. **3 Call.** Press "Start the call".
   - Answer "No" to the 911 question. (Test once saying "yes" too: it should tell you to call 911 and show a red banner. Press Reset after.)
   - "Do you know your Mockingbird ID?" say no.
   - Keypad: enter the DOB you used in step 1 (default 03141991), then ZIP 37210. Try a wrong DOB once: it should say "That doesn't match. Try again."
   - Answer the rest. Check: "Identity verified", form fills with "From profile" tags, eligibility card, trap box, read-back turns fields green, document warning with 21 days, text reminder.
4. **4 Plan.** "While you were offline" box, Day 88 banner, task list.
5. **5 Map.** Streets show under counties (needs internet). Press "Drop James's call on the map", then "Send area notice (demo)" on the Shelby food signal. Try heat map, filters, county click, Public vs Responder view, the Day slider.

If the mic does not work, use the **Next** button to advance with the suggested line (testing only).

## 2. Phone run (the real demo setup)
Stop the laptop server (Ctrl+C), then:
```bash
npm run dev:phone
```
The terminal prints a Network URL such as `https://192.168.x.x:5173/`.
1. Laptop and phone on the same Wi-Fi. If the venue Wi-Fi blocks devices from seeing each other, turn on a hotspot on a third phone and join both devices to it.
2. On the laptop open the **https** link, click through the certificate warning (Advanced, proceed). Go to **3 Call**, press **Open the phone line**. A QR code and URL appear.
3. On the phone, scan the QR (or type the URL), click through the certificate warning, allow the microphone.
4. Tap the green call button on the phone. The laptop rings, then the AI answers through the laptop speakers.
5. Talk to the phone. Your words appear live on the laptop. When the keypad step comes, a keypad appears on the phone: tap digits, hear tones, the laptop shows dots only.
6. Check the mic mutes while the AI talks (no echo). Use headphones on the phone if the room echoes.

## 3. Final checklist before recording
- [ ] Laptop volume up, laptop not muted, phone ringer irrelevant
- [ ] "Prepare voice" pressed on Profile and Call (only needed if you changed the script)
- [ ] Wi-Fi tested (voice lines cached, but map streets and speech recognition need internet)
- [ ] DOB entered on the Profile step is the one you plan to use on the call
- [ ] Screen recording rehearsed once, plus a backup full recording
- [ ] **H** hides the controls for the take

## Troubleshooting
- No AI voice: the footer "Voice:" label says "browser fallback". Check `app/.env.local` and internet. Cached lines still play offline.
- Phone cannot open the page: same network? Use the Network URL, not localhost. Try the hotspot.
- Phone mic blocked: the page must be https (`npm run dev:phone`). Re-allow in browser site settings.
- Nothing happens when the phone dials: press "Open the phone line" on the laptop first.
- Map has no streets: no internet. County shapes still work.
- Rotate the ElevenLabs key after the event. Never commit `.env.local`.
