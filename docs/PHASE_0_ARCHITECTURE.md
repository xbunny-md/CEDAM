# LUGA BOYZ - PHASE 0: Architecture & Planning

## 1. Complete Product Architecture
LUGA BOYZ is a mobile-first, client-rendered Single Page Application (SPA) built with React and Vite. It leverages Firebase for its backend infrastructure, specifically using Firestore for data persistence, Firebase Authentication for user management, and Firebase Storage for media. The architecture follows a feature-driven design, separating the application into distinct feature modules (Auth, Feed, Profile, Challenges, Polls) to maintain scalability.

## 2. Folder/Component Structure
```text
/src
  /assets           # Brand assets, icons, splash screens
  /components
    /ui             # Reusable design system components (glass cards, buttons)
    /layout         # Shell, Navigation, Bottom Sheets
  /features
    /auth           # Sign up, Login, Firebase Auth logic
    /feed           # Posts, Home Feed, Likes, Comments
    /discover       # Search, Trending
    /challenges     # Challenges, Voting
    /profile        # User profiles, Follows, Stats
  /hooks            # Global custom hooks (e.g., useSwipe, useAuth)
  /store            # Global state management (Zustand)
  /lib              # Utilities (cn, Firebase initialization)
  /services         # API/Database interaction layer
  /types            # TypeScript interfaces and type definitions
```

## 3. Firebase Architecture
- **Firebase Authentication**: Email/Password and Google Sign-in.
- **Firestore**: NoSQL document database for all social data.
- **Firebase Storage**: For user avatars, post images, and challenge media.
- **Cloud Messaging / Realtime Updates**: Utilizing Firestore `onSnapshot` for realtime feed and notification updates.
- **Security**: Robust `firestore.rules` implementing Attribute-Based Access Control (ABAC).

## 4. Firestore Data Model
- **`users/{userId}`**: `{ username, displayName, bio, avatarUrl, followersCount, followingCount, points, badges, createdAt }`
- **`posts/{postId}`**: `{ authorId, content, mediaUrl, likesCount, commentsCount, createdAt, type }`
- **`comments/{commentId}`**: `{ postId, authorId, content, createdAt }`
- **`likes/{likeId}`**: `{ postId, userId, createdAt }`
- **`follows/{followId}`**: `{ followerId, followingId, createdAt }`
- **`polls/{pollId}`**: `{ authorId, question, options: [{ text, votesCount }], totalVotes, expiresAt, createdAt }`
- **`challenges/{challengeId}`**: `{ title, description, type, pointsReward, expiresAt, createdAt }`
- **`challengeEntries/{entryId}`**: `{ challengeId, authorId, mediaUrl, votesCount, createdAt }`
- **`notifications/{notificationId}`**: `{ userId, type, actorId, referenceId, read, createdAt }`

## 5. Security-Rule Strategy
- **Master Gate Pattern**: Validate all incoming writes against an `isValid[Entity]` helper.
- **Strict Keys**: Use `affectedKeys().hasOnly()` for updates to prevent shadow fields.
- **Identity Integrity**: Ensure `request.auth.uid` matches `authorId` on document creation.
- **Total Array Guarding**: Avoid unbounded arrays; use subcollections for likes/comments.
- **Terminal State Locking**: Prevent modification of expired polls or completed challenges.

## 6. Navigation Architecture
Using React Router with a stacked-card gesture system.
- `/` (Home/Feed)
- `/discover`
- `/create` (Bottom Sheet overlay)
- `/challenges`
- `/profile`
- `/profile/:userId`
- `/post/:postId`
- `/auth` (Login/Signup overlay)
- `/about`

## 7. Design System
- **Theme**: Premium iPhone + Glassmorphism + Futuristic Social Media.
- **Typography**: Inter (or system font like SF Pro) for UI, paired with a bold, futuristic display font for headers.
- **Colors**: Deep dark mode base (e.g., `#0A0A0A`) with vibrant electric accents (Neon Blue, Purple) and semi-transparent glass panels (`rgba(255,255,255,0.05)`).
- **Glass-Card System**: Backdrop blur (`backdrop-blur-md`), 1px subtle white borders (`border-white/10`), and soft inner shadows.
- **Border Radius**: Substantial radii for a friendly mobile feel (e.g., `rounded-2xl` or `3xl` for main cards).
- **Shadows**: Soft, colored drop shadows for elevated elements.

## 8. Animation/Gesture Strategy
- **Library**: Framer Motion (`motion/react`) for layout animations and spring transitions.
- **Gestures**: `@use-gesture/react` for complex drag and swipe interactions.
- **Tab-over-Tab**: Screens mount as absolutely positioned layers. Swiping dismisses the top layer to reveal the one beneath it, mimicking iOS navigation.
- **Spring Physics**: Fast, bouncy spring animations rather than linear easings to feel responsive and premium.

## 9. Brand/Logo Placement Strategy
- **Typography Logo**: "LUGA BOYZ" bold, tight tracking, futuristic sans-serif.
- **Splash Screen**: Centered logo with a pulsing glassmorphic halo.
- **Loading States**: Skeleton loaders mimicking the glass card shapes, with a sweeping gradient shimmer.
- **Header**: Clean top navigation with the wordmark on the left, notifications on the right.

## 10. Complete Phase 1–8 Roadmap
- **Phase 1 (Foundation)**: App shell, routing, design system, Firebase init, bottom navigation.
- **Phase 2 (Auth)**: Authentication, User profiles, Database rules.
- **Phase 3 (Posts)**: Home feed, text/image posts, likes, comments.
- **Phase 4 (Discover)**: Search, follow graph, trending sections.
- **Phase 5 (Polls/Challenges)**: Voting mechanics, media uploads for challenges.
- **Phase 6 (Gamification)**: Points system, badges, leaderboards.
- **Phase 7 (Realtime)**: Notifications, unread states, `onSnapshot` listeners.
- **Phase 8 (Production)**: Performance optimization, PWA installability, animations polish, security audit.

## 11. Dependencies Identified
- `react-router-dom`: Routing
- `motion`: Animation engine
- `@use-gesture/react`: Gesture handling
- `firebase`: Backend SDK
- `zustand`: State management
- `clsx` & `tailwind-merge`: Utility for dynamic Tailwind classes
- `lucide-react`: Icons
- `vite-plugin-pwa`: Progressive Web App manifest and service worker

## 12. Performance Strategy
- **Virtualization**: Use virtual lists for the Home Feed and Discover pages to maintain 60fps on low-memory devices.
- **Image Optimization**: Serve appropriate sized images, implement lazy loading for post media.
- **Code Splitting**: Route-level code splitting using `React.lazy`.
- **Query Limits**: Paginate all Firestore queries (e.g., `limit(15)`).

## 13. PWA Strategy
- **Manifest**: Complete `manifest.json` via `vite-plugin-pwa` with standalone display, dark theme colors.
- **Service Worker**: Cache static assets and fonts. Network-first strategy for the Feed.
- **Install Prompt**: Custom in-app "Add to Home Screen" bottom sheet prompting users to install the app.
