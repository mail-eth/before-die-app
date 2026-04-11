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
    heroEyebrow: "Sst... ini ruang aman.",
    heroTitle: "Sebelum aku mati, aku ingin…",
    heroSubtitle: "Umumin mimpi kamu. Gak perlu nama. Gak perlu wajah. Gak ada yang judged.",
    heroPrimary: "Tulis mimpimu",
    heroSecondary: "Lihat dream wall",
    wallTitle: "Dream Wall",
    wallSubtitle:
      "Kumpulan harapan manusia — sederhana, besar, rapuh, tapi nyata.",
    shareTitle: "Tulis milestone-mu",
    shareSubtitle:
      "Kamu bebas pake nama, emoji, atau anonymous. Gak ada yang缚 kamu.",
    formName: "Namamu",
    formDream: "Mimpi kamu apa?",
    formReason: "Kenapa mimpi ini penting?",
    formLanguage: "Bahasa tulisan",
    formPublicNote: "Submission bisa tampil publik. Jangan isi data sensitif.",
    formSubmit: "Kirim milestone",
    formLoading: "Mengirim...",
    formSuccess: "Mimpimu sudah masuk. Terima kasih sudah berbagi.",
    formError: "Submission belum bisa dipublish sekarang. Coba lagi nanti.",
    formPlaceholderName: "Namamu (atau gak pake nama. bebas.)",
    formPlaceholderDream: "Speak it into existence...",
    formPlaceholderReason: "Kenapa ini penting buat kamu?",
    footerLine:
      "Mungkin kita tidak bisa pengendalian akhirnya. Tapi kita masih bisa memilih apa yang ingin kita perjuangkan sebelum sampai ke sana.",
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
    heroEyebrow: "Psst... this is a safe space.",
    heroTitle: "Before I die, I want to…",
    heroSubtitle:
      "Say your dream out loud. No name required. No face. Nobody judges.",
    heroPrimary: "Write your dream",
    heroSecondary: "See the wall",
    wallTitle: "Dream Wall",
    wallSubtitle:
      "A quiet collection of human hopes — small, massive, fragile, and real.",
    shareTitle: "Write your milestone",
    shareSubtitle:
      "Use a name, an emoji, or stay anonymous. Nobody's forcing you.",
    formName: "Your name",
    formDream: "Your dream?",
    formReason: "Why does it matter?",
    formLanguage: "Writing language",
    formPublicNote: "Submissions may appear publicly. Please avoid sensitive personal information.",
    formSubmit: "Submit milestone",
    formLoading: "Submitting...",
    formSuccess: "Your dream has been received. Thank you for sharing it.",
    formError: "Your submission could not be published right now. Please try again later.",
    formPlaceholderName: "Your name (or don't. up to you.)",
    formPlaceholderDream: "Speak it into existence...",
    formPlaceholderReason: "Why should this matter?",
    footerLine:
      "You get to say whatever. You get to be whoever. Before Die just says - someone out there made it.",
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
