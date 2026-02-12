/* ------------------------------------------------------------------
 * TYPES
 * ------------------------------------------------------------------ */

export type Song = {
  id: number;
  title: string;
  artist: string;
  albumArt: any;
  audioURL: any; // require(...)
  isLiked?: boolean;
};

export type Genre = {
  id: string;
  name: string;
  imageUrl: any;
};

export type GuidanceCategory = {
  id: string;
  name: string;
  videoUrls: string[];
};

export type GuidanceForTheHeart = {
  id: string;
  name: string;
  imageUrl: any;
  videoUrls: string[];
  categories: GuidanceCategory[];
};

/* ------------------------------------------------------------------
 * MOCK DATA
 * ------------------------------------------------------------------ */

export const mockData = {
  /* ---------------- VIDEO TITLE CACHE ---------------- */
  videoTitles: {} as Record<string, string>,

  /* ---------------- SONGS ---------------- */

  recentlyPlayed: [
    {
      id: 1,
      title: "As It Was",
      artist: "Harry Styles",
      albumArt: require("../assets/thumbnails/As_it_was.jpg"),
      audioURL: require("../assets/audio/as-it-was.mp3"), // ✅ FIXED
    },
    {
      id: 2,
      title: "Shake It Off",
      artist: "Taylor Swift",
      albumArt: require("../assets/thumbnails/Shake_It_Off.png"),
      audioURL: require("../assets/audio/levitating.mp3"), // ✅
    },
    {
      id: 3,
      title: "SICKO MODE",
      artist: "Travis Scott",
      albumArt: require("../assets/thumbnails/sicko_mode.jpeg"),
      audioURL: require("../assets/audio/sicko-mode.mp3"), // ✅
      isLiked: true,
    },
    {
      id: 4,
      title: "Lose Yourself",
      artist: "Eminem",
      albumArt: require("../assets/thumbnails/lose_yourself.jpeg"),
      audioURL: require("../assets/audio/lose-yourself.mp3"), // ✅
      isLiked: true,
    },
    {
      id: 5,
      title: "HUMBLE.",
      artist: "Kendrick Lamar",
      albumArt: require("../assets/thumbnails/humble.jpeg"),
      audioURL: require("../assets/audio/humble.mp3"), // ✅
    },
  ] as Song[],

  /* ---------------- LIKED SONGS ---------------- */

  likedSongs: [] as Song[],

  /* ---------------- GENRES ---------------- */

  genres: [
    {
      id: "bollywood",
      name: "Bollywood",
      imageUrl: require("../assets/genres/Bollywood.png"),
    },
    {
      id: "hollywood",
      name: "Hollywood",
      imageUrl: require("../assets/genres/Hollywood.png"),
    },
    {
      id: "artist",
      name: "Artist",
      imageUrl: require("../assets/genres/Artist.png"),
    },
  ] as Genre[],

  /* ---------------- GUIDANCE ---------------- */

// data/mockData.ts

guidanceForTheHeart: [
  {
    id: "islamic_lectures",
    name: "Islamic Lectures",
    imageUrl: require("../assets/genres/Lectures.png"),
    videoUrls: [
      "https://youtu.be/ITarXSw7Zhg",
      "https://youtu.be/arp0eBn1nG8",
      "https://www.youtube.com/live/qaF6jyXbIsk",
      'https://youtu.be/LhezSOSnOEM?si=fs0gvYSErAIWSBWa',
  
    ],
    categories: [],
  },

  {
    id: "little_muslim",
    name: "Little Muslim",
    imageUrl: require("../assets/genres/Muslim.png"),
    videoUrls: [],
    categories: [
      {
        id: "quran_stories",
        name: "Quran Stories",
        videoUrls: [
          "https://www.youtube.com/live/LDJyw4Pgws4",
          "https://youtu.be/d2D6WuKlymM",
          'https://youtu.be/xxnZuAHCAjY?si=6Z5-CL6FiC24eRPR',
        ],
      },
      {
        id: "nasheeds_for_kids",
        name: "Nasheeds for Kids",
        videoUrls: [
          "https://youtu.be/AwW8s_r4g4w",
          "https://youtu.be/7fyAtfGytGk",
          'https://youtu.be/T3DuAFu2ZoY?si=ydqNJ1VXx68ps_si',
          'https://youtu.be/mQwgJ2-9lVI?si=7aQdKcKV6YumMlgL',
          'https://youtu.be/EmyuGk9GmKk?si=t82GPfzBt6VN6xKM',
       
        ],
      },
      {
        id: 'fun_learning',
        name: 'Fun Learning',
        videoUrls: [
          'https://youtu.be/v3oRq32Ruzo?si=xEsTby5ehnL7tsJN',
          'https://youtu.be/d2D6WuKlymM?si=b40xcGgdgDLZXIAr',
          'https://youtu.be/u2e2Uk4qEXs?si=dJNTdhWypNUAgFkb',
          'https://youtu.be/JbfEZMdgZ_A?si=m-EQzio0Vm_1ZlEb',
          'https://youtu.be/xxnZuAHCAjY?si=_9GuDvch7k1IGSka',
        ]
      },
      {
        id: 'dua_adab',
        name: 'Dua & Adab',
        videoUrls: [
          'https://youtu.be/u2e2Uk4qEXs?si=Ue_xhi-xl-RL-RVO',
          'https://youtu.be/llz1efYNTxs?si=J338qvrpmNVUU72s',
          'https://youtu.be/UKmZLEEexiQ?si=8PbHP-mixg78BoLR',
        ]
      },
    ],
  },

  {
    id: "islamic_lifestyle",
    name: "Islamic Lifestyle",
    imageUrl: require("../assets/genres/Lifestyle.png"),
    videoUrls: [],
    categories: [
      {
        id: "sunnah_beauty",
        name: "Sunnah Beauty",
        videoUrls: [
          "https://youtu.be/GYkVMNLscw0",
          "https://youtu.be/MLlGt24Yv1s",
          'https://youtu.be/45kpQgUR_lg?si=hGu98-Kk8Tja2G6s',
        ],
      },
      {
        id: 'sunnah_daily_routine',
        name: 'Sunnah in daily routine',
        videoUrls: [
          'https://youtu.be/GYkVMNLscw0?si=qb1GmWU8zYOFpFN4',
          'https://youtu.be/MLlGt24Yv1s?si=7yMoZOMF0DQKmeU-',
          'https://youtu.be/-ZSxXF79r3g?si=jLOR6kEZrlpEJto4',
          'https://youtu.be/Ht1qrhJBcAk?si=tisHoFhx_OX1hvgW',
        ]
      },
    ],
  },
],

  /* ---------------- GENRE SONGS ---------------- */

  genreSongs(genreId: string): Song[] {
    return Array.from({ length: 20 }).map((_, index) => ({
      id: index,
      title: `Song ${index + 1}`,
      artist: `Artist ${index % 5 + 1}`,
      albumArt: require("../assets/images/song.png"),
      audioURL: require("../assets/audio/levitating.mp3"), // ✅ FIXED
      isLiked: index % 3 === 0,
    }));
  },

  /* ---------------- CURRENTLY PLAYING ---------------- */

  currentlyPlaying: {
    id: 8,
    title: "So What",
    artist: "Miles Davis",
    albumArt: require("../assets/thumbnails/so_what.jpeg"),
    audioURL: require("../assets/audio/levitating.mp3"), // ✅ FIXED
  } as Song,
};

/* ---------------- POST INIT ---------------- */

mockData.likedSongs = mockData.recentlyPlayed.filter(
  (song) => song.isLiked
);
