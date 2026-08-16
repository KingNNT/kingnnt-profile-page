export interface Identity {
  fullName: string;
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
  englishName: "Jesse",
  nickname: "KingNNT",
  jobTitle: "Solutions Consultant",
  location: { city: "Hà Nội", country: "Việt Nam" },
};
