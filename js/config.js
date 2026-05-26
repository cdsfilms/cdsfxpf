// Site-wide configuration. Edit these values to point at your Google Sheet.

export const CONFIG = {
  // Display name shown in the header and <title>.
  CLUB_NAME: "Singularity Storytelling Guild",
  CLUB_TAGLINE: "Từ ý tưởng đến kịch bản hoàn chỉnh",

  // Set to false when you have a real Google Sheet to read from.
  // While true, the site loads from /data/mock/<tab>.json so you can preview
  // the design and develop locally before the sheet is ready.
  USE_MOCK_DATA: false,

  // Google Sheet — must be shared as "Anyone with the link → Viewer".
  // The ID is the long string in the sheet URL between /d/ and /edit.
  SHEET_ID: "1JLdDXjATvbuO1zPyOny5o31MOjvxaDvXTtCBZ_IVR7g",

  // Tab names inside the sheet. Match these exactly.
  TABS: {
    members: "members",
    projects: "projects",
    progress: "progress",
    errors: "errors_checklist",
    events: "events",
  },

  // How long to keep fetched sheet data in localStorage before re-fetching.
  // 5 minutes is a good balance between freshness and snappy navigation.
  CACHE_TTL_MS: 5 * 60 * 1000,
};
