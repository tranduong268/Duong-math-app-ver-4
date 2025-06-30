import { ImageSet, ShapeType } from './types';

export const NUM_QUESTIONS_PER_ROUND = 20; // Base number, can be overridden by specific modes/difficulties
export const VISUAL_PATTERN_QUESTIONS_MAM = 10;
export const VISUAL_PATTERN_QUESTIONS_CHOI = 15;
export const ODD_ONE_OUT_QUESTIONS_MAM = 10;
export const ODD_ONE_OUT_QUESTIONS_CHOI = 15;


export const MAX_SESSIONS_TO_STORE = 3;
export const NEXT_QUESTION_DELAY_MS = 1000; // New faster default
export const SLOW_NEXT_QUESTION_DELAY_MS = 2000; // For complex modes
export const MIN_EQUALS_IN_COMPARISON_ROUND = 3;


export const POSITIVE_FEEDBACKS: string[] = [
  "TUYỆT VỜI!",
  "GIỎI QUÁ!",
  "XUẤT SẮC!",
  "CHUẨN LUÔN!",
  "QUÁ ĐỈNH!",
  "BÉ LÀM TỐT LẮM!",
  "ĐÚNG RỒI ĐÓ BÉ!",
];

export const ENCOURAGING_FEEDBACKS: string[] = [
  "BÉ HÃY SUY NGHĨ KỸ HƠN!",
  "CỐ LÊN NÀO BÉ!",
  "THỬ LẠI NHÉ!",
  "SUÝT ĐÚNG RỒI!",
  "ĐỪNG NẢN LÒNG, BÉ CỐ GẮNG NHÉ!",
  "SAI MỘT CHÚT THÔI!",
];

export const MENU_EMOJIS_RANDOM: string[] = ['✨', '🎉', '🎈', '⭐', '🎯', '💡', '🚀', '💯', '🧩', '🌟', '🥳', '🤩'];

export const COMPARISON_ICON = '⚖️';
export const COUNTING_ICON = '🎨';
export const NUMBER_RECOGNITION_ICON = '🧐'; 
export const MATCHING_PAIRS_ICON = '🔗';
export const NUMBER_SEQUENCE_ICONS: string[] = ['📊', '📈', '📉', '🔢']; 
export const VISUAL_PATTERN_ICON = '🖼️'; 
export const ODD_ONE_OUT_ICONS_RANDOM: string[] = ['🔍', '🔎', '🤔', '🧐', '💡', '❓', '🧩']; // New random icons for Odd One Out
export const REVIEW_ICON = '📝';


export const INITIAL_COUNTING_ICONS: ShapeType[] = [
  // Fruits & Veggies
  '🍎', '🍊', '🍋', '🍉', '🍇', '🍓', '🍑', '🍍', '🥝', '🥭',
  '🥕', '🥦', '🌽', '🍅', '🍆', '🌶️', '🍄',
  // Animals
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', 
  '🐵', '🦁', '🐘', '🦒', '🦓', '🐧', '🦉', '🦋', '🐞', '🐌',
  '🐢', '🐍', '🐙', '🐠', '🦀', '🐳',
  // Vehicles
  '🚗', '🚕', '🚌', '🚓', '🚑', '🚒', '🚜', '🛵', '🚲', '🚂',
  '🚢', '🛥️', '✈️', '🚁', '🚀', '🛸', '🛶', '⛵',
  // Sweets
  '🎂', '🍰', '🧁', '🍭', '🍬', '🍩', '🍪', '🍦', '🍿', '🥧',
  // General Items & Objects
  '⚽', '🏀', '🏈', '⚾', '🎾', '🎸', '⭐', '🎈', '🎁', '🔑', 
  '🕰️', '💡', '💎', '📚', '✏️', '☂️', '⚙️', '💰', '🔭', '🔬',
  '🔔', '📣', '💾', '💿', '📞', '🔋', '🔌',
  // Shapes
  '🔴', '🔵', '🟢', '🟡', '🟠', '🟣', '❤️', '🔺', '🟦', '🔶', 
  '🟥', '🟩', '🟨', '🟧', '🟪', '⚫', '⚪', // Star repeated, good.
  // Clothes & Accessories
  '👕', '👗', '👟', '🧢', '👑', '👓', '👒', '🧣', '🧤', '🧦',
  '💍', '👜', '🎒', '🌂', // Umbrella repeated
  // Household Items & More
  '⏰', '⏳', '🛁', '🚿', '🧸', /*'🧩',*/ '🧮', '🖋️', '📏', '✂️', 
  '🏠', '🚪', '🖼️', '🪑', '🕯️', '🧺', '🧼', '🧽', /*'🔑',*/ 
  '🔒', '📎', '📌', '📮',
  // Musical Instruments
  '🥁', '🎷', '🎺', '🎻', '🎹', '🪗', '🎤',
  // Tools (ensure no problematic ones)
  '🔨', '🔧', '🔩', '🛠️', 
  // Nature
  '🌳', '🌲', '🌿', '🌸', '🌻', '🍁', '🔥', '🌍', '☀️',
  '🌙', /*'⭐',*/ '🌈', '🌊', '🌋', '⛰️', '🌵', '🌷', '🌹', '🌼',
  // Food (More)
  '🍕', '🍔', '🍟', '🌭', '🥪', '🥨', '🥐', '🥞', '🧇', '🍳',
  '🧀', '🍗', '🍙', '🍜', '🍣', '🍡',
  // Fantasy / Fun
  '👻', '🤖', '👽', '👾', '🤡', '👹', '👺', '🦄', '🐲',
  // Sports (More)
  '🎳', '🎯', '⛳', '⛸️', '🎣', '🎽', '🏅', '🏆',
  // Weather / Sky
  '☁️', '⚡', '❄️', '☃️', '🌬️',

  // --- START OF NEW ICONS (100+) ---
  // More Animals (Land, Sea, Air, Insects)
  '🦌', // Deer
  '🦘', // Kangaroo
  '🐿️', // Chipmunk
  '🦔', // Hedgehog
  '🦙', // Llama
  '🐫', // Two-Hump Camel
  '🦏', // Rhinoceros
  '🐃', // Water Buffalo
  '🐂', // Ox
  '🦢', // Swan
  '🦜', // Parrot
  '🕊️', // Dove
  '🦅', // Eagle
  '🦇', // Bat
  '🐛', // Caterpillar
  '🐜', // Ant
  '🦗', // Cricket
  '🦂', // Scorpion
  '🕷️', // Spider
  '🕸️', // Spider Web
  '🦞', // Lobster
  '🦐', // Shrimp
  '🦑', // Squid
  '🐡', // Blowfish
  '🦈', // Shark
  '🦦', // Otter
  // More Food & Drinks
  '🥥', // Coconut
  '🥑', // Avocado
  '🫑', // Bell Pepper
  '🧅', // Onion
  '🧄', // Garlic
  '🥬', // Leafy Green
  '🥒', // Cucumber
  '🥔', // Potato
  '🫐', // Blueberries
  '🍒', // Cherries
  '🍞', // Bread
  '🥚', // Egg
  '🥓', // Bacon
  '🥛', // Glass of Milk
  '🧃', // Juice Box
  '🧉', // Mate
  '☕', // Hot Beverage / Coffee cup
  '🥤', // Cup with Straw
  '🌮', // Taco
  '🌯', // Burrito
  '🥗', // Salad
  '🥘', // Shallow Pan of Food
  '🍝', // Spaghetti
  '🍚', // Cooked Rice
  // Household Items / Furniture
  '🛋️', // Couch and Lamp
  '🛏️', // Bed
  '🚽', // Toilet
  '🪞', // Mirror
  '🏺', // Amphora
  '🪟', // Window
  '🧱', // Brick
  '📦', // Package
  // Clothing & Accessories (more detail)
  '👖', // Jeans
  '🩱', // One-Piece Swimsuit
  '🩲', // Briefs
  '🧥', // Coat
  '🥾', // Hiking Boot
  '👠', // High-Heeled Shoe
  '👡', // Woman’s Sandal
  '👢', // Woman’s Boot
  '🎩', // Top Hat
  '🎓', // Graduation Cap
  // Nature & Weather (more detail)
  '🌱', // Seedling
  '🪵', // Wood
  '🌪️', // Tornado
  '🌫️', // Fog
  '🌕', // Full Moon
  '🌑', // New Moon
  '🌟', // Glowing Star
  '🌠', // Shooting Star
  // Tools & Equipment (more variations)
  '⛏️', // Pick
  '🪓', // Axe
  '🦯', // White Cane
  '🧹', // Broom
  '🧯', // Fire Extinguisher
  '🪜', // Ladder
  // Toys & Games (more)
  '🪁', // Kite
  '🪀', // Yo-yo
  '🎮', // Video Game Controller
  '🎲', // Game Die
  '♟️', // Chess Pawn
  '🕹️', // Joystick
  // Musical Instruments (more)
  '🪕', // Banjo
  '🪈', // Flute
  '🪘', // Long Drum
  '🪇', // Maracas
  // Sports & Activities (more)
  '🛷', // Sled
  '🛹', // Skateboard
  '🥋', // Martial Arts Uniform
  '🥊', // Boxing Glove
  '🏹', // Bow and Arrow
  // Fantasy/Misc
  '🧚', // Fairy
  '🧜', // Merperson
  '🧞', // Genie
  '🧛', // Vampire
  '🧟', // Zombie
  // --- END OF NEW ICONS ---

  // --- START OF USER REQUESTED ICONS ---
  // Fruits/Veggies
  '🍈', // dưa lê
  // Drinks
  '🍷', '🍺', '🧋', '🥃',
  // Vehicles
  '🚇', '🚄', '🚠', '🏍️',
  // Activities
  '🏃', '🏊', '🚣', '🏋️', '🏌️', '🏇', '🧗', '🏄', '🚴', '🪂', '🧘', '🏂',
  // Clothing
  '🩴', '🕶️',
  // Household & Kitchen
  '🍴', '🥄', '🗄️', '🔪', '🥢',
  // Technology
  '⌚', '🖨️', '📹',
  // School Supplies
  '📐', '📖',
  // --- END OF USER REQUESTED ICONS ---
];


export const UNLOCKABLE_IMAGE_SETS: ImageSet[] = [
  { id: 'farm_animals', name: "Bộ Nông Trại Vui Vẻ", starsRequired: 20, icons: ['🐄', '🐖', '🐑', '🐓', '🦆', '🐴', '🐐', '🦃', '🦢', '🐇'] }, 
  { id: 'sea_creatures', name: "Bộ Sinh Vật Biển Kỳ Thú", starsRequired: 50, icons: ['🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🌊', '🐚', '🦈', '🦦'] }, 
  { id: 'space_explorer', name: "Bộ Khám Phá Vũ Trụ", starsRequired: 100, icons: ['🪐', '☄️', '🌌', '👽', '🧑‍🚀', '🛰️', '🌠', '🛸'] }, 
  { id: 'magical_items', name: "Bộ Vật Phẩm Diệu Kỳ", starsRequired: 180, icons: ['🪄', '🧪', '📜', '🔮', '🧿', '⚜️', '🗝️', '💍', '✨', '💎'] }, 
  { id: 'dinosaurs', name: "Bộ Khủng Long Bạo Chúa", starsRequired: 250, icons: ['🦖', '🦕', '🐉', '🌋', '🦴'] }, 
];


export const POSITIVE_FEEDBACK_EMOJIS: string[] = ['🥳', '🤩', '🎉', '👍', '🌟', '💖', '💫', '🎈', '💯', '✨', '✔️', '🏆', '🥇', '🏅'];
export const ENCOURAGING_FEEDBACK_EMOJIS: string[] = ['🤔', '🧐', '💡', '💪', '🌱', '➡️', '🚀', '👀', '✏️', '🧠'];

// End Game Messages & Icons
export const CONGRATS_MESSAGES: string[] = [
  "Xuất sắc! Bé thật là siêu!",
  "Tuyệt vời! Bé đã làm rất tốt!",
  "Giỏi quá! Bé là một thiên tài toán học!",
  "Hoàn thành xuất sắc! Tiếp tục phát huy nhé!",
  "Chúc mừng bé đã chinh phục thử thách!"
];
export const CONGRATS_ICONS: string[] = ['🎉', '🥳', '🌟', '🏆', '🥇', '🎈', '✨', '🤩', '💯'];

export const ENCOURAGE_TRY_AGAIN_MESSAGE = "Bé hãy cố gắng thêm ở lần sau nhé!";
export const ENCOURAGE_TRY_AGAIN_ICONS: string[] = ['💪', '👍', '💡', '🌱', '😊', '🤔'];

// LocalStorage Keys
export const TOTAL_STARS_STORAGE_KEY = 'toanHocThongMinh_totalStars';
export const UNLOCKED_SETS_STORAGE_KEY = 'toanHocThongMinh_unlockedSetIds';
export const CURRENT_DIFFICULTY_KEY = 'toanHocThongMinh_currentDifficulty';