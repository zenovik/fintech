/**
 * Load profiles: smoke, load, stress, spike, soak
 */

export const smokeProfile = {
  scenarios: {
    mixed: {
      executor: 'constant-vus',
      vus: 10,
      duration: '2m',
    },
  },
};

export const loadProfile = {
  scenarios: {
    mixed: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '6m', target: 100 },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
};

export const stressProfile = {
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '3m', target: 100 },
        { duration: '3m', target: 200 },
        { duration: '3m', target: 300 },
        { duration: '3m', target: 400 },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '1m',
    },
  },
};

export const spikeProfile = {
  scenarios: {
    spike: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '30s', target: 200 },
        { duration: '1m', target: 200 },
        { duration: '30s', target: 10 },
        { duration: '1m', target: 10 },
      ],
    },
  },
};

export function soakProfile(soakDuration = '4h', soakVus = 20) {
  return {
    scenarios: {
      soak: {
        executor: 'constant-vus',
        vus: soakVus,
        duration: soakDuration,
      },
    },
  };
}

export function getProfile(name, config = {}) {
  switch (name) {
    case 'load':
      return loadProfile;
    case 'stress':
      return stressProfile;
    case 'spike':
      return spikeProfile;
    case 'soak':
      return soakProfile(config.soakDuration, config.soakVus);
    case 'smoke':
    default:
      return smokeProfile;
  }
}
