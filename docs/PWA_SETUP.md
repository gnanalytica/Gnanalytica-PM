# PWA Setup Guide for Gnanalytica PM

## 1. PWA Overview

### What is a Progressive Web App?

A Progressive Web App (PWA) is a web application that uses modern web technologies to deliver app-like experiences to users. PWAs bridge the gap between web and native applications by providing reliable performance, offline capability, and an installable interface.

### Benefits of PWA

- **Offline Capability**: Access your tickets and data even without internet connection
- **Install Prompt**: Users can install the app directly from their browser to home screen
- **Native App Experience**: Standalone window without browser UI, fast loading, smooth animations
- **Fast Loading**: Service worker caching ensures instant page loads on repeat visits
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **No App Store Required**: Direct installation from the web, automatic updates

### How Gnanalytica PM Uses PWA

Gnanalytica PM leverages PWA technology to provide:

- **Offline Tickets**: View cached ticket data when offline
- **Installable App**: One-click installation on Android, iOS, and desktop browsers
- **Mobile Support**: Responsive design optimized for all screen sizes
- **Fast Navigation**: Service worker caching for instant page transitions
- **Automatic Updates**: Users always get the latest version without manual intervention

### Browser Support

| Platform | Support | Notes |
|----------|---------|-------|
| iOS | 16.4+ | Uses Web Clip (different from Android install flow) |
| Android | 5.0+ | Full PWA support with install prompt and home screen icon |
| Chrome Desktop | Latest 2 versions | Full PWA support with install button in address bar |
| Firefox | Latest 2 versions | PWA support (manifest required, service worker required) |
| Safari (macOS) | 15.2+ | Basic PWA support, install to home screen |
| Samsung Internet | Latest versions | Full PWA support with install button |

---

## 2. Project Structure

### PWA Files Created

The following files comprise the PWA implementation:

```
public/
├── manifest.json              # App metadata, icons, display mode
├── service-worker.js          # Offline support and caching strategy
├── offline.html               # Fallback page when offline
└── icons/
    ├── icon-192.png           # App icon for Android home screen
    └── icon-512.png           # App icon for splash screens
```

### File Descriptions

#### `public/manifest.json`
**Purpose**: Web app manifest that describes the application metadata to the browser.

**Contains**:
- Application name and short name
- Display mode (standalone - removes browser UI)
- Theme color and background color for branding
- Maskable and regular icon definitions
- Start URL (landing page when installed)
- App scope and orientation preferences

**Used by**: Browser installation prompt, home screen installation, app metadata display

#### `public/service-worker.js`
**Purpose**: JavaScript worker that runs in the background to enable offline functionality and caching.

**Functionality**:
- Intercepts network requests
- Caches static assets (HTML, CSS, JS, images)
- Implements network-first caching for API calls
- Provides fallback responses when offline
- Handles cache versioning and updates
- Manages background sync for offline actions

**Strategy**: Network-first for APIs, stale-while-revalidate for static assets

#### `public/offline.html`
**Purpose**: Fallback page shown to users when they navigate to an uncached page while offline.

**Features**:
- User-friendly offline message
- Navigation links to cached pages
- Simple styling that doesn't require external assets
- Instructions for when connection is restored

#### `public/icons/icon-192.png` & `public/icons/icon-512.png`
**Purpose**: Application icons used by the browser and operating system.

**Specifications**:
- 192x192: Used for home screen icons on Android and smaller devices
- 512x512: Used for splash screens, app store listings, and larger displays
- Transparent background with maskable-area support for adaptive icons
- PNG format with RGBA color space

---

## 3. Local Development Setup

### Prerequisites

- Node.js 18+ and npm 9+
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Text editor or IDE

### Installation Steps

Follow these steps to set up the PWA for local development:

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open the application in your browser
# Navigate to http://localhost:3000
```

### Verify PWA Installation

1. **Open DevTools** (`Cmd+Option+I` on macOS, `F12` on Windows/Linux)
2. **Check Manifest**:
   - Go to **Application tab** > **Manifest** (left sidebar)
   - Verify `manifest.json` loads without errors (should show green checkmark)
   - Check that icons and colors are displayed correctly
3. **Check Service Worker**:
   - Go to **Application tab** > **Service Workers** (left sidebar)
   - Verify service worker shows "Installed and running" (green dot)
   - Status should show "activated and running"
4. **Test Manifest Loading**:
   - Go to **Console tab**
   - Type: `navigator.serviceWorker.controller` (should return the service worker)
   - No errors should appear in the console

### Expected Output

When everything is set up correctly:
- Manifest appears without errors in DevTools
- Service worker shows "activated and running" status
- Console shows no manifest or registration errors
- Application is responsive on different screen sizes

---

## 4. Testing Locally

### Testing Service Worker Registration

**Method 1: DevTools**
1. Open DevTools > **Application tab**
2. Select **Service Workers** from the left sidebar
3. Should show the service worker with "activated and running" status
4. Click the worker to inspect its details and cached resources

**Method 2: Console**
1. Open DevTools > **Console tab**
2. Run: `navigator.serviceWorker.getRegistrations()`
3. Should return an array with one registration object
4. Verify `active` property shows the active service worker

**Method 3: Network Request**
1. DevTools > **Network tab**
2. Request any page - the service worker should intercept it
3. Response should come from service worker cache or network
4. Request shows "(from ServiceWorker)" for cached responses

### Testing Offline Mode

**Steps**:
1. Load the application at `http://localhost:3000`
2. Open DevTools > **Application tab** > **Service Workers**
3. Verify service worker is "activated and running"
4. Go to **Network tab**
5. Check the **Offline checkbox** (or select offline from throttling dropdown)
6. Refresh the page or navigate to different routes
7. Cached pages should load normally
8. API calls should fail gracefully with cached data if available
9. Uncheck **Offline** to restore connection

**What to Observe**:
- Dashboard loads with cached tickets
- Navigation still works between cached pages
- Offline status indicator appears (if implemented)
- Attempting to fetch new data shows cached version

### Testing Install Prompt

**Chrome Desktop**:
1. Open the application in Chrome (not Chromium, needs some history)
2. Look for **Install button** in the address bar (looks like a box with arrow)
3. Click to show install dialog
4. Choose "Install" to add to applications

**Chrome Mobile (Android)**:
1. Open the application in Chrome on Android device
2. Tap the **3-dot menu** (top right)
3. Select **"Install app"** (only shows if app meets PWA criteria)
4. Confirm installation
5. App appears on home screen as a shortcut

**iOS (Safari)**:
1. Open the application in Safari on iOS
2. Tap the **Share button** (box with arrow)
3. Scroll down and select **"Add to Home Screen"**
4. Name the shortcut (default is app name)
5. Tap **Add**
6. App appears on home screen (note: different from Android install)

**Testing Requirements Met**:
- Manifest.json loads successfully
- Icons are valid PNG files
- Service worker is registered and active
- HTTPS is enabled (or localhost for dev)
- User interaction triggered the prompt

### Clearing Service Worker Cache

**For Development/Testing**:

**Option 1: DevTools**
1. DevTools > **Application** > **Service Workers**
2. Click **Unregister** button next to the service worker
3. Clear site data: **Storage** > Select all > **Clear site data**
4. Refresh the page (service worker re-registers)

**Option 2: Browser Settings**
- Chrome: **Settings** > **Privacy and security** > **Clear browsing data**
- Select "Cookies and other site data" and "Cached images and files"
- Choose time range: "All time"
- Click **Clear data**

**Option 3: Manual Cache Update**
- Edit `CACHE_VERSION = 'v2'` in `service-worker.js`
- Refresh the page
- Old cache is replaced with new version on next request

### Lighthouse PWA Audit

**Running the Audit**:
1. Open DevTools (F12)
2. Go to **Lighthouse tab** (may need to search in tabs)
3. Select **PWA** under categories
4. Choose device type: **Mobile** (stricter) or **Desktop**
5. Click **Analyze page load**

**What to Look For**:
- ✅ Green checkmarks on all PWA criteria
- ✅ Manifest valid and icons present
- ✅ Service worker registered
- ✅ Installable criteria met
- ✅ Performance score 90+
- ✅ Best practices 90+

**Common Issues**:
- Missing or invalid manifest → Fix paths in HTML head
- Service worker errors → Check console for registration errors
- Icon issues → Verify icon paths in manifest.json
- Performance issues → Check cache strategy, reduce bundle size

---

## 5. Service Worker Caching Strategy

### Overview

Gnanalytica PM uses an intelligent, dual-strategy caching approach:

1. **Network-first** for API calls and dynamic data
2. **Stale-while-revalidate** for static assets

### Network-First Strategy (API Routes)

**Used for**: `/rest/*`, `/auth/*`, API endpoints

**How it works**:
1. Request goes to network first
2. If network succeeds, response is cached and returned
3. If network fails, cached response is returned
4. If both fail, fallback response is provided

**Benefits**:
- Always gets fresh data when possible
- Provides cached data when offline
- Users see latest information

**Example**:
```javascript
// Request to /rest/tickets
1. Try network → Success → Cache + Return new data
2. Try network → Fail → Return cached data
3. Both fail → Return error response
```

### Stale-While-Revalidate (Static Assets)

**Used for**: CSS, JavaScript, images, fonts

**How it works**:
1. Request is served from cache immediately
2. Simultaneously, fetch from network in background
3. If network response differs, cache is updated for next visit
4. User sees cached version instantly, gets update on next load

**Benefits**:
- Instant page loads (served from cache)
- Always checks for fresh assets
- Smooth experience with eventual consistency

**Example**:
```javascript
// Request to /styles.css
1. Return cached version instantly
2. Fetch from network in background
3. Update cache if version changed
```

### Cache Versioning

**Version String**: `CACHE_VERSION = 'v1'` in `service-worker.js`

**How Versioning Works**:
- Cache keys are prefixed with version: `v1:static`, `v1:api`
- When version changes to `v2`, new caches are created
- Old caches (`v1:*`) are automatically deleted
- Ensures fresh cache on app updates

**When to Update Version**:
- After deploying new static assets (CSS, JS, images)
- After major feature releases
- When fixing cache bugs
- Every 1-2 weeks for regular updates

**Updating Cache Version**:
```javascript
// In public/service-worker.js
const CACHE_VERSION = 'v1';  // Change to 'v2'
```

Then:
1. Deploy the updated service worker
2. Users' service workers automatically update in background
3. Next time service worker activates, old caches are cleaned up
4. New requests use fresh cache

### Cache Storage Limits

- **Per origin limit**: ~50 MB on desktop, ~10-50 MB on mobile (varies by browser)
- **Total browser limit**: Varies, but typically 10-100 GB total
- **Eviction**: Browsers may clear caches if storage is full
- **Monitoring**: DevTools > **Application** > **Storage** shows usage

### Debugging Cache Issues

**View Cached Responses**:
1. DevTools > **Application** > **Cache Storage**
2. Expand cache version folders (`v1:static`, `v1:api`, etc.)
3. Click entry to see cached response

**Clear Cache and Re-register**:
```javascript
// Run in console
await caches.keys().then(names => {
  return Promise.all(names.map(name => caches.delete(name)));
});
location.reload();
```

**Monitor Network Requests**:
1. DevTools > **Network** tab
2. Check response source: "from cache" or "from network"
3. Compare headers to verify freshness

---

## 6. App Manifest Configuration

### Manifest File Location

```
public/manifest.json
```

### Full Manifest Example

```json
{
  "name": "Gnanalytica Project Manager",
  "short_name": "Gnanalytica",
  "description": "A modern, responsive project management application with offline support",
  "start_url": "/dashboard",
  "scope": "/",
  "display": "standalone",
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "categories": ["productivity", "business"],
  "screenshots": [
    {
      "src": "/screenshots/desktop.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "/screenshots/mobile.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
```

### Key Configuration Fields

#### `name` (Required)
- **Value**: `"Gnanalytica Project Manager"`
- **Purpose**: Full application name
- **Used by**: Installation dialogs, app listings
- **Length**: Up to 45 characters recommended

#### `short_name` (Recommended)
- **Value**: `"Gnanalytica"`
- **Purpose**: Short name for home screen icon label
- **Used by**: Home screen, app switcher, limited space
- **Length**: Up to 12 characters for full display

#### `description`
- **Value**: Brief description of app functionality
- **Purpose**: Explains app purpose to users
- **Used by**: App stores, installation dialogs
- **Length**: 1-3 sentences

#### `display: "standalone"`
- **Value**: `"standalone"` (required for PWA)
- **Alternative values**: `"fullscreen"`, `"minimal-ui"`, `"browser"`
- **Purpose**: Removes browser UI (address bar, tabs)
- **Result**: App looks like native application

#### `start_url`
- **Value**: `"/dashboard"`
- **Purpose**: Page loaded when app is launched
- **Important**: Should be a cached page for offline support
- **Path**: Relative to app origin

#### `scope`
- **Value**: `"/"`
- **Purpose**: Defines which pages belong to the app
- **Important**: Determines which pages can be cached
- **Pattern**: `/` includes all pages, `/app/` includes only /app/* pages

#### `theme_color`
- **Value**: `"#ffffff"` (hex color)
- **Purpose**: Colors the browser UI (address bar, status bar on mobile)
- **Used by**: Android status bar, browser UI elements
- **Match**: Should match app's primary color

#### `background_color`
- **Value**: `"#ffffff"` (hex color)
- **Purpose**: Splash screen background while app loads
- **Used by**: iOS and Android splash screen
- **Match**: Should match app background

#### `orientation`
- **Value**: `"portrait-primary"`
- **Options**: `"portrait"`, `"landscape"`, `"portrait-primary"`, `"landscape-primary"`
- **Purpose**: Recommended screen orientation
- **Note**: User can override in app settings

#### `icons` Array
- **Purpose**: Application icons for different contexts
- **Fields**:
  - `src`: Path to icon file (relative to domain root)
  - `sizes`: Icon dimensions (e.g., "192x192")
  - `type`: MIME type (e.g., "image/png")
  - `purpose`: `"any"` (regular) or `"maskable"` (adaptive icons)

#### `categories`
- **Value**: `["productivity", "business"]`
- **Purpose**: App categorization for app stores
- **Valid values**: `"business"`, `"productivity"`, `"lifestyle"`, etc.

#### `screenshots`
- **Purpose**: Screenshots shown during installation
- **Fields**: `src`, `sizes`, `type`, `form_factor`
- **form_factor**: `"wide"` (desktop) or `"narrow"` (mobile)

### Linking Manifest in HTML

The manifest must be linked in the `<head>` of your HTML:

```html
<link rel="manifest" href="/manifest.json" />
```

This is typically done in your Next.js layout or head component:

```typescript
// app/layout.tsx
export const metadata = {
  title: "Gnanalytica PM",
  // ...
  manifest: "/manifest.json",
};
```

### Validating Manifest

**Method 1: DevTools**
1. DevTools > **Application** > **Manifest**
2. View parsed manifest
3. Errors appear in red, warnings in yellow

**Method 2: Web Manifest Validator**
- Visit: https://manifest-validator.appspot.com/
- Enter URL or upload manifest.json
- Receive detailed validation report

**Method 3: Console Check**
```javascript
// Run in console
fetch('/manifest.json')
  .then(r => r.json())
  .then(manifest => console.log('Manifest valid:', manifest))
  .catch(e => console.error('Invalid manifest:', e));
```

---

## 7. Install Prompt Behavior

### Installation Prompt Basics

The install prompt appears automatically when PWA criteria are met. The prompt and timing vary by browser and platform.

### When Install Prompt Shows

**Chrome Desktop**:
- ✅ Valid manifest.json
- ✅ Service worker registered
- ✅ HTTPS enabled (or localhost for dev)
- ✅ Icons present and valid
- ✅ display: "standalone"
- **Timing**: After ~30 seconds on first visit, or after user engagement
- **Location**: Install button in address bar (right side)

**Chrome Mobile (Android)**:
- ✅ Same requirements as desktop
- **Timing**: After ~30 seconds on first visit, or user scrolls down
- **Location**: 3-dot menu > "Install app" option
- **Requirements**: Not on iOS (uses different flow)

**Firefox**:
- ✅ Valid manifest.json
- ✅ Service worker registered
- ✅ Icons present
- **Timing**: On demand, triggered by manifest hint
- **Location**: Address bar icon

**Safari (iOS)**:
- ❌ No automatic install prompt
- **Alternative**: Share button > "Add to Home Screen"
- **Timing**: Always available from Share menu
- **Note**: Installed as Web Clip, not true PWA

**Safari (macOS)**:
- Similar to iOS, no automatic prompt
- Manual installation from Share menu

### Testing Install Prompt on Chrome Desktop

**Step 1: Build for Production**
```bash
npm run build
npm start  # Runs on http://localhost:3000
```

**Step 2: Clear Installation History**
1. Open DevTools
2. Application > Service Workers > Unregister
3. Application > Storage > Clear site data

**Step 3: Wait for Prompt**
1. Open http://localhost:3000
2. Wait 30 seconds or scroll down
3. Look for install button in address bar
4. Click install button

**Step 4: Confirm Installation**
- Click "Install" in dialog
- App appears in applications list
- Shortcut appears on desktop (may need to enable)

### Testing Install Prompt on Chrome Mobile

**Prerequisites**:
- Android device or emulator with Chrome
- USB debugging enabled (for physical device)
- Device connected to development machine

**Step 1: Enable Port Forwarding**
1. DevTools on desktop > More tools > Remote devices
2. Enable port forwarding: localhost:3000 to localhost:3000
3. Start dev server: `npm run dev`

**Step 2: Open on Mobile Chrome**
1. Open Chrome on Android
2. Navigate to http://localhost:3000
3. Wait for install prompt or trigger manually

**Step 3: Manual Trigger (if not showing)**
1. Tap 3-dot menu
2. Look for "Install app" option
3. Tap to show confirmation dialog
4. Tap "Install"
5. App shortcut added to home screen

### Install Prompt Dismissal

**User Actions**:
- Click "Install" → Installs app to home screen
- Click "Later" or close → Dismisses prompt (shows again later)
- Ignore for 5 minutes → Dismissed for session

**Programmatic Control** (Optional - Advanced):
```javascript
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Save the event for later
  deferredPrompt = e;

  // Show custom install button
  customInstallButton.style.display = 'block';

  // Prevent default install prompt
  e.preventDefault();
});

customInstallButton.addEventListener('click', async () => {
  // Show the install prompt when user clicks
  deferredPrompt.prompt();

  // Wait for user choice
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`User response: ${outcome}`);

  // Hide custom button
  customInstallButton.style.display = 'none';
  deferredPrompt = null;
});
```

### iOS Installation (Different Flow)

**No Automatic Prompt on iOS** - Users must manually install:

1. Open Safari
2. Navigate to https://gnanalytica.com (production URL)
3. Tap Share button (bottom or top, depending on iOS version)
4. Scroll and tap "Add to Home Screen"
5. Name appears (defaults to app name)
6. Tap "Add"
7. Icon appears on home screen

**iOS "Web Clip" vs Android PWA**:
- iOS: Web Clip (Web app, looks like app, but different)
- Android: True PWA (app badge, system integration, more native)

**Differences**:
- No offline support with iOS Web Clip (browsers handle it)
- No install prompt (manual only)
- Limited background sync
- Works in Safari engine only

### Samsung Internet Install

**Samsung Internet Browser** (Android-based):
1. Open app in Samsung Internet
2. Tap menu button
3. Tap "Install app"
4. Confirm installation
5. App appears on home screen

---

## 8. Offline Functionality

### How Offline Works in Gnanalytica PM

The app uses service worker and cache to provide offline access:

1. **Initial Load**: Service worker caches assets and pages
2. **Offline Detection**: App detects lost connection
3. **Cached Content**: Shows cached pages and data
4. **API Failures**: Gracefully handles failed requests
5. **Reconnection**: Notifies user when online, syncs updates

### Cached Pages

**Automatically Cached on Install**:
- `/` (Home page)
- `/dashboard` (Dashboard view)
- `/offline.html` (Offline fallback)
- All static assets (CSS, JS, images, fonts)

**Cached on Visit**:
- Any page the user visits is cached for offline access
- API responses are cached with network-first strategy
- Images and media are cached when downloaded

### Offline.html Fallback

**Location**: `public/offline.html`

**Purpose**: Shown when user navigates to uncached page while offline

**Content**:
- Friendly offline message
- Navigation links to cached pages
- Instructions for restoring connection
- Simple styling (no external dependencies)

**When it Shows**:
- User is offline
- Tries to navigate to page not in cache
- Service worker returns offline.html as fallback

### API Call Handling Offline

**Network-First Strategy**:
```
User requests /rest/tickets
  ↓
Try network request
  ├─ Success → Cache response + Return data (user sees latest)
  └─ Fail → Return cached response or error (user sees cached/stale data)
```

**Behavior**:
- Online: Always fetches fresh data
- Offline: Returns cached data if available
- Both fail: Shows error message or empty state

**Example Flow**:
```javascript
// User offline, previously fetched tickets
GET /rest/tickets
  → Network fails
  → Service worker returns cached response
  → User sees cached tickets from last online session
```

### Offline Indicator (Optional)

The app can show visual indicator of offline status:

```javascript
// Listen for online/offline events
window.addEventListener('online', () => {
  // User is now online
  showNotification('Connection restored');
});

window.addEventListener('offline', () => {
  // User is offline
  showNotification('You are offline. Some features may not work.');
});
```

### Manual Testing of Offline Features

**Method 1: DevTools Offline Mode**
1. DevTools > Network tab
2. Check "Offline" checkbox
3. Try navigating pages
4. Try making API calls
5. Uncheck to restore connection

**Method 2: Service Worker Debugging**
1. Go to cached page (e.g., /dashboard)
2. Check DevTools > Application > Cache Storage
3. Enable offline mode
4. Refresh page
5. Page loads from cache (check Network tab)

**Method 3: Network Throttling**
1. DevTools > Network tab
2. Select "Offline" from throttle dropdown
3. Navigate app
4. See which pages work offline
5. Note which API calls fail

### Performance Impact

**Benefits**:
- Instant page loads (served from cache)
- Reduced bandwidth usage
- Better battery life on mobile
- Offline access to core features

**Trade-offs**:
- Slight cache storage overhead (typically <10MB)
- Stale data until cache updates
- Need to handle conflict resolution if changes made offline

---

## 9. Mobile Browser Testing

### Browser-Based Testing (Desktop)

**Chrome DevTools Mobile Emulation**:

1. Open DevTools (F12)
2. Click **Device Toggle** button (icon that looks like phone/tablet) or Cmd+Shift+M
3. Select device from dropdown (iPhone, Pixel, iPad, etc.)
4. Emulated screen shows mobile view
5. Test responsiveness, touch interactions, etc.

**Available Devices**:
- iPhone SE, iPhone 12, iPhone 13, iPhone 14, iPhone 15
- Pixel 4, Pixel 5, Pixel 6, Pixel 7
- iPad, iPad Pro
- Custom dimensions

**What It Tests**:
- ✅ Responsive layout
- ✅ Touch event handling
- ✅ Media queries (viewport)
- ✅ DevTools features (Lighthouse, Application tab)
- ❌ True hardware acceleration
- ❌ Native APIs (geolocation, camera)
- ❌ Real performance characteristics

### Real Device Testing (Android)

**Prerequisites**:
- Android device (phone or tablet)
- USB cable
- USB debugging enabled on device
- Chrome browser on both devices
- Same Wi-Fi network (or USB connection)

**Step 1: Enable USB Debugging**
1. Settings > About phone
2. Tap "Build number" 7 times
3. Developer options appear
4. Developer options > USB debugging > Enable
5. Connect device via USB

**Step 2: Open DevTools Remote Devices**
1. DevTools on desktop > More tools > Remote devices
2. Enable port forwarding if needed
3. Connect device (allow USB debugging prompt)
4. Device appears in DevTools

**Step 3: Inspect Remote Page**
1. Open Chrome on Android
2. Navigate to http://localhost:3000 or public URL
3. DevTools shows the page
4. Inspect elements, view console, debug

**Step 4: Install App on Android**
1. Chrome menu (3 dots) > "Install app"
2. Confirm installation
3. App appears on home screen
4. Tap to launch installed app
5. Test offline functionality
6. Test install prompt on real device

### Real Device Testing (iOS)

**Prerequisites**:
- iOS device (iPhone or iPad)
- macOS computer
- Safari browser on both devices
- Same Wi-Fi network
- Lightning/USB-C cable

**Step 1: Enable Web Inspector**
1. iOS: Settings > Safari > Advanced > Web Inspector > ON
2. macOS: Safari > Preferences > Advanced > Show features for web developers

**Step 2: Connect Device**
1. Connect iOS device to macOS with cable
2. Unlock device and tap "Trust"
3. macOS Safari > Develop menu
4. Select your device from list

**Step 3: Inspect Remote Page**
1. Open Safari on iOS
2. Navigate to http://localhost:3000 or public URL
3. macOS Safari shows Web Inspector
4. Inspect elements, view console, debug

**Step 4: Install App on iOS**
1. Safari > Share button
2. Scroll down, tap "Add to Home Screen"
3. Name the shortcut
4. Tap "Add"
5. Icon appears on home screen
6. Tap to launch Web Clip
7. Test offline functionality
8. Note: Different from Android PWA

### Testing Performance

**Method 1: DevTools Performance Tab**
1. DevTools > Performance tab
2. Click record button (red circle)
3. Interact with app (scroll, navigate, etc.)
4. Stop recording
5. Analyze performance timeline

**Method 2: Lighthouse Audit**
1. DevTools > Lighthouse tab
2. Select categories: Performance, Accessibility, Best Practices, SEO, PWA
3. Choose device: Mobile (recommended) or Desktop
4. Click "Analyze page load"
5. Get detailed performance report

**Method 3: Chrome User Experience Report**
- Visit: https://crux.run/
- Enter URL
- View real user performance metrics
- See device-specific data

**Performance Metrics to Check**:
- **FCP** (First Contentful Paint): < 1.8s
- **LCP** (Largest Contentful Paint): < 2.5s
- **CLS** (Cumulative Layout Shift): < 0.1
- **TTI** (Time to Interactive): < 3.8s

### Mobile Debugging Commands

**Console in Mobile Safari**:
```javascript
// Check service worker registration
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log(regs));

// Check manifest
fetch('/manifest.json')
  .then(r => r.json())
  .then(m => console.log(m));

// Test online status
console.log('Online:', navigator.onLine);

// Clear service worker and cache
navigator.serviceWorker.getRegistrations()
  .then(regs => regs.forEach(r => r.unregister()));
caches.keys()
  .then(names => Promise.all(names.map(n => caches.delete(n))));
```

### Testing Checklist

- [ ] Responsive layout on iPhone SE (375px)
- [ ] Responsive layout on iPad (768px)
- [ ] Responsive layout on Android phone (360-412px)
- [ ] Touch interactions work (tap, scroll, swipe)
- [ ] Forms are mobile-friendly
- [ ] Install prompt shows on Android
- [ ] App installable on iOS (Web Clip)
- [ ] Offline mode works with DevTools Offline
- [ ] Lighthouse PWA audit passes (90+)
- [ ] Performance acceptable (< 3s FCP on 3G)
- [ ] App loads and functions correctly
- [ ] No console errors or warnings
- [ ] Images display correctly at all sizes
- [ ] Text is readable without zoom

---

## 10. Deployment Checklist

Before deploying Gnanalytica PM to production, verify all items below:

### Assets & Files

- [ ] **Icon Files Exist**
  - `/public/icons/icon-192.png` (192x192, PNG)
  - `/public/icons/icon-512.png` (512x512, PNG)
  - Icons have transparent background
  - Icons support maskable-area for adaptive icons

- [ ] **Manifest Valid**
  - `/public/manifest.json` exists and is valid
  - Correct `start_url` (should be cached page)
  - Correct `scope` (typically `/`)
  - Valid hex colors for `theme_color` and `background_color`
  - All icon paths point to correct files

- [ ] **Service Worker Configured**
  - `/public/service-worker.js` is registered
  - Service worker auto-registered in layout component
  - Offline.html exists and is accessible
  - Service worker script is not cached excessively

- [ ] **Offline Fallback**
  - `/public/offline.html` exists
  - Contains navigation to cached pages
  - Has friendly offline message
  - Doesn't require external CSS or JS

### Configuration

- [ ] **Manifest Linked in Head**
  ```html
  <link rel="manifest" href="/manifest.json" />
  ```

- [ ] **Service Worker Registered**
  ```javascript
  navigator.serviceWorker.register('/service-worker.js')
  ```

- [ ] **Meta Tags Present**
  ```html
  <meta name="theme-color" content="#ffffff" />
  <meta name="description" content="..." />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ```

### Responsive Design

- [ ] **Mobile Layout (< 640px)**
  - Navigation works on small screens
  - Text is readable without zoom
  - Touch targets are 48px+ (Mobile Safe Tap Targets)
  - No horizontal scroll

- [ ] **Tablet Layout (640px - 1024px)**
  - Two-column or three-column layout renders correctly
  - Images scale proportionally
  - Forms are easy to use

- [ ] **Desktop Layout (> 1024px)**
  - Full three-panel layout works
  - Sidebar visible and functional
  - Content area is properly sized
  - Detail panel can be toggled

### Lighthouse Audit

- [ ] **Run Lighthouse**
  1. DevTools > Lighthouse
  2. Select **PWA** category
  3. Choose **Mobile** device
  4. Click "Analyze page load"

- [ ] **PWA Audit Results**
  - [ ] Installable criteria: ✅ PASS
  - [ ] Works offline: ✅ PASS
  - [ ] Responsive design: ✅ PASS
  - [ ] Theme color set: ✅ PASS
  - [ ] Icon masks: ✅ PASS

- [ ] **Performance Audit Results**
  - [ ] Performance score: 90+
  - [ ] First Contentful Paint: < 1.8s
  - [ ] Largest Contentful Paint: < 2.5s
  - [ ] Cumulative Layout Shift: < 0.1

- [ ] **Best Practices**
  - [ ] Score: 90+
  - [ ] No console errors
  - [ ] No console warnings
  - [ ] Secure context (HTTPS)

### Functionality Testing

- [ ] **Installation**
  - [ ] Install prompt appears on Chrome Desktop
  - [ ] Install button works on Chrome Mobile
  - [ ] App installable on iOS (Web Clip)
  - [ ] App appears on home screen correctly

- [ ] **Offline Mode**
  - [ ] Cached pages load while offline
  - [ ] Service worker is active and running
  - [ ] API failures show cached data
  - [ ] App gracefully handles offline state

- [ ] **App Functionality**
  - [ ] Dashboard loads and displays tickets
  - [ ] Navigation works between pages
  - [ ] Create/edit tickets works
  - [ ] Search and filtering functional
  - [ ] Settings and preferences work

### Server Configuration

- [ ] **HTTPS Enabled**
  - Production URL uses HTTPS
  - Certificates are valid and not expired
  - No mixed HTTP/HTTPS content

- [ ] **Cache Headers Configured**
  - Service worker: `Cache-Control: no-cache`
  - Static assets: `Cache-Control: public, max-age=31536000`
  - HTML files: `Cache-Control: public, max-age=3600`

- [ ] **Security Headers Set**
  ```
  Content-Security-Policy: ...
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  ```

- [ ] **MIME Types Correct**
  - `.json` files served as `application/json`
  - `.js` files served as `application/javascript`
  - Images served with correct type
  - Service worker served as `application/javascript`

- [ ] **Compression Enabled**
  - Gzip compression enabled
  - Brotli compression enabled (optional)
  - CSS and JS are minified
  - Images are optimized

### Monitoring & Analytics

- [ ] **Error Tracking**
  - Error logging configured (e.g., Sentry)
  - Service worker errors tracked
  - API failures monitored

- [ ] **Performance Monitoring**
  - Real User Monitoring (RUM) configured
  - Core Web Vitals tracked
  - Installation metrics tracked

- [ ] **Analytics**
  - Page views tracked
  - User interactions logged
  - Install events tracked

### Documentation

- [ ] **README Updated**
  - Deployment instructions clear
  - Environment variables documented
  - Build process documented

- [ ] **This Guide Updated**
  - Production URL documented
  - Deployment procedure documented
  - Known issues listed

### Pre-Deployment Final Check

- [ ] Run `npm run build` successfully
- [ ] No TypeScript errors
- [ ] No console warnings in build output
- [ ] Lighthouse audit passes (all green)
- [ ] Manual testing on mobile device passed
- [ ] All tests passing (`npm run test`)
- [ ] Code review completed
- [ ] Security review completed

---

## 11. Troubleshooting

### Service Worker Not Registering

**Symptoms**:
- DevTools shows no service worker
- Console shows registration errors
- App doesn't work offline

**Solutions**:

1. **Check File Path**
   - Verify `/public/service-worker.js` exists
   - Ensure path in registration matches: `/service-worker.js`
   - Service worker must be at root (not in subdirectory)

2. **Check Browser Console**
   ```javascript
   // Run in console
   navigator.serviceWorker.register('/service-worker.js')
     .then(r => console.log('Success', r))
     .catch(e => console.error('Error', e));
   ```
   - Look for specific error message
   - Common: "Service Worker registration failed: NetworkError"

3. **Verify HTTPS or Localhost**
   - Service workers require HTTPS (or localhost for dev)
   - If not HTTPS, registration fails silently
   - Check: URL starts with `https://` or `http://localhost`

4. **Clear Cache and Re-register**
   ```javascript
   // Run in console
   navigator.serviceWorker.getRegistrations()
     .then(regs => regs.forEach(r => r.unregister()))
     .then(() => location.reload());
   ```

5. **Check Browser Support**
   - Service workers require modern browser
   - Unsupported: IE 11, older Android browsers
   - Verify: Chrome 40+, Firefox 44+, Safari 11.1+, Edge 17+

### Install Prompt Not Showing

**Symptoms**:
- No install button in Chrome address bar
- No "Install app" option in mobile menu
- Install prompt never appears

**Solutions**:

1. **Verify PWA Criteria Met**
   - DevTools > Application > Manifest: Check for errors
   - DevTools > Application > Service Workers: Should show "activated and running"
   - Verify HTTPS or localhost
   - Check manifest.json is valid JSON

2. **Chrome Desktop Requirements**
   - Must meet all PWA criteria (see above)
   - Typically shows after ~30 seconds on first visit
   - Requires some browser history (can't be first visit to origin)
   - Try different page or come back later

3. **Chrome Mobile Requirements**
   - Open with mobile Chrome (not WebView)
   - Wait 30 seconds or scroll down page
   - Ensure sufficient content on page
   - May not show on home page, try inner page

4. **Clear Installation State**
   ```javascript
   // Run in console
   await caches.keys().then(names =>
     Promise.all(names.map(n => caches.delete(n)))
   );
   await navigator.serviceWorker.getRegistrations()
     .then(regs => Promise.all(regs.map(r => r.unregister())));
   // Then close and reopen tab
   ```

5. **Test with Lighthouse**
   1. DevTools > Lighthouse
   2. Run audit with PWA category
   3. Check "Installable" section for requirements not met
   4. Fix any errors listed

### Offline Mode Not Working

**Symptoms**:
- Pages don't load while offline
- Blank page or error when offline
- Service worker doesn't intercept requests

**Solutions**:

1. **Verify Service Worker Active**
   - DevTools > Application > Service Workers
   - Should show "activated and running" status
   - Click to view installed URLs

2. **Check Cache Contents**
   - DevTools > Application > Cache Storage
   - Expand cache folders (e.g., `v1:static`, `v1:api`)
   - Verify expected pages and assets are cached
   - If empty, service worker may not be installing correctly

3. **Test Offline Mode**
   1. DevTools > Network tab
   2. Load page once (to cache it)
   3. Check "Offline" checkbox
   4. Refresh page
   5. Should load from cache

4. **Check Service Worker Scope**
   - Verify service worker is at root (`/service-worker.js`)
   - Scope in `manifest.json` should be `/`
   - Scope too narrow (e.g., `/app/`) limits cached pages

5. **Verify Cached Routes**
   - Service worker should cache: `/`, `/dashboard`, all static assets
   - Check which routes are cached in DevTools
   - Add more routes to precache list if needed

### Icons Not Loading

**Symptoms**:
- Manifest shows error for icons
- Icons don't appear on home screen
- App icon is default/generic

**Solutions**:

1. **Verify File Existence**
   ```bash
   # Check files exist
   ls -la public/icons/
   # Should show: icon-192.png, icon-512.png
   ```

2. **Check Manifest Paths**
   - Verify paths in manifest.json match actual files
   - Paths must be absolute: `/icons/icon-192.png` (not `./icons/`)
   - Check for typos in filenames

3. **Verify Icon Format**
   - Icons must be PNG format
   - Check dimensions: 192x192 and 512x512
   - Verify file is valid PNG:
   ```bash
   file public/icons/icon-192.png
   # Output: PNG image data, 192 x 192, 8-bit/color RGBA
   ```

4. **Check Image Integrity**
   - Icon must have transparent background
   - File size should be reasonable (< 100KB each)
   - Try opening icon in image viewer to verify

5. **Clear Cache and Reload**
   ```javascript
   // Run in console
   await caches.keys().then(names =>
     Promise.all(names.map(n => caches.delete(n)))
   );
   location.reload();
   ```

6. **Verify in DevTools**
   - DevTools > Application > Manifest
   - Check icons section
   - Click icon link to verify it loads in new tab

### Performance Issues

**Symptoms**:
- App loads slowly
- Page transitions are slow
- Lighthouse performance score < 90

**Solutions**:

1. **Run Lighthouse Audit**
   - DevTools > Lighthouse > Performance
   - Identifies specific performance issues
   - Follow recommendations in report

2. **Check Cache Effectiveness**
   - DevTools > Network tab > look for "(from cache)"
   - Many requests should be served from cache
   - If few cached, increase number of cached assets

3. **Analyze JavaScript Bundle**
   ```bash
   npm run build
   npm run analyze  # If analyzer configured
   ```
   - Identify large dependencies
   - Consider code splitting
   - Remove unused dependencies

4. **Check Network Performance**
   - Network tab > Throttling dropdown
   - Simulate slow 4G network
   - Test performance on simulated network
   - Ensure acceptable on 3G

5. **Optimize Images**
   - Use optimized image sizes
   - WebP format for modern browsers
   - Lazy load images below fold
   - Remove images from critical path

6. **Monitor Real User Performance**
   - Implement RUM (Real User Monitoring)
   - Track Core Web Vitals in production
   - Identify actual bottlenecks from real users

---

## 12. References

### Web Standards & Learning

- **Web.dev Progressive Web Apps**: https://web.dev/progressive-web-apps/
  - Comprehensive PWA learning path
  - Step-by-step tutorials
  - Best practices and patterns

- **Service Worker API (MDN)**: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
  - Complete API documentation
  - Code examples and patterns
  - Browser compatibility

- **Web App Manifest (MDN)**: https://developer.mozilla.org/en-US/docs/Web/Manifest
  - Full manifest.json specification
  - Field definitions and options
  - Browser support details

### Tools & Testing

- **Lighthouse PWA Audit**: https://developers.google.com/web/tools/lighthouse
  - Built-in DevTools audit
  - PWA assessment criteria
  - Performance and best practices

- **Chrome DevTools**: https://developer.chrome.com/docs/devtools/
  - Service worker debugging
  - Application tab features
  - Offline simulation tools

- **Web Manifest Validator**: https://manifest-validator.appspot.com/
  - Online manifest validation
  - Detailed error reporting
  - Recommendations for improvement

### Browser Documentation

- **Chrome PWA**: https://developer.chrome.com/docs/web-platform/pwa/
- **Firefox PWA**: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- **Apple Web App**: https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html

### Community & Support

- **Web.dev Community**: https://web.dev/about/#community
- **Stack Overflow**: [Tag: progressive-web-apps](https://stackoverflow.com/questions/tagged/progressive-web-apps)
- **Chrome Developers Blog**: https://developer.chrome.com/blog/

### Related Documentation

- **Next.js PWA Guide** (if applicable): https://nextjs.org/docs
- **Supabase Offline Sync**: https://supabase.com/docs (if using Supabase)
- **TypeScript Types**: https://github.com/microsoft/TypeScript-DOM-lib-generator

---

## Summary

This guide provides everything needed to understand, develop, test, and deploy Gnanalytica PM as a Progressive Web App. Key points:

1. **PWA provides**: Offline access, installable app, fast loading, responsive design
2. **Local testing**: Use `npm run dev`, DevTools Application tab, and offline mode
3. **Installation**: Works on Android (true PWA) and iOS (Web Clip)
4. **Caching**: Network-first for APIs, stale-while-revalidate for assets
5. **Deployment**: Follow the 50-point checklist before going to production

For questions or issues, refer to the troubleshooting section or consult the referenced web.dev and MDN documentation.

Happy PWA development!
