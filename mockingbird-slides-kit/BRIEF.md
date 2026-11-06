# Mockingbird: everything you need to build the deck

Event: 1776 Labs 24-Hour Challenge. Audience: Tennesseans, likely state and local officials plus judges. Everything is Tennessee first.
Format: 8 minutes max presentation, then 5 minutes of judge Q&A. A 4-minute live product demo happens INSIDE the 8 minutes. Deck covers problem, approach, solution, with an appendix of sources and stats. Each team member owns a portion.

## 1. The challenge (verbatim focus question)
"How can Tennessee use AI to help individuals and families navigate disaster recovery, identify available assistance, and develop personalized plans to rebuild their lives?"

## 2. The product in one paragraph
Mockingbird is a recovery assistant people reach by phone, text, or web. Before any disaster, a person builds a profile by talking to an AI instead of filling out forms. After a disaster they call, say what happened in their own words, and the AI repeats key facts back, works out what help they likely qualify for, prepares the application for them to review and submit, and builds a personalized recovery plan with deadlines. Every call also lands on a live map so responders and the state can see where help is needed and what callers are asking for.

Name: Mockingbird, Tennessee's state bird. A mockingbird repeats back what it hears, which is our read-back confirmation. A bird also has a bird's-eye view, which is the responder map. Pitch line: "Families get the ear, responders get the eye."
Tagline: "Help is one call away." Opening spoken hook: "Getting help shouldn't be the hard part."

## 3. The big idea (what to emphasize)
1. Forms are the barrier. Every big platform makes people start with a 20 minute form or a 10 page PDF, and people get lost on what to fill in. A conversation can prod, ask follow-ups, and explain, which a static form cannot.
2. Build the profile once, before anything happens, from facts that are not tied to an emergency: name, address, county, household, rent or own, insurance, employer, health needs, contact preferences, emergency contact.
3. That one profile pre-fills many different applications. We demo emergency response, but the same profile works for any program.
4. During a disaster the person only says what is new. The AI already knows the rest, so very little has to be said in a bad moment.
5. Phone and text first, because ice storms take out power and internet for weeks.
6. The same calls become a live picture for responders: where people are, what they need, and what they likely qualify for.
7. We prepare, the survivor reviews and submits. We never submit anything to a government system and never say "approved." We say "likely eligible."

## 4. Problem framing (for the opening slides)
- Winter Storm Fern, January 2026. Severe winter storms began Jan 22, 2026. The ice storm hit Middle Tennessee Jan 24. Federal disaster declaration FEMA DR-4898.
- People waited months not knowing what they qualified for. FEMA Individual Assistance was added for 29 counties more than two months after the storm. Disaster Unemployment Assistance (DUA) opened April 22, 2026, which is about 88 days after the storm.
- Power: Nashville Electric Service reported 57,000 customers still without power nearly a week after the storm, and 22,000 still out more than a week after.
- Forms and rules are confusing. Example Tennessee trap: you must file regular state unemployment first (choose "Lack of Work", then "Disaster related closure"), DUA is a separate federal benefit you must still apply for, and TDLWD says to apply right away even before DUA is approved for your county.
- Relief that came: FEMA approved about $23.7 million for 10,563 households in May 2026.
(Use only these. See section 8 for sources and what NOT to claim.)

## 5. Approach (for the middle slides)
- Talk, don't type: voice and text, one question at a time, plain language.
- Pre-disaster profile built by conversation, reusable across programs.
- Rules engine decides labels so results are predictable. The AI extracts facts, a small rules module (county in declaration, need type, employment type) decides "likely eligible", with the program name, deadline, and why. Labeled "demo rules, not an official determination."
- Read-back confirmation: the AI repeats the key facts and waits for a yes before anything locks in. Shown as a "Check your answers" screen.
- Safety first: if someone mentions injury, danger, or no shelter, stop the form and give emergency and shelter guidance.
- Identity: caller ID plus date of birth and ZIP typed on the keypad (never spoken), or the person's Mockingbird ID. Wrong answers are rejected.
- Privacy: SSN is never spoken, it is typed into a masked field. Map pins are county or neighborhood level, never exact home addresses. Names and phone numbers show only for callers who opted in. A public aggregate view shows counts only.
- We watch for declarations and tell people the moment a program opens for their county.

## 6. The demo (4 minutes, what is on screen)
The demo is a real working web app, not mockups. Persona: James Carter, fictional, an hourly warehouse associate in Davidson County (Nashville), married with one child, renter with no renters insurance. All data is fake and labeled fictional. The app has five screens, shown in order:

1. PROFILE (about 0:00 to 1:00). The AI interviews James and the profile fills in live on the right: name, address, date of birth (typed on an on-screen keypad with phone keypad tones, never spoken, shown masked), county found from the address, rent or own, insurance, household, work, health needs, contact preference, emergency contact. Gives him a Mockingbird ID (MB-2041). Ends with "Ready to pre-fill": DUA, FEMA Individual Assistance, SBA, SNAP, utility and rent help, local recovery services. Spoken message: "No forms. Just a conversation."
2. STORM (about 0:45 to 1:10, presenter narrates). A snowfall screen with sound design: wind and ice crackle, then a transformer blows and the power cuts (presenter triggers it). On screen: "January 24, 2026, Nashville, Tennessee". The presenter talks the audience back to the storm, sets the scene, then the teammate dials the hotline from his phone. The profile step is also presenter-controlled: the presenter interjects mid-profile and the AI fades out, because the profile is saved as is and finished later by text.
3. THE CALL (about 1:25 to 3:00). A teammate plays James and dials the Mockingbird Hotline from a phone. The phone screen looks like a real call. For the demo it is a simulated handset: speech travels over the web to the demo screen instead of through a phone carrier. (Production would use Twilio voice and SMS. Say "simulated handset" if asked.) His speech is transcribed live on screen as he talks, so the audience sees exactly what he says. The AI answers by voice. The words James says can vary, the AI's questions stay the same. The AI first verifies who is calling (see below), then confirms safety, asks what happened, tells him he is likely eligible for Tennessee Disaster Unemployment Assistance and why, and asks if he wants it prepared. He says yes. The application fills in on the right. Fields from his profile are tagged "From profile". Only a few new questions: last day worked, weekly earnings, whether he has filed. The AI explains the Tennessee trap in plain language. It reads back the key facts ("Check your answers"), he confirms, fields go green. It lists the 3 documents due 21 days after filing (SSN typed securely, never spoken; recent paystub or tax return; proof of employment) with a 21-day warning, and queues text reminders. Last, it asks if he needs anything else. He says food. The AI says it passed the need to local responders.
4. PLAN (about 3:00 to 3:20). "You're back online. Here's what happened while you were offline." Four things already done. Then a Day 88, April 22 banner: DUA is now open for Davidson County. Then the recovery plan as a task list in three windows (first 72 hours, first 2 weeks, first 3 months) with statuses and deadlines: DUA (prepared, due June 9, 2026), FEMA Individual Assistance (next step, due June 10, 2026), SBA loan, local recovery services. All "likely eligible", never "approved."
5. RESPONDER MAP (about 3:20 to 4:00, the closing moment). Tennessee on a light street map. James's call drops in as a new pin with a pulse. The map shows an AI signal: many callers in Shelby County report no access to food in the last 3 days, with a recommendation to reroute hot meals. Click send area notice (demo). Toggle the county heat layer, filter by need or program, click a county for a summary and a "gaps" line, open a pin to see an anonymized caller card with "likely eligible" chips. Toggle Public aggregate vs Responder view to show the privacy model. A Day 1 to Day 88 slider replays call volume. Closing line: "Every call helps one family and shows the state where help is not reaching yet."

Screens to capture for the deck (take these from the running app): profile mid-conversation, profile complete with "Ready to pre-fill", storm title card, live call with transcript and form, Check your answers, document checklist with 21-day warning, plan task list, map with the food signal, map heat layer, county summary, pin side panel.
Note: the map is simulated with about 50 seeded fake callers, labeled simulated everywhere.

SAFETY FIRST: the very first thing the hotline says is "Welcome to the Mockingbird hotline. If you are in immediate danger, hang up and call 911. Are you in immediate danger?" If the caller says yes, the AI says "Hang up and call 911 now" and ends the call, and the screen shows an emergency banner. This shows the system puts life safety ahead of paperwork. The AI also speaks in short, direct sentences with no filler, at a conversational pace, because people in a crisis do not want long lead-ins.

IDENTITY VERIFICATION on the call (a security moment worth showing): the call comes from a number on file, but the AI does not trust caller ID alone. It asks "Do you know your Mockingbird ID?" James says he does not remember it. The AI says it will confirm another way and tells him NOT to say any numbers out loud. On the phone, a keypad appears. He taps his date of birth, then his home ZIP code, with phone keypad tones on every tap. The screen shows only dots, never the digits. A wrong entry is rejected ("That doesn't match what we have on file") and he tries again. When both match, the screen shows "Identity verified". Why: anyone could call and claim to be someone else, and spoken numbers can be overheard or recorded in a transcript. Typed keypad entry (DTMF) keeps sensitive numbers out of the voice channel and the transcript. This is the same kind of check hospitals, banks, and records offices use: something you have (your phone number on file) plus something you know (date of birth, ZIP). Production idea to mention if asked: add a one-time code texted to the number on file, and lock the account after repeated failures.

## 6b. Team
- Ammar Omer, teammate. Plays James on the phone call in the demo.
- Presenter photo for the team slide: `assets/team/presenter-1.webp` (the other team member, name to be added by the team). Ammar's photo and the other members' names/roles still need to be supplied by the team.

## 7. Run of show (8 minutes) and speaker notes
Presenter names are placeholders. Replace them.
| Time | Section | Owner | Slide(s) | Notes |
|---|---|---|---|---|
| 0:00 to 0:30 | Hook | Presenter 1 | Title (reversed logo), then one hook slide | Say: "Getting help shouldn't be the hard part." |
| 0:30 to 1:45 | Problem | Presenter 1 | 2 to 3 | Winter Storm Fern, the waiting, the forms, the Tennessee DUA trap |
| 1:45 to 2:45 | Approach and solution | Presenter 2 | 2 to 3 | Talk not type, profile once, rules engine, read-back, privacy, "we prepare, you review and submit" |
| 2:45 to 6:45 | LIVE DEMO (4:00) | Presenter 3 (drives) and Presenter 4 (plays James) | 1 transition slide only | Switch to the app. Do not use slides during the demo |
| 6:45 to 7:30 | Impact and what is next | Presenter 2 | 2 | Scale beyond one disaster, same profile for any program, partners, next steps |
| 7:30 to 8:00 | Close | Presenter 1 | 1 | Return to tagline: "Help is one call away." |
Deck should be about 10 to 12 content slides plus the appendix. Keep slides sparse, the demo is the main event.
Fallbacks to mention only if needed: if the call fails the app takes typed or button input with the same screens; if Wi-Fi dies there is a recorded video of a full run.

Judge Q&A, prepared answers:
- "What if cell towers are down?" Messages are queued and sent as soon as the person has signal again, and the pre-disaster profile means very little has to be said in a bad moment.
- "Do you submit applications?" No. We prepare, the survivor reviews and submits. No real integration with any government system.
- "Is this an official eligibility decision?" No. Labels say "likely eligible" using simple demo rules, with links to program rules.
- "How do you stop someone calling as somebody else?" The call must come from the number on file, and then the caller proves identity with their date of birth and ZIP typed on the keypad, never spoken. Wrong answers are rejected. Production would add a texted one-time code and lockout after failed attempts.
- "Privacy?" SSN and date of birth are never spoken, map is county level, names shown only with opt-in, public view is counts only.
- "How does the AI avoid making things up?" The AI extracts facts. A rules module decides eligibility labels and deadlines. The AI never says approved.

## 8. Facts you may state, and what you may not
Verified from official or reputable sources:
- Winter Storm Fern: severe winter storms began Jan 22, 2026. The ice storm hit Middle Tennessee Jan 24. Federal disaster declaration FEMA DR-4898.
- FEMA Individual Assistance was added for 29 Tennessee counties more than two months after the storm. Deadline to apply was June 10, 2026.
- TDLWD opened Disaster Unemployment Assistance for 29 counties on April 22, 2026, with applications open until June 9, 2026.
- Apply through Jobs4TN. State unemployment first: select "Lack of Work", then "Disaster related closure". DUA applications come after, if the county is approved.
- DUA documentation is due within 21 days of filing: SSN, most recent federal income tax form or paycheck stubs, and documentation showing the person was working or self-employed when the disaster occurred.
- DUA is a federal program administered by the state. Regular unemployment and DUA cannot be paid at the same time.
- FEMA approved about $23.7 million for 10,563 households in May 2026.
- NES reported 57,000 customers still without power nearly a week after the storm, and 22,000 still out more than a week after.
- The 29 FEMA IA counties (TEMA via WKRN, April 2026): Benton, Carroll, Cheatham, Chester, Clay, Davidson, Decatur, Dickson, Dyer, Fayette, Hardeman, Hardin, Henderson, Hickman, Lewis, Macon, Madison, Maury, McNairy, Montgomery, Perry, Robertson, Rutherford, Shelby, Sumner, Trousdale, Wayne, Williamson, Wilson. All 95 counties were designated for FEMA public assistance or emergency protective measures. The team still plans to cross-check this list against TEMA directly.
NOT verified, do not state as fact:
- The exact screens and fields of the live Jobs4TN claim flow (behind a login). Our field layout is our own, based on documented requirements.
- The current mailing address or fax number for document submission.
- Whether any specific person would qualify. Always say "likely eligible."
- Any statistic not listed above. If the deck needs another number (for example the length of paper forms or time to complete them), research it, cite it in the appendix, or leave it out. Do not put an invented number on a slide.
Appendix sources (use these in the sources slide):
- TEMA, January 2026 Winter Weather: https://www.tn.gov/tema/assistance/active-disasters-and-emergencies/2026-disasters/january-2026-winter-weather.html
- TDLWD, DUA in 29 counties: https://www.tn.gov/workforce/general-resources/news/2026/4/22/disaster-unemployment-assistance-available-in-29-tennessee-counties.html
- TDLWD, Disaster Unemployment page: https://www.tn.gov/workforce/unemployment/disaster-unemployment.html
- TDLWD, DUA documentation requirements (2025 release): https://www.tn.gov/workforce/general-resources/news/2025/6/26/disaster-unemployment-assistance-available-in-nine-counties.html
- WKRN, FEMA IA added for 29 counties: https://www.wkrn.com/news/tennessee-news/tennessees-winter-storm-disaster-declaration-amended-to-include-fema-individual-assistance/amp/
- WSMV, IA deadline: https://www.wsmv.com/2026/05/13/tennesseans-affected-by-deadly-january-winter-storm-have-less-than-one-month-apply-disaster-assistance-tema-says/
- WVLT, FEMA approvals: https://www.wvlt.tv/2026/06/09/deadline-apply-disaster-assistance-tn-ice-storm-is-this-week/
- NES outages 57,000: https://abcnews4.com/news/nation-world/gallery/nashville-power-outages-nes-electric-service-customers-still-without-power-nearly-week-after-ice-storm-winter-weather?photo=1
- NES outages 22,000: https://newschannel9.com/news/local/gallery/nashville-power-outages-25000-nes-electric-services-customers-without-power-more-than-a-week-after-ice-storm-winter-weather?photo=1
- GOV.UK Design System (patterns only, no branding): https://design-system.service.gov.uk
- US Census cartographic boundaries (county shapes), Esri Light Gray basemap (map tiles).

## 9. Brand and design rules (slides must match the product)
Logo files in `assets/`: `mockingbird-icon.svg` (icon only), `mockingbird-lockup.svg` (full lockup on white), `mockingbird-reversed.svg` (white on navy, use for the title slide and the closing slide). The mark is a bird in flight inside an arc with three small stars (Tennessee's three Grand Divisions). Do not redraw, recolor, or stretch it.
Palette (CSS variables):
- Navy #002D65: headings, primary shapes, links
- Red #CC0000: accent only. Deadlines, one highlight per slide, a thin underline. Never large fills
- White #FFFFFF: about 90 percent of every slide
- Ink #1B1F24 body text, Secondary #5B6573 captions, Border #D9DEE5, Surface #F5F7FA
- Success #1E7B3A and Warning #B25E00: status only
Type: Public Sans for text, Source Serif 4 for large headings (both free on Google Fonts). Generous white space. 1px borders instead of heavy shadows. Small corner radius (4 to 6 px).
Feel: calm, trustworthy, a well-run public service. Not a startup landing page.
Avoid: purple or rainbow gradients, emoji as icons, glassmorphism or blurred cards, chat-bubble UIs, sparkle icons, "AI-powered" badges, flag backgrounds, eagle or seal clip art, copying TN.gov or state seal branding. Do not use the GOV.UK crown or its typeface.
Optional motif: a slim vertical navy stripe with a thin white edge on one page edge, echoing the Tennessee flag's fly stripe.
Check contrast (WCAG AA) on every text and background pair.

## 10. Slide outline (LEAN: the demo is the main event, about 4 of the 8 minutes)
Keep the deck to 6 slides before the demo and 2 after, plus an appendix. Sparse slides, one idea each, big type.
1. Title: reversed logo, tagline "Help is one call away." (about 0:15)
2. The storm and the wait: Winter Storm Fern, Jan 24, 2026. One timeline visual: storm Jan 24, DUA opens Apr 22 (about 88 days), FEMA IA added after 2+ months. Add the NES outage numbers (57,000 and 22,000). (about 1:00)
3. The barrier: the forms. The Tennessee DUA trap in three short lines. One stat on how hard forms are (research and cite it, see below). (about 0:45)
4. Our idea: talk, don't type. Build a profile once by conversation, it pre-fills any application. Families get the ear, responders get the eye. (about 0:45)
5. Trust: read-back confirmation, "likely eligible" never "approved", SSN never spoken, county-level map, we prepare and you submit. (about 0:30)
6. Transition: "Meet James." Switch to the live app. (about 0:05)
--- LIVE DEMO, about 4:00 ---
7. Impact and next: for families, for responders, for the state. Same profile for any program, other disasters, real Twilio SMS and voice, live declaration alerts. (about 0:45)
8. Close: reversed logo, tagline, team. (about 0:20)
Appendix (not presented, for Q&A): A1 sources, A2 verified facts table, A3 the 29 counties, A4 how the eligibility rules work, A5 architecture and tools, A6 privacy model, A7 judge Q&A.
Presenter time: slides about 4 minutes, demo about 4 minutes.

## 10b. Statistics: what to look for (research these, cite each one in the appendix)
The verified numbers in section 8 are the only ones already confirmed. The team wants more supporting stats. Find and verify these before putting any on a slide. Prefer primary sources (FEMA, GAO, Census, TEMA, TDLWD, academic papers, major news). If you cannot verify a number, do not use it.
- Disaster aid gap: how many households that were eligible for FEMA assistance never applied or were denied for paperwork reasons (GAO and FEMA OIG reports exist on this).
- Complexity and burden: documented research on "administrative burden" in disaster recovery applications and time spent on forms.
- Speed: how long people wait for decisions or aid after major disasters.
- Tennessee specific: Winter Storm Fern totals (households affected, outage peak, deaths if officially reported), number of Tennessee counties and people in the declaration.
- Phone and SMS reach: share of Tennessee or US households that are cell-only, and how often people lose internet after storms.
- Conversational AI in public benefits: any credible studies or pilots on AI-assisted benefit applications.
For each stat, record: the number, the exact wording of the source, the URL, and the date. Put the table in appendix A2.

## 11. Tech facts for the architecture appendix
Web app (React, Vite, Leaflet). Voice: browser speech recognition for live transcription and text-to-speech for the AI voice (Twilio voice and SMS planned for production). Scripted by intent for the demo: the AI's questions and form values are pre-written, the caller can phrase answers any way. Rules module for eligibility labels. Map: Census county boundaries, Esri light gray basemap, seeded simulated callers. Roadmap: Claude for real conversation and extraction, live declaration monitoring, Twilio voice and SMS, state and county responder dashboards.
