/**
 * User preferences stored in localStorage.
 */

const KEYS = {
  onboarded: "callitback_onboarding",
  name: "callitback_userName",
  subjects: "callitback_subjects",
  studyStyle: "callitback_studyStyle",
  preferredMethods: "callitback_preferred_methods",
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function hasCompletedOnboarding(): boolean {
  return localStorage.getItem(KEYS.onboarded) === "true";
}

export function completeOnboarding() {
  localStorage.setItem(KEYS.onboarded, "true");
}

export function getUserName(): string {
  return localStorage.getItem(KEYS.name) || "";
}

export function setUserName(name: string) {
  localStorage.setItem(KEYS.name, name);
}

export function getUserSubjects(): string[] {
  return read<string[]>(KEYS.subjects, []);
}

export function setUserSubjects(subjects: string[]) {
  localStorage.setItem(KEYS.subjects, JSON.stringify(subjects));
}

export function getStudyStyle(): string {
  return localStorage.getItem(KEYS.studyStyle) || "";
}

export function setStudyStyle(style: string) {
  localStorage.setItem(KEYS.studyStyle, style);
}

export function getPreferredMethods(): string[] {
  return read<string[]>(KEYS.preferredMethods, []);
}

export function setPreferredMethods(methods: string[]) {
  localStorage.setItem(KEYS.preferredMethods, JSON.stringify(methods));
}