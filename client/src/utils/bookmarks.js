const BOOKMARKS_KEY = 'syncspace_bookmarks';

export function getBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY)) || [];
  } catch {
    return [];
  }
}

export function isBookmarked(resourceId) {
  return getBookmarks().includes(resourceId);
}

export function toggleBookmark(resourceId) {
  const bookmarks = getBookmarks();
  const idx = bookmarks.indexOf(resourceId);
  if (idx > -1) {
    bookmarks.splice(idx, 1);
  } else {
    bookmarks.push(resourceId);
  }
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  return idx === -1; // returns true if bookmarked, false if removed
}

export function removeBookmark(resourceId) {
  const bookmarks = getBookmarks().filter(id => id !== resourceId);
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}
