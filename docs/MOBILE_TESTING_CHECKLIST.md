# Mobile Testing Checklist

This document provides a structured checklist for testing the mobile-first responsive design and PWA features of the Gnanalytica-PM application. Use this checklist to validate functionality across devices, screen sizes, and network conditions.

## 1. Device & Screen Size Testing

Test the application on the following devices and viewport sizes to ensure responsive behavior:

| Device | Viewport Width | Key Characteristics | Test Status |
|--------|---|---|---|
| iPhone SE | 375px | Small mobile, older device | [ ] |
| iPhone 12/13 | 390px | Standard mobile size | [ ] |
| iPhone 14 Pro Max | 430px | Large mobile, safe area edges | [ ] |
| Android Phone | 375px | Standard Android device | [ ] |
| iPad | 768px | Tablet size, landscape/portrait | [ ] |
| iPad Pro | 1024px | Large tablet, multi-tasking | [ ] |
| Android Tablet | 600px | Medium tablet size | [ ] |
| Desktop | 1920px+ | Wide desktop, full layout | [ ] |

### Test Criteria for Each Device
- [ ] Content displays without horizontal overflow
- [ ] Text is readable without zoom
- [ ] All interactive elements are properly sized
- [ ] Navigation is appropriate for screen size
- [ ] Images scale appropriately

---

## 2. Responsive Layout Testing

Verify that the application's layout responds correctly to viewport changes.

### Sidebar Navigation
- [ ] **Mobile (<768px)**: Sidebar hidden by default, accessible via drawer/hamburger menu
- [ ] **Tablet (768px-1024px)**: Sidebar visible but possibly collapsed
- [ ] **Desktop (1024px+)**: Full sidebar visible with all labels
- [ ] **Drawer behavior**: Opens with overlay, closes with back button or outside tap
- [ ] **Animation**: Smooth slide-in/out transition

### Three-Panel Layout
- [ ] **Mobile**: Panels stack vertically, one visible at a time
- [ ] **Tablet**: Up to 2 panels visible, possible horizontal scroll
- [ ] **Desktop (lg breakpoint)**: All three panels visible inline
- [ ] **Panel resizing**: Dividers allow resize without breaking layout
- [ ] **Content preservation**: Panel content maintains state during resize

### Typography & Spacing
- [ ] **Heading scales**: h1/h2/h3 sizes adapt to viewport (smaller on mobile)
- [ ] **Body text**: 16px minimum on mobile (no zoom required)
- [ ] **Line height**: Comfortable reading distance (1.5-1.8)
- [ ] **Margins/Padding**: Consistent spacing, tighter on mobile
- [ ] **Text truncation**: Long text truncates with ellipsis, not overflow

### Images & Media
- [ ] **Responsive images**: Load appropriate size for device (srcset)
- [ ] **Avatar sizing**: Consistent across different breakpoints
- [ ] **Background images**: Scale without distortion
- [ ] **Aspect ratios**: Maintained in cards and components

### Touch Targets
- [ ] **Button size**: All clickable elements ≥44x44px (recommended minimum)
- [ ] **Button spacing**: Adequate margin between interactive elements
- [ ] **Form inputs**: Touch-friendly size, clear tap target
- [ ] **Links**: No text links smaller than 44px click area
- [ ] **Hover states**: Only apply on non-touch devices (no hover on mobile)

---

## 3. PWA Features Testing

Verify all Progressive Web App capabilities are working correctly.

### Install Prompt
- [ ] **iOS (Home Screen)**: Safari prompts to "Add to Home Screen"
- [ ] **Chrome Android**: Install banner appears at appropriate time
- [ ] **Chrome Desktop**: Install prompt in address bar
- [ ] **Dismissal**: Can dismiss and prompt appears again after 3 days
- [ ] **Completion**: Icon appears on home screen/desktop after install

### App Icon & Appearance
- [ ] **Home screen icon**: Displays correct 192x192px icon (standard mobile)
- [ ] **App switcher**: Shows correct 512x512px icon on app switch
- [ ] **Splash screen**: Displays during startup (iOS/Android)
- [ ] **Theme color**: Status bar matches brand color on Android
- [ ] **Display mode**: Standalone mode (no browser UI visible)

### Offline Mode
- [ ] **App loads offline**: Opens to cached shell after first visit
- [ ] **Cached pages**: Previously visited pages load from cache
- [ ] **API calls fail gracefully**: Error states appear, no crashes
- [ ] **Offline indicator**: Visual feedback that app is offline (optional)
- [ ] **Service Worker active**: Check DevTools > Application > Service Workers

### Service Worker
- [ ] **Registration**: Service worker registers without errors
- [ ] **DevTools visibility**: Shows in DevTools > Application > Service Workers
- [ ] **Cache storage**: Check DevTools > Application > Cache Storage
- [ ] **Version control**: New version installs and updates correctly
- [ ] **Scope correct**: Service worker scope is `/` (entire app)

### Manifest File
- [ ] **Valid JSON**: Open `/public/manifest.json`, no parse errors
- [ ] **Required fields**: name, short_name, icons, start_url, display present
- [ ] **Icons exist**: All icons in manifest exist and load
- [ ] **Theme colors**: theme_color and background_color valid hex codes
- [ ] **Start URL**: Points to `/` with trailing slash if needed

---

## 4. Performance Testing

Measure and validate Core Web Vitals and performance metrics.

### Lighthouse Scores
Run Lighthouse in Chrome DevTools (Lighthouse tab):

| Metric | Target | Mobile | Desktop | Status |
|--------|--------|--------|---------|--------|
| Performance | ≥90 | [ ] | [ ] | |
| Accessibility | ≥90 | [ ] | [ ] | |
| Best Practices | ≥90 | [ ] | [ ] | |
| SEO | ≥90 | [ ] | [ ] | |
| PWA | ≥100 | [ ] | [ ] | |

### Core Web Vitals
- [ ] **First Contentful Paint (FCP)**: < 2.0 seconds
- [ ] **Largest Contentful Paint (LCP)**: < 2.5 seconds
- [ ] **Cumulative Layout Shift (CLS)**: < 0.1
- [ ] **Interaction to Next Paint (INP)**: < 200ms
- [ ] **Time to Interactive (TTI)**: < 4 seconds

### Cache Performance
- [ ] **Offline page load**: < 100ms (after first visit)
- [ ] **Cache size**: Reasonable size (< 50MB for reasonable offline experience)
- [ ] **Cache cleanup**: Old entries removed appropriately
- [ ] **Asset caching**: Static assets return 304 Not Modified on repeat visits

### Build & Bundle Size
- [ ] **Initial JS bundle**: < 200KB gzipped
- [ ] **Main chunk**: Loaded immediately, no major third-party blocking
- [ ] **Code splitting**: Route chunks load on demand
- [ ] **Images optimized**: No oversized images in bundle

---

## 5. Network Conditions Testing

Test application behavior under various network conditions.

### Slow 3G
Using Chrome DevTools Network throttling (Slow 3G preset):
- [ ] **Page loads**: Still usable, skeleton loaders appear
- [ ] **Content displays**: Main content loads within 5-10 seconds
- [ ] **Caching works**: Repeat visits load from cache quickly
- [ ] **No timeout**: App doesn't timeout or show errors
- [ ] **User feedback**: Loading states are visible and informative

### Offline Mode
Disconnect network or use DevTools offline simulation:
- [ ] **App remains open**: No crash or white screen
- [ ] **Fallback page**: Shows offline.html or cached shell
- [ ] **Cached content**: Loads previously visited pages
- [ ] **API calls fail gracefully**: Shows "No connection" error or uses stale data
- [ ] **Buttons disabled**: Submission buttons disabled or show warning

### Online After Offline
Reconnect network after being offline:
- [ ] **Auto-detection**: App detects connection restored
- [ ] **Refresh notification**: Optional toast/banner prompts user to refresh
- [ ] **Auto-refresh**: Page automatically reloads (if configured)
- [ ] **Data sync**: Any queued actions attempt to sync
- [ ] **No duplicate submissions**: Form submissions not duplicated

### API Retry Behavior
Simulate API failures or slow responses:
- [ ] **Failed requests**: Show error message to user
- [ ] **Retry logic**: Automatically retry failed requests (e.g., 3 attempts)
- [ ] **Exponential backoff**: Retry delays increase appropriately
- [ ] **User notification**: Clear error messages indicate issue
- [ ] **Recovery**: App fully functional once connection restored

---

## 6. Touch & Interaction Testing

Validate touch interactions and mobile-specific behaviors.

### Touch Targets
- [ ] **Button minimum**: All buttons ≥44x44px (44x48px recommended)
- [ ] **Comfortable spacing**: Buttons/links spaced ≥8px apart
- [ ] **Form fields**: Input areas ≥44px height for easy touch
- [ ] **Scrollable areas**: Clear visual scroll indicators
- [ ] **Tap zones**: No hover-only controls (all actions available to touch)

### Scrolling & Animations
- [ ] **Smooth scrolling**: No janky scrolling (60fps)
- [ ] **Momentum scrolling**: iOS momentum scroll enabled
- [ ] **Overscroll bounce**: Native feel on iOS
- [ ] **Pull-to-refresh**: Doesn't interfere with normal scrolling (if implemented)
- [ ] **Animation performance**: Animations use transform/opacity (GPU-accelerated)

### Gesture Support
- [ ] **Pinch-to-zoom**: Works and zooms appropriately
- [ ] **Double-tap zoom**: Disabled on input fields (prevent auto-zoom)
- [ ] **Long press**: Opens context menu if applicable
- [ ] **Swipe gestures**: Back/forward swipe works where implemented
- [ ] **Touch cancellation**: Cancelled touches don't trigger actions

### Input Interactions
- [ ] **Autocomplete**: Browser autofill works for email/password
- [ ] **Autocorrect**: Spelling correction appears for text inputs
- [ ] **Keyboard**: Correct keyboard type appears (email, number, tel, etc.)
- [ ] **Focus visible**: Clear focus indicator on form fields
- [ ] **Placeholder text**: Visible and disappears when typing

---

## 7. Browser Compatibility

Test across different browsers and platforms to ensure broad compatibility.

### iOS Safari
- [ ] **Page loads**: No errors, renders correctly
- [ ] **Install prompt**: "Add to Home Screen" works
- [ ] **Standalone mode**: App runs fullscreen when installed
- [ ] **Status bar**: Matches theme color
- [ ] **Service worker**: Registered and working
- [ ] **LocalStorage**: Data persists across sessions
- [ ] **Performance**: Acceptable speed on iPhone SE

### Chrome Android
- [ ] **Page loads**: Renders without issues
- [ ] **Install banner**: Appears after engagement heuristics met
- [ ] **Service worker**: Registered and visible in DevTools
- [ ] **Offline support**: App works offline
- [ ] **Theme color**: Status bar and address bar themed
- [ ] **WebView**: Works in custom tabs/WebView context

### Firefox Mobile
- [ ] **Page loads**: No rendering issues
- [ ] **Responsive layout**: All breakpoints work
- [ ] **Service worker**: Supported and registered
- [ ] **Performance**: Acceptable speed
- [ ] **LocalStorage**: Works and persists
- [ ] **Feature parity**: No major missing features vs Chrome

### Samsung Internet
- [ ] **Page loads**: Renders correctly
- [ ] **Install prompt**: Web app install works
- [ ] **Performance**: Acceptable speed on Samsung devices
- [ ] **Service worker**: Supported
- [ ] **Security**: No warnings or errors

### Desktop Chrome/Firefox
- [ ] **Responsive layout**: All breakpoints work
- [ ] **Install prompt**: Appears in address bar when criteria met
- [ ] **Desktop PWA**: Can be installed as desktop app
- [ ] **Performance**: Excellent speed
- [ ] **DevTools**: No console errors

---

## 8. Accessibility Testing

Ensure the application meets WCAG 2.1 AA accessibility standards.

### Reduced Motion
- [ ] **Prefers-reduced-motion respected**: Animations pause/reduce when enabled
- [ ] **Transitions**: No auto-playing animations with motion
- [ ] **Parallax disabled**: Parallax scrolling disabled for reduced motion users
- [ ] **Page transitions**: Fade instead of slide for reduced motion
- [ ] **No animation blocking**: Reduced motion users can still complete tasks

### Color Contrast
- [ ] **Text contrast**: ≥4.5:1 for normal text (WCAG AA)
- [ ] **Large text contrast**: ≥3:1 for large text (18px+ or 14px+ bold)
- [ ] **UI components**: Non-text elements have sufficient contrast
- [ ] **Focus indicators**: Visible focus rings with adequate contrast
- [ ] **Color not only**: Don't rely on color alone to convey information

### Screen Reader Support
Using iOS VoiceOver or Android TalkBack:
- [ ] **Headings**: Properly marked with semantic HTML (h1-h6)
- [ ] **Form labels**: Associated with inputs via `<label>` or aria-label
- [ ] **Buttons**: Announce purpose clearly
- [ ] **Images**: Have alt text describing content (or aria-hidden if decorative)
- [ ] **Links**: Announce destination or purpose
- [ ] **Live regions**: ARIA live regions for dynamic content updates
- [ ] **List structure**: Lists announced correctly with item counts
- [ ] **Navigation**: Landmarks (nav, main, aside) properly used

### Keyboard Navigation
Using hardware keyboard or Tab key:
- [ ] **Tab order**: Logical tab order (left-to-right, top-to-bottom)
- [ ] **Skip links**: Skip to main content link available
- [ ] **Focus visible**: Clear focus indicator on all interactive elements
- [ ] **No keyboard traps**: Can tab out of any element
- [ ] **Enter/Space**: Buttons/checkboxes activate with Enter or Space
- [ ] **Arrow keys**: Dropdowns/menus navigate with arrow keys
- [ ] **Escape key**: Closes modals and dropdowns
- [ ] **All features accessible**: No mouse-only features

### Focus Management
- [ ] **Focus outline**: Visible on all interactive elements
- [ ] **Focus color**: High contrast (min 3:1 against background)
- [ ] **Focus ring**: Width ≥2px, not hidden on click
- [ ] **Modal focus**: Focus trapped in modal when open
- [ ] **Focus restoration**: Returns to trigger element after modal closes

---

## 9. Visual Testing Across Breakpoints

Test layout and visual appearance at key breakpoints.

### 320px (Small Mobile)
- [ ] **Single column**: Content stacks vertically
- [ ] **Navigation**: Hamburger menu only, sidebar collapsed
- [ ] **Spacing**: Tight padding (16px), readable
- [ ] **Font sizes**: Reduced for small screen, still readable
- [ ] **Images**: Scaled down, not oversized
- [ ] **No horizontal scroll**: Content fits viewport width
- [ ] **Touch targets**: All buttons/links ≥44x44px

### 480px (Standard Mobile)
- [ ] **Improved spacing**: Better padding/margins than 320px
- [ ] **Typography**: Readable without zoom
- [ ] **Images**: Appropriately sized
- [ ] **Navigation drawer**: Works smoothly
- [ ] **Form fields**: Easy to tap
- [ ] **Content width**: Optimal line length for reading

### 768px (Tablet Portrait)
- [ ] **Sidebar visible**: Navigation sidebar shows (possibly collapsed)
- [ ] **Two-column layout**: Sidebar + content visible
- [ ] **Better spacing**: More generous margins
- [ ] **Larger fonts**: Comfortable reading size
- [ ] **Detail panel**: Not visible (only on wider screens)
- [ ] **Landscape mode**: Proper layout when rotated

### 1024px (Tablet Landscape / Desktop)
- [ ] **Three-panel layout**: All three panels visible (sidebar, content, detail)
- [ ] **Full navigation**: All labels visible in sidebar
- [ ] **Optimal spacing**: Content well-distributed
- [ ] **Panel dividers**: Visible and draggable for resize
- [ ] **Full feature access**: All controls visible without scrolling
- [ ] **Desktop mode**: Hover states and full interaction model

### 1920px (Wide Desktop)
- [ ] **Proper utilization**: Content doesn't stretch too wide
- [ ] **Max-width constraints**: Content limited to readable width
- [ ] **Comfortable spacing**: Not cramped, not stretched
- [ ] **Multi-panel view**: All panels visible with good proportions
- [ ] **Sidebar width**: Proportional to overall width
- [ ] **Detail panel**: Sufficient width for complex content

---

## 10. Testing Checklist Template

Use this template to document your testing results and any issues found.

### Test Run: [Date] - [Tester Name] - [Device/Browser]

**Device Information:**
- Device Model: _____________________
- Operating System: _____________________
- Browser: _____________________
- OS Version: _____________________
- Browser Version: _____________________
- Network Connection: _____________________

**Test Results:**

#### Device & Screen Size Testing
- [ ] Layout displays without overflow (Pass / Fail / N/A)
- [ ] Content is readable without zoom (Pass / Fail / N/A)
- [ ] Interactive elements properly sized (Pass / Fail / N/A)
- Issues: _____________________

#### Responsive Layout Testing
- [ ] Sidebar behavior correct (Pass / Fail / N/A)
- [ ] Three-panel layout responsive (Pass / Fail / N/A)
- [ ] Typography scales appropriately (Pass / Fail / N/A)
- [ ] Touch targets ≥44x44px (Pass / Fail / N/A)
- Issues: _____________________

#### PWA Features Testing
- [ ] Install prompt appears/works (Pass / Fail / N/A)
- [ ] App icon displays correctly (Pass / Fail / N/A)
- [ ] Offline mode functional (Pass / Fail / N/A)
- [ ] Service worker registered (Pass / Fail / N/A)
- [ ] Manifest.json valid (Pass / Fail / N/A)
- Issues: _____________________

#### Performance Testing
- [ ] Lighthouse Performance ≥90 (Pass / Fail / N/A)
- [ ] FCP < 2.0s (Pass / Fail / N/A)
- [ ] LCP < 2.5s (Pass / Fail / N/A)
- [ ] CLS < 0.1 (Pass / Fail / N/A)
- [ ] Offline page load < 100ms (Pass / Fail / N/A)
- Issues: _____________________

#### Network Conditions Testing
- [ ] Slow 3G usable (Pass / Fail / N/A)
- [ ] Offline graceful fallback (Pass / Fail / N/A)
- [ ] Online after offline works (Pass / Fail / N/A)
- [ ] API retry functioning (Pass / Fail / N/A)
- Issues: _____________________

#### Touch & Interaction Testing
- [ ] Touch targets comfortable (Pass / Fail / N/A)
- [ ] Scrolling smooth (60fps) (Pass / Fail / N/A)
- [ ] Gestures work correctly (Pass / Fail / N/A)
- [ ] Input interactions smooth (Pass / Fail / N/A)
- Issues: _____________________

#### Browser Compatibility
- [ ] Renders correctly (Pass / Fail / N/A)
- [ ] All features functional (Pass / Fail / N/A)
- [ ] Service worker supported (Pass / Fail / N/A)
- [ ] Performance acceptable (Pass / Fail / N/A)
- Issues: _____________________

#### Accessibility Testing
- [ ] Reduced motion respected (Pass / Fail / N/A)
- [ ] Color contrast ≥4.5:1 (Pass / Fail / N/A)
- [ ] Screen reader functional (Pass / Fail / N/A)
- [ ] Keyboard navigation works (Pass / Fail / N/A)
- [ ] Focus indicators visible (Pass / Fail / N/A)
- Issues: _____________________

#### Visual Testing Across Breakpoints
- [ ] 320px: Single column, readable (Pass / Fail / N/A)
- [ ] 480px: Improved spacing, usable (Pass / Fail / N/A)
- [ ] 768px: Sidebar visible, better layout (Pass / Fail / N/A)
- [ ] 1024px: Three-panel layout optimal (Pass / Fail / N/A)
- [ ] 1920px: Proper spacing and utilization (Pass / Fail / N/A)
- Issues: _____________________

### Summary

**Overall Status:** [ ] Pass [ ] Fail [ ] Partial Pass

**Critical Issues (Blocking):**
1. _____________________
2. _____________________
3. _____________________

**Major Issues (Should Fix):**
1. _____________________
2. _____________________
3. _____________________

**Minor Issues (Nice to Fix):**
1. _____________________
2. _____________________
3. _____________________

**Notes & Recommendations:**
_____________________

**Tester Signature:** _____________________ **Date:** _____________________

---

## Quick Reference: Common Testing Tools

- **Chrome DevTools**: Device emulation, network throttling, Lighthouse
- **Firefox DevTools**: Responsive design mode, accessibility inspector
- **Safari DevTools**: Remote debugging on iOS devices
- **BrowserStack**: Real device testing across browsers
- **Lighthouse**: Performance and PWA audits (built into Chrome)
- **WAVE**: Accessibility checker (browser extension)
- **axe DevTools**: Accessibility testing (browser extension)
- **Responsively App**: Multi-device responsive testing tool

---

## Notes for Developers

1. **Test Regularly**: Run through this checklist during development, not just before release
2. **Device Priority**: Prioritize testing on low-end devices (older iPhones, Android phones)
3. **Real Devices**: Always test on real devices when possible, not just emulators
4. **Network Simulation**: Test with realistic network conditions (3G, 4G, WiFi)
5. **Automation**: Automate performance and accessibility tests in CI/CD pipeline
6. **User Testing**: Conduct user testing with real users, especially for accessibility
7. **Version Tracking**: Track results over time to catch performance regressions
8. **Known Issues**: Document known issues and platforms with workarounds

---

**Last Updated**: 2026-03-15
**Document Version**: 1.0
