// Fictional identity used by the demo. DOB is typed on a keypad (never spoken) during profile setup, then checked on the call.
const KEY = 'mb.dob'
export const identity = {
  get dob() { return localStorage.getItem(KEY) || '03141991' },
  set dob(v: string) { localStorage.setItem(KEY, v) },
  zip: '37235',
  mbid: 'MB-2041',
}
