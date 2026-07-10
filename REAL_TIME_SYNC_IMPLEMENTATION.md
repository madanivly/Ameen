# Real-Time Data Sync Implementation

## Overview

This document describes the real-time data synchronization system implemented to ensure all users see updates to the Google Sheet data in real-time without requiring manual page refreshes.

## Problem Solved

Previously, the Ameen Portal suffered from data synchronization issues:
- Changes made by one user were not visible to other users immediately
- Users had to perform hard refreshes to see updates
- Browser caching prevented fresh data fetches
- Only the user who made changes saw them immediately

## Solution Architecture

### 1. **Polling Mechanism** (`src/hooks/useGoogleSheetSync.tsx`)

A custom React hook that automatically polls the Google Sheets API every 5 seconds:

```typescript
useGoogleSheetSync({
  enabled: true,
  pollInterval: 5000, // 5 seconds
  onDataUpdate: (data) => {
    // Update local state with synced data
  },
  onError: (error) => {
    // Handle sync errors gracefully
  }
})
```

**Key Features:**
- Automatic polling with configurable interval (default: 5 seconds)
- Cache-busting query parameters (`?t=timestamp`)
- Custom headers to prevent browser caching
- Manual refresh capability (`manualRefresh()`)
- Graceful error handling

### 2. **Data Fetch Endpoint** (`src/api/fetch-data.ts`)

A new GET endpoint that retrieves all data from Google Sheets:

**Endpoint:** `GET /api/fetch-data`

**Response Headers (Cache-Busting):**
```
Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0
Pragma: no-cache
Expires: 0
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "members": [...],
    "admins": [...],
    "transactions": [...],
    "investments": [...],
    "stakes": [...],
    "transfers": [...],
    "pendingSignups": [...]
  },
  "timestamp": "2026-07-10T15:45:20.212Z"
}
```

### 3. **Integrated Polling** (`src/context/AppStateContext.tsx`)

The `AppStateProvider` automatically sets up polling when the app initializes:

```typescript
useGoogleSheetSync({
  enabled: isClient,
  pollInterval: 5000,
  onDataUpdate: (syncedData) => {
    setState((prevState) => ({
      currentUserId: prevState.currentUserId, // Preserve local auth
      currentRole: prevState.currentRole,
      members: syncedData.members || prevState.members,
      admins: syncedData.admins || prevState.admins,
      transactions: syncedData.transactions || prevState.transactions,
      investments: syncedData.investments || prevState.investments,
      stakes: syncedData.stakes || prevState.stakes,
      transfers: syncedData.transfers || prevState.transfers,
      pendingSignups: syncedData.pendingSignups || prevState.pendingSignups,
    }));
  }
});
```

**State Merge Strategy:**
- Preserves local `currentUserId` and `currentRole` (user's session)
- Replaces all data fields with synced versions
- Automatically triggers re-renders when data changes

### 4. **Immediate Refresh on Mutations**

When a user creates or updates data, an immediate refresh is triggered after 500ms:

```typescript
fetch('/api/update-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Cache-Control': '...' },
  body: JSON.stringify(data),
}).then(() => {
  // Trigger immediate refresh
  setTimeout(() => setRefreshTrigger(prev => prev + 1), 500);
});
```

## Cache Busting Strategy

Multiple layers ensure fresh data fetches:

1. **Query Parameter:** `?t=${timestamp}` - Forces cache bust
2. **HTTP Headers:**
   - `Cache-Control: no-store` - Don't store in cache
   - `Pragma: no-cache` - Legacy cache bust
   - `Expires: 0` - Already expired
3. **Fetch Options:** Custom headers prevent any caching

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  User Browser                           │
├─────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐ │
│  │          AppStateProvider                          │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │  useGoogleSheetSync Hook (5s polling)        │  │ │
│  │  │  - Fetches /api/fetch-data?t=<timestamp>     │  │ │
│  │  │  - Updates local state with synced data      │  │ │
│  │  │  - Triggers UI re-render                     │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────┘ │
│                        │                                 │
│  User Actions → setState() → setState() → Re-render     │
│       │                │                                 │
│       └─────→ POST /api/update-data → Persist           │
│              + setRefreshTrigger()                       │
└─────────────────────────────────────────────────────────┘
          │
          ├─────────────────→ Google Sheets API
          └─────────────────→ Vercel Deployment
```

## Key Features

### ✅ Real-Time Updates
- All users see changes within 5 seconds
- Changes from any user are reflected across all sessions

### ✅ Immediate User Feedback
- User sees their changes immediately in local state
- Other users see changes within 5 seconds of sync

### ✅ No Browser Caching
- Every fetch includes cache-busting headers and query params
- Fresh data always fetched from Google Sheets

### ✅ Graceful Degradation
- If sync fails, local state remains intact
- Error messages logged to console for debugging
- Polling continues to retry

### ✅ Session Preservation
- User login/auth state not affected by syncs
- Only data is refreshed, session persists

## Performance Considerations

### Network Usage
- ~5KB of data per poll request (varies by data size)
- Every 5 seconds = ~12 requests/minute per user
- Acceptable for most production deployments

### Optimization Options (if needed)
1. **Increase poll interval:** Change `pollInterval: 10000` for 10-second polling
2. **Implement delta sync:** Only sync changed data
3. **Use WebSockets:** Real-time updates instead of polling
4. **Add debouncing:** Batch multiple rapid changes

## Testing the Implementation

### Manual Testing

1. **Open app in two browser tabs/windows**
2. **In Tab A:** Create a new payment entry
3. **In Tab B:** Wait up to 5 seconds - new entry should appear
4. **Verify:** Both tabs show the same data without manual refresh

### Monitoring

Check browser console for:
```javascript
// Successful syncs
console.log('Google Sheets sync successful')

// Errors
console.error('Google Sheets sync error:', error)
```

## Deployment Notes

### Vercel Configuration
- The app is deployed to: https://ameen-kappa.vercel.app
- API endpoints are automatically available at `/api/*`
- Environment variables for Google Sheets API must be set:
  - `GOOGLE_SHEET_ID`
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - `GOOGLE_PRIVATE_KEY`

### Environment Variables
Ensure these are set in Vercel project settings:
```
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
```

## Future Enhancements

1. **WebSocket Support:** Real-time updates without polling
2. **Offline Support:** Queue changes when offline, sync when reconnected
3. **Conflict Resolution:** Handle simultaneous edits by multiple users
4. **Data Compression:** Reduce payload size for slower connections
5. **User Activity Indicators:** Show which users are online
6. **Change History:** Track all changes with timestamps and user info

## Troubleshooting

### Changes not appearing on other users' screens

**Solution:**
1. Check browser DevTools Network tab - verify `/api/fetch-data` requests are being made
2. Check Google Sheets API quotas haven't been exceeded
3. Verify environment variables are correctly set on Vercel
4. Check browser console for error messages

### High network usage

**Solution:**
1. Increase `pollInterval` in `AppStateContext.tsx`
2. Implement data diff checking before state updates
3. Consider WebSocket implementation

### Sync errors in console

**Solution:**
1. Check Google Sheets credentials are valid
2. Verify sheet structure matches expected format
3. Check Vercel function logs for server-side errors
4. Ensure service account has read/write permissions

## Code Files Modified

1. **Created:** `src/api/fetch-data.ts` - Data fetch endpoint
2. **Created:** `src/hooks/useGoogleSheetSync.tsx` - Polling hook
3. **Modified:** `src/api/update-data.ts` - Added cache-busting headers
4. **Modified:** `src/context/AppStateContext.tsx` - Integrated polling

## Summary

The real-time sync implementation ensures:
- ✅ Data updates across all users within 5 seconds
- ✅ No browser caching interference
- ✅ Immediate feedback to the user making changes
- ✅ Graceful error handling
- ✅ Session preservation

The system is production-ready and deployed on Vercel with Google Sheets integration.