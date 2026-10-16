# Matata privacy, consent and safeguarding policy

Version 1.0 · 16 October 2026

This page is also shown in the app at `/privacy`. Keep the two in step: when
you change one, change the other.

## 1. Who we are

Matata is built and maintained by Origin Africa Software Limited, a company
registered in Kenya ("we"). When we run Matata for a response, we are the
data controller. When a partner (for example a county government or a Red
Cross society) runs its own Matata instance, that partner is the controller
for its data and this policy describes the minimum the software does.

Privacy and safeguarding contact: info@origin.co.ke

## 2. What we collect

| Data | When | Why |
| --- | --- | --- |
| Location of the damage (GPS position and its accuracy), or a landmark you type | Every report | To put the report on the map and match it to a building |
| The building you pick, or that your building is not on the map | If you choose one | To link the report to the right building, or to show mapping gaps |
| Crisis type, building type, damage level, electricity, health services, debris, most pressing needs | Every report | To understand the damage and what people need |
| A photo of the damage | Only if you add one | To show responders the damage and estimate its severity |
| A random session code for your phone | When you open the report form | To let you see your own reports and to stop abuse |
| Your email address | Only if you choose to sign in | To let you sign in. We store only a scrambled (hashed) form of it |
| Your IP address | When your phone talks to our server | To block abuse such as automated floods of reports |

We do **not** ask for your name, ID number or phone number to send a report.

Before a photo is stored, we remove the hidden data that phones add to
pictures (GPS position, device model, serial number). Free text you type is
cleaned of web code. Your email address or phone number is never stored in
readable form: we keep only a salted hash.

While you are offline, your report waits on your own phone (in the browser's
storage) and is sent when you are back online. It is deleted from your phone
once it is sent.

## 3. Why we use it, and our legal basis

We use report data only to help people affected by a disaster: to see where
damage is, to decide where to send help, and to plan recovery. We do not sell
data, show advertising, or use reports to build profiles of people.

Our legal basis is your **consent**, which you give in the report form before
you send a report, and, during an emergency, the **protection of people's
vital interests** and tasks carried out in the **public interest** by the
responders we work with.

## 4. Who can see your report

- **Trained analysts and responders** working on the response see reports on
  the Matata dashboard, including photos. Regional responders see only
  reports inside their own area.
- **Aid organisations and the public** may receive exported data (for example
  on the Humanitarian Data Exchange). Exports never include photos, your
  email, your session code or analyst notes. Email addresses, phone numbers
  and web links typed into free-text fields are removed. For sensitive
  situations, such as conflict, locations can be rounded to about 110 m or
  1.1 km before sharing.
- **Analysts never see who you are.** The dashboard shows only a trust level
  for each reporter, never an email or session code.

## 5. Service providers

These services process data on our behalf. Matata runs on servers we
operate, so report data, photos and translation stay on our own systems.
Anthropic and Amazon Web Services are outside Kenya.

| Provider | What it does | Data it sees |
| --- | --- | --- |
| Our own server (Docker deployment, with MinIO photo storage) | Runs the Matata server, database and photo storage | All report data and photos |
| Privy | Sends sign-in codes by email | Your email address, if you sign in |
| Amazon Web Services (AWS Rekognition) | Checks photos for harmful content | Photos |
| Anthropic (Claude) | Estimates damage severity from the photo | Photos and the damage details |
| OpenStreetMap Nominatim | Finds a location from a landmark you typed | The landmark text |
| LibreTranslate, run on our own server | Translates free text for analysts | Free text you typed |

## 6. Automated severity estimates

When a photo is added, an AI model may estimate how badly the building is
damaged. The estimate is advice for analysts, not a decision about you.
Estimates the model is unsure about are always sent to a person, and
analysts can override any estimate.

## 7. How long we keep it

- **Photos** are deleted 90 days after the report was sent, unless a newer
  report still uses the same photo. (Set with `PHOTO_RETENTION_DAYS` on the
  server.)
- **Report records** (location, damage details, needs) are kept for as long
  as the response and recovery need them, and reviewed at the end of each
  response. They are then deleted or made anonymous, and are never kept
  more than 2 years after the response ends.
- **Session codes** expire on their own. Sign-in codes expire within minutes.
- **Exports** created on the dashboard expire after 24 hours.

## 8. Your rights

Under the Kenya Data Protection Act, 2019, you can ask us to:

- tell you what data we hold about you and give you a copy;
- correct it;
- delete it, or stop using it;
- withdraw your consent at any time (this does not affect reports already
  shared before you withdrew it).

Write to info@origin.co.ke with the report reference shown after you
sent the report. We will reply within 30 days. If you are not satisfied,
you can complain to the Office of the Data Protection Commissioner
(https://www.odpc.go.ke).

## 9. Safeguarding

Reports are about damage, not people. To keep everyone safe:

- **Do not photograph people's faces, children, injured or dead people, or
  ID documents.** Point the camera at the building or road.
- **Do not photograph police, military or other security sites.**
- **Do not type names or phone numbers** (yours or anyone else's) into the
  report. If you need help yourself, contact emergency services first.
- **Only report if it is safe to do so.** Never enter a damaged building or
  flood water to take a photo.
- **Children:** Matata is not meant for children under 18 to use alone. A
  young person who needs to report damage should ask an adult to help.

When automatic content checking is switched on, every photo is checked for
harmful content before it is stored. Analysts remove reports that break these
rules. In conflict settings, locations can be
rounded before data is shared. If you see a report that puts someone at risk,
contact info@origin.co.ke and we will act within 24 hours.

## 10. Security

Data travels between your phone and our server over an encrypted connection
(HTTPS). Only provisioned staff accounts can open the dashboard. Personal
identifiers are stored only as salted hashes. One limit: phone numbers have
few possible values, so if both our database and our secret key were stolen,
hashed phone numbers could be worked out. Moving the key to a managed key
store is planned.

## 11. Changes

We will post any change to this policy here, with a new version date. If a
change affects how reports you have already sent are used, we will say so on
the report form.
