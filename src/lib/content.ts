export type Locale = "id" | "en";

export type Dream = {
  id: string;
  name: string;
  dream: string;
  reason: string;
  language: Locale;
  createdAt: string;
};

export const dictionaries = {
  id: {
    brand: "Before Die",
    navWall: "Wall",
    navShare: "Bagikan",
    heroEyebrow: "Milestone hidup yang ingin dikenang.",
    heroTitle: "Sebelum aku mati, aku ingin…",
    heroSubtitle:
      "Ruang kecil untuk mimpi, milestone, dan hal-hal yang terasa penting sebelum semuanya berakhir.",
    heroPrimary: "Bagikan mimpimu",
    heroSecondary: "Lihat dream wall",
    wallTitle: "Dream Wall",
    wallSubtitle:
      "Kumpulan harapan manusia — sederhana, besar, rapuh, tapi nyata.",
    shareTitle: "Tulis milestone-mu",
    shareSubtitle:
      "Tulis nama panggilan, impianmu, dan alasan singkat kenapa itu berarti buatmu.",
    formName: "Nama depan / nickname",
    formDream: "Apa yang ingin kamu capai sebelum mati?",
    formReason: "Kenapa itu penting buat kamu?",
    formLanguage: "Bahasa tulisan",
    formPublicNote: "Submission bisa tampil publik. Jangan isi data sensitif.",
    formSubmit: "Kirim milestone",
    formLoading: "Mengirim...",
    formSuccess: "Mimpimu sudah masuk. Terima kasih sudah berbagi.",
    formError: "Submission belum bisa dipublish sekarang. Coba lagi nanti.",
    formPlaceholderName: "mis. Ilham, Bree, atau nama panggilanmu",
    formPlaceholderDream: "mis. membangun rumah untuk orang tua",
    formPlaceholderReason:
      "mis. karena itu simbol perjalanan, rasa terima kasih, atau janji ke diri sendiri",
    footerLine:
      "Mungkin kita tidak bisa mengendalikan akhirnya. Tapi kita masih bisa memilih apa yang ingin kita perjuangkan sebelum sampai ke sana.",
    emptyTitle: "Belum ada submission publik.",
    emptyBody: "Jadi orang pertama yang menulis milestone di Before Die.",
    loadMore: "Muat lagi",
    relativeNow: "baru saja",
    notConfigured: "Backend database belum dikonfigurasi. Saat ini masih mode preview.",
    languageLabel: { id: "Indonesia", en: "English" },
  },
  en: {
    brand: "Before Die",
    navWall: "Wall",
    navShare: "Share",
    heroEyebrow: "Life milestones worth remembering.",
    heroTitle: "Before I die, I want to…",
    heroSubtitle:
      "A small place for dreams, milestones, and the things that still feel worth reaching before everything ends.",
    heroPrimary: "Share your dream",
    heroSecondary: "See the wall",
    wallTitle: "Dream Wall",
    wallSubtitle:
      "A quiet collection of human hopes — small, massive, fragile, and real.",
    shareTitle: "Write your milestone",
    shareSubtitle:
      "Leave your nickname, your dream, and a short reason why it matters.",
    formName: "First name / nickname",
    formDream: "What do you want to do before you die?",
    formReason: "Why does it matter to you?",
    formLanguage: "Writing language",
    formPublicNote: "Submissions may appear publicly. Please avoid sensitive personal information.",
    formSubmit: "Submit milestone",
    formLoading: "Submitting...",
    formSuccess: "Your dream has been received. Thank you for sharing it.",
    formError: "Your submission could not be published right now. Please try again later.",
    formPlaceholderName: "e.g. Ilham, Bree, or your nickname",
    formPlaceholderDream: "e.g. build a home for my parents",
    formPlaceholderReason:
      "e.g. because it feels like gratitude, closure, or a promise I still want to keep",
    footerLine:
      "Maybe we cannot control the ending. But we can still choose what feels worth pursuing before we get there.",
    emptyTitle: "No public submissions yet.",
    emptyBody: "Be the first person to leave a milestone on Before Die.",
    loadMore: "Load more",
    relativeNow: "just now",
    notConfigured: "Database backend is not configured yet. The site is currently in preview mode.",
    languageLabel: { id: "Indonesian", en: "English" },
  },
} as const;

export const sampleDreams: Dream[] = [
  {
    id: "1",
    name: "Alya",
    dream: "Membawa ibu ke Mekkah",
    reason: "Karena dari kecil aku cuma lihat beliau selalu mendahulukan semua orang selain dirinya sendiri.",
    language: "id",
    createdAt: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
  },
  {
    id: "2",
    name: "Rafi",
    dream: "Membangun tempat tinggal yang tenang untuk keluarga",
    reason: "Aku pengen rumah itu jadi tempat pulang yang nggak pernah aku punya waktu kecil.",
    language: "id",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
  },
  {
    id: "3",
    name: "Mina",
    dream: "Publish the book I keep postponing",
    reason: "It holds the parts of me I’m scared will disappear if I keep waiting.",
    language: "en",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 19).toISOString(),
  },
  {
    id: "4",
    name: "Ken",
    dream: "Watch the northern lights with someone I love",
    reason: "I want one memory that feels bigger than all the noise I spent years surviving.",
    language: "en",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 34).toISOString(),
  },
];

export function isLocale(value: string): value is Locale {
  return value === "id" || value === "en";
}
