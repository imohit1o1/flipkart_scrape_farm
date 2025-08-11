const DELAY_TYPES = {
    MOUSE: 'mouse',
    PAGE_LOAD: 'pageLoad',
    READING: 'reading',
    SCROLL: 'scroll',
    SHORTEST: 'shortest',
    SHORT: 'short',
    NORMAL: 'normal',
    LONG: 'long',
    LONGEST: 'longest',
    TYPING: 'typing'
};

const DELAY_CONFIGS = {
    mouse: { min: 300, max: 500 },
    pageLoad: { min: 300, max: 500 },
    reading: { min: 300, max: 500 },
    scroll: { min: 300, max: 500 },
    shortest: { min: 200, max: 500 },
    short: { min: 500, max: 700 },
    normal: { min: 700, max: 1000 },
    long: { min: 1000, max: 3000 },
    longest: { min: 3000, max: 5000 },
    typing: { min: 70, max: 100 }
};

const DelayManager = {
    DELAY_TYPES,
    DELAY_CONFIGS,

    delay: async (type) => {
        const config = DELAY_CONFIGS[type] || DELAY_CONFIGS.normal;
        const delayTime = Math.floor(Math.random() * (config.max - config.min + 1) + config.min);
        await new Promise(resolve => setTimeout(resolve, delayTime));
    },
};

export { DelayManager };