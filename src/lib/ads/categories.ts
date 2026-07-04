// Ad category system: each vertical carries a scene recipe, tone and
// lighting hints (fed to the video model in English), a default music
// style, and voiceover script templates per UI language.

export type CategoryGroup =
  | "ecommerce"
  | "service"
  | "realestate"
  | "automotive"
  | "app"
  | "event";

export type AdCategory = {
  id: string;
  group: CategoryGroup;
  icon: string; // lucide icon name
  scene: {
    opening: string;
    productFocus: string;
    lifestyle: string;
    cta: string;
  };
  tone: string;
  lighting: string;
  camera: string;
  musicStyle: string;
  voiceoverTemplate: { tr: string; en: string };
};

export const AD_CATEGORIES: AdCategory[] = [
  {
    id: "ecommerce-jewelry",
    group: "ecommerce",
    icon: "gem",
    scene: {
      opening: "slow reveal from darkness, a single spotlight catches the piece",
      productFocus: "extreme macro close-up, light dancing across polished metal and stones",
      lifestyle: "elegant person wearing the piece at an evening event, soft bokeh",
      cta: "product floating on dark velvet with subtle sparkle particles",
    },
    tone: "luxurious, intimate, aspirational",
    lighting: "dramatic low-key lighting with warm golden accents and specular highlights",
    camera: "slow orbital moves, macro details, shallow depth of field",
    musicStyle: "elegant minimal piano with soft strings",
    voiceoverTemplate: {
      tr: "{product}. Zarafetin en saf hali. {campaign} Şimdi keşfedin.",
      en: "{product}. Elegance in its purest form. {campaign} Discover it now.",
    },
  },
  {
    id: "ecommerce-fashion",
    group: "ecommerce",
    icon: "shirt",
    scene: {
      opening: "model walking toward camera in an urban setting, fabric in motion",
      productFocus: "detail shots of texture, stitching and fit while the model turns",
      lifestyle: "quick cuts of the outfit styled three different ways, city backdrop",
      cta: "model looks at camera, confident smile, logo appears",
    },
    tone: "confident, energetic, editorial",
    lighting: "natural daylight with high contrast, golden hour warmth",
    camera: "dynamic tracking shots, whip pans between looks, slight handheld energy",
    musicStyle: "upbeat electronic fashion-week groove",
    voiceoverTemplate: {
      tr: "Tarzını konuştur. {product} ile her an podyum. {campaign}",
      en: "Let your style speak. Every moment is a runway with {product}. {campaign}",
    },
  },
  {
    id: "ecommerce-beauty",
    group: "ecommerce",
    icon: "sparkles",
    scene: {
      opening: "product on a pastel pedestal, liquid or powder swirling in slow motion",
      productFocus: "texture macro: cream swatch, serum droplet, pigment burst",
      lifestyle: "person applying the product, glowing skin, soft smile in mirror",
      cta: "product lineup on clean background with water splash accent",
    },
    tone: "fresh, clean, radiant",
    lighting: "bright soft studio light, dewy highlights, pastel color palette",
    camera: "slow motion macro, satisfying fluid dynamics, smooth push-ins",
    musicStyle: "light airy pop with organic percussion",
    voiceoverTemplate: {
      tr: "Cildinin ışıltısını ortaya çıkar. {product}. {campaign}",
      en: "Reveal your natural glow. {product}. {campaign}",
    },
  },
  {
    id: "ecommerce-electronics",
    group: "ecommerce",
    icon: "cpu",
    scene: {
      opening: "device silhouette in darkness, edge lighting traces its outline",
      productFocus: "rotating hero shot, ports and details highlighted with light sweeps",
      lifestyle: "hands using the device in a modern workspace, screen glow",
      cta: "device front and center, spec highlights appear as clean text",
    },
    tone: "precise, powerful, futuristic",
    lighting: "cool blue-white studio lighting with neon edge accents",
    camera: "precise robotic camera moves, seamless speed ramps",
    musicStyle: "modern tech electronic with deep bass pulse",
    voiceoverTemplate: {
      tr: "Gücü elinde hisset. {product}. {campaign} Teknolojinin yeni standardı.",
      en: "Feel the power. {product}. {campaign} The new standard in tech.",
    },
  },
  {
    id: "ecommerce-home",
    group: "ecommerce",
    icon: "sofa",
    scene: {
      opening: "sunlit room, camera glides through a doorway revealing the space",
      productFocus: "the product styled in a cozy corner, textures in soft focus",
      lifestyle: "family or couple enjoying the space, warm candid moments",
      cta: "wide beauty shot of the styled room at golden hour",
    },
    tone: "warm, cozy, inviting",
    lighting: "soft window light, warm interior lamps, airy atmosphere",
    camera: "smooth gimbal glides, gentle push-ins, wide establishing shots",
    musicStyle: "warm acoustic guitar with soft whistling",
    voiceoverTemplate: {
      tr: "Evini yuvaya dönüştür. {product}. {campaign}",
      en: "Turn your house into a home. {product}. {campaign}",
    },
  },
  {
    id: "ecommerce-food",
    group: "ecommerce",
    icon: "utensils-crossed",
    scene: {
      opening: "ingredients falling in slow motion onto a rustic surface",
      productFocus: "extreme close-up of texture: steam, glaze, melt, crunch",
      lifestyle: "friends sharing the food at a lively table, genuine laughter",
      cta: "perfect hero plate, garnish drops, steam rising",
    },
    tone: "appetizing, indulgent, joyful",
    lighting: "rich warm food-photography lighting with strong backlight for steam",
    camera: "macro slow motion, overhead table shots, satisfying action shots",
    musicStyle: "playful jazzy rhythm with kitchen percussion",
    voiceoverTemplate: {
      tr: "Damaklarda şölen. {product}. {campaign} Şimdi sipariş ver.",
      en: "A feast for the senses. {product}. {campaign} Order now.",
    },
  },
  {
    id: "service-restaurant",
    group: "service",
    icon: "chef-hat",
    scene: {
      opening: "flames in the kitchen, chef plating with precision",
      productFocus: "signature dishes paraded in quick appetizing cuts",
      lifestyle: "warm dining room atmosphere, guests toasting, candlelight",
      cta: "restaurant exterior at dusk, sign glowing, doors opening",
    },
    tone: "warm, premium, welcoming",
    lighting: "moody warm restaurant ambience, kitchen fire accents",
    camera: "energetic kitchen handheld, smooth dining room glides",
    musicStyle: "sophisticated latin jazz",
    voiceoverTemplate: {
      tr: "Her tabak bir hikaye. {product}. {campaign} Masanız hazır.",
      en: "Every plate tells a story. {product}. {campaign} Your table is ready.",
    },
  },
  {
    id: "service-salon",
    group: "service",
    icon: "scissors",
    scene: {
      opening: "transformation tease: chair spins, before-look hidden",
      productFocus: "stylist hands at work, precise details of the craft",
      lifestyle: "client reveal moment, confident smile in the mirror",
      cta: "fresh look walking out the door in slow motion",
    },
    tone: "transformative, confident, chic",
    lighting: "clean bright salon light with flattering soft glow",
    camera: "mirror reveals, orbit around the chair, slow motion hair flips",
    musicStyle: "empowering pop beat",
    voiceoverTemplate: {
      tr: "Yeni sen, seni bekliyor. {product}. {campaign} Randevunu al.",
      en: "The new you is waiting. {product}. {campaign} Book your appointment.",
    },
  },
  {
    id: "service-fitness",
    group: "service",
    icon: "dumbbell",
    scene: {
      opening: "chalk dust in the air, athlete gripping the bar, deep breath",
      productFocus: "intense training moments: sweat, focus, iron in motion",
      lifestyle: "group class energy, high-fives, community spirit",
      cta: "athlete at sunrise, city skyline, determined look at camera",
    },
    tone: "intense, motivational, raw",
    lighting: "dramatic gym lighting, shafts of light through haze",
    camera: "punchy speed ramps, low angles, gritty handheld",
    musicStyle: "hard-hitting motivational trap",
    voiceoverTemplate: {
      tr: "Sınırlarını zorla. {product}. {campaign} Bugün başla.",
      en: "Push your limits. {product}. {campaign} Start today.",
    },
  },
  {
    id: "service-clinic",
    group: "service",
    icon: "stethoscope",
    scene: {
      opening: "calm modern clinic entrance, morning light through glass",
      productFocus: "state-of-the-art equipment and caring staff in action",
      lifestyle: "reassured patient consulting with a friendly specialist",
      cta: "smiling patient leaving, clinic logo on the facade",
    },
    tone: "trustworthy, calm, professional",
    lighting: "clean bright clinical light softened with warm accents",
    camera: "steady reassuring glides, gentle push-ins on human moments",
    musicStyle: "calm optimistic ambient piano",
    voiceoverTemplate: {
      tr: "Sağlığınız güvenli ellerde. {product}. {campaign}",
      en: "Your health, in trusted hands. {product}. {campaign}",
    },
  },
  {
    id: "realestate",
    group: "realestate",
    icon: "building-2",
    scene: {
      opening: "aerial approach over the neighborhood toward the property",
      productFocus: "sweeping interior walkthrough: living space, kitchen, master suite",
      lifestyle: "morning coffee on the balcony, city or nature view",
      cta: "exterior beauty shot at golden hour, gate opening",
    },
    tone: "prestigious, spacious, serene",
    lighting: "bright natural light, golden hour exteriors",
    camera: "drone establishing shots, smooth walkthrough gimbal, wide lenses",
    musicStyle: "cinematic inspiring orchestral",
    voiceoverTemplate: {
      tr: "Hayalinizdeki yaşam burada başlıyor. {product}. {campaign}",
      en: "The life you imagined starts here. {product}. {campaign}",
    },
  },
  {
    id: "automotive",
    group: "automotive",
    icon: "car",
    scene: {
      opening: "headlights ignite in a dark studio, silhouette emerges",
      productFocus: "light sweeps across body lines, wheel close-ups, badge detail",
      lifestyle: "driving through mountain curves at dusk, reflections gliding over paint",
      cta: "hero front three-quarter shot, dramatic sky",
    },
    tone: "powerful, sleek, adrenaline",
    lighting: "dramatic studio lighting outdoors: dusk, wet asphalt reflections",
    camera: "low tracking shots, rig shots alongside the car, dramatic orbits",
    musicStyle: "cinematic percussion with engine-like bass",
    voiceoverTemplate: {
      tr: "Yol senin. {product}. {campaign} Test sürüşü için hazır mısın?",
      en: "The road is yours. {product}. {campaign} Ready for a test drive?",
    },
  },
  {
    id: "app-saas",
    group: "app",
    icon: "smartphone",
    scene: {
      opening: "person frustrated with a messy problem, then opens the app",
      productFocus: "clean UI moments: the key feature solving the problem in seconds",
      lifestyle: "relaxed user getting results on the go, time saved visualized",
      cta: "phone in hand, download button, five-star ratings floating",
    },
    tone: "smart, effortless, modern",
    lighting: "bright contemporary light with brand-colored accents",
    camera: "screen-centric inserts, smooth transitions between real life and UI",
    musicStyle: "optimistic tech pop",
    voiceoverTemplate: {
      tr: "Hayatını kolaylaştır. {product}. {campaign} Hemen indir.",
      en: "Make life easier. {product}. {campaign} Download now.",
    },
  },
  {
    id: "event",
    group: "event",
    icon: "party-popper",
    scene: {
      opening: "countdown energy: lights warming up, crowd gathering",
      productFocus: "stage moments, key acts or speakers, crowd reactions",
      lifestyle: "friends dancing, confetti, unforgettable moments montage",
      cta: "date and venue on screen, tickets pulsing",
    },
    tone: "electric, festive, urgent",
    lighting: "concert lighting: strobes, colored washes, lens flares",
    camera: "energetic crowd shots, jib sweeps over the stage, fast cuts",
    musicStyle: "festival EDM build-up",
    voiceoverTemplate: {
      tr: "Kaçırılmayacak bir gece. {product}. {campaign} Biletini kap!",
      en: "A night to remember. {product}. {campaign} Grab your ticket!",
    },
  },
];

export function categoryById(id: string): AdCategory | undefined {
  return AD_CATEGORIES.find((c) => c.id === id);
}

export type ProductBrief = {
  productName: string;
  description?: string;
  campaign?: string;
  extraDirection?: string;
};

// Builds the fallback English prompt sent to the video model.
// Beat count scales with duration — a 5s clip is ONE continuous shot,
// not a four-scene montage.
export function buildVideoPrompt(
  category: AdCategory,
  brief: ProductBrief,
  opts: { durationSeconds: number; aspectRatio: string },
): string {
  const subject = brief.description
    ? `${brief.productName}, ${brief.description}`
    : brief.productName;
  const scene = category.scene;

  let action: string;
  if (opts.durationSeconds <= 6) {
    action = `One continuous shot: ${scene.productFocus}.`;
  } else if (opts.durationSeconds <= 10) {
    action = `The shot opens as ${scene.productFocus}, then flows into ${scene.lifestyle}.`;
  } else {
    action = `The sequence opens as ${scene.opening}, moves into ${scene.productFocus}, and settles on ${scene.cta}.`;
  }

  const parts = [
    `Cinematic ${opts.durationSeconds}-second product commercial featuring ${subject}.`,
    action,
    `Lighting: ${category.lighting}.`,
    `Camera: ${category.camera}.`,
    `Mood: ${category.tone}.`,
    `Photorealistic, shallow depth of field, high-end commercial color grading, ${opts.aspectRatio} composition, ends on a stable composed frame.`,
    "No on-screen text, no logos, no watermarks.",
  ];
  if (brief.extraDirection) parts.push(`Extra direction: ${brief.extraDirection}.`);
  return parts.join(" ");
}

export function buildVoiceoverScript(
  category: AdCategory,
  brief: ProductBrief,
  locale: "tr" | "en",
): string {
  return category.voiceoverTemplate[locale]
    .replace("{product}", brief.productName)
    .replace("{campaign}", brief.campaign ?? "");
}
