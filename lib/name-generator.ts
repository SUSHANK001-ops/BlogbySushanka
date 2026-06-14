// =============================================================================
// Anonymous name generator — fun two-word names for anonymous commenters
// =============================================================================

const adjectives = [
  "Curious",
  "Silent",
  "Brave",
  "Cosmic",
  "Swift",
  "Clever",
  "Mystic",
  "Noble",
  "Vivid",
  "Zen",
  "Radiant",
  "Daring",
  "Gentle",
  "Witty",
  "Bold",
  "Serene",
  "Lively",
  "Fierce",
  "Mellow",
  "Stellar",
  "Dreamy",
  "Lucky",
  "Nimble",
  "Jolly",
  "Gleaming",
];

const animals = [
  "Panda",
  "Fox",
  "Wolf",
  "Hawk",
  "Owl",
  "Tiger",
  "Raven",
  "Phoenix",
  "Dragon",
  "Falcon",
  "Bear",
  "Dolphin",
  "Eagle",
  "Lynx",
  "Otter",
  "Heron",
  "Jaguar",
  "Crane",
  "Viper",
  "Koala",
  "Panther",
  "Stag",
  "Swan",
  "Gecko",
  "Mantis",
];

/**
 * Generate a fun anonymous name like "CuriousPanda42"
 */
export function generateAnonymousName(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}${animal}${num}`;
}
