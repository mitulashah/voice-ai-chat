// Utility for generating random names based on persona and gender
export interface GeneratedName {
  first: string;
  last: string;
  full: string;
  gender: 'male' | 'female';
}

const maleFirstNames = [
  'James', 'John', 'Robert', 'Michael', 'David', 'William', 'Richard', 'Joseph', 'Thomas', 'Christopher',
  'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua',
  'Kenneth', 'Kevin', 'Brian', 'George', 'Timothy', 'Ronald', 'Jason', 'Edward', 'Jeffrey', 'Ryan'
];

const femaleFirstNames = [
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
  'Lisa', 'Nancy', 'Betty', 'Helen', 'Sandra', 'Donna', 'Carol', 'Ruth', 'Sharon', 'Michelle',
  'Laura', 'Sarah', 'Kimberly', 'Deborah', 'Dorothy', 'Lisa', 'Nancy', 'Karen', 'Betty', 'Helen'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'
];

export function generateRandomName(gender?: 'male' | 'female'): GeneratedName {
  let firstNamePool: string[];
  let selectedGender: 'male' | 'female';
  
  if (gender === 'male') {
    firstNamePool = maleFirstNames;
    selectedGender = 'male';
  } else if (gender === 'female') {
    firstNamePool = femaleFirstNames;
    selectedGender = 'female';
  } else {
    // Random gender if not specified
    const isRandom = Math.random() > 0.5;
    firstNamePool = isRandom ? maleFirstNames : femaleFirstNames;
    selectedGender = isRandom ? 'male' : 'female';
  }
  
  const firstName = firstNamePool[Math.floor(Math.random() * firstNamePool.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return {
    first: firstName,
    last: lastName,
    full: `${firstName} ${lastName}`,
    gender: selectedGender
  };
}

export function getGenderFromVoice(voiceName: string): 'male' | 'female' {
  const maleVoices = ['andrew', 'brian', 'christopher', 'eric', 'guy', 'jacob', 'john', 'ryan'];
  const voiceLower = voiceName.toLowerCase();
  
  for (const male of maleVoices) {
    if (voiceLower.includes(male)) {
      return 'male';
    }
  }
  
  return 'female'; // Default to female if not found in male list
}

export function inferGenderFromPersona(persona: any): 'male' | 'female' | undefined {
  if (!persona) return undefined;
  
  // Check if persona has explicit gender in demographics
  if (persona.demographics?.gender) {
    const gender = persona.demographics.gender.toLowerCase();
    if (gender === 'male' || gender === 'female') {
      return gender as 'male' | 'female';
    }
  }
  
  // Try to infer from persona name
  const name = persona.name?.toLowerCase() || '';
  
  // Common gendered persona indicators
  const maleIndicators = ['man', 'father', 'dad', 'husband', 'guy', 'mr', 'gentleman'];
  const femaleIndicators = ['woman', 'mother', 'mom', 'wife', 'lady', 'mrs', 'ms', 'girl'];
  
  for (const indicator of maleIndicators) {
    if (name.includes(indicator)) return 'male';
  }
  
  for (const indicator of femaleIndicators) {
    if (name.includes(indicator)) return 'female';
  }
  
  // No clear indication
  return undefined;
}
