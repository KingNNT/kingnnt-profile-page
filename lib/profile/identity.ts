export interface Identity {
  fullName: string;
  /**
   * `fullName` stripped of diacritics. Not a stylistic variant — it is the
   * spelling most people actually type, because most keyboards outside Vietnam
   * cannot produce the accented one. Search matches on literal strings, so a
   * site that never writes this spelling is invisible to the query that uses
   * it.
   */
  latinName: string;
  englishName: string;
  nickname: string;
  jobTitle: string;
  location: { city: string; country: string };
}

/**
 * Số điện thoại và ngày sinh trong CV cố ý không có ở đây. Trang này công khai
 * và được crawler đọc; một số điện thoại đặt trên trang công khai là một số
 * điện thoại đã bị thu thập.
 *
 * Email và social cũng không ở đây nữa: chúng phụ thuộc vào nhánh (dev,
 * trading, creator dùng địa chỉ khác nhau) nên sống trong `./contact`.
 */
export const IDENTITY: Identity = {
  fullName: "Ninh Ngọc Tuấn",
  latinName: "Ninh Ngoc Tuan",
  englishName: "Jesse",
  nickname: "KingNNT",
  jobTitle: "Solutions Consultant",
  location: { city: "Hà Nội", country: "Việt Nam" },
};

/**
 * Every string someone might reasonably search for him by, excluding
 * `fullName` itself — that one is `name` in the schema, and a value repeated
 * in both fields reads as padding.
 *
 * `englishName` appears bare and paired with the family name: "Jesse" alone
 * resolves to nobody, but colleagues who only ever heard the English name have
 * nothing else to type. Order runs most to least likely.
 */
export const ALTERNATE_NAMES: readonly string[] = [
  IDENTITY.latinName,
  `${IDENTITY.englishName} Ninh`,
  IDENTITY.nickname,
  IDENTITY.englishName,
];
