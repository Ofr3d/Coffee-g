// Contextual tips shown after logging a brew — keyed by a FLAW-leaning descriptor
// word (matches lexicon.js `hint: 'flaw'`). Shown only when the user named such a
// word; otherwise no tip fires and the coach is the real helper. These are gentle
// nudges, NOT the flaw-vs-preference verdict — that's the coach's job.
export const FLAW_TIPS = {
  sour: {
    headline: 'Tasting sour or sharp?',
    body: "Often underextraction — the sweetness didn't have time to dissolve. Grind finer or extend the brew slightly. (If the beans are a bright light roast, this may just be their character — ask the coach.)",
  },
  sharp: {
    headline: 'Tasting sharp or acidic?',
    body: 'Frequently underextraction — try grinding a touch finer or brewing a little longer. On a bright bean, though, that acidity can be exactly the point.',
  },
  bitter: {
    headline: 'Tasting bitter?',
    body: "Classically overextraction — you pulled too much. Grind coarser, shorten the brew, or lower the water temp a few degrees.",
  },
  harsh: {
    headline: 'Tasting harsh?',
    body: 'Usually overextraction or water too hot. Coarsen the grind a step and drop the temperature by 2–3°C.',
  },
  astringent: {
    headline: 'Mouth-drying or puckering?',
    body: "Astringency usually means too-fine grind at too-high a temperature, or stale beans. Lower temp by 2°C and check the roast date.",
  },
  drying: {
    headline: 'A drying finish?',
    body: 'Often overextraction or too-hot water. Coarsen slightly and ease the temperature down.',
  },
  weak: {
    headline: 'Tasting weak?',
    body: 'Under-dosed or too coarse. Add 1–2g of coffee or grind a step finer. Aim for 1:15–1:17 on filter.',
  },
  watery: {
    headline: 'Tasting watery?',
    body: 'Usually too little coffee or too coarse a grind. Tighten the ratio and grind a step finer.',
  },
  thin: {
    headline: 'Feeling thin-bodied?',
    body: 'Can be underextraction or a low dose — try a touch finer or a gram more. Some light, delicate beans simply drink lighter, though.',
  },
  flat: {
    headline: 'Tasting flat or lifeless?',
    body: 'Often stale beans or an uneven extraction. Check the roast date, and look for clumping in the grinder.',
  },
  hollow: {
    headline: 'Tasting hollow?',
    body: 'Frequently under-developed extraction — grind finer or extend contact time a little.',
  },
  muddled: {
    headline: 'Tasting muddled or confused?',
    body: 'Usually uneven extraction — inconsistent particle size or poor distribution. Check the grinder for clumping; a light stir/WDT helps.',
  },
  ashy: {
    headline: 'Tasting ashy?',
    body: 'Often overextraction or a very dark roast. Coarsen the grind and lower the temperature; if the beans are very dark, it may be the roast.',
  },
};

// Static palate education cards for the Train tab.
// Each has a unique id so dismissal can be tracked.
export const TRAIN_CARDS = [
  {
    id: 'tc-extraction-basics',
    topic: 'Extraction',
    headline: 'Sour → bitter is a spectrum, not a mystery',
    body: 'Every brew extracts compounds in order: acids first (bright, sour), then sugars (sweet, round), then bitter compounds last. Sour = stopped too early. Bitter = went too far. Your grind size and brew time control where you land.',
    takeaway: 'If it tastes sour, go finer or longer. If bitter, go coarser or shorter.',
  },
  {
    id: 'tc-grind-basics',
    topic: 'Grind',
    headline: 'Your grind setting means nothing without the grinder',
    body: '"Grind 15" on a Comandante is a totally different particle size than "15" on a Baratza Encore. Grind numbers only make sense within the same device. This is why logging your grinder matters — not just the number.',
    takeaway: "Always record grinder model + number. Otherwise you can't repeat or compare.",
  },
  {
    id: 'tc-ratio',
    topic: 'Ratio',
    headline: 'The ratio is your strongest lever',
    body: 'Coffee-to-water ratio controls strength more than almost anything else. 1:15 is stronger; 1:17 is lighter. Most specialty filter recipes live between 1:15 and 1:17. Espresso runs 1:2 to 1:3. Once you fix ratio, other variables become much easier to isolate.',
    takeaway: 'Lock in your ratio first. Then dial grind and time around it.',
  },
  {
    id: 'tc-water-temp',
    topic: 'Water',
    headline: 'Water temperature affects extraction speed',
    body: 'Hotter water extracts faster and more aggressively. Lighter roasts usually need higher temps (93–96°C) because their sugars are harder to dissolve. Darker roasts are more soluble — try 88–91°C to avoid bitterness.',
    takeaway: 'Light roast = go hotter. Dark roast = go cooler.',
  },
  {
    id: 'tc-flavor-wheel',
    topic: 'Tasting',
    headline: 'The flavor wheel is a vocabulary, not a test',
    body: 'The SCA flavor wheel gives you words for what you\'re already tasting. Start at the center (general: fruity, nutty, sweet) and work outward to specific (blueberry, hazelnut, caramel). You don\'t need to identify every note — even one word helps you remember a cup.',
    takeaway: 'Pick one word after each brew. It builds your palate faster than you expect.',
  },
  {
    id: 'tc-origin-light',
    topic: 'Origin',
    headline: 'Ethiopian coffees taste like fruit — that\'s not a flaw',
    body: 'Coffees from Ethiopia (especially Yirgacheffe and Sidama) are known for intense fruit and floral notes — blueberry, jasmine, bergamot. If you\'re used to chocolate-forward Brazilian or Colombian beans, Ethiopian light roasts can feel strange at first. They\'re not under-roasted; that\'s the bean.',
    takeaway: 'Try an Ethiopian light roast brewed at 94°C and see how far the fruit goes.',
  },
  {
    id: 'tc-origin-latin',
    topic: 'Origin',
    headline: 'Latin American coffees are the "safe" bet — here\'s why',
    body: 'Brazil, Colombia, and Guatemala tend to produce balanced, nutty, chocolatey cups. They\'re forgiving of a wide grind range and brew temp. They\'re why most café house blends use them as a base — predictable and crowd-pleasing.',
    takeaway: 'If you want a reliable daily coffee without surprises, start with a Colombian or Brazilian medium roast.',
  },
  {
    id: 'tc-natural-process',
    topic: 'Processing',
    headline: 'Natural process = the coffee fermented inside the fruit',
    body: 'Washed (wet) coffees are fruit-removed before drying — clean, bright, crisp. Natural (dry) coffees dry inside the cherry — funky, fruity, wine-like. Honey process is in between. Processing method often matters more than origin for flavor profile.',
    takeaway: 'If your coffee tastes winey or fermented, check if it\'s a natural process. It\'s intentional.',
  },
  {
    id: 'tc-bloom',
    topic: 'Technique',
    headline: 'The bloom (pre-infusion) isn\'t optional',
    body: 'Fresh coffee releases CO2 when hot water hits it. That gas creates bubbles that block even extraction. A 30–45 second bloom — using 2× the coffee weight in water — lets the gas escape before the main pour. Skip it on stale coffee; it won\'t bloom anyway (no gas left).',
    takeaway: 'If your coffee bubbles a lot on bloom, it\'s fresh. No bubbles = the bag has been open too long.',
  },
  {
    id: 'tc-water-quality',
    topic: 'Water',
    headline: 'Tap water quality affects taste more than most gear',
    body: 'Coffee is 98% water. Chlorinated or very hard water suppresses flavors and can cause scale buildup in your kettle. Filtered or lightly mineral water (around 150 ppm TDS) is the sweet spot. Ultra-pure water (like distilled) tastes flat — it needs some minerals to extract properly.',
    takeaway: 'If your tap tastes fine to drink, it\'s probably fine. If it has a chlorine smell, use a Britta or bottled.',
  },
];
