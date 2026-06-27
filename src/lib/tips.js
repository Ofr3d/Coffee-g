// Contextual tips shown after logging a brew — one per outcome.
export const OUTCOME_TIPS = {
  sour: {
    headline: 'Tasting sour or sharp?',
    body: "That's underextraction — the good stuff didn't have enough time to dissolve. Grind finer, or extend your brew time slightly. The citrus will sweeten.",
  },
  bitter: {
    headline: 'Tasting harsh or bitter?',
    body: "That's overextraction — you pulled too much. Grind coarser, shorten brew time, or lower your water temperature a few degrees.",
  },
  weak: {
    headline: 'Tasting thin or watery?',
    body: 'Under-dosed or too coarse. Try adding 1–2g more coffee, or grind a step finer. Your ratio is probably off — aim for 1:15 to 1:17 for filter.',
  },
  strong: {
    headline: 'Tasting too intense or heavy?',
    body: 'Over-dosed or too fine for your ratio. Try pulling back 1g on dose, or grind slightly coarser. Adding a bit more water also softens intensity.',
  },
  astringent: {
    headline: 'Tasting dry or mouth-puckering?',
    body: "Astringency usually means too-fine grind at too-high temperature, or stale beans. Lower your temp by 2°C and check your bean's roast date.",
  },
  muddled: {
    headline: 'Tasting flat or confused?',
    body: 'Often an uneven extraction — some coarse, some fine particles. Check your grinder for clumping, or try a light WDT before your shot. Distribution matters.',
  },
  balanced: {
    headline: 'You nailed it.',
    body: "A balanced cup means your extraction hit the sweet spot. Lock in these parameters and try the same setup tomorrow — then you know it's repeatable.",
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
