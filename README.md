# Teacher John's class site (Cloudflare version)

One Cloudflare Pages project = website + server + database. Free.

```
index.html             home page (choose your class)
apes/index.html        AP Environmental Science Unit 1
chemistry/index.html   Chemistry Module 6
functions/api.js       the server (saves answers, sends activities)
```

## 1. Update the GitHub repo
1. In `smoa`, upload these files so they replace the old ones: `index.html`, the `apes` folder, the `chemistry` folder.
2. Upload the `functions` folder too (drag the whole folder).
3. Delete `Code.gs` from the repo if it is there. You do not need Google Sheets any more.

## 2. Create the Cloudflare project
1. Make a free account at dash.cloudflare.com.
2. **Workers & Pages → Create → Pages → Connect to Git.** Connect GitHub and choose `smoa`.
3. Build settings: Framework preset **None**, Build command **(empty)**, Build output directory **/** .
4. Click **Save and Deploy**. Your site will be at `https://smoa.pages.dev` (or a similar name Cloudflare shows you).

## 3. Create the database
1. **Storage & Databases → D1 → Create database.** Name it `classdb`.
2. Open your Pages project → **Settings → Bindings → Add → D1 database.**
   Variable name: `DB` (capital letters). Database: `classdb`. Save.
   (The tables are created automatically the first time a student saves.)

## 4. Set your teacher key
Pages project → **Settings → Variables and Secrets → Add.**
Type: **Secret**. Name: `TEACHER_KEY`. Value: your own secret word. Save.

## 5. Redeploy (needed after steps 3 and 4)
Pages project → **Deployments** → newest deployment → **⋯ → Retry deployment**.

## 6. Test
- You: `https://smoa.pages.dev/apes/#teacher` → **Class monitor** → enter your key → **Save key**. You should see "students connected live".
- Ask 2–3 students **without a VPN** to open `https://smoa.pages.dev/`.
  - If the activity pops up when you press **Send to students**: it works.
  - If not, buy a domain and do step 7.

## 7. Add your own domain (later)
Pages project → **Custom domains → Set up a custom domain** → type your domain → follow the steps.
To change domain next year, add the new one here. No files need to change.

## Notes
- Both classes use the same database and the same teacher key. Results stay separate (each page has its own course name).
- To see raw results: **D1 → classdb → Console**, run `SELECT name, act, score, n, done FROM responses ORDER BY course, name;`
- **Class monitor → "Delete ALL class results on the server"** clears one course (click twice).
- Students who cannot connect still get a code at the end of each activity. They paste it in the ClassIn chat; you paste the chat into Class monitor.
- Free limits (100,000 requests a day) are far more than one or two small classes use.
