# Your Name — Portfolio (v3)

A single-page, recruiter-facing portfolio. Everything on the page — the
hero, About, Skills, every section (Projects, Education, Certifications,
Research…), and Contact — is editable directly in the browser, and you can
add or hide whole sections. Cards "open" like a book page as they scroll
into view, with a folded-corner detail on hover and a book-cover-style
entrance for the hero terminal.

## Files

```
index.html   page structure
style.css    design system + animations
script.js    all content (edit here!), rendering, edit mode, scroll logic
resume.pdf   ← add your own resume here (referenced by the Resume button)
```

## 1. Editing in the browser

Click **Edit** in the nav. You'll now see:

- A pencil icon on the **Hero**, **About**, **Skills**, and **Contact**
  blocks — click it to edit that block's text (name, bio, quote, skill
  tags, contact links, etc.) in a small form.
- A pencil, a hide (×), and **▲▼ reorder** icons next to every section
  title (Projects, Education, …) — edit the title/subtitle, hide the
  whole section, or move it up/down the page. Hidden sections can be
  brought back any time via the **"+ Restore"** chips at the bottom of
  the page while in Edit mode.
- A pencil and **▲▼ reorder** icon on every card/entry — edit its title,
  description, link, caption, and tags, delete it, or move it up/down
  within its section.
- **"+ Add entry"** under every section, and **"+ Add section"** at the
  bottom of the page, to create a brand-new section (card-grid layout
  like Projects, or timeline layout like Education).
- **"Create Resume" / "Create CV"** buttons in the edit banner at the
  top — see section 3 below.

All of this saves to this browser's `localStorage`. Treat `DEFAULT_DATA`
at the top of `script.js` as the version you actually commit to GitHub —
use Edit mode to try things out, then copy the values you like back into
that object (or just keep editing in the browser if that's easier for you).

## 2. Add your resume PDF (optional, static)

Drop a PDF named `resume.pdf` next to `index.html` if you'd rather link a
manually-designed PDF. The **Resume** button in the nav links to it.

## 3. Auto-generated Resume / CV

While in Edit mode, click **"Create Resume"** or **"Create CV"** in the
banner at the top of the page. This opens a new tab with a clean,
print-ready document built live from your current data — no separate
file to keep in sync.

- **Resume**: compact, trimmed descriptions, meant to stay close to one
  page — good for job applications.
- **CV**: full descriptions and tags, every section in full — good for
  academic or research applications.

In the new tab, click **"Print / Save as PDF"** and choose **"Save as
PDF"** as the destination in your browser's print dialog. Since it's
generated from your live data, it's always current — just regenerate it
any time your content changes.

## 4. Research notebook

The notes box in the Research section saves to `localStorage` via two
functions in `script.js`: `loadNote()` and `saveNote(text)`. Swap these for
real API calls (Supabase, Firebase, your own backend) when you want notes
to sync across devices.

## 5. Publish on GitHub Pages

```bash
git init
git add index.html style.css script.js resume.pdf README.md
git commit -m "Portfolio v3"
git branch -M main
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

Then: **Settings → Pages → Source → "Deploy from a branch" → `main` /
`root`** → Save. Give it a minute, then visit:
- `https://your-username.github.io/` if the repo is named
  `your-username.github.io`, or
- `https://your-username.github.io/your-repo-name/` otherwise.

## 6. The "book" animations

- **Cards open like a page.** As each card scrolls into view it swings
  open from its left edge (`rotateY`, like a page turning), staggered
  slightly between siblings — see `.reveal .stagger` in `style.css`.
- **Folded corner.** Hovering a card lifts a small folded-corner detail
  in the top-right, a quiet nod to a paper page — see `.entry-card::after`.
- **Book-cover entrance.** The hero terminal card swings open from
  `-78deg` to its resting angle once on load — see `@keyframes
  bookCoverOpen`.
- All of this is skipped automatically for visitors with
  `prefers-reduced-motion` enabled (see the top of `style.css`).

Palette, fonts, and spacing all live at the top of `style.css` under
`:root` and `html[data-theme="dark"]` — change the accent color in one
place and it propagates everywhere.
