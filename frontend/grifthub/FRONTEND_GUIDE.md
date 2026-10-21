# Frontend guide (start here)

The app is built with **React Native + Expo**. You write one codebase in TypeScript and it runs on iPhone, Android, and the web.

## 1. Run it

You need [Node.js](https://nodejs.org) (LTS version) installed.

```bash
cd frontend/grifthub
npm install        # first time only, downloads the libraries
npx expo start     # starts the dev server
```

Then either:
- press **w** to open it in your web browser (easiest), or
- install **Expo Go** on your phone and scan the QR code (phone and laptop must be on the same Wi-Fi).

Leave `expo start` running. Save any file and the app reloads by itself.

To add a library, use `npx expo install <name>`, not `npm install`. It picks a version that works with our Expo SDK.

## 2. Where things are

```
src/
  app/                      every file here is a screen (Expo Router)
    _layout.tsx             wraps all screens (a "Stack": screens slide over each other)
    index.tsx               /              Welcome screen
    how-it-works.tsx        /how-it-works  Intro to the scoring rules
    sign-up.tsx             /sign-up       Create account (form + validation)
    login.tsx               /login
    (tabs)/                 the main app, with a bottom tab bar
      _layout.tsx           defines the tabs
      home.tsx              /home          Dashboard placeholder
      leaderboard.tsx       /leaderboard   Weekly leaderboard
  components/               reusable pieces: Button, TextField, Avatar
  constants/theme.ts        colors, spacing, font sizes; change them here
  lib/api.ts                ALL calls to the Django backend go here
  data/mockLeaderboard.ts   fake data until the backend endpoints exist
```

The flow is: Welcome → How it works → Sign up → Leaderboard. "I already have an account" → Login → Leaderboard.

## 3. The five ideas you need

1. **Components are functions that return UI.** `export default function Welcome() { return <View>...</View> }`.
2. **Use `View` (a box) and `Text`, not `div` or `p`.** Every piece of text must be inside a `<Text>`.
3. **Styles are JS objects** in `StyleSheet.create({...})`. Layout uses **flexbox**, and items stack vertically by default. `flexDirection: "row"` puts them side by side.
4. **State (`useState`) holds anything that changes.** It might be what's typed in a field, whether something is loading, or the data you fetched. Calling the setter (`setEmail("x")`) re-draws the screen.
5. **Navigation:** `router.push("/login")` goes forward, `router.back()` goes back, and `router.replace("/leaderboard")` goes forward with no way back (use it after sign-up).

Try this first: open `src/constants/theme.ts`, change `accent` to `"#4AA3FF"`, and save. Every button changes color.

## 4. Good tutorials (in this order)

- React basics, 1–2 hours: https://react.dev/learn (do "Describing the UI" and "Adding Interactivity")
- Expo's own tutorial, builds a small app: https://docs.expo.dev/tutorial/introduction/
- Expo Router (how files become screens): https://docs.expo.dev/router/introduction/
- Flexbox in React Native: https://reactnative.dev/docs/flexbox

## 5. Connecting to the backend

`src/lib/api.ts` has `USE_MOCK = true`. The screens use fake data for now, because the Django app doesn't yet have these endpoints:

| Frontend needs | Suggested endpoint | Returns |
|---|---|---|
| Sign up | `POST /api/auth/register/` | `{ userId }`, or field errors |
| Log in | `POST /api/auth/login/` | a token or session |
| Leaderboard | `GET /api/leaderboard/` | `{ weekStart, currentUserId, entries: [{ userId, displayName, points, workouts, rank }] }` |

The backend also needs:
- **CORS** (`django-cors-headers`). Without it, the browser blocks requests from the Expo web app.
- A **display name** field on users. Django's built-in User model doesn't have one.
- An agreed **login method**. Token auth is simpler than session cookies for a mobile app.

Once an endpoint exists, set `USE_MOCK = false` and make the URL in `api.ts` match. On a real phone, `localhost` means the phone itself, so change `API_BASE` to your laptop's IP address.

## 6. Before you push

```bash
npx tsc --noEmit    # type check; should print nothing
git checkout -b frontend/your-feature
git add . && git commit -m "Describe what you did"
git push -u origin frontend/your-feature   # then open a Pull Request on GitHub
```
