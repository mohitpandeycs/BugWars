export const CLOUD_SIZE = { sm: 40, md: 55, lg: 70 }

export const HOME_CLOUDS = [
    { id: 1, top: '10%', left: '5%', size: CLOUD_SIZE.lg, opacity: 0.9, shape: 'wide', animation: 'drift' },
    { id: 2, top: '15%', left: '70%', size: CLOUD_SIZE.md, opacity: 0.7, shape: 'small', animation: 'bob' },
    { id: 3, top: '30%', left: '30%', size: CLOUD_SIZE.sm, opacity: 0.6, shape: 'small', animation: 'driftBob' },
    { id: 4, top: '8%', left: '85%', size: CLOUD_SIZE.lg, opacity: 0.9, shape: 'wide', animation: 'driftSlow' },
]

export const LOBBY_CLOUDS = [
    { id: 1, top: '5%', left: '10%', size: CLOUD_SIZE.md, opacity: 0.8, shape: 'wide', animation: 'driftBob' },
    { id: 2, top: '20%', left: '80%', size: CLOUD_SIZE.lg, opacity: 0.7, shape: 'small', animation: 'bob' },
    { id: 3, top: '50%', left: '5%', size: CLOUD_SIZE.sm, opacity: 0.5, shape: 'small', animation: 'drift' },
]

export const VOTE_CLOUDS = [
    { id: 1, top: '6%', left: '15%', size: CLOUD_SIZE.sm, opacity: 0.6, shape: 'small', animation: 'bob' },
    { id: 2, top: '12%', left: '75%', size: CLOUD_SIZE.md, opacity: 0.8, shape: 'wide', animation: 'drift' },
    { id: 3, top: '45%', left: '88%', size: CLOUD_SIZE.sm, opacity: 0.5, shape: 'small', animation: 'driftSlow' },
    { id: 4, top: '60%', left: '8%', size: CLOUD_SIZE.md, opacity: 0.7, shape: 'wide', animation: 'driftBob' },
]