# Password Strength Analyzer

A small web app that checks how strong a password is while you type — no server, no tracking, everything happens right in your browser.

I built this as a beginner project to practice vanilla JavaScript, DOM manipulation, and get more comfortable with git and GitHub.

**Live demo:** [chanidu321.github.io/password-strength-analyzer](https://chanidu321.github.io/password-strength-analyzer/)

## What it does

- Scores a password out of 100 based on length, character variety, and weak patterns
- Estimates how long it would take to brute-force, assuming a fast offline attack (10 billion guesses/sec)
- Flags it if it's one of the most commonly used/leaked passwords
- Gives specific suggestions for improving it ("add a symbol," "avoid keyboard sequences," etc.)
- Live strength meter that smoothly shifts color as you type, instead of jumping between fixed colors

## Screenshot

![App screenshot](screenshot.png)

## Running it locally

1. Copy this command and paste it into your terminal:

```
git clone https://github.com/chanidu321/password-strength-analyzer.git
```

2. Open the `password-strength-analyzer` folder that gets created
3. Open `index.html` in your browser — or if you're using VS Code, right-click it and choose **Open with Live Server**

No build step, no dependencies, no npm install needed.

## How it's organized

- `index.html` — page structure
- `style.css` — all the visual styling, including the animated meter
- `script.js` — the actual analysis logic: scoring, the crack-time estimate, and the suggestions

The scoring isn't based on any official standard, it's a rubric I wrote myself: points for length and character variety, penalties for repeated characters, keyboard sequences, and matches against a small list of common passwords.

## What I'd add next

- Check against a real breached-password list (like the HaveIBeenPwned API) instead of a small hardcoded array
- A password generator
- A light/dark theme toggle

## A note on privacy

Nothing typed into this app is sent anywhere. The whole thing runs client-side in the browser — that's the whole point of doing it this way instead of with a backend.
